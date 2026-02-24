// WhatsApp Notification Service
// Handles scheduling and sending appointment reminders, follow-ups, and system notifications

import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import { sendTextMessage } from "./service";
import { WA_TABLES, NOTIFICATION_TYPES } from "./constants";
import * as templates from "./templates";

// Schedule appointment reminders (24h and 1h before)
export async function scheduleAppointmentReminders(phone, userId, appointmentId, appointmentDate, patientName, doctorName = null) {
  const reminders = [];

  // 24-hour reminder
  const reminder24h = new Date(appointmentDate);
  reminder24h.setHours(reminder24h.getHours() - 24);

  // Only schedule if it's in the future
  if (reminder24h > new Date()) {
    reminders.push({
      phone,
      user_id: userId,
      message_type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H,
      related_type: "appointment",
      related_id: appointmentId,
      scheduled_at: reminder24h.toISOString(),
      template_params: { patientName, doctorName },
      status: "pending",
    });
  }

  // 1-hour reminder
  const reminder1h = new Date(appointmentDate);
  reminder1h.setHours(reminder1h.getHours() - 1);

  if (reminder1h > new Date()) {
    reminders.push({
      phone,
      user_id: userId,
      message_type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H,
      related_type: "appointment",
      related_id: appointmentId,
      scheduled_at: reminder1h.toISOString(),
      template_params: { patientName, doctorName },
      status: "pending",
    });
  }

  if (reminders.length > 0) {
    const { error } = await supabaseAdmin
      .from(WA_TABLES.SCHEDULED)
      .insert(reminders);

    if (error) {
      console.error("Error scheduling reminders:", error);
    }
  }

  return reminders.length;
}

// Schedule a follow-up reminder (7 days after consultation)
export async function scheduleFollowUpReminder(phone, userId, appointmentId, patientName, doctorName, daysAfter = 7) {
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + daysAfter);
  followUpDate.setHours(10, 0, 0, 0); // 10 AM IST

  const { error } = await supabaseAdmin
    .from(WA_TABLES.SCHEDULED)
    .insert({
      phone,
      user_id: userId,
      message_type: NOTIFICATION_TYPES.FOLLOW_UP,
      related_type: "appointment",
      related_id: appointmentId,
      scheduled_at: followUpDate.toISOString(),
      template_params: { patientName, doctorName, daysAfter },
      status: "pending",
    });

  if (error) {
    console.error("Error scheduling follow-up:", error);
  }
}

// Send an instant WhatsApp notification (for system events)
export async function sendWhatsAppNotification(phone, type, params) {
  if (!phone) return { success: false, error: "No phone number" };

  let message;

  switch (type) {
    case NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED:
      message = templates.appointmentConfirmedNotification(params);
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_REJECTED:
      message = templates.appointmentRejectedNotification(params);
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED:
      message = templates.appointmentRescheduledNotification(params);
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_CANCELLED:
      message = templates.appointmentCancelledNotification(params);
      break;
    case NOTIFICATION_TYPES.PRESCRIPTION_READY:
      message = templates.prescriptionReadyNotification(params);
      break;
    case NOTIFICATION_TYPES.PRESCRIPTION_DISPENSED:
      message = templates.prescriptionDispensedNotification(params);
      break;
    case NOTIFICATION_TYPES.FOLLOW_UP:
      message = templates.followUpReminder(params);
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H:
      message = templates.appointmentReminder24h(params);
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H:
      message = templates.appointmentReminder1h(params);
      break;
    default:
      console.error("Unknown notification type:", type);
      return { success: false, error: "Unknown notification type" };
  }

  return await sendTextMessage(phone, message);
}

// Process scheduled messages (called by cron endpoint)
export async function processScheduledMessages() {
  const now = new Date().toISOString();

  // Fetch pending messages that are due
  const { data: pending, error } = await supabaseAdmin
    .from(WA_TABLES.SCHEDULED)
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Error fetching scheduled messages:", error);
    return { processed: 0, errors: 0 };
  }

  if (!pending || pending.length === 0) {
    return { processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const msg of pending) {
    try {
      // Check if the related appointment is still active (not cancelled)
      if (msg.related_type === "appointment" && msg.related_id) {
        const { data: apt } = await supabaseAdmin
          .from(TABLES.APPOINTMENTS)
          .select("status")
          .eq("id", msg.related_id)
          .single();

        if (apt?.status === "cancelled" || apt?.status === "rejected") {
          // Skip — appointment was cancelled
          await supabaseAdmin
            .from(WA_TABLES.SCHEDULED)
            .update({ status: "cancelled" })
            .eq("id", msg.id);
          continue;
        }
      }

      // Build params for message
      let params = msg.template_params || {};

      // For reminder messages, fetch latest appointment details
      if (
        msg.message_type === NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H ||
        msg.message_type === NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H
      ) {
        if (msg.related_id) {
          const { data: apt } = await supabaseAdmin
            .from(TABLES.APPOINTMENTS)
            .select("date, doctor:doctors(*, user:users(full_name))")
            .eq("id", msg.related_id)
            .single();

          if (apt) {
            const aptDate = new Date(apt.date);
            params = {
              ...params,
              date: aptDate.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              }),
              time: aptDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Kolkata",
              }),
              doctorName: apt.doctor?.user?.full_name || params.doctorName,
            };
          }
        }
      }

      // For follow-up, calculate days since
      if (msg.message_type === NOTIFICATION_TYPES.FOLLOW_UP) {
        params.daysSince = params.daysAfter || 7;
      }

      const result = await sendWhatsAppNotification(msg.phone, msg.message_type, params);

      if (result.success) {
        await supabaseAdmin
          .from(WA_TABLES.SCHEDULED)
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", msg.id);
        processed++;
      } else {
        const retryCount = (msg.retry_count || 0) + 1;
        const newStatus = retryCount >= 3 ? "failed" : "pending";

        await supabaseAdmin
          .from(WA_TABLES.SCHEDULED)
          .update({
            status: newStatus,
            retry_count: retryCount,
            error_message: result.error,
            // If retrying, push scheduled_at forward by 5 minutes
            ...(newStatus === "pending"
              ? { scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() }
              : {}),
          })
          .eq("id", msg.id);
        errors++;
      }
    } catch (err) {
      console.error(`Error processing scheduled message ${msg.id}:`, err);
      await supabaseAdmin
        .from(WA_TABLES.SCHEDULED)
        .update({
          status: "failed",
          error_message: err.message,
          retry_count: (msg.retry_count || 0) + 1,
        })
        .eq("id", msg.id);
      errors++;
    }
  }

  return { processed, errors, total: pending.length };
}
