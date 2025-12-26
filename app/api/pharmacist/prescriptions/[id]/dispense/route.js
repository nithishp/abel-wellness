import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES, PRESCRIPTION_STATUS } from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";

// Helper to verify pharmacist session
async function verifyPharmacistSession() {
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

  if (error || !session || session.user?.role !== "pharmacist") {
    return null;
  }

  return session.user;
}

// POST - Mark prescription as dispensed
export async function POST(request, { params }) {
  try {
    const pharmacist = await verifyPharmacistSession();
    if (!pharmacist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get pharmacist profile
    const { data: pharmacistProfile } = await supabaseAdmin
      .from(TABLES.PHARMACISTS)
      .select("id")
      .eq("user_id", pharmacist.id)
      .single();

    if (!pharmacistProfile) {
      return NextResponse.json(
        { error: "Pharmacist profile not found" },
        { status: 404 }
      );
    }

    // Get prescription
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        *,
        patient:patient_id(id, full_name, email),
        doctor:doctor_id(id, user:user_id(full_name)),
        items:prescription_items(*)
      `
      )
      .eq("id", id)
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    if (prescription.status === PRESCRIPTION_STATUS.DISPENSED) {
      return NextResponse.json(
        { error: "Prescription already dispensed" },
        { status: 400 }
      );
    }

    // Update prescription status
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .update({
        status: PRESCRIPTION_STATUS.DISPENSED,
        dispensed_by: pharmacistProfile.id,
        dispensed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Send notification to patient
    if (prescription.patient?.email) {
      try {
        await sendEmail({
          to: prescription.patient.email,
          ...emailTemplates.prescriptionDispensed(
            prescription.patient.full_name,
            {
              id: id,
              itemCount: prescription.items?.length || 0,
            }
          ),
        });
      } catch (emailError) {
        console.error("Error sending dispensed email:", emailError);
      }
    }

    // Create notification for patient
    await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert({
      user_id: prescription.patient_id,
      type: "prescription_dispensed",
      title: "Prescription Dispensed",
      message: "Your prescription has been dispensed and is ready for pickup",
      related_id: id,
      related_type: "prescription",
    });

    return NextResponse.json({
      message: "Prescription marked as dispensed",
      prescription: {
        id,
        status: PRESCRIPTION_STATUS.DISPENSED,
        dispensed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error dispensing prescription:", error);
    return NextResponse.json(
      { error: "Failed to dispense prescription" },
      { status: 500 }
    );
  }
}
