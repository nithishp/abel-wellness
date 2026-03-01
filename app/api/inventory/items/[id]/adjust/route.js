import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import { adjustStock } from "@/lib/actions/inventory.actions";

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

// POST /api/inventory/items/[id]/adjust - Adjust stock for an item
export async function POST(request, { params }) {
  try {
    const user = await verifyAdminOrPharmacist();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const { quantity, reason, notes, batchId } = body;

    if (!quantity || quantity === 0) {
      return NextResponse.json(
        { error: "Quantity is required and cannot be zero" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const result = await adjustStock(id, {
      quantity,
      reason,
      notes,
      batchId,
      userId: user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error adjusting stock:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
