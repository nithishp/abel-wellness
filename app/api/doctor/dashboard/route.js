import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";
import { getStartOfDayIST, getEndOfDayIST } from "@/lib/utils";

// Helper function to verify doctor session
async function verifyDoctorSession() {
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

  if (session.user?.role !== ROLES.DOCTOR) {
    return null;
  }

  // Get doctor record
  const { data: doctor } = await supabaseAdmin
    .from(TABLES.DOCTORS)
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  return { user: session.user, doctor };
}

export async function GET(request) {
  try {
    const auth = await verifyDoctorSession();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { doctor } = auth;

    // Get today's date range in IST
    const todayStart = getStartOfDayIST();
    const todayEnd = getEndOfDayIST();

    // Get today's appointments count
    const { count: todayAppointments } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", doctor.id)
      .gte("date", todayStart.toISOString())
      .lte("date", todayEnd.toISOString())
      .in("status", ["approved", "completed"]);

    // Get pending consultations (approved but not completed)
    const { count: pendingConsultations } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", doctor.id)
      .eq("status", "approved")
      .eq("consultation_status", "pending");

    // Get completed today
    const { count: completedToday } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", doctor.id)
      .eq("consultation_status", "completed")
      .gte("completed_at", todayStart.toISOString())
      .lte("completed_at", todayEnd.toISOString());

    // Get total unique patients
    const { data: patientIds } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("patient_id")
      .eq("doctor_id", doctor.id)
      .not("patient_id", "is", null);

    const uniquePatients = new Set(patientIds?.map((p) => p.patient_id) || []);

    // Get upcoming appointments (next 5)
    const { data: upcomingAppointments } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        *,
        patient:users!appointments_patient_id_fkey (
          id,
          full_name,
          email,
          phone,
          age,
          sex
        )
      `,
      )
      .eq("doctor_id", doctor.id)
      .eq("status", "approved")
      .eq("consultation_status", "pending")
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true })
      .limit(5);

    return NextResponse.json({
      stats: {
        todayAppointments: todayAppointments || 0,
        pendingConsultations: pendingConsultations || 0,
        completedToday: completedToday || 0,
        totalPatients: uniquePatients.size,
      },
      upcomingAppointments: upcomingAppointments || [],
    });
  } catch (error) {
    console.error("Error fetching doctor dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
