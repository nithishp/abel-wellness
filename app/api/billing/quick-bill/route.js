"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";
import {
  createQuickBill,
  searchPatientsForBilling,
  getDoctorsForBilling,
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

// POST /api/billing/quick-bill - Create a quick bill
export async function POST(request) {
  try {
    // Verify authentication
    const user = await verifyBillingAccess();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const result = await createQuickBill(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in quick bill API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

// GET /api/billing/quick-bill - Get patients and doctors for quick bill form
export async function GET(request) {
  try {
    // Verify authentication
    const user = await verifyBillingAccess();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchType = searchParams.get("type");
    const query = searchParams.get("q") || "";

    if (searchType === "patients") {
      const result = await searchPatientsForBilling(query);
      return NextResponse.json(result);
    }

    if (searchType === "doctors") {
      const result = await getDoctorsForBilling();
      return NextResponse.json(result);
    }

    // Return both patients and doctors for initial load
    const [patients, doctors] = await Promise.all([
      searchPatientsForBilling(query),
      getDoctorsForBilling(),
    ]);

    return NextResponse.json({
      patients: patients.patients || [],
      doctors: doctors.doctors || [],
    });
  } catch (error) {
    console.error("Error in quick bill GET API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
