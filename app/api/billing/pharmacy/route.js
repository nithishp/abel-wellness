"use server";

import { NextResponse } from "next/server";
import {
  createPharmacyBill,
  createCombinedBill,
} from "@/lib/actions/quickbill.actions";

// POST /api/billing/pharmacy - Create pharmacy bill or combined bill
export async function POST(request) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
