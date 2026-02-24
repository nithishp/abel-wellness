// WhatsApp Message Templates — formatted text messages for the chatbot
// These are plain text messages (not Meta template messages).
// For outbound messages outside the 24h window, use Meta template messages instead.

const CLINIC_NAME = "Abel Wellness & Homoeopathic Care Centre";
const CLINIC_PHONE = "+91 6380093009";

export function welcomeMessage(name = null) {
  const greeting = name ? `Hello ${name}! 👋` : "Hello! 👋";
  return `${greeting}

Welcome to *${CLINIC_NAME}*

We provide individualised homoeopathic care with evidence-oriented, ethical practice.

How can I help you today?`;
}

export function mainMenuText() {
  return `What would you like to do?

1️⃣ *Book an Appointment*
2️⃣ *Check Appointment Status*
3️⃣ *Cancel an Appointment*
4️⃣ *Reschedule an Appointment*
5️⃣ *Get Help*

_Reply with a number or tap a button below._`;
}

export function askName() {
  return "Please share your *full name* for the appointment.\n\n_Example: Rahul Sharma_";
}

export function askEmail() {
  return "Please share your *email address*.\n\nThis will be used for appointment confirmations and to access your patient portal.\n\n_Example: rahul@email.com_";
}

export function askReason() {
  return `What is the *reason for your visit*?

You can briefly describe your health concern or choose from common reasons:

• General Consultation
• Skin Condition
• Digestive Issues
• Joint/Muscle Pain
• Respiratory Issues
• Mental/Emotional Health
• Follow-up Visit

_Type your reason or select from above._`;
}

export function askDate() {
  return `Please share your *preferred date* for the appointment.

_Format: DD/MM/YYYY_
_Example: 28/02/2026_

📅 Clinic hours: Monday to Saturday, 9 AM to 5 PM
🚫 Closed on Sundays`;
}

export function askTimeSlot() {
  return "Please select your *preferred time slot*:";
}

export function confirmBooking({ name, email, date, time, reason }) {
  return `📋 *Appointment Summary*

👤 *Name:* ${name}
📧 *Email:* ${email}
📅 *Date:* ${date}
🕐 *Time:* ${time}
📝 *Reason:* ${reason}

Would you like to confirm this appointment?`;
}

export function bookingSuccess({ date, time }) {
  return `✅ *Appointment Booked Successfully!*

Your appointment has been scheduled for *${date}* at *${time}*.

📌 *What happens next:*
• Our team will review your appointment
• You'll receive a confirmation once a doctor is assigned
• We'll send you a reminder before your appointment

💡 You can check your appointment status anytime by messaging us.

_Thank you for choosing ${CLINIC_NAME}!_`;
}

export function bookingFailed() {
  return `❌ Sorry, we couldn't book your appointment at this time.

Please try again or contact us directly:
📞 ${CLINIC_PHONE}

_Type "menu" to go back to the main menu._`;
}

export function statusReport(appointments) {
  if (!appointments || appointments.length === 0) {
    return `📋 *No Appointments Found*

We couldn't find any upcoming appointments linked to your account.

💡 Would you like to book a new appointment?

_Type "menu" to go back to the main menu._`;
  }

  let msg = `📋 *Your Appointments*\n\n`;

  appointments.forEach((apt, i) => {
    const statusEmoji = {
      pending: "🟡",
      approved: "🟢",
      rejected: "🔴",
      rescheduled: "🔵",
      completed: "✅",
      cancelled: "⚫",
    };

    msg += `${i + 1}. ${statusEmoji[apt.status] || "⚪"} *${apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}*\n`;
    msg += `   📅 ${apt.formattedDate}\n`;
    if (apt.doctorName) msg += `   👨‍⚕️ Dr. ${apt.doctorName}\n`;
    if (apt.reason) msg += `   📝 ${apt.reason}\n`;
    msg += "\n";
  });

  msg += `_Type "menu" to go back to the main menu._`;
  return msg;
}

export function cancelSelectAppointment() {
  return "Which appointment would you like to cancel? Select from the list:";
}

export function cancelConfirmation({ date, time }) {
  return `Are you sure you want to *cancel* your appointment on *${date}* at *${time}*?

⚠️ This action cannot be undone.`;
}

export function cancelSuccess() {
  return `✅ Your appointment has been cancelled successfully.

If you'd like to rebook, just let us know!

_Type "menu" to go back to the main menu._`;
}

export function rescheduleSelectAppointment() {
  return "Which appointment would you like to reschedule? Select from the list:";
}

