import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import { getInventoryAlerts } from "@/lib/actions/inventory.actions";

// Helper to verify admin/pharmacist session
async function verifyAdminOrPharmacist() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  if (!["admin", "pharmacist"].includes(session.user.role)) {
    return null;
  }

  return session.user;
}

// GET /api/inventory/alerts - Get all alerts
export async function GET(request) {
  try {
    const user = await verifyAdminOrPharmacist();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertType = searchParams.get("alertType");
    const isResolvedParam = searchParams.get("isResolved");
    const itemId = searchParams.get("itemId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const options = {
      alertType,
      itemId,
      page,
      limit,
    };

    // Only add isResolved if explicitly provided
    if (isResolvedParam !== null) {
      options.isResolved = isResolvedParam === "true";
    }

    const result = await getInventoryAlerts(options);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
