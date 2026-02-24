// WhatsApp Chatbot Constants

// Conversation flows
export const FLOWS = {
  BOOKING: "booking",
  STATUS: "status",
  CANCEL: "cancel",
  RESCHEDULE: "reschedule",
  HELP: "help",
};

// Steps within the booking flow
export const BOOKING_STEPS = {
  IDLE: "idle",
  AWAITING_NAME: "awaiting_name",
  AWAITING_EMAIL: "awaiting_email",
  AWAITING_REASON: "awaiting_reason",
  AWAITING_DATE: "awaiting_date",
  AWAITING_TIME: "awaiting_time",
  AWAITING_CONFIRM: "awaiting_confirm",
};

// Steps for status check flow
export const STATUS_STEPS = {
  AWAITING_EMAIL: "status_awaiting_email",
};

// Steps for cancellation flow
export const CANCEL_STEPS = {
  AWAITING_SELECTION: "cancel_awaiting_selection",
  AWAITING_CONFIRM: "cancel_awaiting_confirm",
};

// Steps for reschedule flow
export const RESCHEDULE_STEPS = {
  AWAITING_SELECTION: "reschedule_awaiting_selection",
  AWAITING_DATE: "reschedule_awaiting_date",
  AWAITING_TIME: "reschedule_awaiting_time",
  AWAITING_CONFIRM: "reschedule_awaiting_confirm",
};

// Interactive button/list IDs
export const ACTIONS = {
  BOOK_APPOINTMENT: "book_appointment",
  CHECK_STATUS: "check_status",
  CANCEL_APPOINTMENT: "cancel_appointment",
  RESCHEDULE: "reschedule_appointment",
  HELP: "help",
  CONFIRM_YES: "confirm_yes",
  CONFIRM_NO: "confirm_no",
  MAIN_MENU: "main_menu",
};

// Available time slots (clinic hours)
export const TIME_SLOTS = [
  { id: "slot_09_00", title: "09:00 AM", value: "09:00" },
  { id: "slot_09_30", title: "09:30 AM", value: "09:30" },
  { id: "slot_10_00", title: "10:00 AM", value: "10:00" },
  { id: "slot_10_30", title: "10:30 AM", value: "10:30" },
  { id: "slot_11_00", title: "11:00 AM", value: "11:00" },
  { id: "slot_11_30", title: "11:30 AM", value: "11:30" },
  { id: "slot_12_00", title: "12:00 PM", value: "12:00" },
  { id: "slot_14_00", title: "02:00 PM", value: "14:00" },
  { id: "slot_14_30", title: "02:30 PM", value: "14:30" },
  { id: "slot_15_00", title: "03:00 PM", value: "15:00" },
  { id: "slot_15_30", title: "03:30 PM", value: "15:30" },
  { id: "slot_16_00", title: "04:00 PM", value: "16:00" },
  { id: "slot_16_30", title: "04:30 PM", value: "16:30" },
  { id: "slot_17_00", title: "05:00 PM", value: "17:00" },
];

// WhatsApp DB tables
export const WA_TABLES = {
  CONVERSATIONS: "whatsapp_conversations",
  MESSAGES: "whatsapp_messages",
  SCHEDULED: "whatsapp_scheduled_messages",
};

// Notification types for scheduling
export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER_24H: "appointment_reminder_24h",
  APPOINTMENT_REMINDER_1H: "appointment_reminder_1h",
  APPOINTMENT_CONFIRMED: "appointment_confirmed",
  APPOINTMENT_REJECTED: "appointment_rejected",
  APPOINTMENT_RESCHEDULED: "appointment_rescheduled",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  PRESCRIPTION_READY: "prescription_ready",
  PRESCRIPTION_DISPENSED: "prescription_dispensed",
  FOLLOW_UP: "follow_up",
  WELCOME: "welcome",
};
