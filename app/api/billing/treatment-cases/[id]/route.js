"use server";

import { NextResponse } from "next/server";
import {
  getTreatmentCaseById,
  updateTreatmentCase,
  updateTreatmentCaseStatus,
  linkInvoiceToCase,
  unlinkInvoiceFromCase,
} from "@/lib/actions/treatmentcase.actions";

// GET /api/billing/treatment-cases/[id] - Get treatment case details
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await getTreatmentCaseById(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching treatment case:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/billing/treatment-cases/[id] - Update treatment case
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    // If only updating status
    if (data.action === "update_status") {
      const result = await updateTreatmentCaseStatus(
        id,
        data.status,
        data.updated_by
      );
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // If linking invoice
    if (data.action === "link_invoice") {
      const result = await linkInvoiceToCase(id, data.invoice_id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // If unlinking invoice
    if (data.action === "unlink_invoice") {
      const result = await unlinkInvoiceFromCase(data.invoice_id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result);
    }

    // General update
    const result = await updateTreatmentCase(id, data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating treatment case:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
