"use server";

import { NextResponse } from "next/server";
import {
  createQuickBill,
  searchPatientsForBilling,
  getDoctorsForBilling,
} from "@/lib/actions/quickbill.actions";

// POST /api/billing/quick-bill - Create a quick bill
export async function POST(request) {
  try {
    const data = await request.json();

    const result = await createQuickBill(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in quick bill API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/billing/quick-bill - Get patients and doctors for quick bill form
export async function GET(request) {
  try {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
