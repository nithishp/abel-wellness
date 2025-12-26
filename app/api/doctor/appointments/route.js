import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES } from "@/lib/supabase.config";

// Helper to verify doctor session
async function verifyDoctorSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session, error } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session || session.user?.role !== "doctor") {
    return null;
  }

  return session.user;
}

// GET - Fetch all appointments for the logged-in doctor
export async function GET(request) {
  try {
    const doctor = await verifyDoctorSession();
    if (!doctor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor profile
    const { data: doctorProfile, error: doctorError } = await supabaseAdmin
      .from(TABLES.DOCTORS)
      .select("id")
      .eq("user_id", doctor.id)
      .single();

    if (doctorError || !doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Fetch all appointments for this doctor
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        id,
        name,
        email,
        phone,
        date,
        time,
        status,
        consultation_status,
        reason_for_visit,
        created_at,
        updated_at,
        patient:patient_id(id, full_name, age, sex)
      `
      )
      .eq("doctor_id", doctorProfile.id)
      .in("status", ["approved", "completed"])
      .order("date", { ascending: false })
      .order("time", { ascending: true });

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      appointments: appointments || [],
    });
  } catch (error) {
    console.error("Error in doctor appointments API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
