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

// GET - Fetch all patient prescriptions with pagination
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
      .from(TABLES.PRESCRIPTIONS)
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id);

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
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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

    const hasMore = offset + prescriptions.length < totalCount;

    return NextResponse.json({
      prescriptions: formattedPrescriptions,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patient prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}
