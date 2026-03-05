import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

// Helper function to verify admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  if (session.user?.role !== ROLES.ADMIN) {
    return null;
  }

  return session.user;
}

// GET - Search patients by name, email, or phone
export async function GET(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ patients: [] });
    }

    const { data: patients, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, full_name, email, phone")
      .eq("role", ROLES.PATIENT)
      .eq("is_active", true)
      .or(
        `full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`,
      )
      .order("full_name", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Error searching patients:", error);
      return NextResponse.json(
        { error: "Failed to search patients" },
        { status: 500 },
      );
    }

    return NextResponse.json({ patients: patients || [] });
  } catch (error) {
    console.error("Error in patient search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
