import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import {
  getInvoiceById,
  getBillingSettings,
} from "@/lib/actions/billing.actions";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoicePDF from "@/app/admin/billing/components/InvoicePDF";

// Verify session (admin or patient viewing their own invoice)
async function verifySession(invoiceId) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return { user: null, canAccess: false };
  }

  const { data: session, error } = await supabaseAdmin
    .from("user_sessions")
    .select("user_id, expires_at, user:users(id, full_name, email, role)")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session || new Date(session.expires_at) < new Date()) {
    return { user: null, canAccess: false };
  }

  const user = session.user;

  // Admin can access all invoices
  if (user.role === "admin") {
    return { user, canAccess: true };
  }

  // Patient can only access their own invoices
  if (user.role === "patient") {
    const { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select("patient_id")
      .eq("id", invoiceId)
      .single();

    if (invoice && invoice.patient_id === user.id) {
      return { user, canAccess: true };
    }
  }

  return { user, canAccess: false };
}

// GET /api/billing/invoices/[id]/pdf - Generate PDF for invoice
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { canAccess } = await verifySession(id);

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get invoice data
    const invoiceResult = await getInvoiceById(id);
    if (!invoiceResult.success) {
      return NextResponse.json(
        { success: false, error: invoiceResult.error },
        { status: 404 }
      );
    }

    // Get billing settings for PDF
    const settingsResult = await getBillingSettings();
    const settings = settingsResult.success ? settingsResult.settings : {};

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({ invoice: invoiceResult.invoice, settings })
    );

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${invoiceResult.invoice.invoice_number}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
