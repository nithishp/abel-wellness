"use server";

import { NextResponse } from "next/server";
import {
  getCreditNoteById,
  updateCreditNoteStatus,
} from "@/lib/actions/creditnote.actions";

// GET /api/billing/credit-notes/[id] - Get credit note details
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await getCreditNoteById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching credit note:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/billing/credit-notes/[id] - Update credit note status
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { status, updated_by } = data;

    const result = await updateCreditNoteStatus(id, status, updated_by);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating credit note:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
