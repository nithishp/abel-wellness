import { NextResponse } from "next/server";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";

/**
 * Session & OTP cleanup endpoint.
 * Deletes expired sessions and used/expired OTP codes.
 * Protected by a simple secret key (for cron or manual trigger).
 */
export async function POST(request) {
  try {
    // Simple secret-based auth for cleanup endpoint
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.CLEANUP_SECRET && process.env.CLEANUP_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Delete expired sessions
    const { data: deletedSessions, error: sessionError } = await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .delete()
      .lt("expires_at", now)
      .select("id");

    if (sessionError) {
      console.error("Session cleanup error:", sessionError);
    }

    // Delete expired or used OTP codes
    const { data: deletedOtps, error: otpError } = await supabaseAdmin
      .from(TABLES.OTP_CODES)
      .delete()
      .or(`expires_at.lt.${now},is_used.eq.true`)
      .select("id");

    if (otpError) {
      console.error("OTP cleanup error:", otpError);
    }

    return NextResponse.json({
      success: true,
      cleaned: {
        sessions: deletedSessions?.length || 0,
        otpCodes: deletedOtps?.length || 0,
      },
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
