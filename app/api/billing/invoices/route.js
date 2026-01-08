import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import {
  getInvoices,
  createInvoice,
  createInvoiceFromAppointment,
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

// GET /api/billing/invoices - Get all invoices with filters
export async function GET(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const options = {
      page: parseInt(searchParams.get("page")) || 1,
      limit: parseInt(searchParams.get("limit")) || 20,
      status: searchParams.get("status") || undefined,
      patientId: searchParams.get("patientId") || undefined,
      appointmentId: searchParams.get("appointmentId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const result = await getInvoices(options);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/billing/invoices:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/billing/invoices - Create a new invoice
export async function POST(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fromAppointment, appointmentId, ...invoiceData } = body;

    let result;

    if (fromAppointment && appointmentId) {
      // Create invoice from appointment
      result = await createInvoiceFromAppointment(appointmentId, {
        created_by: user.id,
        status: invoiceData.status,
      });
    } else {
      // Create regular invoice
      result = await createInvoice({
        ...invoiceData,
        created_by: user.id,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/billing/invoices:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
