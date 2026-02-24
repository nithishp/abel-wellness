import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES, APPOINTMENT_STATUS } from "@/lib/supabase.config";

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

// GET - Fetch all patient appointments with pagination
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
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("patient_id", patient.id);

    const { data: appointments, error } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        id,
        date,
        time,
        status,
        consultation_status,
        reason_for_visit,
        rejection_reason,
        created_at,
        doctor:doctor_id(id, user:user_id(full_name))
      `,
      )
      .eq("patient_id", patient.id)
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const formattedAppointments =
      appointments?.map((apt) => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        status: apt.status,
        consultation_status: apt.consultation_status,
        reason_for_visit: apt.reason_for_visit,
        rejection_reason: apt.rejection_reason,
        created_at: apt.created_at,
        doctor_name: apt.doctor?.user?.full_name,
      })) || [];

    const hasMore = offset + appointments.length < totalCount;

    return NextResponse.json({
      appointments: formattedAppointments,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

// POST - Create new appointment for logged-in patient
export async function POST(request) {
  try {
    const patient = await verifyPatientSession();
    if (!patient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, time, reasonForVisit } = await request.json();

    // Validation
    if (!date || !time || !reasonForVisit) {
      return NextResponse.json(
        { error: "Date, time, and reason for visit are required" },
        { status: 400 },
      );
    }

    // Check if the date is in the future
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate <= today) {
      return NextResponse.json(
        { error: "Appointment date must be in the future" },
        { status: 400 },
      );
    }

    // Check for duplicate appointments at the same date and time
    const { data: existingAppointment } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("id")
      .eq("patient_id", patient.id)
      .eq("date", date)
      .eq("time", time)
      .eq("status", "pending")
      .single();

    if (existingAppointment) {
      return NextResponse.json(
        {
          error: "You already have a pending appointment at this date and time",
        },
        { status: 400 },
      );
    }

    // Create the appointment
    const { data: newAppointment, error } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .insert({
        patient_id: patient.id,
        name: patient.full_name || patient.email,
        email: patient.email,
        phone: patient.phone || "",
        date,
        time,
        reason_for_visit: reasonForVisit,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: newAppointment.id,
        date: newAppointment.date,
        time: newAppointment.time,
        reason_for_visit: newAppointment.reason_for_visit,
        status: newAppointment.status,
      },
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}

// PATCH - Cancel an appointment (patient can only cancel pending/approved)
export async function PATCH(request) {
  try {
    const patient = await verifyPatientSession();
    if (!patient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId, action } = await request.json();

    if (!appointmentId || action !== "cancel") {
      return NextResponse.json(
        { error: "Appointment ID and action 'cancel' are required" },
        { status: 400 },
      );
    }

    // Fetch the appointment to verify ownership and status
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("id, patient_id, status, date, time")
      .eq("id", appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Verify the patient owns this appointment
    if (appointment.patient_id !== patient.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Only allow cancellation of pending or approved appointments
    const cancellableStatuses = [
      APPOINTMENT_STATUS.PENDING,
      APPOINTMENT_STATUS.APPROVED,
      APPOINTMENT_STATUS.RESCHEDULED,
    ];

    if (!cancellableStatuses.includes(appointment.status)) {
      return NextResponse.json(
        {
          error: `Cannot cancel an appointment with status "${appointment.status}". Only pending, approved, or rescheduled appointments can be cancelled.`,
        },
        { status: 400 },
      );
    }

    // Update the appointment status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .update({
        status: APPOINTMENT_STATUS.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select("id, status")
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      appointment: updated,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 },
    );
  }
}
