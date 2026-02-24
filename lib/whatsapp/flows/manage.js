// WhatsApp Chatbot — Appointment Status, Cancel, and Reschedule Flows

import { supabaseAdmin, TABLES, APPOINTMENT_STATUS } from "@/lib/supabase.config";
import { sendTextMessage, sendButtonMessage, sendListMessage } from "../service";
import { updateConversation, resetConversation, logMessage } from "../conversation";
import { CANCEL_STEPS, RESCHEDULE_STEPS, STATUS_STEPS, ACTIONS, TIME_SLOTS } from "../constants";
import * as templates from "../templates";

// Format appointment date for display
function formatAppointmentDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}

// Fetch appointments for a user
async function fetchUserAppointments(userId, statusFilter = null) {
  let query = supabaseAdmin
    .from(TABLES.APPOINTMENTS)
    .select(`*, doctor:doctors(*, user:users(full_name))`)
    .eq("patient_id", userId)
    .order("date", { ascending: true });

  if (statusFilter) {
    if (Array.isArray(statusFilter)) {
      query = query.in("status", statusFilter);
    } else {
      query = query.eq("status", statusFilter);
    }
  } else {
    // Exclude completed and cancelled by default
    query = query.in("status", ["pending", "approved", "rescheduled"]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }
  return data || [];
}

// Find user by phone or email
async function findUser(conversation, phone) {
  // First check if conversation is linked to a user
  if (conversation.user_id) {
    const { data } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, full_name, email")
      .eq("id", conversation.user_id)
      .single();
    if (data) return data;
  }

  // Try to find by phone
  const cleanPhone = phone.replace(/[\s\-+]/g, "");
  const { data: byPhone } = await supabaseAdmin
    .from(TABLES.USERS)
    .select("id, full_name, email")
    .eq("phone", cleanPhone)
    .single();

  if (byPhone) return byPhone;

  // Also try with country code variations
  const phoneVariations = [cleanPhone, `+${cleanPhone}`, cleanPhone.slice(2)];
  for (const variant of phoneVariations) {
    const { data } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, full_name, email")
      .eq("phone", variant)
      .single();
    if (data) return data;
  }

  return null;
}

// --- STATUS FLOW ---

export async function startStatusFlow(conversation, phone) {
  const user = await findUser(conversation, phone);

  if (!user) {
    await updateConversation(conversation.id, {
      flow: "status",
      current_step: STATUS_STEPS.AWAITING_EMAIL,
    });
    await sendTextMessage(phone, "I couldn't find an account linked to this number.\n\nPlease share the *email address* you used when booking your appointment.");
    return;
  }

  await showAppointmentStatus(conversation, phone, user);
}

export async function handleStatusStep(conversation, phone, message) {
  if (conversation.current_step === STATUS_STEPS.AWAITING_EMAIL) {
    const email = message.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await sendTextMessage(phone, templates.invalidInput("Please enter a valid email address."));
      return;
    }

    const { data: user } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, full_name, email")
      .eq("email", email)
      .single();

    if (!user) {
      await sendTextMessage(phone, "No account found with that email.\n\nWould you like to book an appointment instead? Reply \"book\" to get started.\n\n_Type \"menu\" for main menu._");
      await resetConversation(conversation.id);
      return;
    }

    await showAppointmentStatus(conversation, phone, user);
  }
}

async function showAppointmentStatus(conversation, phone, user) {
  const appointments = await fetchUserAppointments(user.id);

  const formatted = appointments.map((apt) => ({
    status: apt.status,
    formattedDate: formatAppointmentDate(apt.date),
    doctorName: apt.doctor?.user?.full_name || null,
    reason: apt.reason_for_visit,
  }));

  await sendTextMessage(phone, templates.statusReport(formatted));
  await logMessage(conversation.id, phone, "outbound", `Status check: ${appointments.length} appointments`);
  await resetConversation(conversation.id);
}

// --- CANCEL FLOW ---

export async function startCancelFlow(conversation, phone) {
  const user = await findUser(conversation, phone);

  if (!user) {
    await sendTextMessage(phone, "I couldn't find an account linked to this number.\n\nPlease book an appointment first or contact us directly.\n\n_Type \"menu\" for main menu._");
    await resetConversation(conversation.id);
    return;
  }

  const appointments = await fetchUserAppointments(user.id, ["pending", "approved", "rescheduled"]);

  if (appointments.length === 0) {
    await sendTextMessage(phone, "You don't have any active appointments to cancel.\n\n_Type \"menu\" for main menu._");
    await resetConversation(conversation.id);
    return;
  }

  await updateConversation(conversation.id, {
    flow: "cancel",
    current_step: CANCEL_STEPS.AWAITING_SELECTION,
    context: {
      userId: user.id,
      appointments: appointments.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        formattedDate: formatAppointmentDate(a.date),
      })),
    },
  });

  const sections = [
    {
      title: "Active Appointments",
      rows: appointments.map((apt, i) => ({
        id: `cancel_${apt.id}`,
        title: `${formatAppointmentDate(apt.date).split(",")[0]}`,
        description: `${apt.status.toUpperCase()} — ${apt.reason_for_visit || "General"}`.substring(0, 72),
      })),
    },
  ];

  await sendListMessage(
    phone,
    templates.cancelSelectAppointment(),
    "Select Appointment",
    sections,
    "Cancel Appointment"
  );
}

