// WhatsApp Notification Service
// Handles scheduling and sending appointment reminders, follow-ups, and system notifications

import { supabaseAdmin, TABLES } from "@/lib/supabase.config";
import { sendTextMessage, sendTemplateMessage } from "./service";
import {
  WA_TABLES,
  NOTIFICATION_TYPES,
  TEMPLATES,
  TEMPLATE_LANGUAGES,
  CLINIC_NAME,
  CLINIC_PHONE,
} from "./constants";
import { logMessage } from "./conversation";
import * as templates from "./templates";

// Check if a phone number has opted out of notifications
async function isOptedOut(phone) {
  const cleanPhone = phone.replace(/[\s\-+]/g, "");
  const { data } = await supabaseAdmin
    .from(WA_TABLES.CONVERSATIONS)
    .select("opted_out")
    .eq("phone", cleanPhone)
    .maybeSingle();
  return data?.opted_out === true;
}

// Log an outbound notification to the audit table
async function logOutboundNotification(
  phone,
  type,
  content,
  success,
  messageId,
) {
  try {
    const cleanPhone = phone.replace(/[\s\-+]/g, "");
    // Find conversation ID for this phone
    const { data: convo } = await supabaseAdmin
      .from(WA_TABLES.CONVERSATIONS)
      .select("id")
      .eq("phone", cleanPhone)
      .maybeSingle();

    await logMessage(
      convo?.id || null,
      cleanPhone,
      "outbound",
      `[${type}] ${typeof content === "string" ? content.substring(0, 200) : "template message"}`,
      "notification",
      messageId || null,
      { notificationType: type, success },
    );
  } catch (err) {
    console.error("Error logging outbound notification:", err);
  }
}

// Schedule appointment reminders (24h and 1h before)
// Deduplicates: cancels any existing pending reminders for the same appointment first
export async function scheduleAppointmentReminders(
  phone,
  userId,
  appointmentId,
  appointmentDate,
  patientName,
  doctorName = null,
) {
  // Cancel any existing pending reminders for this appointment (prevent duplicates)
  await supabaseAdmin
    .from(WA_TABLES.SCHEDULED)
    .update({ status: "cancelled" })
    .eq("related_id", appointmentId)
    .eq("status", "pending")
    .in("message_type", [
      NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H,
      NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H,
    ]);

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
      template_name: TEMPLATES.APPOINTMENT_REMINDER,
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
      template_name: TEMPLATES.APPOINTMENT_REMINDER,
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
export async function scheduleFollowUpReminder(
  phone,
  userId,
  appointmentId,
  patientName,
  doctorName,
  daysAfter = 7,
) {
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + daysAfter);
  // 10:00 AM IST = 04:30 UTC
  followUpDate.setUTCHours(4, 30, 0, 0);

  const { error } = await supabaseAdmin.from(WA_TABLES.SCHEDULED).insert({
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

// Build Meta template message components for a given template
function buildTemplateComponents(templateName, params) {
  switch (templateName) {
    case TEMPLATES.APPOINTMENT_CONFIRMATION:
      // Body: Hi {{1}}, Your appointment is scheduled for {{2}}. Service: {{3}} Confirmation number: {{4}}
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.patientName || "Patient" },
            {
              type: "text",
              text: `${params.date}${params.time ? ` at ${params.time}` : ""}`,
            },
            {
              type: "text",
              text: params.service || params.reason || "General Consultation",
            },
            { type: "text", text: params.appointmentId || "N/A" },
          ],
        },
      ];

    case TEMPLATES.APPOINTMENT_CANCELLED:
      // Body: Hi {{1}}, Your appointment on {{2}} has been cancelled.
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.patientName || "Patient" },
            { type: "text", text: params.date || "your scheduled date" },
          ],
        },
      ];

    case TEMPLATES.APPOINTMENT_REMINDER:
      // Body: Hello {{1}}, reminder about your appointment with {{2}} on {{3}} at {{4}}.
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.patientName || "Patient" },
            { type: "text", text: CLINIC_NAME },
            { type: "text", text: params.date || "your scheduled date" },
            { type: "text", text: params.time || "your scheduled time" },
          ],
        },
      ];

    case TEMPLATES.MISSED_APPOINTMENT:
      // Body: Hi {{1}}, we missed you at your scheduled {{2}} appointment on {{3}}. Contact {{4}}.
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.patientName || "Patient" },
            { type: "text", text: params.service || "General Consultation" },
            { type: "text", text: params.date || "your scheduled date" },
            { type: "text", text: CLINIC_PHONE },
          ],
        },
      ];

    case TEMPLATES.RESCHEDULED:
      // Body: Dear {{patient_name}}, Your appointment with Dr. {{doctor_name}} has been rescheduled. New Date: {{date}} New Time: {{time}} ... contact {{clinic_name}}.
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.patientName || "Patient" },
            { type: "text", text: params.doctorName || "our doctor" },
            {
              type: "text",
              text: params.newDate || params.date || "your new date",
            },
            {
              type: "text",
              text: params.newTime || params.time || "your new time",
            },
            { type: "text", text: CLINIC_NAME },
          ],
        },
      ];

    case TEMPLATES.REJECTED:
      // Body: Dear {{patient_name}}, Greetings from {{clinic_name}}, Your appointment on {{date}} at {{time}} with Dr. {{doctor_name}} has been cancelled due to {{reason}}.
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.patientName || "Patient" },
            { type: "text", text: CLINIC_NAME },
            { type: "text", text: params.date || "your scheduled date" },
            { type: "text", text: params.time || "" },
            { type: "text", text: params.doctorName || "our doctor" },
            {
              type: "text",
              text: params.reason || "unavoidable circumstances",
            },
          ],
        },
      ];

    default:
      return [];
  }
}

