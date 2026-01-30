import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

/**
 * Centralized session verification utility
 * Ensures consistent session validation across all API routes
 */

/**
 * Verify a session and return the user data
 * @param {Object} options - Verification options
 * @param {string[]} options.allowedRoles - Array of allowed roles (e.g., ['admin', 'doctor'])
 * @param {boolean} options.requireActive - Whether to require is_active=true (default: true)
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifySession({
  allowedRoles = null,
  requireActive = true,
} = {}) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return { user: null, error: "No session token" };
    }

    // Get session with user data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .select(
        `
        id,
        user_id,
        expires_at,
        is_active,
        user:users(
          id,
          email,
          full_name,
          role,
          is_active,
          phone
        )
      `,
      )
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session) {
      return { user: null, error: "Invalid session" };
    }

    // Check if session is active
    if (!session.is_active) {
      return { user: null, error: "Session has been revoked" };
    }

    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      // Mark session as inactive
      await supabaseAdmin
        .from(TABLES.USER_SESSIONS)
        .update({ is_active: false })
        .eq("id", session.id);
      return { user: null, error: "Session has expired" };
    }

    // Check if user exists
    if (!session.user) {
      return { user: null, error: "User not found" };
    }

    // Check if user is active
    if (requireActive && !session.user.is_active) {
      return { user: null, error: "Account has been deactivated" };
    }

    // Check role if specified
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(session.user.role)) {
        return { user: null, error: "Insufficient permissions" };
      }
    }

    return { user: session.user, error: null };
  } catch (error) {
    console.error("Session verification error:", error);
    return { user: null, error: "Session verification failed" };
  }
}

/**
 * Verify admin session
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyAdminSession() {
  return verifySession({ allowedRoles: [ROLES.ADMIN] });
}

/**
 * Verify doctor session
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyDoctorSession() {
  return verifySession({ allowedRoles: [ROLES.DOCTOR] });
}

/**
 * Verify patient session
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyPatientSession() {
  return verifySession({ allowedRoles: [ROLES.PATIENT] });
}

/**
 * Verify pharmacist session
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyPharmacistSession() {
  return verifySession({ allowedRoles: [ROLES.PHARMACIST] });
}

/**
 * Verify billing access (admin or pharmacist)
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyBillingAccess() {
  return verifySession({ allowedRoles: [ROLES.ADMIN, ROLES.PHARMACIST] });
}

/**
 * Verify staff access (admin, doctor, or pharmacist)
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyStaffSession() {
  return verifySession({
    allowedRoles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  });
}

/**
 * Verify medical staff access (admin or doctor)
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function verifyMedicalStaffSession() {
  return verifySession({ allowedRoles: [ROLES.ADMIN, ROLES.DOCTOR] });
}

/**
 * Helper to create unauthorized response
 * @param {string} message - Error message
 * @returns {Response}
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Helper to create forbidden response
 * @param {string} message - Error message
 * @returns {Response}
 */
export function forbiddenResponse(message = "Forbidden") {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
