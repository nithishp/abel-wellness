import { NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_API_ROUTES = {
  // Admin routes - require admin role
  admin: [
    "/api/admin/appointments",
    "/api/admin/blogs",
    "/api/admin/patients",
    "/api/admin/users",
    "/api/admin/inventory",
    "/api/admin/dashboard",
  ],
  // Billing routes - require admin or pharmacist role
  billing: [
    "/api/billing/quick-bill",
    "/api/billing/pharmacy",
    "/api/billing/ledger",
    "/api/billing/invoices",
    "/api/billing/payments",
    "/api/billing/credit-notes",
  ],
  // Doctor routes - require doctor role
  doctor: [
    "/api/doctor/appointments",
    "/api/doctor/consultation",
    "/api/doctor/dashboard",
  ],
  // Patient routes - require patient role
  patient: [
    "/api/patient/appointments",
    "/api/patient/billing",
    "/api/patient/records",
    "/api/patient/prescriptions",
  ],
  // Pharmacist routes - require pharmacist role
  pharmacist: [
    "/api/pharmacist/prescriptions",
    "/api/pharmacist/inventory",
    "/api/pharmacist/dashboard",
  ],
  // Sensitive operations requiring authentication
  sensitive: ["/api/upload-image", "/api/notifications"],
};

// Public routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/otp/send",
  "/api/auth/otp/verify",
  "/api/appointments/public",
  "/api/doctors", // Public doctor listing for appointment booking
  "/api/blogs", // Public blog listing (GET only, mutations protected in route)
];

// Check if path matches any pattern in the list
function matchesRoute(pathname, routes) {
  return routes.some((route) => pathname.startsWith(route));
}

// Get the type of protected route
function getProtectedRouteType(pathname) {
  for (const [type, routes] of Object.entries(PROTECTED_API_ROUTES)) {
    if (routes.some((route) => pathname.startsWith(route))) {
      return type;
    }
  }
  return null;
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip non-API routes (handled by client-side auth)
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (matchesRoute(pathname, PUBLIC_API_ROUTES)) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const routeType = getProtectedRouteType(pathname);

  if (routeType) {
    // Check for session token in cookies
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Note: Detailed role verification is done in individual API routes
    // because middleware cannot access database directly in Edge runtime.
    // This middleware provides a first-line defense by checking token presence.
  }

  // Add security headers to all API responses
  const response = NextResponse.next();

  // Prevent caching of API responses with sensitive data
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");

  return response;
}

export const config = {
  matcher: [
    // Match all API routes
    "/api/:path*",
  ],
};