// Try to send via Meta template message first, fall back to text message
async function sendWithTemplateFallback(
  phone,
  templateName,
  params,
  textMessage,
) {
  if (templateName) {
    const components = buildTemplateComponents(templateName, params);
    const language = TEMPLATE_LANGUAGES[templateName] || "en";
    const result = await sendTemplateMessage(
      phone,
      templateName,
      language,
      components,
    );
    if (result.success) return result;
    // Template failed (maybe not approved yet) — fall back to text
    console.warn(
      `Template "${templateName}" failed, falling back to text message:`,
      result.error,
    );
  }
  return await sendTextMessage(phone, textMessage);
}

// Send an instant WhatsApp notification (for system events)
export async function sendWhatsAppNotification(phone, type, params) {
  if (!phone) return { success: false, error: "No phone number" };

  // Check if user has opted out
  try {
    if (await isOptedOut(phone)) {
      console.log(`Skipping notification to opted-out number: ${phone}`);
      return { success: false, error: "User opted out" };
    }
  } catch (err) {
    // Don't block notification if opt-out check fails
    console.error("Opt-out check error:", err);
  }

  let message;
  let templateName = null;

  switch (type) {
    case NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED:
      message = templates.appointmentConfirmedNotification(params);
      templateName = TEMPLATES.APPOINTMENT_CONFIRMATION;
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_REJECTED:
      message = templates.appointmentRejectedNotification(params);
      templateName = TEMPLATES.REJECTED;
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED:
      message = templates.appointmentRescheduledNotification(params);
      templateName = TEMPLATES.RESCHEDULED;
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_CANCELLED:
      message = templates.appointmentCancelledNotification(params);
      templateName = TEMPLATES.APPOINTMENT_CANCELLED;
      break;
    case NOTIFICATION_TYPES.PRESCRIPTION_READY:
      message = templates.prescriptionReadyNotification(params);
      // TODO: Replace with template message once approved
      break;
    case NOTIFICATION_TYPES.PRESCRIPTION_DISPENSED:
      message = templates.prescriptionDispensedNotification(params);
      // TODO: Replace with template message once approved
      break;
    case NOTIFICATION_TYPES.FOLLOW_UP:
      message = templates.followUpReminder(params);
      // TODO: Replace with template message once approved
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER_24H:
      message = templates.appointmentReminder24h(params);
      templateName = TEMPLATES.APPOINTMENT_REMINDER;
      break;
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER_1H:
      message = templates.appointmentReminder1h(params);
      templateName = TEMPLATES.APPOINTMENT_REMINDER;
      break;
    default:
      console.error("Unknown notification type:", type);
      return { success: false, error: "Unknown notification type" };
  }

  const result = await sendWithTemplateFallback(
    phone,
    templateName,
    params,
    message,
  );

  // Log outbound notification to audit table
  await logOutboundNotification(
    phone,
    type,
    message,
    result.success,
    result.messageId,
  );

  return result;
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
      // Check if user has opted out
      try {
        if (await isOptedOut(msg.phone)) {
          await supabaseAdmin
            .from(WA_TABLES.SCHEDULED)
            .update({ status: "cancelled", error_message: "User opted out" })
            .eq("id", msg.id);
          continue;
        }
      } catch (err) {
        console.error("Opt-out check error in cron:", err);
      }

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

      const result = await sendWhatsAppNotification(
        msg.phone,
        msg.message_type,
        params,
      );

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
              ? {
                  scheduled_at: new Date(
                    Date.now() + 5 * 60 * 1000,
                  ).toISOString(),
                }
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
