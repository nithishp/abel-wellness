"use server";

import { NextResponse } from "next/server";
import {
  getLedgerEntries,
  getPatientLedgerBalance,
  getLedgerSummary,
} from "@/lib/actions/ledger.actions";

// GET /api/billing/ledger - Get ledger entries with filters
export async function GET(request) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
