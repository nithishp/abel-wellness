import { NextResponse } from "next/server";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";
import crypto from "crypto";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    // If user doesn't exist, they need to book an appointment first
    if (!existingUser) {
      return NextResponse.json(
        {
          error:
            "No account found with this email. Please book an appointment first to create your account.",
        },
        { status: 404 }
      );
    }

    // Check if user is active
    if (!existingUser.is_active) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Delete any existing OTPs for this email
    await supabaseAdmin
      .from(TABLES.OTP_CODES)
      .delete()
      .eq("email", normalizedEmail);

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    const { error: otpError } = await supabaseAdmin
      .from(TABLES.OTP_CODES)
      .insert({
        email: normalizedEmail,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    // Send OTP email
    const emailResult = await sendEmail(
      normalizedEmail,
      emailTemplates.otp(existingUser?.full_name || "", code)
    );

    if (!emailResult.success) {
      console.error("Failed to send OTP email:", emailResult.error);
      // Don't reveal email sending issues to user for security
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Error in OTP send:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
