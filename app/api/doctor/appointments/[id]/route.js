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

// GET - Fetch single appointment with medical record and prescription
export async function GET(request, { params }) {
  try {
    const doctor = await verifyDoctorSession();
    if (!doctor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get doctor profile
    const { data: doctorProfile } = await supabaseAdmin
      .from(TABLES.DOCTORS)
      .select("id")
      .eq("user_id", doctor.id)
      .single();

    if (!doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Fetch appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        *,
        patient:patient_id(id, full_name, email, phone, age, sex, address)
      `
      )
      .eq("id", id)
      .eq("doctor_id", doctorProfile.id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Fetch medical record if exists
    const { data: medicalRecord } = await supabaseAdmin
      .from(TABLES.MEDICAL_RECORDS)
      .select("*")
      .eq("appointment_id", id)
      .single();

    // Fetch prescription if exists
    const { data: prescription } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        *,
        items:prescription_items(*)
      `
      )
      .eq("appointment_id", id)
      .single();

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        name: appointment.name,
        email: appointment.email,
        phone: appointment.phone,
        date: appointment.date,
        time: appointment.time,
        reason_for_visit: appointment.reason_for_visit,
        status: appointment.status,
        consultation_status: appointment.consultation_status,
        patient: appointment.patient,
      },
      medicalRecord: medicalRecord
        ? {
            chief_complaints: medicalRecord.chief_complaints || "",
            onset: medicalRecord.onset || "",
            duration: medicalRecord.duration || "",
            location: medicalRecord.location || "",
            sensation: medicalRecord.sensation || "",
            modalities: medicalRecord.modalities || "",
            associated_symptoms: medicalRecord.associated_symptoms || "",
            progression: medicalRecord.progression || "",
            history_present_illness:
              medicalRecord.history_present_illness || "",
            past_history: medicalRecord.past_history || "",
            family_history: medicalRecord.family_history || "",
            physical_generals: medicalRecord.physical_generals || "",
            physical_particulars: medicalRecord.physical_particulars || "",
            mental_emotional_state: medicalRecord.mental_emotional_state || "",
            vital_signs: medicalRecord.vital_signs || {
              temperature: "",
              blood_pressure: "",
              pulse: "",
              respiratory_rate: "",
              weight: "",
              height: "",
            },
            general_exam_findings: medicalRecord.general_exam_findings || "",
            tongue_pulse: medicalRecord.tongue_pulse || "",
            lab_results: medicalRecord.lab_results || "",
            imaging_results: medicalRecord.imaging_results || "",
            provisional_diagnosis: medicalRecord.provisional_diagnosis || "",
            totality_analysis: medicalRecord.totality_analysis || "",
            final_diagnosis: medicalRecord.final_diagnosis || "",
            treatment_plan: medicalRecord.treatment_plan || "",
            follow_up_instructions: medicalRecord.follow_up_instructions || "",
            additional_notes: medicalRecord.additional_notes || "",
          }
        : null,
      prescription: prescription
        ? {
            id: prescription.id,
            notes: prescription.notes,
            status: prescription.status,
            items: prescription.items || [],
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointment" },
      { status: 500 }
    );
  }
}
