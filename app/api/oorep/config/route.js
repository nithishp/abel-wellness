import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

export async function GET() {
  try {
    // Fetch available repertories
    const repsResponse = await fetch(
      `${OOREP_API_URL}/api/available_rems_and_reps`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      },
    );

    // Fetch available materia medicas
    const mmsResponse = await fetch(
      `${OOREP_API_URL}/api/available_rems_and_mms`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      },
    );

    const repertories = repsResponse.ok ? await repsResponse.json() : [];
    const materiaMedicas = mmsResponse.ok ? await mmsResponse.json() : [];

    return NextResponse.json({
      success: true,
      data: {
        repertories,
        materiaMedicas,
        oorepUrl: OOREP_API_URL,
        enabled: process.env.NEXT_PUBLIC_OOREP_ENABLED === "true",
      },
    });
  } catch (error) {
    console.error("OOREP Config Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch OOREP configuration",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
