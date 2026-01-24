import { NextResponse } from "next/server";
import { 
  fetchFromOOREP, 
  isLocalRepertory,
  LOCAL_REPERTORIES 
} from "@/lib/oorep-session";

const OOREP_LOCAL_URL = process.env.OOREP_API_URL || "http://localhost:9000";

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

    // Determine if we should use local or remote OOREP
    const useLocal = isLocalRepertory(repertory);
    const source = useLocal ? "local" : "remote";
    
    console.log(`[OOREP Search] Repertory: ${repertory}, Source: ${source}`);

    // Build query string
    const queryParams = new URLSearchParams({
      repertory,
      symptom,
      page,
      remedyString,
      minWeight,
      getRemedies,
    });

    let response;
    
    if (useLocal) {
      // Query local Docker instance
      const localUrl = `${OOREP_LOCAL_URL}/api/lookup_rep?${queryParams}`;
      response = await fetch(localUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      });
    } else {
      // Query oorep.com with session cookies
      response = await fetchFromOOREP(`/api/lookup_rep?${queryParams}`, {
        method: "GET",
        signal: AbortSignal.timeout(30000),
      });
    }

    if (!response.ok) {
      throw new Error(`OOREP API error: ${response.status}`);
    }

    // Get raw text first to handle empty responses
    const rawText = await response.text();
    
    // Handle empty response (repertory not found or no results)
    if (!rawText || rawText.trim() === "") {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
          totalResults: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          hasMore: false,
          remedyStats: [],
        },
        meta: {
          repertory,
          searchTerm: symptom,
          page: parseInt(page),
          message: `No results found. The repertory "${repertory}" may not be available.`,
        },
      });
    }

    // Parse JSON
    let rawData;
    try {
      rawData = JSON.parse(rawText);
    } catch (parseError) {
      console.error("OOREP JSON Parse Error:", parseError, "Raw text:", rawText.substring(0, 200));
      throw new Error(`Invalid response from OOREP API for repertory "${repertory}"`);
    }

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
        source, // 'local' or 'remote'
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
