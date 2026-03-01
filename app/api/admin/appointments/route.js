import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  supabaseAdmin,
  TABLES,
  ROLES,
  APPOINTMENT_STATUS,
} from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";
import {
  sendWhatsAppNotification,
  scheduleAppointmentReminders,
} from "@/lib/whatsapp/notifications";
import { NOTIFICATION_TYPES } from "@/lib/whatsapp/constants";

// Format date in IST for WhatsApp messages (consistent with chatbot)
function formatDateIST(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatTimeIST(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

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

// Transform appointment from DB format
function transformAppointment(appointment) {
  if (!appointment) return null;
  return {
    $id: appointment.id,
    $createdAt: appointment.created_at,
    $updatedAt: appointment.updated_at,
    id: appointment.id,
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone,
    date: appointment.date,
    service: appointment.service,
    message: appointment.message,
    status: appointment.status,
    patient_id: appointment.patient_id,
    doctor_id: appointment.doctor_id,
    assigned_by: appointment.assigned_by,
    reason_for_visit: appointment.reason_for_visit,
    rejection_reason: appointment.rejection_reason,
    cancellation_reason: appointment.cancellation_reason,
    rescheduled_from: appointment.rescheduled_from,
    consultation_status: appointment.consultation_status,
    notes: appointment.notes,
    assigned_at: appointment.assigned_at,
    completed_at: appointment.completed_at,
    doctor: appointment.doctor,
    patient: appointment.patient,
  };
}

// POST - Create a new appointment (admin)
export async function POST(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      email,
      phone,
      date,
      service,
      message,
      doctorId,
      patientId,
      reason_for_visit,
    } = data;

    // Validate required fields
    if (!name || !email || !date) {
      return NextResponse.json(
        { error: "Name, email, and date are required" },
        { status: 400 },
      );
    }

    // Check if patient exists or create one
    let patient = null;
    if (patientId) {
      const { data: existingPatient } = await supabaseAdmin
        .from(TABLES.USERS)
        .select("*")
        .eq("id", patientId)
        .single();
      patient = existingPatient;
    } else {
      // Check if user exists by email
      const { data: existingUser } = await supabaseAdmin
        .from(TABLES.USERS)
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existingUser) {
        patient = existingUser;
      } else {
        // Create new patient user
        const { data: newPatient, error: createError } = await supabaseAdmin
          .from(TABLES.USERS)
          .insert({
            email: email.toLowerCase().trim(),
            full_name: name,
            phone: phone,
            role: ROLES.PATIENT,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating patient:", createError);
          return NextResponse.json(
            { error: "Failed to create patient" },
            { status: 500 },
          );
        }
        patient = newPatient;
      }
    }

    // Create the appointment
    const appointmentData = {
      name,
      email: email.toLowerCase().trim(),
      phone,
      date,
      service: service || "General Consultation",
      message: message || reason_for_visit,
      reason_for_visit: reason_for_visit || message,
      status: doctorId
        ? APPOINTMENT_STATUS.APPROVED
        : APPOINTMENT_STATUS.PENDING,
      patient_id: patient?.id,
      doctor_id: doctorId || null,
      assigned_by: doctorId ? admin.id : null,
      assigned_at: doctorId ? new Date().toISOString() : null,
    };

    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError) {
      console.error("Error creating appointment:", appointmentError);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 },
      );
    }

    // Format dates for emails
    const appointmentDate = new Date(date);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // If doctor is assigned, send notifications
    if (doctorId) {
      const { data: doctor } = await supabaseAdmin
        .from(TABLES.DOCTORS)
        .select(`*, user:users(id, full_name, email)`)
        .eq("id", doctorId)
        .single();

      if (doctor) {
        // Notify patient
        await sendEmail(
          email,
          emailTemplates.appointmentApproved(
            name,
            { date: formattedDate, time: formattedTime },
            {
              name: doctor.user.full_name,
              specialization: doctor.specialization,
            },
          ),
        );

        // Notify doctor
        if (doctor.user.email) {
          await sendEmail(
            doctor.user.email,
            emailTemplates.doctorAssignment(
              doctor.user.full_name,
              { date: formattedDate, time: formattedTime },
              {
                name: name,
                age: patient?.age,
                reason: reason_for_visit || message,
              },
            ),
          );
        }

        // Create notification for doctor
        await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert({
          user_id: doctor.user.id,
          title: "New Patient Assigned",
          message: `You have a new appointment with ${name} on ${formattedDate} at ${formattedTime}`,
          type: "appointment",
          related_type: "appointment",
          related_id: appointment.id,
        });
      }
    } else {
      // Send confirmation email to patient
      await sendEmail(
        email,
        emailTemplates.appointmentConfirmation(name, {
          date: formattedDate,
          time: formattedTime,
          service: service || "General Consultation",
        }),
      );
    }

    return NextResponse.json({
      success: true,
      appointment: transformAppointment(appointment),
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // First get total count for pagination
    let countQuery = supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true });

    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status);
    }
    if (doctorId) {
      countQuery = countQuery.eq("doctor_id", doctorId);
    }
    if (patientId) {
      countQuery = countQuery.eq("patient_id", patientId);
    }
    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }

    const { count: totalCount } = await countQuery;

    // Then get paginated data
    let query = supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        *,
        patient:users!appointments_patient_id_fkey (
          id,
          full_name,
          email,
          phone,
          age,
          sex
        ),
        doctor:doctors!appointments_doctor_id_fkey (
          id,
          specialization,
          consultation_fee,
          user:users (
            id,
            full_name,
            email
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (doctorId) {
      query = query.eq("doctor_id", doctorId);
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }

    const { data: appointments, error } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      console.error("Supabase error fetching appointments:", error);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 },
      );
    }

    const hasMore = offset + appointments.length < totalCount;

    return NextResponse.json({
      success: true,
      appointments: appointments.map(transformAppointment),
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("id");
    const action = searchParams.get("action");
    const updateData = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 },
      );
    }

    // Get current appointment data
    const { data: currentAppointment } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        *,
        patient:users!appointments_patient_id_fkey (
          id,
          full_name,
          email
        ),
        doctor:doctors!appointments_doctor_id_fkey (
          id,
          user:users (
            id,
            full_name,
            email
          )
        )
      `,
      )
      .eq("id", appointmentId)
      .single();

    if (!currentAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Handle different actions
    switch (action) {
      case "assign": {
        // Assign doctor and approve
        const { doctorId } = updateData;

        if (!doctorId) {
          return NextResponse.json(
            { error: "Doctor ID is required" },
            { status: 400 },
          );
        }

        // Get doctor info
        const { data: doctor } = await supabaseAdmin
          .from(TABLES.DOCTORS)
          .select(
            `
            *,
            user:users (
              id,
              full_name,
              email
            )
          `,
          )
          .eq("id", doctorId)
          .single();

        if (!doctor) {
          return NextResponse.json(
            { error: "Doctor not found" },
            { status: 404 },
          );
        }

        // Update appointment
        const { data: updatedAppointment, error } = await supabaseAdmin
          .from(TABLES.APPOINTMENTS)
          .update({
            doctor_id: doctorId,
            assigned_by: admin.id,
            assigned_at: new Date().toISOString(),
            status: APPOINTMENT_STATUS.APPROVED,
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Format dates for emails
        const appointmentDate = new Date(currentAppointment.date);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Notify patient
        if (currentAppointment.email) {
          await sendEmail(
            currentAppointment.email,
            emailTemplates.appointmentApproved(
              currentAppointment.name,
              { date: formattedDate, time: formattedTime },
              {
                name: doctor.user.full_name,
                specialization: doctor.specialization,
              },
            ),
          );
        }

        // Notify doctor
        if (doctor.user.email) {
          await sendEmail(
            doctor.user.email,
            emailTemplates.doctorAssignment(
              doctor.user.full_name,
              { date: formattedDate, time: formattedTime },
              {
                name: currentAppointment.name,
                age: currentAppointment.patient?.age,
                reason:
                  currentAppointment.reason_for_visit ||
                  currentAppointment.message,
              },
            ),
          );
        }

        // Create notification for doctor
        await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert({
          user_id: doctor.user.id,
          title: "New Patient Assigned",
          message: `You have a new appointment with ${currentAppointment.name} on ${formattedDate} at ${formattedTime}`,
          type: "appointment",
          related_type: "appointment",
          related_id: appointmentId,
        });

        // Send WhatsApp notification to patient
        if (currentAppointment.phone) {
          await sendWhatsAppNotification(
            currentAppointment.phone,
            NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED,
            {
              patientName: currentAppointment.name,
              date: formatDateIST(currentAppointment.date),
              time: formatTimeIST(currentAppointment.date),
              doctorName: doctor.user.full_name,
            },
          ).catch((err) =>
            console.error("WhatsApp notify error (assign):", err),
          );

          // Schedule appointment reminders
          await scheduleAppointmentReminders(
            currentAppointment.phone,
            currentAppointment.patient_id,
            appointmentId,
            new Date(currentAppointment.date),
            currentAppointment.name,
            doctor.user.full_name,
          ).catch((err) =>
            console.error("WhatsApp reminder schedule error:", err),
          );
        }

        return NextResponse.json({
          success: true,
          appointment: transformAppointment(updatedAppointment),
        });
      }

      case "reject": {
        const { reason } = updateData;

        const { data: updatedAppointment, error } = await supabaseAdmin
          .from(TABLES.APPOINTMENTS)
          .update({
            status: APPOINTMENT_STATUS.REJECTED,
            rejection_reason:
              reason || "Your appointment request could not be accommodated.",
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Notify patient
        const appointmentDate = new Date(currentAppointment.date);
        const formattedDate = appointmentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        if (currentAppointment.email) {
          await sendEmail(
            currentAppointment.email,
            emailTemplates.appointmentRejected(
              currentAppointment.name,
              { date: formattedDate, time: formattedTime },
              reason,
            ),
          );
        }

        // Send WhatsApp notification to patient
        if (currentAppointment.phone) {
          await sendWhatsAppNotification(
            currentAppointment.phone,
            NOTIFICATION_TYPES.APPOINTMENT_REJECTED,
            {
              patientName: currentAppointment.name,
              date: formatDateIST(currentAppointment.date),
              time: formatTimeIST(currentAppointment.date),
              doctorName: currentAppointment.doctor?.user?.full_name || null,
              reason: reason || "unavoidable circumstances",
            },
          ).catch((err) =>
            console.error("WhatsApp notify error (reject):", err),
          );

          // Cancel any scheduled reminders for this rejected appointment
          await supabaseAdmin
            .from("whatsapp_scheduled_messages")
            .update({ status: "cancelled" })
            .eq("related_id", appointmentId)
            .eq("status", "pending")
            .catch(() => {});
        }

        return NextResponse.json({
          success: true,
          appointment: transformAppointment(updatedAppointment),
        });
      }

      case "reschedule": {
        const { newDate, doctorId } = updateData;

        if (!newDate) {
          return NextResponse.json(
            { error: "New date is required" },
            { status: 400 },
          );
        }

        const updateFields = {
          rescheduled_from: currentAppointment.date,
          date: newDate,
          status: doctorId
            ? APPOINTMENT_STATUS.APPROVED
            : APPOINTMENT_STATUS.RESCHEDULED,
        };

        if (doctorId) {
          updateFields.doctor_id = doctorId;
          updateFields.assigned_by = admin.id;
          updateFields.assigned_at = new Date().toISOString();
        }

        const { data: updatedAppointment, error } = await supabaseAdmin
          .from(TABLES.APPOINTMENTS)
          .update(updateFields)
          .eq("id", appointmentId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Format dates
        const oldDate = new Date(currentAppointment.date);
        const newAppointmentDate = new Date(newDate);

        const oldFormattedDate = oldDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const oldFormattedTime = oldDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const newFormattedDate = newAppointmentDate.toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        );
        const newFormattedTime = newAppointmentDate.toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        );

        // Notify patient
        if (currentAppointment.email) {
          await sendEmail(
            currentAppointment.email,
            emailTemplates.appointmentRescheduled(
              currentAppointment.name,
              { date: oldFormattedDate, time: oldFormattedTime },
              { date: newFormattedDate, time: newFormattedTime },
            ),
          );
        }

        // Send WhatsApp notification to patient
        if (currentAppointment.phone) {
          await sendWhatsAppNotification(
            currentAppointment.phone,
            NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED,
            {
              patientName: currentAppointment.name,
              oldDate: `${formatDateIST(currentAppointment.date)} at ${formatTimeIST(currentAppointment.date)}`,
              newDate: formatDateIST(newDate),
              newTime: formatTimeIST(newDate),
              doctorName: currentAppointment.doctor?.user?.full_name || null,
            },
          ).catch((err) =>
            console.error("WhatsApp notify error (reschedule):", err),
          );

          // Cancel old reminders and schedule new ones
          await supabaseAdmin
            .from("whatsapp_scheduled_messages")
            .update({ status: "cancelled" })
            .eq("related_id", appointmentId)
            .eq("status", "pending")
            .catch(() => {});

          await scheduleAppointmentReminders(
            currentAppointment.phone,
            currentAppointment.patient_id,
            appointmentId,
            new Date(newDate),
            currentAppointment.name,
          ).catch((err) =>
            console.error("WhatsApp reminder schedule error:", err),
          );
        }

        return NextResponse.json({
          success: true,
          appointment: transformAppointment(updatedAppointment),
        });
      }

      default: {
        // Regular status update - handle cancellation with reason
        const { status, cancellation_reason, ...otherData } = updateData;

        const updateFields = { ...otherData };
        if (status) {
          updateFields.status = status;
        }
        if (cancellation_reason) {
          updateFields.cancellation_reason = cancellation_reason;
        }

        const { data: updatedAppointment, error } = await supabaseAdmin
          .from(TABLES.APPOINTMENTS)
          .update(updateFields)
          .eq("id", appointmentId)
          .select()
          .single();

        if (error) {
          console.error("Supabase error updating appointment:", error);
          return NextResponse.json(
            { error: "Failed to update appointment" },
            { status: 500 },
          );
        }

        // Send cancellation email if status is cancelled and reason provided
        if (status === "cancelled" && currentAppointment.email) {
          const appointmentDate = new Date(currentAppointment.date);
          const formattedDate = appointmentDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

          await sendEmail(
            currentAppointment.email,
            emailTemplates.appointmentCancelled(
              currentAppointment.name,
              { date: formattedDate, time: formattedTime },
              cancellation_reason || "No specific reason provided.",
            ),
          );
        }

        // Send WhatsApp cancellation notification
        if (status === "cancelled" && currentAppointment.phone) {
          await sendWhatsAppNotification(
            currentAppointment.phone,
            NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
            {
              patientName: currentAppointment.name,
              date: formatDateIST(currentAppointment.date),
            },
          ).catch((err) =>
            console.error("WhatsApp notify error (cancel):", err),
          );

          // Cancel scheduled reminders
          await supabaseAdmin
            .from("whatsapp_scheduled_messages")
            .update({ status: "cancelled" })
            .eq("related_id", appointmentId)
            .eq("status", "pending")
            .catch(() => {});
        }

        return NextResponse.json({
          success: true,
          appointment: transformAppointment(updatedAppointment),
        });
      }
    }
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("id");

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .delete()
      .eq("id", appointmentId);

    if (error) {
      console.error("Supabase error deleting appointment:", error);
      return NextResponse.json(
        { error: "Failed to delete appointment" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 },
    );
  }
}
