import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";

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

// GET - Fetch prescription for a specific appointment
export async function GET(request, { params }) {
  try {
    const patient = await verifyPatientSession();
    if (!patient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId } = await params;

    // Verify the appointment belongs to this patient
    const { data: appointment, error: apptError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("id, patient_id")
      .eq("id", appointmentId)
      .eq("patient_id", patient.id)
      .single();

    if (apptError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Fetch prescription with items
    const { data: prescription, error: prescError } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        *,
        items:prescription_items(*)
      `,
      )
      .eq("appointment_id", appointmentId)
      .single();

    if (prescError && prescError.code !== "PGRST116") {
      throw prescError;
    }

    return NextResponse.json({
      prescription: prescription || null,
    });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 },
    );
  }
}
