// WhatsApp Chatbot — Appointment Booking Flow Handler

import {
  supabaseAdmin,
  TABLES,
  ROLES,
  APPOINTMENT_STATUS,
} from "@/lib/supabase.config";
import {
  sendTextMessage,
  sendButtonMessage,
  sendListMessage,
} from "../service";
import {
  updateConversation,
  updateContext,
  resetConversation,
  logMessage,
  linkConversationToUser,
} from "../conversation";
import { BOOKING_STEPS, ACTIONS, TIME_SLOTS } from "../constants";
import { sendEmail, emailTemplates } from "@/lib/email/service";
import { scheduleAppointmentReminders } from "../notifications";
import * as templates from "../templates";

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Parse date from DD/MM/YYYY format
function parseDate(input) {
  const cleaned = input.trim().replace(/[-\/\.]/g, "/");
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]) - 1;
  const year = parseInt(match[3]);
  const date = new Date(year, month, day);

  // Validate it's a real date
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  // Must be in the future (IST-aware)
  const nowIST = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
  const todayIST = new Date(
    nowIST.getFullYear(),
    nowIST.getMonth(),
    nowIST.getDate(),
  );
  if (date < todayIST) return null;

  // Must not be a Sunday
  if (date.getDay() === 0) return null;

  // Must not be more than 90 days out
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 90);
  if (date > maxDate) return null;

  return date;
}

