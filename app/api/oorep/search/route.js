import { NextResponse } from "next/server";

const OOREP_API_URL = process.env.OOREP_API_URL || "http://localhost:9000";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const repertory = searchParams.get("repertory") || "publicum";
    const symptom = searchParams.get("symptom") || "";
    const page = searchParams.get("page") || "1";
    const remedyString = searchParams.get("remedyString") || "";
    const minWeight = searchParams.get("minWeight") || "1";
    const getRemedies = searchParams.get("getRemedies") || "1";

    if (!symptom.trim()) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 },
      );
    }

    // Build OOREP API URL
    const oorepUrl = new URL(`${OOREP_API_URL}/api/lookup_rep`);
    oorepUrl.searchParams.set("repertory", repertory);
    oorepUrl.searchParams.set("symptom", symptom);
    oorepUrl.searchParams.set("page", page);
    oorepUrl.searchParams.set("remedyString", remedyString);
    oorepUrl.searchParams.set("minWeight", minWeight);
    oorepUrl.searchParams.set("getRemedies", getRemedies);

    // Fetch from OOREP
    const response = await fetch(oorepUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Set timeout
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OOREP API error: ${response.status}`);
    }

    const rawData = await response.json();

    // OOREP returns an array: [searchResults, remedyStats]
    // searchResults contains: totalNumberOfRepertoryRubrics, totalNumberOfResults, totalNumberOfPages, currPage, results
    const searchResults = Array.isArray(rawData) ? rawData[0] : rawData;
    const remedyStats = Array.isArray(rawData) && rawData[1] ? rawData[1] : [];

    // Transform to consistent format for frontend
    const transformedData = {
      results: searchResults?.results || [],
      totalResults: searchResults?.totalNumberOfResults || 0,
      totalPages: searchResults?.totalNumberOfPages || 1,
      currentPage: searchResults?.currPage || parseInt(page),
      hasMore:
        (searchResults?.currPage || 1) <
        (searchResults?.totalNumberOfPages || 1),
      remedyStats: remedyStats,
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
      meta: {
        repertory,
        searchTerm: symptom,
        page: parseInt(page),
      },
    });
  } catch (error) {
    console.error("OOREP Search Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to search repertory",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
