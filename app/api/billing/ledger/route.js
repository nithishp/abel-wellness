"use server";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";
import {
  getLedgerEntries,
  getPatientLedgerBalance,
  getLedgerSummary,
} from "@/lib/actions/ledger.actions";

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

  // Allow admin or pharmacist to access ledger
  if (![ROLES.ADMIN, ROLES.PHARMACIST].includes(session.user?.role)) {
    return null;
  }

  return session.user;
}

// GET /api/billing/ledger - Get ledger entries with filters
export async function GET(request) {
  try {
    // Verify authentication
    const user = await verifyBillingAccess();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");
    const patientId = searchParams.get("patient_id");
    const entryType = searchParams.get("entry_type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const summary = searchParams.get("summary");

    // If requesting summary
    if (summary === "true") {
      const result = await getLedgerSummary({
        startDate,
        endDate,
      });
      return NextResponse.json(result);
    }

    // If requesting patient balance
    if (patientId && searchParams.get("balance") === "true") {
      const result = await getPatientLedgerBalance(patientId);
      return NextResponse.json(result);
    }

    // Get ledger entries with filters
    const result = await getLedgerEntries({
      invoiceId,
      patientId,
      entryType,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
