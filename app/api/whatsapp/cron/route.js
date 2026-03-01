// WhatsApp Cron Endpoint — Processes scheduled messages (reminders, follow-ups)
// Call this endpoint periodically (e.g., every 5 minutes via external cron service like cron-job.org)
// GET /api/whatsapp/cron?token=<CRON_SECRET>

import { NextResponse } from "next/server";
import { processScheduledMessages } from "@/lib/whatsapp/notifications";

// Cron secret — must be set in environment
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  try {
    // Verify cron secret is configured
    if (!CRON_SECRET) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 },
      );
    }

    // Verify authorization
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const authHeader = request.headers.get("authorization");

    const isAuthorized =
      token === CRON_SECRET || authHeader === `Bearer ${CRON_SECRET}`;

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
      { status: 500 },
    );
  }
}
