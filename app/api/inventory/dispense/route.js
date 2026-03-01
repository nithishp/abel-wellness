import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import {
  dispensePrescriptionItems,
  checkStockAvailability,
} from "@/lib/actions/inventory.actions";

// Helper to verify pharmacist session
async function verifyPharmacist() {
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

  if (session.user.role !== "pharmacist") {
    return null;
  }

  return session.user;
}

// POST /api/inventory/dispense - Dispense prescription items
export async function POST(request) {
  try {
    const user = await verifyPharmacist();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prescriptionId, items, forceDispense = false } = body;

    if (!prescriptionId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Prescription ID and items array are required" },
        { status: 400 }
      );
    }

    // Check stock availability first (unless force dispense)
    if (!forceDispense) {
      const stockCheck = await checkStockAvailability(items);

      if (!stockCheck.success) {
        return NextResponse.json({ error: stockCheck.error }, { status: 400 });
      }

      if (!stockCheck.allAvailable) {
        return NextResponse.json({
          success: false,
          requiresConfirmation: true,
          insufficientItems: stockCheck.insufficientItems,
          message: "Some items have insufficient stock",
        });
      }
    }

    // Proceed with dispensing
    const result = await dispensePrescriptionItems(
      prescriptionId,
      items,
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error dispensing items:", error);
    return NextResponse.json(
      { error: "Failed to dispense items" },
      { status: 500 }
    );
  }
}