function formatDate(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function formatDateForDB(date, timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  // Create date in IST (UTC+5:30)
  const dbDate = new Date(date);
  dbDate.setHours(hours, minutes, 0, 0);
  // Convert IST to UTC for storage
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(dbDate.getTime() - istOffset).toISOString();
}

// Start booking flow
export async function startBookingFlow(conversation, phone) {
  await updateConversation(conversation.id, {
    flow: "booking",
    current_step: BOOKING_STEPS.AWAITING_NAME,
    context: {},
  });

  // Check if we already have user info from previous conversations
  if (conversation.user_id) {
    const { data: user } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("full_name, email, phone")
      .eq("id", conversation.user_id)
      .single();

    if (user?.full_name && user?.email) {
      // Skip name and email — we already know them
      await updateConversation(conversation.id, {
        current_step: BOOKING_STEPS.AWAITING_REASON,
        context: {
          name: user.full_name,
          email: user.email,
        },
      });

      const msg = `Welcome back, *${user.full_name}*! 😊\n\nLet's book your appointment.\n\n${templates.askReason()}`;
      await sendTextMessage(phone, msg);
      await logMessage(conversation.id, phone, "outbound", msg);
      return;
    }
  }

  await sendTextMessage(phone, templates.askName());
  await logMessage(conversation.id, phone, "outbound", templates.askName());
}

// Handle each step in the booking flow
export async function handleBookingStep(
  conversation,
  phone,
  message,
  messageType,
) {
  const step = conversation.current_step;
  const ctx = conversation.context || {};

  switch (step) {
    case BOOKING_STEPS.AWAITING_NAME:
      return handleName(conversation, phone, message);

    case BOOKING_STEPS.AWAITING_EMAIL:
      return handleEmail(conversation, phone, message);

    case BOOKING_STEPS.AWAITING_REASON:
      return handleReason(conversation, phone, message);

    case BOOKING_STEPS.AWAITING_DATE:
      return handleDate(conversation, phone, message);

    case BOOKING_STEPS.AWAITING_TIME:
      return handleTime(conversation, phone, message, messageType);

    case BOOKING_STEPS.AWAITING_CONFIRM:
      return handleConfirmation(conversation, phone, message, messageType);

    default:
      await resetConversation(conversation.id);
      await sendTextMessage(phone, "Something went wrong. Let's start over.");
      return;
  }
}

async function handleName(conversation, phone, message) {
  const name = message.trim();

  if (name.length < 2 || name.length > 100) {
    await sendTextMessage(
      phone,
      templates.invalidInput(
        "Please enter a valid full name (2–100 characters).",
      ),
    );
    return;
  }

  await updateConversation(conversation.id, {
    current_step: BOOKING_STEPS.AWAITING_EMAIL,
    context: { ...conversation.context, name },
  });

  await sendTextMessage(
    phone,
    `Thanks, *${name}*! 👍\n\n${templates.askEmail()}`,
  );
  await logMessage(conversation.id, phone, "outbound", "Asked for email");
}

async function handleEmail(conversation, phone, message) {
  const email = message.trim().toLowerCase();

  if (!isValidEmail(email)) {
    await sendTextMessage(
      phone,
      templates.invalidInput(
        "Please enter a valid email address.\n\n_Example: rahul@email.com_",
      ),
    );
    return;
  }

  // Check if user exists — link to conversation if so
  const { data: existingUser } = await supabaseAdmin
    .from(TABLES.USERS)
    .select("id, full_name")
    .eq("email", email)
    .single();

  if (existingUser) {
    await linkConversationToUser(conversation.id, existingUser.id);
  }

  await updateConversation(conversation.id, {
    current_step: BOOKING_STEPS.AWAITING_REASON,
    context: { ...conversation.context, email },
  });

  await sendTextMessage(phone, templates.askReason());
  await logMessage(conversation.id, phone, "outbound", "Asked for reason");
}

async function handleReason(conversation, phone, message) {
  const reason = message.trim();

  if (reason.length < 2) {
    await sendTextMessage(
      phone,
      templates.invalidInput("Please describe your reason for visiting."),
    );
    return;
  }

  await updateConversation(conversation.id, {
    current_step: BOOKING_STEPS.AWAITING_DATE,
    context: { ...conversation.context, reason },
  });

  await sendTextMessage(phone, templates.askDate());
  await logMessage(conversation.id, phone, "outbound", "Asked for date");
}

async function handleDate(conversation, phone, message) {
  const date = parseDate(message);

  if (!date) {
    let errorMsg = "Please enter a valid future date in DD/MM/YYYY format.\n\n";
    errorMsg += "• Must be a weekday (Monday–Saturday)\n";
    errorMsg += "• Cannot be in the past\n";
    errorMsg += "• Cannot be more than 90 days ahead\n";
    errorMsg += "\n_Example: 28/02/2026_";
    await sendTextMessage(phone, templates.invalidInput(errorMsg));
    return;
  }

  const formattedDate = formatDate(date);

  await updateConversation(conversation.id, {
    current_step: BOOKING_STEPS.AWAITING_TIME,
    context: {
      ...conversation.context,
      date: date.toISOString().split("T")[0],
      formattedDate,
    },
  });

  // Send time slots as interactive list
  const sections = [
    {
      title: "Morning Slots",
      rows: TIME_SLOTS.filter((s) => parseInt(s.value) < 12).map((s) => ({
        id: s.id,
        title: s.title,
        description: `${formattedDate}`,
      })),
    },
    {
      title: "Afternoon Slots",
      rows: TIME_SLOTS.filter((s) => parseInt(s.value) >= 12).map((s) => ({
        id: s.id,
        title: s.title,
        description: `${formattedDate}`,
      })),
    },
  ];

  await sendListMessage(
    phone,
    `📅 Available slots for *${formattedDate}*\n\nSelect your preferred time:`,
    "View Time Slots",
    sections,
    "Select Time Slot",
  );
  await logMessage(conversation.id, phone, "outbound", "Sent time slots");
}

async function handleTime(conversation, phone, message, messageType) {
  let selectedSlot;

  if (messageType === "interactive") {
    // User tapped a list item
    selectedSlot = TIME_SLOTS.find((s) => s.id === message);
  } else {
    // User typed time manually — try to match
    const cleaned = message.trim().replace(/\s+/g, " ").toUpperCase();
    selectedSlot = TIME_SLOTS.find(
      (s) => s.title.toUpperCase() === cleaned || s.value === message.trim(),
    );
  }

  if (!selectedSlot) {
    await sendTextMessage(
      phone,
      templates.invalidInput("Please select a valid time slot from the list."),
    );
    return;
  }

  const ctx = conversation.context;
  await updateConversation(conversation.id, {
    current_step: BOOKING_STEPS.AWAITING_CONFIRM,
    context: {
      ...ctx,
      time: selectedSlot.value,
      formattedTime: selectedSlot.title,
    },
  });

  // Send confirmation with buttons
  const summaryText = templates.confirmBooking({
    name: ctx.name,
    email: ctx.email,
    date: ctx.formattedDate,
    time: selectedSlot.title,
    reason: ctx.reason,
  });

  await sendButtonMessage(phone, summaryText, [
    { id: ACTIONS.CONFIRM_YES, title: "✅ Confirm" },
    { id: ACTIONS.CONFIRM_NO, title: "❌ Cancel" },
  ]);
  await logMessage(
    conversation.id,
    phone,
    "outbound",
    "Sent booking confirmation",
  );
}

async function handleConfirmation(conversation, phone, message, messageType) {
  const isConfirm =
    (messageType === "interactive" && message === ACTIONS.CONFIRM_YES) ||
    message.toLowerCase().match(/^(yes|y|confirm|ok|sure)$/);

  const isCancel =
    (messageType === "interactive" && message === ACTIONS.CONFIRM_NO) ||
    message.toLowerCase().match(/^(no|n|cancel|stop)$/);

  if (isCancel) {
    await resetConversation(conversation.id);
    await sendTextMessage(
      phone,
      'Appointment booking cancelled. No worries!\n\n_Type "menu" to see other options._',
    );
    return;
  }

  if (!isConfirm) {
    await sendButtonMessage(
      phone,
      "Please confirm or cancel your appointment.",
      [
        { id: ACTIONS.CONFIRM_YES, title: "✅ Confirm" },
        { id: ACTIONS.CONFIRM_NO, title: "❌ Cancel" },
      ],
    );
    return;
  }

  // Create the appointment
  const ctx = conversation.context;

  try {
    const normalizedEmail = ctx.email.toLowerCase().trim();

    // Check if user exists, create if not (mirrors public appointment API)
    let { data: existingUser } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    let patientId = existingUser?.id;

    if (!existingUser) {
      const { data: newUser, error: userError } = await supabaseAdmin
        .from(TABLES.USERS)
        .insert({
          email: normalizedEmail,
          full_name: ctx.name,
          phone: phone,
          role: ROLES.PATIENT,
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating patient:", userError);
        await sendTextMessage(phone, templates.bookingFailed());
        await resetConversation(conversation.id);
        return;
      }

      patientId = newUser.id;

      // Send welcome email
      await sendEmail(normalizedEmail, emailTemplates.welcomePatient(ctx.name));
    } else {
      // Update phone if different
      if (phone !== existingUser.phone?.replace(/[\s\-+]/g, "")) {
        await supabaseAdmin
          .from(TABLES.USERS)
          .update({ phone })
          .eq("id", existingUser.id);
      }
    }

    // Link conversation to user
    await linkConversationToUser(conversation.id, patientId);

    // Create appointment
    const appointmentDate = formatDateForDB(new Date(ctx.date), ctx.time);

    const { data: newAppointment, error: aptError } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .insert({
        patient_id: patientId,
        name: ctx.name,
        email: normalizedEmail,
        phone,
        date: appointmentDate,
        reason_for_visit: ctx.reason,
        message: `[Booked via WhatsApp] ${ctx.reason}`,
        status: APPOINTMENT_STATUS.PENDING,
        consultation_status: "pending",
      })
      .select()
      .single();

    if (aptError) {
      console.error("Error creating appointment:", aptError);
      await sendTextMessage(phone, templates.bookingFailed());
      await resetConversation(conversation.id);
      return;
    }

    // Send success message
    await sendTextMessage(
      phone,
      templates.bookingSuccess({
        date: ctx.formattedDate,
        time: ctx.formattedTime,
      }),
    );

    // Send email confirmations
    const formattedDate = ctx.formattedDate;
    const formattedTime = ctx.formattedTime;

    await sendEmail(
      normalizedEmail,
      emailTemplates.appointmentConfirmation(ctx.name, {
        date: formattedDate,
        time: formattedTime,
        reason: ctx.reason,
      }),
    );

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, email")
      .eq("role", ROLES.ADMIN)
      .eq("is_active", true);

    if (admins?.length > 0) {
      for (const admin of admins) {
        await sendEmail(
          admin.email,
          emailTemplates.newAppointmentAdmin({
            patientName: ctx.name,
            email: normalizedEmail,
            phone,
            date: formattedDate,
            time: formattedTime,
            reason: ctx.reason,
          }),
        );

        await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert({
          user_id: admin.id,
          title: "New Appointment (WhatsApp)",
          message: `${ctx.name} booked via WhatsApp for ${formattedDate} at ${formattedTime}`,
          type: "appointment",
          related_type: "appointment",
          related_id: newAppointment.id,
        });
      }
    }

    // Schedule appointment reminders
    await scheduleAppointmentReminders(
      phone,
      patientId,
      newAppointment.id,
      new Date(appointmentDate),
      ctx.name,
    );

    await logMessage(
      conversation.id,
      phone,
      "outbound",
      `Appointment created: ${newAppointment.id}`,
    );
    await resetConversation(conversation.id);
  } catch (error) {
    console.error("Booking error:", error);
    await sendTextMessage(phone, templates.bookingFailed());
    await resetConversation(conversation.id);
  }
}
