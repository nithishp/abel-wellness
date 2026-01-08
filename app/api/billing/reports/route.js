import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import {
  getRevenueReport,
  getOutstandingInvoices,
  getBillingDashboardStats,
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

// GET /api/billing/reports - Get billing reports
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
    const reportType = searchParams.get("type") || "dashboard";

    let result;

    switch (reportType) {
      case "revenue":
        result = await getRevenueReport({
          startDate: searchParams.get("startDate"),
          endDate: searchParams.get("endDate"),
          groupBy: searchParams.get("groupBy") || "day",
        });
        break;

      case "outstanding":
        result = await getOutstandingInvoices({
          page: parseInt(searchParams.get("page")) || 1,
          limit: parseInt(searchParams.get("limit")) || 20,
        });
        break;

      case "dashboard":
      default:
        result = await getBillingDashboardStats();
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/billing/reports:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
