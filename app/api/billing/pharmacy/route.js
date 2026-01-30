"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";
import {
  createPharmacyBill,
  createCombinedBill,
} from "@/lib/actions/quickbill.actions";

// Helper function to verify admin or pharmacist session
async function verifyBillingAccess() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  // Allow admin or pharmacist to access billing
  if (![ROLES.ADMIN, ROLES.PHARMACIST].includes(session.user?.role)) {
    return null;
  }

  return session.user;
}

// POST /api/billing/pharmacy - Create pharmacy bill or combined bill
export async function POST(request) {
  try {
    // Verify authentication
    const user = await verifyBillingAccess();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { bill_type } = data;

    let result;

    if (bill_type === "combined") {
      result = await createCombinedBill(data);
    } else {
      result = await createPharmacyBill(data);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in pharmacy billing API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
