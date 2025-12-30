import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  supabaseAdmin,
  TABLES,
  ROLES,
} from "@/lib/supabase.config";

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

// GET - Fetch case sheet for an appointment
export async function GET(request, { params }) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(`
        *,
        patient:users!appointments_patient_id_fkey (
          id,
          full_name,
          email,
          phone,
          age,
          sex,
          occupation,
          address
        ),
        doctor:doctors!appointments_doctor_id_fkey (
          id,
          specialization,
          user:users (
            id,
            full_name,
            email
          )
        )
      `)
      .eq("id", id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Fetch medical record
    const { data: medicalRecord } = await supabaseAdmin
      .from(TABLES.MEDICAL_RECORDS)
      .select("*")
      .eq("appointment_id", id)
      .single();

    // Fetch prescription with items
    const { data: prescription } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(`
        *,
        items:prescription_items(*)
      `)
      .eq("appointment_id", id)
      .single();

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        name: appointment.name,
        email: appointment.email,
        phone: appointment.phone,
        date: appointment.date,
        status: appointment.status,
        consultation_status: appointment.consultation_status,
        reason_for_visit: appointment.reason_for_visit,
      },
      patient: appointment.patient,
      doctor: appointment.doctor,
      medicalRecord: medicalRecord || null,
      prescription: prescription || null,
    });
  } catch (error) {
    console.error("Error fetching case sheet:", error);
    return NextResponse.json(
      { error: "Failed to fetch case sheet" },
      { status: 500 }
    );
  }
}
