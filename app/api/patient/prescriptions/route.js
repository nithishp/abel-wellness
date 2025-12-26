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

// GET - Fetch all patient prescriptions
export async function GET() {
  try {
    const patient = await verifyPatientSession();
    if (!patient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: prescriptions, error } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        id,
        notes,
        status,
        created_at,
        dispensed_at,
        doctor:doctor_id(id, user:user_id(full_name)),
        items:prescription_items(
          id,
          medication_name,
          dosage,
          frequency,
          duration,
          quantity,
          instructions
        )
      `
      )
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const formattedPrescriptions =
      prescriptions?.map((p) => ({
        id: p.id,
        notes: p.notes,
        status: p.status,
        created_at: p.created_at,
        dispensed_at: p.dispensed_at,
        doctor_name: p.doctor?.user?.full_name,
        items: p.items || [],
      })) || [];

    return NextResponse.json({
      prescriptions: formattedPrescriptions,
    });
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}
