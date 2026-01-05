import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import {
  getStockValuationReport,
  getLowStockReport,
  getExpiryReport,
  getStockMovementReport,
} from "@/lib/actions/inventory.actions";

// Helper to verify admin/pharmacist session
async function verifyAdminOrPharmacist() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session, error } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session) {
    return null;
  }

  if (!["admin", "pharmacist"].includes(session.user.role)) {
    return null;
  }

  return session.user;
}

// GET /api/inventory/reports - Get inventory reports
export async function GET(request) {
  try {
    const user = await verifyAdminOrPharmacist();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");

    let result;

    switch (reportType) {
      case "valuation":
        result = await getStockValuationReport();
        break;
      case "low-stock":
        result = await getLowStockReport();
        break;
      case "expiry":
        const days = parseInt(searchParams.get("days")) || 30;
        result = await getExpiryReport(days);
        break;
      case "movements":
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const itemId = searchParams.get("itemId");
        result = await getStockMovementReport({
          startDate,
          endDate,
          itemId,
        });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
