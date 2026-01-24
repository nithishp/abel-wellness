/**
 * OOREP Session Manager
 * Handles cookie-based authentication for oorep.com API
 * 
 * oorep.com requires a 2-step cookie dance:
 * 1. Visit homepage to get CSRF cookie
 * 2. Hit any API endpoint to get PLAY_SESSION cookie
 * 3. Both cookies must be present for protected API calls
 */

const OOREP_REMOTE_URL = "https://www.oorep.com";

// In-memory session storage (server-side)
let sessionCookies = null;
let sessionExpiry = null;
const SESSION_TTL = 20 * 60 * 1000; // 20 minutes

/**
 * Get or create a valid session for oorep.com
 * @returns {Promise<string>} Cookie header string
 */
export async function getOOREPSession() {
  // Check if we have a valid cached session
  if (sessionCookies && sessionExpiry && Date.now() < sessionExpiry) {
    return sessionCookies;
  }

  try {
    // Step 1: Visit homepage to get CSRF cookie
    const homeResponse = await fetch(OOREP_REMOTE_URL, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!homeResponse.ok) {
      throw new Error(`Failed to fetch OOREP homepage: ${homeResponse.status}`);
    }

    // Extract cookies from response
    const cookies = extractCookies(homeResponse.headers);
    
    if (!cookies.csrfCookie) {
      throw new Error("Failed to get CSRF cookie from OOREP");
    }

    // Step 2: Hit an API endpoint to get PLAY_SESSION cookie
    const apiResponse = await fetch(`${OOREP_REMOTE_URL}/api/available_remedies`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Cookie": formatCookies(cookies),
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`Failed to get session from OOREP API: ${apiResponse.status}`);
    }

    // Extract PLAY_SESSION cookie
    const sessionCookie = extractCookies(apiResponse.headers);
    
    // Merge cookies
    const allCookies = { ...cookies, ...sessionCookie };

    if (!allCookies.PLAY_SESSION) {
      throw new Error("Failed to get PLAY_SESSION cookie from OOREP");
    }

    // Cache the session
    sessionCookies = formatCookies(allCookies);
    sessionExpiry = Date.now() + SESSION_TTL;

    console.log("[OOREP Session] New session established");
    return sessionCookies;
  } catch (error) {
    console.error("[OOREP Session] Failed to establish session:", error);
    throw error;
  }
}

/**
 * Clear the cached session (useful if requests start failing)
 */
export function clearOOREPSession() {
  sessionCookies = null;
  sessionExpiry = null;
}

/**
 * Extract cookies from response headers
 */
function extractCookies(headers) {
  const cookies = {};
  const setCookieHeaders = headers.getSetCookie?.() || [];
  
  // Handle both getSetCookie() and get('set-cookie')
  const cookieStrings = setCookieHeaders.length > 0 
    ? setCookieHeaders 
    : (headers.get("set-cookie")?.split(/,(?=\s*\w+=)/) || []);

  for (const cookieStr of cookieStrings) {
    const match = cookieStr.match(/^([^=]+)=([^;]+)/);
    if (match) {
      cookies[match[1].trim()] = match[2].trim();
    }
  }

  return cookies;
}

/**
 * Format cookies object as header string
 */
function formatCookies(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

/**
 * Make an authenticated request to oorep.com
 */
export async function fetchFromOOREP(endpoint, options = {}) {
  const cookies = await getOOREPSession();

  const response = await fetch(`${OOREP_REMOTE_URL}${endpoint}`, {
    ...options,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
      "Cookie": cookies,
      "Referer": OOREP_REMOTE_URL,
      ...options.headers,
    },
  });

  // If unauthorized, clear session and retry once
  if (response.status === 401 || response.status === 403) {
    console.log("[OOREP Session] Session expired, refreshing...");
    clearOOREPSession();
    
    const newCookies = await getOOREPSession();
    return fetch(`${OOREP_REMOTE_URL}${endpoint}`, {
      ...options,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Cookie": newCookies,
        "Referer": OOREP_REMOTE_URL,
        ...options.headers,
      },
    });
  }

  return response;
}

// List of repertories available locally (Docker instance)
export const LOCAL_REPERTORIES = ["publicum", "kent-de"];

// List of repertories available on oorep.com (remote)
export const REMOTE_REPERTORIES = [
  "kent",
  "boger", 
  "bogboen",
  "hering",
  "robasif",
  "tylercold",
  "boen",
  "bogsk",
  "bogsk-de",
  "cowpert-de",
  "dorcsi-de",
];

/**
 * Check if a repertory should use local or remote API
 */
export function isLocalRepertory(repertory) {
  return LOCAL_REPERTORIES.includes(repertory);
}
