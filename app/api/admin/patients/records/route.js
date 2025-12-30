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

// GET - Fetch medical records for a specific patient (admin view)
export async function GET(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, full_name, email")
      .eq("id", patientId)
      .eq("role", ROLES.PATIENT)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Fetch medical records
    const { data: records, error } = await supabaseAdmin
      .from(TABLES.MEDICAL_RECORDS)
      .select(
        `
        id,
        appointment_id,
        chief_complaints,
        onset,
        duration,
        location,
        sensation,
        modalities,
        associated_symptoms,
        progression,
        history_present_illness,
        past_history,
        family_history,
        physical_generals,
        physical_particulars,
        mental_emotional_state,
        vital_signs,
        general_exam_findings,
        tongue_pulse,
        lab_results,
        imaging_results,
        provisional_diagnosis,
        totality_analysis,
        final_diagnosis,
        treatment_plan,
        follow_up_instructions,
        additional_notes,
        created_at,
        updated_at,
        doctor:doctor_id(
          id,
          user:user_id(full_name)
        ),
        appointment:appointment_id(
          id,
          date,
          time,
          service,
          reason_for_visit
        )
      `
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching medical records:", error);
      return NextResponse.json(
        { error: "Failed to fetch medical records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      patient,
      records: records || [],
    });
  } catch (error) {
    console.error("Error in GET patient records:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
