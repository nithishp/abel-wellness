import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import {
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  addInvoiceItems,
  addPrescriptionItemsToInvoice,
} from "@/lib/actions/billing.actions";

// Verify admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session, error } = await supabaseAdmin
    .from("user_sessions")
    .select("user_id, expires_at, user:users(id, full_name, email, role)")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  if (session.user?.role !== "admin") {
    return null;
  }

  return session.user;
}

// GET /api/billing/invoices/[id] - Get invoice by ID
export async function GET(request, { params }) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await getInvoiceById(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/billing/invoices/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/billing/invoices/[id] - Update invoice
export async function PUT(request, { params }) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case "update_status":
        result = await updateInvoiceStatus(id, data.status, {
          updatedBy: user.id,
        });
        break;

      case "add_items":
        result = await addInvoiceItems(id, data.items);
        break;

      case "add_prescription":
        result = await addPrescriptionItemsToInvoice(id, data.prescriptionId);
        break;

      default:
        result = await updateInvoice(id, {
          ...data,
          updated_by: user.id,
        });
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/billing/invoices/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/billing/invoices/[id] - Delete invoice
export async function DELETE(request, { params }) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const result = await deleteInvoice(id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in DELETE /api/billing/invoices/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
