import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const { data: user, error: userError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Check if user is staff (admin, doctor, pharmacist)
    if (user.role === ROLES.PATIENT) {
      return NextResponse.json(
        { error: "Please use OTP login for patient accounts" },
        { status: 400 },
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 },
      );
    }

    // Verify password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: "Password not set. Please contact administrator." },
        { status: 400 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Update last login
    await supabaseAdmin
      .from(TABLES.USERS)
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for staff

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

    // Get additional role-specific data
    let roleData = null;

    if (user.role === ROLES.DOCTOR) {
      const { data: doctor } = await supabaseAdmin
        .from(TABLES.DOCTORS)
        .select("*")
        .eq("user_id", user.id)
        .single();
      roleData = doctor;
    } else if (user.role === ROLES.PHARMACIST) {
      const { data: pharmacist } = await supabaseAdmin
        .from(TABLES.PHARMACISTS)
        .select("*")
        .eq("user_id", user.id)
        .single();
      roleData = pharmacist;
    }

    // Return user without sensitive data
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      roleData,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
