"use server";

import { NextResponse } from "next/server";
import {
  createTreatmentCase,
  getTreatmentCases,
  getPatientTreatmentCases,
} from "@/lib/actions/treatmentcase.actions";

// POST /api/billing/treatment-cases - Create a treatment case
export async function POST(request) {
  try {
    const data = await request.json();

    const result = await createTreatmentCase(data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating treatment case:", error);
    return NextResponse.json(
      { error: "Failed to create treatment case" },
      { status: 500 },
    );
  }
}

// GET /api/billing/treatment-cases - List treatment cases
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patient_id");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // If filtering by patient, use specific function
    if (patientId) {
      const result = await getPatientTreatmentCases(patientId);
      return NextResponse.json(result);
    }

    // Get all treatment cases with filters
    const result = await getTreatmentCases({
      status,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching treatment cases:", error);
    return NextResponse.json(
      { error: "Failed to fetch treatment cases" },
      { status: 500 },
    );
  }
}
