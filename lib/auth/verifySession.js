import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

/**
 * Shared session verification utility for API routes.
 * Replaces the duplicated verifyXxxSession() helpers in every route file.
 *
 * @param {string|string[]} allowedRoles - Single role or array of roles allowed
 * @returns {object|null} The user object if session is valid and role matches, null otherwise
 */
export async function verifySession(allowedRoles) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) return null;

    const { data: session, error } = await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .select("*, user:users(*)")
      .eq("token", sessionToken)
      .single();

    if (error || !session) return null;

    // Check expiry
    if (new Date(session.expires_at) < new Date()) return null;

    // Check user exists and is active
    if (!session.user || !session.user.is_active) return null;

    // Check role
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(session.user.role)) return null;

    return session.user;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

// Convenience wrappers for specific roles
export async function verifyAdminSession() {
  return verifySession(ROLES.ADMIN);
}

export async function verifyDoctorSession() {
  return verifySession(ROLES.DOCTOR);
}

export async function verifyPatientSession() {
  return verifySession(ROLES.PATIENT);
}

export async function verifyPharmacistSession() {
  return verifySession(ROLES.PHARMACIST);
}

/**
 * Verify that the user is any staff member (admin, doctor, or pharmacist)
 */
export async function verifyStaffSession() {
  return verifySession([ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST]);
}
