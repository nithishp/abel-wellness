"use server";

import { NextResponse } from "next/server";
import {
  createCreditNote,
  getCreditNotes,
  getCreditNotesForInvoice,
} from "@/lib/actions/creditnote.actions";

// POST /api/billing/credit-notes - Create a credit note
export async function POST(request) {
  try {
    const data = await request.json();

    const result = await createCreditNote(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating credit note:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/billing/credit-notes - List credit notes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // If filtering by invoice, use specific function
    if (invoiceId) {
      const result = await getCreditNotesForInvoice(invoiceId);
      return NextResponse.json(result);
    }

    // Get all credit notes with filters
    const result = await getCreditNotes({
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching credit notes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
