import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import crypto from "crypto";
import { otpVerifySchema, validateRequest } from "@/lib/validation/schemas";

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate input with Zod
    const { data: validatedData, error: validationError } = validateRequest(
      otpVerifySchema,
      data,
    );

    if (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 },
      );
    }

    const normalizedEmail = validatedData.email.toLowerCase().trim();

    // Find the OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from(TABLES.OTP_CODES)
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", validatedData.code)
      .eq("is_used", false)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from(TABLES.OTP_CODES)
      .update({ is_used: true })
      .eq("id", otpRecord.id);

    // Find user - user must exist (created via appointment booking)
    const { data: user, error: userError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "No account found with this email. Please book an appointment first to create your account.",
        },
        { status: 404 },
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 },
      );
    }

    // Update last login
    await supabaseAdmin
      .from(TABLES.USERS)
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { error: sessionError } = await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

    if (sessionError) {
      console.error("Error creating session:", sessionError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    // Clean up expired sessions for this user
    await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .delete()
      .eq("user_id", user.id)
      .lt("expires_at", new Date().toISOString());

    // Return user without sensitive data
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      phone: user.phone,
      age: user.age,
      sex: user.sex,
      avatar_url: user.avatar_url,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
