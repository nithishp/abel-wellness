import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import {
  getBillingSettings,
  updateBillingSettings,
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

// GET /api/billing/settings - Get billing settings
export async function GET(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = await getBillingSettings();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/billing/settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/billing/settings - Update billing settings
export async function PUT(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    // Handle both { settings: {...} } and direct settings object
    const settingsToUpdate = body.settings || body;
    const result = await updateBillingSettings(settingsToUpdate);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/billing/settings:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
