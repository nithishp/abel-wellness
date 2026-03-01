import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES } from "@/lib/supabase.config";

// Helper to verify patient session
async function verifyPatientSession() {
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

  if (session.user?.role !== "patient") {
    return null;
  }

  return session.user;
}

// GET - Fetch patient dashboard data
export async function GET() {
  try {
    const patient = await verifyPatientSession();
    if (!patient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get total appointments count
    const { count: totalAppointments } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id);

    // Get upcoming appointments count
    const { count: upcomingAppointments } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id)
      .in("status", ["pending", "approved"])
      .gte("date", today.toISOString().split("T")[0]);

    // Get completed consultations count
    const { count: completedConsultations } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id)
      .eq("consultation_status", "completed");

    // Get active prescriptions count
    const { count: activePrescriptions } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id);

    // Get upcoming appointments with details
    const { data: upcomingAppointmentsList } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        id,
        date,
        time,
        status,
        reason_for_visit,
        doctor:doctor_id(id, user:user_id(full_name))
      `
      )
      .eq("patient_id", patient.id)
      .in("status", ["pending", "approved"])
      .gte("date", today.toISOString().split("T")[0])
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(5);

    // Get recent prescriptions
    const { data: recentPrescriptionsList } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        id,
        status,
        created_at,
        doctor:doctor_id(id, user:user_id(full_name)),
        items:prescription_items(medication_name)
      `
      )
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Format appointments
    const formattedAppointments =
      upcomingAppointmentsList?.map((apt) => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        reason_for_visit: apt.reason_for_visit,
        doctor_name: apt.doctor?.user?.full_name,
      })) || [];

    // Format prescriptions
    const formattedPrescriptions =
      recentPrescriptionsList?.map((p) => ({
        id: p.id,
        status: p.status,
        created_at: p.created_at,
        doctor_name: p.doctor?.user?.full_name,
        items: p.items || [],
      })) || [];

    return NextResponse.json({
      stats: {
        totalAppointments: totalAppointments || 0,
        upcomingAppointments: upcomingAppointments || 0,
        completedConsultations: completedConsultations || 0,
        activePrescriptions: activePrescriptions || 0,
      },
      upcomingAppointments: formattedAppointments,
      recentPrescriptions: formattedPrescriptions,
    });
  } catch (error) {
    console.error("Error fetching patient dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