export async function handleCancelStep(conversation, phone, message, messageType) {
  const step = conversation.current_step;
  const ctx = conversation.context || {};

  if (step === CANCEL_STEPS.AWAITING_SELECTION) {
    let appointmentId;

    if (messageType === "interactive" && message.startsWith("cancel_")) {
      appointmentId = message.replace("cancel_", "");
    } else {
      // Try to match by number
      const num = parseInt(message);
      if (num > 0 && num <= ctx.appointments?.length) {
        appointmentId = ctx.appointments[num - 1].id;
      }
    }

    if (!appointmentId) {
      await sendTextMessage(phone, templates.invalidInput("Please select an appointment from the list."));
      return;
    }

    const apt = ctx.appointments.find((a) => a.id === appointmentId);

    await updateConversation(conversation.id, {
      current_step: CANCEL_STEPS.AWAITING_CONFIRM,
      context: { ...ctx, selectedAppointmentId: appointmentId },
    });

    await sendButtonMessage(
      phone,
      templates.cancelConfirmation({
        date: apt?.formattedDate || "your scheduled date",
        time: "",
      }),
      [
        { id: ACTIONS.CONFIRM_YES, title: "✅ Yes, Cancel" },
        { id: ACTIONS.CONFIRM_NO, title: "❌ No, Keep It" },
      ]
    );
  } else if (step === CANCEL_STEPS.AWAITING_CONFIRM) {
    const isConfirm =
      (messageType === "interactive" && message === ACTIONS.CONFIRM_YES) ||
      message.toLowerCase().match(/^(yes|y|confirm)$/);

    if (!isConfirm) {
      await sendTextMessage(phone, "Appointment cancellation aborted. Your appointment is still active.\n\n_Type \"menu\" for main menu._");
      await resetConversation(conversation.id);
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from(TABLES.APPOINTMENTS)
        .update({
          status: APPOINTMENT_STATUS.CANCELLED,
          cancellation_reason: "Cancelled by patient via WhatsApp",
        })
        .eq("id", ctx.selectedAppointmentId);

      if (error) throw error;

      // Cancel scheduled reminders for this appointment
      await supabaseAdmin
        .from("whatsapp_scheduled_messages")
        .update({ status: "cancelled" })
        .eq("related_id", ctx.selectedAppointmentId)
        .eq("status", "pending");

      await sendTextMessage(phone, templates.cancelSuccess());
      await logMessage(conversation.id, phone, "outbound", `Cancelled appointment: ${ctx.selectedAppointmentId}`);
    } catch (error) {
      console.error("Cancel error:", error);
      await sendTextMessage(phone, "Sorry, we couldn't cancel the appointment. Please try again or contact us.\n\n_Type \"menu\" for main menu._");
    }

    await resetConversation(conversation.id);
  }
}

// --- RESCHEDULE FLOW ---

export async function startRescheduleFlow(conversation, phone) {
  const user = await findUser(conversation, phone);

  if (!user) {
    await sendTextMessage(phone, "I couldn't find an account linked to this number.\n\nPlease book an appointment first or contact us directly.\n\n_Type \"menu\" for main menu._");
    await resetConversation(conversation.id);
    return;
  }

  const appointments = await fetchUserAppointments(user.id, ["pending", "approved"]);

  if (appointments.length === 0) {
    await sendTextMessage(phone, "You don't have any active appointments to reschedule.\n\n_Type \"menu\" for main menu._");
    await resetConversation(conversation.id);
    return;
  }

  await updateConversation(conversation.id, {
    flow: "reschedule",
    current_step: RESCHEDULE_STEPS.AWAITING_SELECTION,
    context: {
      userId: user.id,
      appointments: appointments.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        formattedDate: formatAppointmentDate(a.date),
      })),
    },
  });

  const sections = [
    {
      title: "Active Appointments",
      rows: appointments.map((apt) => ({
        id: `resched_${apt.id}`,
        title: `${formatAppointmentDate(apt.date).split(",")[0]}`,
        description: `${apt.status.toUpperCase()} — ${apt.reason_for_visit || "General"}`.substring(0, 72),
      })),
    },
  ];

  await sendListMessage(
    phone,
    templates.rescheduleSelectAppointment(),
    "Select Appointment",
    sections,
    "Reschedule"
  );
}

