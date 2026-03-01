// WhatsApp Webhook Endpoint
// Receives incoming messages from Meta WhatsApp Business Cloud API
// GET — Webhook verification (required by Meta during setup)
// POST — Incoming messages, status updates

import { NextResponse } from "next/server";
import crypto from "crypto";
import { parseIncomingMessage, handleIncomingMessage } from "@/lib/whatsapp/router";
import { supabaseAdmin } from "@/lib/supabase.config";
import { WA_TABLES } from "@/lib/whatsapp/constants";
import { rateLimit } from "@/lib/rate-limit";

// Webhook verification token — must be set in environment
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// App secret for webhook signature verification
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Rate limiter: 60 requests per minute per IP
const webhookLimiter = rateLimit({
  interval: 60 * 1000,
  maxRequests: 60,
  prefix: "wa-webhook",
});

// Verify Meta webhook signature (X-Hub-Signature-256)
function verifyWebhookSignature(rawBody, signature) {
  if (!APP_SECRET) {
    console.warn("WHATSAPP_APP_SECRET not set — skipping signature verification");
    return true;
  }
  if (!signature) return false;

  const expectedSignature = "sha256=" + crypto
    .createHmac("sha256", APP_SECRET)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

// Check if a message has already been processed (idempotency)
async function isMessageAlreadyProcessed(waMessageId) {
  if (!waMessageId) return false;
  const { data } = await supabaseAdmin
    .from(WA_TABLES.MESSAGES)
    .select("id")
    .eq("wa_message_id", waMessageId)
    .eq("direction", "inbound")
    .limit(1)
    .maybeSingle();
  return !!data;
}

// GET — Meta webhook verification challenge
export async function GET(request) {
  if (!VERIFY_TOKEN) {
    console.error("WHATSAPP_VERIFY_TOKEN not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Incoming messages and status updates
export async function POST(request) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { success: rateLimitOk } = webhookLimiter.check(ip);
    if (!rateLimitOk) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const body = JSON.parse(rawBody);

    // Verify this is a WhatsApp message event
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    // Process each entry (there can be multiple)
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const messages = value?.messages || [];
        const statuses = value?.statuses || [];

        // Handle incoming messages
        for (const message of messages) {
          // Idempotency check — skip if already processed
          if (message.id && await isMessageAlreadyProcessed(message.id)) {
            console.log(`Skipping duplicate message: ${message.id}`);
            continue;
          }

          const parsed = parseIncomingMessage(message);
          if (parsed) {
            // Process asynchronously — don't block the webhook response
            handleIncomingMessage(parsed).catch((err) => {
              console.error("Error processing WhatsApp message:", err);
            });
          }
        }

        // Handle message status updates (delivered, read, etc.)
        for (const status of statuses) {
          // Log status changes for debugging
          if (status.status === "failed") {
            console.error("WhatsApp message delivery failed:", {
              messageId: status.id,
              recipientId: status.recipient_id,
              errors: status.errors,
            });
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
