import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      // Delete session from database
      await supabaseAdmin
        .from(TABLES.USER_SESSIONS)
        .delete()
        .eq("session_token", sessionToken);

      // Clear cookie
      cookieStore.delete("session_token");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in logout:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
