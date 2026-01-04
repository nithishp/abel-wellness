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

  const { data: session, error } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session || session.user?.role !== "patient") {
    return null;
  }

  return session.user;
}

// GET - Fetch all patient medical records with pagination
export async function GET(request) {
  try {
    const patient = await verifyPatientSession();
    if (!patient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    // First get total count
    const { count: totalCount } = await supabaseAdmin
      .from(TABLES.MEDICAL_RECORDS)
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id);

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
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const hasMore = offset + records.length < totalCount;

    return NextResponse.json({
      records: records || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching medical records:", error);
    return NextResponse.json(
      { error: "Failed to fetch medical records" },
      { status: 500 }
    );
  }
}
