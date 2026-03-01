import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import { resolveInventoryAlert } from "@/lib/actions/inventory.actions";

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

// PUT /api/inventory/alerts/[id] - Resolve an alert
export async function PUT(request, { params }) {
  try {
    const user = await verifyAdminOrPharmacist();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.resolved) {
      const result = await resolveInventoryAlert(id, user.id);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}
