import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";
import crypto from "crypto";

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find the OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from(TABLES.OTP_CODES)
      .select("*")
      .eq("email", normalizedEmail)
      .eq("code", code)
      .eq("is_used", false)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from(TABLES.OTP_CODES)
      .update({ is_used: true })
      .eq("id", otpRecord.id);

    // Find or create user
    let { data: user } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    let isNewUser = false;

    if (!user) {
      // Create new patient user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from(TABLES.USERS)
        .insert({
          email: normalizedEmail,
          role: ROLES.PATIENT,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      user = newUser;
      isNewUser = true;

      // Send welcome email
      await sendEmail(
        normalizedEmail,
        emailTemplates.welcomePatient(user.full_name || "")
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
        { status: 500 }
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
      isNewUser,
    });
  } catch (error) {
    console.error("Error in OTP verification:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
