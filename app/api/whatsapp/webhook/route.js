// WhatsApp Webhook Endpoint
// Receives incoming messages from Meta WhatsApp Business Cloud API
// GET — Webhook verification (required by Meta during setup)
// POST — Incoming messages, status updates

import { NextResponse } from "next/server";
import { parseIncomingMessage, handleIncomingMessage } from "@/lib/whatsapp/router";

// Webhook verification token — set this in your Meta developer dashboard
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "abel_wellness_whatsapp_verify_2026";

// GET — Meta webhook verification challenge
export async function GET(request) {
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
    const body = await request.json();

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
