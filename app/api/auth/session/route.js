import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    // Find session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .select("*, user:users(*)")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session) {
      // Clear invalid cookie
      cookieStore.delete("session_token");
      return NextResponse.json({ user: null });
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await supabaseAdmin
        .from(TABLES.USER_SESSIONS)
        .delete()
        .eq("id", session.id);

      cookieStore.delete("session_token");
      return NextResponse.json({ user: null });
    }

    const user = session.user;

    if (!user || !user.is_active) {
      cookieStore.delete("session_token");
      return NextResponse.json({ user: null });
    }

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
      age: user.age,
      sex: user.sex,
      avatar_url: user.avatar_url,
      roleData,
    };

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json({ user: null });
  }
}
