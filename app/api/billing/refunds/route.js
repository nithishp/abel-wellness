import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { createRefund } from "@/lib/actions/billing.actions";

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

// POST /api/billing/refunds - Create a refund
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

    // Validate required fields
    if (!body.payment_id || !body.amount || !body.reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: payment_id, amount, reason",
        },
        { status: 400 }
      );
    }

    const result = await createRefund({
      ...body,
      refunded_by: user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/billing/refunds:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
