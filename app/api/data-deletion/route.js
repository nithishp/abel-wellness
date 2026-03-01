import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabase.config";

// Generate a short readable reference code
function generateConfirmationCode() {
  return (
    "DEL-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).substring(2, 6).toUpperCase()
  );
}

// Verify Meta's signed_request (used when this URL is set as Facebook/Meta data deletion callback)
function parseSignedRequest(signedRequest, appSecret) {
  try {
    const [encodedSig, payload] = signedRequest.split(".");
    const decodedSig = Buffer.from(
      encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );
    const expectedSig = createHmac("sha256", appSecret)
      .update(payload)
      .digest();
    if (!decodedSig.equals(expectedSig)) return null;
    return JSON.parse(
      Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    );
  } catch {
    return null;
  }
}

// ─── GET — Meta verification ping & status check ─────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      {
        message:
          "Data Deletion Request endpoint for AWHCC. Submit a POST request to initiate deletion.",
      },
      { status: 200 },
    );
  }

  // Status check for a previously submitted deletion request
  const { data, error } = await supabaseAdmin
    .from("data_deletion_requests")
    .select("confirmation_code, status, created_at, email")
    .eq("confirmation_code", code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json({
    confirmation_code: data.confirmation_code,
    status: data.status,
    submitted_at: data.created_at,
  });
}

// ─── POST — handles both web form and Meta signed_request callback ─────────────
export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awhcc.in";
  const appSecret =
    process.env.WHATSAPP_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  let requestData = {};
  let isMetaCallback = false;

  // ── Meta signed_request callback (application/x-www-form-urlencoded) ────────
  if (contentType.includes("application/x-www-form-urlencoded")) {
    isMetaCallback = true;
    const formText = await request.text();
    const params = new URLSearchParams(formText);
    const signedRequest = params.get("signed_request");

    if (!signedRequest) {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 },
      );
    }

    const parsed = appSecret
      ? parseSignedRequest(signedRequest, appSecret)
      : null;

    if (appSecret && !parsed) {
      return NextResponse.json(
        { error: "Invalid signed_request signature" },
        { status: 403 },
      );
    }

    const userId = parsed?.user_id || "meta-callback-" + Date.now();
    const confirmationCode = generateConfirmationCode();

    // Log the deletion request
    await supabaseAdmin.from("data_deletion_requests").insert({
      confirmation_code: confirmationCode,
      source: "meta-callback",
      meta_user_id: userId,
      status: "pending",
      raw_payload: parsed || { signed_request: signedRequest },
    });

    // Meta requires this exact response format
    return NextResponse.json({
      url: `${appUrl}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  }

  // ── Web form submission (application/json) ───────────────────────────────────
  try {
    requestData = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { name, email, phone, reason } = requestData;

  if (!email) {
    return NextResponse.json(
      { error: "Email address is required" },
      { status: 400 },
    );
  }

  const confirmationCode = generateConfirmationCode();

  const { error: insertError } = await supabaseAdmin
    .from("data_deletion_requests")
    .insert({
      confirmation_code: confirmationCode,
      source: "web-form",
      name: name || null,
      email: email.toLowerCase().trim(),
      phone: phone ? `+91${phone}` : null,
      reason: reason || null,
      status: "pending",
    });

  if (insertError) {
    console.error("Data deletion insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to submit request. Please email us directly." },
      { status: 500 },
    );
  }

  // Send notification email to admin
  try {
    const { sendEmail } = await import("@/lib/email/service");
    await sendEmail({
      to: "abelwhcc@gmail.com",
      subject: `[Data Deletion Request] ${name || email} — ${confirmationCode}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#dc2626">Data Deletion Request Received</h2>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr><td style="padding:8px;font-weight:600;color:#374151;width:160px">Reference Code</td><td style="padding:8px;font-family:monospace;color:#111827">${confirmationCode}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:8px;font-weight:600;color:#374151">Name</td><td style="padding:8px;color:#111827">${name || "—"}</td></tr>
            <tr><td style="padding:8px;font-weight:600;color:#374151">Email</td><td style="padding:8px;color:#111827">${email}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:8px;font-weight:600;color:#374151">Phone</td><td style="padding:8px;color:#111827">${phone ? "+91" + phone : "—"}</td></tr>
            <tr><td style="padding:8px;font-weight:600;color:#374151">Reason</td><td style="padding:8px;color:#111827">${reason || "—"}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:8px;font-weight:600;color:#374151">Submitted</td><td style="padding:8px;color:#111827">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td></tr>
          </table>
          <p style="margin-top:24px;color:#6b7280;font-size:14px">
            Please process this request within 30 days as required by applicable data protection regulations.
            <br/>Check status at: ${appUrl}/data-deletion?code=${confirmationCode}
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    // Non-fatal — request is already saved in DB
    console.error("Failed to send deletion notification email:", emailErr);
  }

  return NextResponse.json({
    success: true,
    confirmation_code: confirmationCode,
    message:
      "Your data deletion request has been received. We will process it within 30 days.",
    status_url: `${appUrl}/data-deletion?code=${confirmationCode}`,
  });
}
