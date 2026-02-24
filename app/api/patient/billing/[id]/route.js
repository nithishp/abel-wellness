import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

// Helper function to verify patient session
async function verifyPatientSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) return null;

    const { data: session } = await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .select("*, user:users(*)")
      .eq("session_token", sessionToken)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) return null;
    if (session.user?.role !== ROLES.PATIENT) return null;

    return session.user;
  } catch (error) {
    console.error("Error verifying patient session:", error);
    return null;
  }
}

// GET - Get specific invoice for patient
export async function GET(request, { params }) {
  try {
    const user = await verifyPatientSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // Fetch invoice with related data - use user.id directly as patient_id
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select(
        `
        *,
        items:invoice_items(*),
        payments(*),
        appointment:appointments(
          id,
          date,
          time_slot,
          reason_for_visit,
          doctor:doctors(
            id,
            specialization,
            user:users(full_name, email)
          )
        )
      `,
      )
      .eq("id", id)
      .eq("patient_id", user.id)
      .neq("status", "draft") // Don't show draft invoices
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    // Sort items by created_at
    if (invoice.items) {
      invoice.items.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      );
    }

    // Sort payments by payment_date
    if (invoice.payments) {
      invoice.payments.sort(
        (a, b) => new Date(b.payment_date) - new Date(a.payment_date),
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error in patient billing GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