export async function handleRescheduleStep(conversation, phone, message, messageType) {
  const step = conversation.current_step;
  const ctx = conversation.context || {};

  if (step === RESCHEDULE_STEPS.AWAITING_SELECTION) {
    let appointmentId;

    if (messageType === "interactive" && message.startsWith("resched_")) {
      appointmentId = message.replace("resched_", "");
    } else {
      const num = parseInt(message);
      if (num > 0 && num <= ctx.appointments?.length) {
        appointmentId = ctx.appointments[num - 1].id;
      }
    }

    if (!appointmentId) {
      await sendTextMessage(phone, templates.invalidInput("Please select an appointment from the list."));
      return;
    }

    await updateConversation(conversation.id, {
      current_step: RESCHEDULE_STEPS.AWAITING_DATE,
      context: { ...ctx, selectedAppointmentId: appointmentId },
    });

    await sendTextMessage(phone, templates.askDate());
  } else if (step === RESCHEDULE_STEPS.AWAITING_DATE) {
    const cleaned = message.trim().replace(/[-\/\.]/g, "/");
    const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (!match) {
      await sendTextMessage(phone, templates.invalidInput("Please enter a valid date in DD/MM/YYYY format."));
      return;
    }

    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    const date = new Date(year, month, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today || date.getDay() === 0) {
      await sendTextMessage(phone, templates.invalidInput("Date must be a future weekday (Monday–Saturday)."));
      return;
    }

    const formattedDate = date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    await updateConversation(conversation.id, {
      current_step: RESCHEDULE_STEPS.AWAITING_TIME,
      context: {
        ...ctx,
        newDate: date.toISOString().split("T")[0],
        newFormattedDate: formattedDate,
      },
    });

    const sections = [
      {
        title: "Morning Slots",
        rows: TIME_SLOTS.filter((s) => parseInt(s.value) < 12).map((s) => ({
          id: `rs_${s.id}`,
          title: s.title,
        })),
      },
      {
        title: "Afternoon Slots",
        rows: TIME_SLOTS.filter((s) => parseInt(s.value) >= 12).map((s) => ({
          id: `rs_${s.id}`,
          title: s.title,
        })),
      },
    ];

    await sendListMessage(
      phone,
      `Select your new time slot for *${formattedDate}*:`,
      "View Time Slots",
      sections,
      "Select Time"
    );
  } else if (step === RESCHEDULE_STEPS.AWAITING_TIME) {
    let selectedSlot;

    if (messageType === "interactive") {
      const slotId = message.replace("rs_", "");
      selectedSlot = TIME_SLOTS.find((s) => s.id === slotId);
    } else {
      const cleaned = message.trim().replace(/\s+/g, " ").toUpperCase();
      selectedSlot = TIME_SLOTS.find(
        (s) => s.title.toUpperCase() === cleaned || s.value === message.trim()
      );
    }

    if (!selectedSlot) {
      await sendTextMessage(phone, templates.invalidInput("Please select a valid time slot."));
      return;
    }

    await updateConversation(conversation.id, {
      current_step: RESCHEDULE_STEPS.AWAITING_CONFIRM,
      context: {
        ...ctx,
        newTime: selectedSlot.value,
        newFormattedTime: selectedSlot.title,
      },
    });

    await sendButtonMessage(
      phone,
      `Reschedule to *${ctx.newFormattedDate}* at *${selectedSlot.title}*?`,
      [
        { id: ACTIONS.CONFIRM_YES, title: "✅ Confirm" },
        { id: ACTIONS.CONFIRM_NO, title: "❌ Cancel" },
      ]
    );
  } else if (step === RESCHEDULE_STEPS.AWAITING_CONFIRM) {
    const isConfirm =
      (messageType === "interactive" && message === ACTIONS.CONFIRM_YES) ||
      message.toLowerCase().match(/^(yes|y|confirm)$/);

    if (!isConfirm) {
      await sendTextMessage(phone, "Reschedule cancelled. Your appointment remains as is.\n\n_Type \"menu\" for main menu._");
      await resetConversation(conversation.id);
      return;
    }

    try {
      // Get current appointment for rescheduled_from
      const { data: currentApt } = await supabaseAdmin
        .from(TABLES.APPOINTMENTS)
        .select("date")
        .eq("id", ctx.selectedAppointmentId)
        .single();

      // Create new datetime
      const [hours, minutes] = ctx.newTime.split(":").map(Number);
      const newDate = new Date(ctx.newDate);
      newDate.setHours(hours, minutes, 0, 0);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const newDateUTC = new Date(newDate.getTime() - istOffset).toISOString();

      const { error } = await supabaseAdmin
        .from(TABLES.APPOINTMENTS)
        .update({
          date: newDateUTC,
          status: APPOINTMENT_STATUS.RESCHEDULED,
          rescheduled_from: currentApt?.date,
        })
        .eq("id", ctx.selectedAppointmentId);

      if (error) throw error;

      // Cancel old reminders and schedule new ones
      await supabaseAdmin
        .from("whatsapp_scheduled_messages")
        .update({ status: "cancelled" })
        .eq("related_id", ctx.selectedAppointmentId)
        .eq("status", "pending");

      await sendTextMessage(
        phone,
        templates.rescheduleSuccess({
          date: ctx.newFormattedDate,
          time: ctx.newFormattedTime,
        })
      );

      await logMessage(conversation.id, phone, "outbound", `Rescheduled appointment: ${ctx.selectedAppointmentId}`);
    } catch (error) {
      console.error("Reschedule error:", error);
      await sendTextMessage(phone, "Sorry, we couldn't reschedule the appointment. Please try again or contact us.\n\n_Type \"menu\" for main menu._");
    }

    await resetConversation(conversation.id);
  }
}
