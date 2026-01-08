import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { addPayment, getPayments } from "@/lib/actions/billing.actions";

// Verify admin/pharmacist session
async function verifySession() {
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

  // Allow admin and pharmacist to record payments
  if (!["admin", "pharmacist"].includes(session.user?.role)) {
    return null;
  }

  return session.user;
}

// GET /api/billing/payments - Get all payments
export async function GET(request) {
  try {
    const user = await verifySession();
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
      invoiceId: searchParams.get("invoiceId") || undefined,
      patientId: searchParams.get("patientId") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: searchParams.get("sortBy") || "payment_date",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const result = await getPayments(options);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/billing/payments:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/billing/payments - Record a new payment
export async function POST(request) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (
      !body.invoice_id ||
      !body.patient_id ||
      !body.amount ||
      !body.payment_method
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await addPayment({
      ...body,
      received_by: user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/billing/payments:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
