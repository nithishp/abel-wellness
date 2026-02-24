// WhatsApp Send API — Admin/System outbound messaging
// Used by the admin panel and system events to send WhatsApp messages

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import { sendTextMessage } from "@/lib/whatsapp/service";
import { sendWhatsAppNotification } from "@/lib/whatsapp/notifications";

// Verify admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;
  const { data: session } = await supabaseAdmin
    .from("user_sessions")
    .select("*, user:users(*)")
    .eq("token", sessionToken)
    .single();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  if (session.user?.role !== "admin") return null;
  return session.user;
}

export async function POST(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to, message, type, params } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: "Missing 'to' phone number" },
        { status: 400 }
      );
    }

    let result;

    if (type && params) {
      // Send a typed notification
      result = await sendWhatsAppNotification(to, type, params);
    } else if (message) {
      // Send a plain text message
      result = await sendTextMessage(to, message);
    } else {
      return NextResponse.json(
        { error: "Missing 'message' or 'type'+'params'" },
        { status: 400 }
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
      });
    }

    return NextResponse.json(
      { error: result.error || "Failed to send message" },
      { status: 500 }
    );
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
