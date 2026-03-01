import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES } from "@/lib/supabase.config";

// Helper to verify pharmacist session
async function verifyPharmacistSession() {
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

  if (session.user?.role !== "pharmacist") {
    return null;
  }

  return session.user;
}

// GET - Fetch single prescription details
export async function GET(request, { params }) {
  try {
    const pharmacist = await verifyPharmacistSession();
    if (!pharmacist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: prescription, error } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        id,
        notes,
        status,
        created_at,
        dispensed_at,
        patient:patient_id(id, full_name, email, phone, address),
        doctor:doctor_id(id, user:user_id(full_name)),
        dispensed_by_pharmacist:dispensed_by(id, user:user_id(full_name)),
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Prescription not found" },
          { status: 404 }
        );
      }
      throw error;
    }

    const formattedPrescription = {
      id: prescription.id,
      notes: prescription.notes,
      status: prescription.status,
      created_at: prescription.created_at,
      dispensed_at: prescription.dispensed_at,
      patient_name: prescription.patient?.full_name || "Unknown Patient",
      patient_email: prescription.patient?.email,
      patient_phone: prescription.patient?.phone,
      patient_address: prescription.patient?.address,
      doctor_name: prescription.doctor?.user?.full_name || "Unknown Doctor",
      dispensed_by: prescription.dispensed_by_pharmacist?.user?.full_name,
      items: prescription.items || [],
    };

    return NextResponse.json({
      prescription: formattedPrescription,
    });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescription" },
      { status: 500 }
    );
  }
}
