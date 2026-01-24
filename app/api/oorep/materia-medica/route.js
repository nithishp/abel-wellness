import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const materiamedica = searchParams.get("materiamedica") || "boericke";
    const symptom = searchParams.get("symptom") || "";
    const page = searchParams.get("page") || "1";
    const remedyString = searchParams.get("remedyString") || "";

    if (!symptom.trim()) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 },
      );
    }

    const oorepUrl = new URL(`${OOREP_API_URL}/api/lookup_mm`);
    oorepUrl.searchParams.set("materiamedica", materiamedica);
    oorepUrl.searchParams.set("symptom", symptom);
    oorepUrl.searchParams.set("page", page);
    oorepUrl.searchParams.set("remedyString", remedyString);

    const response = await fetch(oorepUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OOREP API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        materiamedica,
        searchTerm: symptom,
        page: parseInt(page),
      },
    });
  } catch (error) {
    console.error("OOREP Materia Medica Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search materia medica",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
