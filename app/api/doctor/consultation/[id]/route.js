import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import {
  TABLES,
  CONSULTATION_STATUS,
  PRESCRIPTION_STATUS,
} from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";

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

// POST - Save medical record and prescription
export async function POST(request, { params }) {
  try {
    const doctor = await verifyDoctorSession();
    if (!doctor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { medicalRecord, prescription, complete } = await request.json();

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

    // Verify appointment belongs to this doctor
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        *,
        patient:patient_id(id, full_name, email)
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

    // Check if medical record exists
    const { data: existingRecord } = await supabaseAdmin
      .from(TABLES.MEDICAL_RECORDS)
      .select("id")
      .eq("appointment_id", id)
      .single();

    // Prepare medical record data
    const medicalRecordData = {
      patient_id: appointment.patient_id,
      appointment_id: id,
      doctor_id: doctorProfile.id,
      chief_complaints: medicalRecord.chief_complaints,
      onset: medicalRecord.onset,
      duration: medicalRecord.duration,
      location: medicalRecord.location,
      sensation: medicalRecord.sensation,
      modalities: medicalRecord.modalities,
      associated_symptoms: medicalRecord.associated_symptoms,
      progression: medicalRecord.progression,
      history_present_illness: medicalRecord.history_present_illness,
      past_history: medicalRecord.past_history,
      family_history: medicalRecord.family_history,
      physical_generals: medicalRecord.physical_generals,
      physical_particulars: medicalRecord.physical_particulars,
      mental_emotional_state: medicalRecord.mental_emotional_state,
      vital_signs: medicalRecord.vital_signs,
      general_exam_findings: medicalRecord.general_exam_findings,
      tongue_pulse: medicalRecord.tongue_pulse,
      lab_results: medicalRecord.lab_results,
      imaging_results: medicalRecord.imaging_results,
      provisional_diagnosis: medicalRecord.provisional_diagnosis,
      totality_analysis: medicalRecord.totality_analysis,
      final_diagnosis: medicalRecord.final_diagnosis,
      treatment_plan: medicalRecord.treatment_plan,
      follow_up_instructions: medicalRecord.follow_up_instructions,
      additional_notes: medicalRecord.additional_notes,
      updated_at: new Date().toISOString(),
    };

    // Upsert medical record
    if (existingRecord) {
      await supabaseAdmin
        .from(TABLES.MEDICAL_RECORDS)
        .update(medicalRecordData)
        .eq("id", existingRecord.id);
    } else {
      await supabaseAdmin
        .from(TABLES.MEDICAL_RECORDS)
        .insert(medicalRecordData);
    }

    // Handle prescription
    if (prescription?.items?.length > 0) {
      // Check if prescription exists
      const { data: existingPrescription } = await supabaseAdmin
        .from(TABLES.PRESCRIPTIONS)
        .select("id")
        .eq("appointment_id", id)
        .single();

      if (existingPrescription) {
        // Update prescription
        await supabaseAdmin
          .from(TABLES.PRESCRIPTIONS)
          .update({
            notes: prescription.notes,
            status: complete
              ? PRESCRIPTION_STATUS.PENDING
              : PRESCRIPTION_STATUS.PENDING,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPrescription.id);

        // Delete existing items and re-insert
        await supabaseAdmin
          .from(TABLES.PRESCRIPTION_ITEMS)
          .delete()
          .eq("prescription_id", existingPrescription.id);

        // Insert new items
        const itemsToInsert = prescription.items.map((item) => ({
          prescription_id: existingPrescription.id,
          medication_name: item.medication_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity: item.quantity,
          instructions: item.instructions,
        }));

        await supabaseAdmin
          .from(TABLES.PRESCRIPTION_ITEMS)
          .insert(itemsToInsert);
      } else {
        // Create new prescription
        const { data: newPrescription } = await supabaseAdmin
          .from(TABLES.PRESCRIPTIONS)
          .insert({
            patient_id: appointment.patient_id,
            appointment_id: id,
            doctor_id: doctorProfile.id,
            notes: prescription.notes,
            status: PRESCRIPTION_STATUS.PENDING,
          })
          .select()
          .single();

        if (newPrescription) {
          // Insert prescription items
          const itemsToInsert = prescription.items.map((item) => ({
            prescription_id: newPrescription.id,
            medication_name: item.medication_name,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            instructions: item.instructions,
          }));

          await supabaseAdmin
            .from(TABLES.PRESCRIPTION_ITEMS)
            .insert(itemsToInsert);
        }
      }
    }

    // If completing the consultation
    if (complete) {
      // Update appointment consultation status
      await supabaseAdmin
        .from(TABLES.APPOINTMENTS)
        .update({
          consultation_status: CONSULTATION_STATUS.COMPLETED,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Send notification to patient
      if (appointment.patient?.email || appointment.email) {
        try {
          await sendEmail({
            to: appointment.patient?.email || appointment.email,
            ...emailTemplates.consultationCompleteAdmin({
              patientName: appointment.patient?.full_name || appointment.name,
              doctorName: doctor.full_name,
              date: appointment.date,
              diagnosis: medicalRecord.final_diagnosis,
              hasPrescription: prescription?.items?.length > 0,
            }),
          });
        } catch (emailError) {
          console.error("Error sending consultation email:", emailError);
        }
      }

      // Create notification for pharmacist if prescription exists
      if (prescription?.items?.length > 0) {
        // Get prescription ID
        const { data: prescriptionData } = await supabaseAdmin
          .from(TABLES.PRESCRIPTIONS)
          .select("id")
          .eq("appointment_id", id)
          .single();

        // Create notification for pharmacists
        const { data: pharmacists } = await supabaseAdmin
          .from(TABLES.USERS)
          .select("id")
          .eq("role", "pharmacist")
          .eq("is_active", true);

        if (pharmacists?.length > 0) {
          const notifications = pharmacists.map((pharmacist) => ({
            user_id: pharmacist.id,
            type: "prescription_ready",
            title: "New Prescription Ready",
            message: `New prescription for ${
              appointment.patient?.full_name || appointment.name
            } is ready for dispensing`,
            related_id: prescriptionData?.id,
            related_type: "prescription",
          }));

          await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert(notifications);
        }
      }

      // Notify admin
      const { data: admins } = await supabaseAdmin
        .from(TABLES.USERS)
        .select("id")
        .eq("role", "admin")
        .eq("is_active", true);

      if (admins?.length > 0) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          type: "consultation_completed",
          title: "Consultation Completed",
          message: `Dr. ${doctor.full_name} completed consultation for ${
            appointment.patient?.full_name || appointment.name
          }`,
          related_id: id,
          related_type: "appointment",
        }));

        await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert(notifications);
      }
    }

    return NextResponse.json({
      message: complete
        ? "Consultation completed successfully"
        : "Progress saved successfully",
      completed: complete,
    });
  } catch (error) {
    console.error("Error saving consultation:", error);
    return NextResponse.json(
      { error: "Failed to save consultation" },
      { status: 500 }
    );
  }
}
