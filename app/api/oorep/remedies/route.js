import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

// Cache remedies in memory (they don't change often)
let cachedRemedies = null;
let cachedAt = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function GET(request) {
  try {
    // Check cache
    if (cachedRemedies && cachedAt && Date.now() - cachedAt < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedRemedies,
        cached: true,
      });
    }

    const response = await fetch(`${OOREP_API_URL}/api/available_remedies`, {
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

    // Update cache
    cachedRemedies = data;
    cachedAt = Date.now();

    return NextResponse.json({
      success: true,
      data: data,
      cached: false,
    });
  } catch (error) {
    console.error("OOREP Remedies Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch remedies",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