export function rescheduleSuccess({ date, time }) {
  return `✅ *Appointment Rescheduled!*

Your appointment has been moved to *${date}* at *${time}*.

Our team will review the change and confirm shortly.

_Type "menu" to go back to the main menu._`;
}

export function invalidInput(expected) {
  return `❌ Sorry, I didn't understand that.

${expected}

_Type "menu" to go back to the main menu or "cancel" to stop._`;
}

export function helpMessage() {
  return `ℹ️ *Help — ${CLINIC_NAME}*

Here's what I can help you with:

🔹 *Book Appointment* — Schedule a new consultation
🔹 *Check Status* — View your upcoming appointments
🔹 *Cancel Appointment* — Cancel a scheduled visit
🔹 *Reschedule* — Change your appointment date/time

📞 *Contact Us:* ${CLINIC_PHONE}
🌐 *Website:* Visit our website to learn more

🏥 *Clinic Hours:*
Monday — Saturday: 9:00 AM — 5:00 PM
Sunday: Closed

_Type "menu" to see options or type "book" to schedule an appointment._`;
}

export function sessionExpired() {
  return `⏰ Your session has timed out due to inactivity.

_Type "hi" or "menu" to start again._`;
}

// --- Notification Messages (outbound from system events) ---

export function appointmentConfirmedNotification({ patientName, date, time, doctorName }) {
  return `✅ *Appointment Confirmed!*

Hi ${patientName}, your appointment has been confirmed!

📅 *Date:* ${date}
🕐 *Time:* ${time}
👨‍⚕️ *Doctor:* Dr. ${doctorName}

📍 Please arrive 10 minutes before your scheduled time.

_Reply "status" to view your appointments._`;
}

export function appointmentRejectedNotification({ patientName, date, reason }) {
  return `❌ *Appointment Update*

Hi ${patientName}, unfortunately your appointment for *${date}* could not be confirmed.

${reason ? `📝 *Reason:* ${reason}` : ""}

Would you like to book a different date? Reply "book" to schedule a new appointment.`;
}

export function appointmentRescheduledNotification({ patientName, oldDate, newDate, newTime }) {
  return `🔄 *Appointment Rescheduled*

Hi ${patientName}, your appointment has been rescheduled.

❌ *Previous:* ${oldDate}
✅ *New Date:* ${newDate} at ${newTime}

_Reply "status" to view your updated appointments._`;
}

export function appointmentCancelledNotification({ patientName, date }) {
  return `⚫ *Appointment Cancelled*

Hi ${patientName}, your appointment on *${date}* has been cancelled.

Would you like to book a new appointment? Reply "book" to get started.`;
}

export function appointmentReminder24h({ patientName, date, time, doctorName }) {
  return `⏰ *Appointment Reminder*

Hi ${patientName}, this is a reminder that you have an appointment *tomorrow*.

📅 *Date:* ${date}
🕐 *Time:* ${time}
${doctorName ? `👨‍⚕️ *Doctor:* Dr. ${doctorName}` : ""}

📍 Please arrive 10 minutes early.
📋 Bring any previous medical reports if available.

_Reply "status" for details or "reschedule" to change the time._`;
}

export function appointmentReminder1h({ patientName, time, doctorName }) {
  return `⏰ *Appointment in 1 Hour*

Hi ${patientName}, your appointment is in *1 hour* at *${time}*${doctorName ? ` with Dr. ${doctorName}` : ""}.

📍 Please make your way to the clinic.

_See you soon!_`;
}

export function prescriptionReadyNotification({ patientName, doctorName, medicationCount }) {
  return `💊 *Prescription Ready*

Hi ${patientName}, your prescription from Dr. ${doctorName} is ready.

📋 *${medicationCount} medication(s)* prescribed.

Your medicines will be prepared by our pharmacist. We'll notify you when they're ready for pickup.

_Reply "status" to view your appointments._`;
}

export function prescriptionDispensedNotification({ patientName, medicationSummary }) {
  return `✅ *Medicines Dispensed*

Hi ${patientName}, your medicines have been dispensed and are ready for pickup/have been provided.

💊 *Medications:*
${medicationSummary}

📋 Please follow the dosage instructions provided by your doctor.

_For any questions, contact us at ${CLINIC_PHONE}._`;
}

export function followUpReminder({ patientName, doctorName, daysSince }) {
  return `👋 *Follow-up Reminder*

Hi ${patientName}, it's been *${daysSince} days* since your last consultation${doctorName ? ` with Dr. ${doctorName}` : ""}.

We hope you're feeling better! If you need a follow-up, we're here to help.

Would you like to book a follow-up appointment? Reply "book" to schedule.

_${CLINIC_NAME}_`;
}
