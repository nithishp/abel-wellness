// WhatsApp Cron Endpoint — Processes scheduled messages (reminders, follow-ups)
// Call this endpoint periodically (e.g., every 5 minutes via Vercel Cron, external cron service, or setTimeout)
// GET /api/whatsapp/cron?token=<CRON_SECRET>

import { NextResponse } from "next/server";
import { processScheduledMessages } from "@/lib/whatsapp/notifications";

// Simple bearer token to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET || process.env.WHATSAPP_VERIFY_TOKEN || "abel_wellness_cron_secret";

export async function GET(request) {
  try {
    // Verify authorization
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const authHeader = request.headers.get("authorization");

    const isAuthorized =
      token === CRON_SECRET ||
      authHeader === `Bearer ${CRON_SECRET}`;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processScheduledMessages();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron processing error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
