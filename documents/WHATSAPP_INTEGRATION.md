# WhatsApp Integration Documentation

## Abel Wellness & Homoeopathic Care Centre (AWHCC)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Meta Setup Requirements](#meta-setup-requirements)
4. [Environment Variables](#environment-variables)
5. [API Endpoints](#api-endpoints)
6. [Chatbot Flows](#chatbot-flows)
7. [Notification System](#notification-system)
8. [Cron Job — Why It's Required](#cron-job--why-its-required)
9. [Meta Message Templates](#meta-message-templates)
10. [Webhook Security](#webhook-security)
11. [Opt-Out Mechanism](#opt-out-mechanism)
12. [Database Tables](#database-tables)
13. [File Reference](#file-reference)
14. [End-to-End Message Flow](#end-to-end-message-flow)
15. [Testing the Integration](#testing-the-integration)
16. [Known Limitations & Next Steps](#known-limitations--next-steps)

---

## Overview

The WhatsApp integration allows patients to interact with AWHCC directly through WhatsApp. It serves two purposes:

| Purpose                    | Description                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Conversational Chatbot** | Patients can book, cancel, and reschedule appointments entirely via WhatsApp                                               |
| **Outbound Notifications** | The system proactively sends appointment confirmations, reminders, prescription alerts, and follow-up messages to patients |

**Provider:** Meta WhatsApp Business Cloud API (`graph.facebook.com/v21.0`)

---

## Architecture

```
Patient (WhatsApp) ──→ Meta Servers ──→ POST /api/whatsapp/webhook  ──→  router.js
                                                                              │
                                                                    ┌─────────▼──────────┐
                                                                    │  conversation.js   │
                                                                    │  (state machine)   │
                                                                    └─────────┬──────────┘
                                                                              │
                                               ┌──────────────────────────────▼──────────────────────┐
                                               │            Flow Handlers                             │
                                               │  booking.js · manage.js (status/cancel/reschedule)  │
                                               └──────────────────────────────┬──────────────────────┘
                                                                              │
                                                                    ┌─────────▼──────────┐
                                                                    │    service.js       │
                                                                    │  (send back to WA)  │
                                                                    └────────────────────┘

System Events (admin approves appt, doctor completes consultation, etc.)
         │
         ▼
  sendWhatsAppNotification()  ──→  service.js  ──→  Patient (WhatsApp)


Cron Job (every 5 min)
         │
         ▼
  GET /api/whatsapp/cron  ──→  processScheduledMessages()  ──→  whatsapp_scheduled_messages table
                                                                         │
                                                              (sends due reminders via service.js)
```

---

## Meta Setup Requirements

You must complete these steps in the [Meta Developer Console](https://developers.facebook.com/) before the integration works.

### Step 1 — Create a Meta App

1. Go to `developers.facebook.com` → My Apps → Create App
2. Select **Business** app type
3. Add the **WhatsApp** product to your app

### Step 2 — Get Credentials

From the WhatsApp → Getting Started panel:

| Value                          | Where to Find                                        |
| ------------------------------ | ---------------------------------------------------- |
| `WHATSAPP_ACCESS_TOKEN`        | Temporary or permanent token from the Meta dashboard |
| `WHATSAPP_PHONE_NUMBER_ID`     | Listed under "Phone Numbers" in the WhatsApp product |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Listed in WhatsApp → Business Accounts               |

> For production, generate a **permanent access token** via a System User in Meta Business Suite. Temporary tokens expire in 24 hours.

### Step 3 — Configure the Webhook

In Meta Developer dashboard → WhatsApp → Configuration → Webhooks:

| Field                 | Value                                               |
| --------------------- | --------------------------------------------------- |
| **Webhook URL**       | `https://yourdomain.com/api/whatsapp/webhook`       |
| **Verify Token**      | The value of `WHATSAPP_VERIFY_TOKEN` in your `.env` |
| **Subscribed Fields** | `messages` (required)                               |

The webhook URL must be publicly accessible over HTTPS. For local dev, use [ngrok](https://ngrok.com/).

### Step 4 — Register Your Business Phone Number

- Add and verify the clinic's WhatsApp phone number in the Meta dashboard
- The number must be approved and active before messages can be sent

---

## Environment Variables

Add these to your `.env.local`:

```env
# WhatsApp Business Cloud API
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_VERIFY_TOKEN=your_verify_token

# Webhook security (from Meta App Dashboard → App Settings → Basic → App Secret)
WHATSAPP_APP_SECRET=your_meta_app_secret

# Cron endpoint security
CRON_SECRET=your_cron_secret_token
```

| Variable                       | Required    | Purpose                                                                    |
| ------------------------------ | ----------- | -------------------------------------------------------------------------- |
| `WHATSAPP_ACCESS_TOKEN`        | Yes         | Permanent access token from Meta                                           |
| `WHATSAPP_PHONE_NUMBER_ID`     | Yes         | Phone number ID from Meta WhatsApp product                                 |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Yes         | Business Account ID from Meta                                              |
| `WHATSAPP_VERIFY_TOKEN`        | Yes         | Token for Meta webhook verification (no hardcoded fallback)                |
| `WHATSAPP_APP_SECRET`          | Recommended | Meta App Secret for webhook signature verification (`X-Hub-Signature-256`) |
| `CRON_SECRET`                  | Yes         | Secret for authenticating cron endpoint requests                           |

---

## API Endpoints

### `GET /api/whatsapp/webhook`

Used by Meta to verify the webhook during setup. Meta sends a challenge and expects it echoed back.

```
Query: hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
Response: 200 <challenge> (plain text)
```

### `POST /api/whatsapp/webhook`

Receives all incoming WhatsApp messages from Meta. Processes them asynchronously and always returns `200` immediately (required by Meta — if you return non-200, Meta retries endlessly).

### `GET /api/whatsapp/cron`

Processes all pending scheduled messages (reminders, follow-ups) that are due.

**Authentication:** Token via query string or Authorization header.

```
GET /api/whatsapp/cron?token=<CRON_SECRET>
-- or --
Authorization: Bearer <CRON_SECRET>
```

**Response:**

```json
{
  "success": true,
  "processed": 3,
  "errors": 0,
  "total": 3,
  "timestamp": "2026-02-25T10:00:00.000Z"
}
```

### `POST /api/whatsapp/send`

Admin-authenticated endpoint to manually send a WhatsApp message to a specific number. Requires a valid admin session cookie.

---

## Chatbot Flows

The chatbot is a **stateful conversation system**. Each patient has one active conversation record in `whatsapp_conversations` tracking their current flow and step.

### Global Commands (work from any state)

| Command              | Aliases | Action                                  |
| -------------------- | ------- | --------------------------------------- |
| `hi`, `hello`, `hey` | —       | Shows main menu                         |
| `menu`               | —       | Resets conversation, shows main menu    |
| `book`               | `1`     | Starts booking flow                     |
| `status`             | `2`     | Starts status check flow                |
| `cancel`             | `3`     | Starts cancellation flow                |
| `reschedule`         | `4`     | Starts reschedule flow                  |
| `help`               | `5`     | Shows help message                      |
| `stop`               | —       | Opts out of all WhatsApp notifications  |
| `start`              | —       | Re-subscribes to WhatsApp notifications |

**Session Timeout:** 30 minutes of inactivity resets the session.

**Menu format:** The main menu is displayed as an interactive list message with two sections — "Appointments" (Book, Status, Cancel, Reschedule) and "More" (Help) — surfacing all 5 options at once.

---

### Booking Flow (`FLOWS.BOOKING`)

Complete appointment booking entirely through WhatsApp.

```
Patient says "book" or "1"
    │
    ▼
AWAITING_NAME
    Patient enters full name
    │
    ▼
AWAITING_EMAIL
    Patient enters email address
    (existing patient account is linked / new account created on completion)
    │
    ▼
AWAITING_REASON
    Patient describes their health concern
    │
    ▼
AWAITING_DATE
    Patient enters date in DD/MM/YYYY format
    Validation: future date, not Sunday, within 90 days
    │
    ▼
AWAITING_TIME
    Interactive list of 14 time slots (9AM–5PM) shown
    (Monday–Saturday, closed lunch 12PM–2PM)
    │
    ▼
AWAITING_CONFIRM
    Summary card shown with name/email/date/time/reason
    Interactive buttons: ✅ Confirm | ❌ Cancel
    │
    ▼
Appointment created in DB (status: pending)
Patient account created if new (temp password emailed)
24h + 1h reminders scheduled in whatsapp_scheduled_messages
Confirmation email sent via Nodemailer
```

---

### Status Check Flow (`FLOWS.STATUS`)

```
Patient says "status" or "2"
    │
    ▼
AWAITING_EMAIL  (if phone not linked to an account)
    Patient enters email to identify themselves
    │
    ▼
Fetches upcoming appointments (pending, approved, rescheduled)
Returns formatted list with date, doctor, and status emoji
```

---

### Cancel Flow (`FLOWS.CANCEL`)

```
Patient says "cancel" or "3"
    │
    ▼
AWAITING_SELECTION
    Interactive list of active appointments shown
    │
    ▼
AWAITING_CONFIRM
    Asks "Are you sure?" with Yes/No buttons
    │
    ▼
Appointment status updated to "cancelled" in DB
Admin notified via system
Scheduled reminders for this appointment marked as cancelled
```

---

### Reschedule Flow (`FLOWS.RESCHEDULE`)

```
Patient says "reschedule" or "4"
    │
    ▼
AWAITING_SELECTION
    Interactive list of active appointments shown
    │
    ▼
AWAITING_DATE
    Patient enters new date (DD/MM/YYYY)
    │
    ▼
AWAITING_TIME
    Interactive list of time slots shown
    │
    ▼
AWAITING_CONFIRM
    Summary of new date/time shown with confirm buttons
    │
    ▼
Appointment updated (status: rescheduled)
Old scheduled reminders cancelled, new ones created
```

---

## Notification System

The app sends instant WhatsApp notifications when key system events happen. These are triggered from existing API routes.

### Instant Notifications (sent immediately)

| Event                       | Trigger Location                                                | Template Used                        |
| --------------------------- | --------------------------------------------------------------- | ------------------------------------ |
| Appointment **Confirmed**   | `POST /api/admin/appointments/[id]` when status → `approved`    | `appointmentConfirmedNotification`   |
| Appointment **Rejected**    | `POST /api/admin/appointments/[id]` when status → `rejected`    | `appointmentRejectedNotification`    |
| Appointment **Rescheduled** | `POST /api/admin/appointments/[id]` when status → `rescheduled` | `appointmentRescheduledNotification` |
| Appointment **Cancelled**   | Admin or patient cancels                                        | `appointmentCancelledNotification`   |
| Prescription **Ready**      | Doctor completes consultation                                   | `prescriptionReadyNotification`      |
| Prescription **Dispensed**  | Pharmacist dispenses medication                                 | `prescriptionDispensedNotification`  |

### Scheduled Notifications (stored in DB, sent by cron)

| Reminder            | When Scheduled                      | When Sent                               |
| ------------------- | ----------------------------------- | --------------------------------------- |
| **24h reminder**    | On appointment booking/confirmation | 24 hours before appointment             |
| **1h reminder**     | On appointment booking/confirmation | 1 hour before appointment               |
| **7-day follow-up** | On consultation completion          | 7 days after completion at 10:00 AM IST |

If the appointment is cancelled or rejected before the reminder fires, the cron skips it and marks it `cancelled`.

**Retry logic:** Failed sends are retried up to 3 times with a 5-minute delay. After 3 failures, status is set to `failed`.

---

## Cron Job — Why It's Required

Reminders are **not sent at booking time** — they are saved as future-dated records in the `whatsapp_scheduled_messages` table with `status: "pending"`. Nothing sends them unless something actively checks the table and fires them.

The cron endpoint acts as that trigger:

```
Every 5 minutes:
  GET /api/whatsapp/cron?token=<CRON_SECRET>
      │
      ▼
  processScheduledMessages() = {
      SELECT * FROM whatsapp_scheduled_messages
      WHERE status = 'pending'
      AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 50;

      → For each row, send the WhatsApp message
      → On success: update status = 'sent'
      → On failure: increment retry_count, push scheduled_at +5min
      → On 3rd failure: update status = 'failed'
  }
```

**Without the cron job, no scheduled reminders or follow-ups will ever be sent** — they accumulate in the table indefinitely.

### Recommended Cron Services

The app is deployed on **Netlify**, which does not have a built-in cron feature. Use an external service:

| Service                 | How to Set Up                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **cron-job.org** (free) | Create a HTTP job: URL = `https://yourdomain.com/api/whatsapp/cron?token=<CRON_SECRET>`, interval = every 5 minutes |
| **Upstash QStash**      | Serverless message queue with cron scheduling. Dashboard at `console.upstash.com`                                   |
| **EasyCron.com**        | Simple HTTP cron service. Free tier supports every 5 minutes                                                        |
| **GitHub Actions**      | Scheduled workflow calling the endpoint via `curl`                                                                  |

See `netlify.toml` in the project root for detailed setup instructions.

---

## Meta Message Templates

The notification system uses **Meta-approved message templates** to send messages outside the 24-hour conversation window. Templates are tried first; if they fail (e.g., not yet approved), the system falls back to plain text messages (which only work within the 24-hour window).

### Registered Templates

| Template Name              | Category  | Body                                                                                                                                                           | Variables                                                                                                  |
| -------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `appointment_confirmation` | UTILITY   | Hi {{1}}, Your appointment is scheduled for {{2}}. Service: {{3}} Confirmation number: {{4}} We're looking forward to your visit.                              | `{{1}}` patient name, `{{2}}` date, `{{3}}` service/reason, `{{4}}` appointment ID                         |
| `appointment_cancelled`    | UTILITY   | Hi {{1}}, Your appointment on {{2}} has been cancelled. We hope to see you another time.                                                                       | `{{1}}` patient name, `{{2}}` date                                                                         |
| `appointment_reminder`     | UTILITY   | Hello {{1}}, This is a reminder about your upcoming appointment with {{2}} on {{3}} at {{4}}. We look forward to seeing you!                                   | `{{1}}` patient name, `{{2}}` doctor name, `{{3}}` date, `{{4}}` time                                      |
| `missed_appointment`       | UTILITY   | Hi {{1}}, we missed you at your scheduled {{2}} appointment on {{3}}. Please reply to reschedule or contact {{4}} to book a new appointment.                   | `{{1}}` patient name, `{{2}}` service, `{{3}}` date, `{{4}}` clinic phone                                  |
| `rescheduled`              | UTILITY   | Dear {{patient_name}}, Your appointment with Dr. {{doctor_name}} has been rescheduled. New Date: {{date}} New Time: {{time}} ... contact {{clinic_name}}.      | `{{1}}` patient name, `{{2}}` doctor name, `{{3}}` new date, `{{4}}` new time, `{{5}}` clinic name         |
| `rejected`                 | MARKETING | Dear {{patient_name}}, Greetings from {{clinic_name}}, Your appointment on {{date}} at {{time}} with Dr. {{doctor_name}} has been cancelled due to {{reason}}. | `{{1}}` patient name, `{{2}}` clinic name, `{{3}}` date, `{{4}}` time, `{{5}}` doctor name, `{{6}}` reason |

### Template → Notification Type Mapping

| Notification Type        | Template Used              | Fallback        |
| ------------------------ | -------------------------- | --------------- |
| `CONFIRMED`              | `appointment_confirmation` | Plain text      |
| `CANCELLED`              | `appointment_cancelled`    | Plain text      |
| `REMINDER_24H`           | `appointment_reminder`     | Plain text      |
| `REMINDER_1H`            | `appointment_reminder`     | Plain text      |
| `REJECTED`               | `rejected`                 | Plain text      |
| `RESCHEDULED`            | `rescheduled`              | Plain text      |
| `PRESCRIPTION_READY`     | — (no template yet)        | Plain text only |
| `PRESCRIPTION_DISPENSED` | — (no template yet)        | Plain text only |
| `FOLLOW_UP`              | — (no template yet)        | Plain text only |

### How Template Fallback Works

The `sendWithTemplateFallback()` function in `notifications.js`:

1. Builds template components using `buildTemplateComponents()`
2. Calls `sendTemplateMessage()` from `service.js`
3. If the template send fails (e.g., template not approved yet, or parameters mismatch), catches the error and falls back to `sendTextMessage()` with the plain-text version
4. Returns `{ success, messageId }` regardless of which method succeeded

This ensures notifications are never completely lost — they degrade gracefully.

---

## Webhook Security

The webhook endpoint (`POST /api/whatsapp/webhook`) implements three layers of security:

### 1. Signature Verification

If `WHATSAPP_APP_SECRET` is set, the webhook verifies the `X-Hub-Signature-256` header on every incoming POST request. This ensures the request actually came from Meta and was not tampered with.

```
Expected: sha256=HMAC(APP_SECRET, rawBody)
Actual:   X-Hub-Signature-256 header value
```

If verification fails, the request is rejected with `403 Forbidden`.

### 2. Rate Limiting

An in-memory rate limiter (from `lib/rate-limit.js`) restricts each IP to **60 requests per minute**. Exceeding this returns `429 Too Many Requests`. This prevents abuse or replay attacks.

### 3. Idempotency / Deduplication

Before processing a message, the webhook checks if `wa_message_id` already exists in the `whatsapp_messages` table. If it does, the message is skipped. This prevents duplicate processing when Meta retries a delivery.

---

## Opt-Out Mechanism

Patients can opt out of WhatsApp notifications by sending **STOP** and re-subscribe by sending **START**.

### How It Works

| Action       | Message      | Effect                                                                   |
| ------------ | ------------ | ------------------------------------------------------------------------ |
| Opt out      | Send `stop`  | Sets `opted_out = true` on `whatsapp_conversations`, confirms to patient |
| Re-subscribe | Send `start` | Sets `opted_out = false`, sends welcome-back message                     |

### Enforcement

- **Router level**: Opted-out users are blocked from receiving any chatbot responses (except for `START`)
- **Notification level**: `sendWhatsAppNotification()` checks `isOptedOut(phone)` before sending
- **Cron level**: `processScheduledMessages()` checks opt-out status per message before sending scheduled reminders

---

## Database Tables

### `whatsapp_conversations`

Stores the active state for each patient's conversation.

| Column            | Type        | Description                                                           |
| ----------------- | ----------- | --------------------------------------------------------------------- |
| `id`              | uuid        | Primary key                                                           |
| `phone`           | text        | Patient's WhatsApp number (cleaned, no spaces/dashes)                 |
| `user_id`         | uuid        | FK to `users` if phone is linked                                      |
| `flow`            | text        | Current flow (booking / status / cancel / reschedule / help)          |
| `current_step`    | text        | Current step within the flow                                          |
| `context`         | jsonb       | Flow-specific data (name, email, date, selected appointment ID, etc.) |
| `last_message_at` | timestamptz | Last activity timestamp (used for timeout check)                      |
| `opted_out`       | boolean     | `true` if patient sent STOP (defaults to `false`)                     |
| `created_at`      | timestamptz | —                                                                     |

### `whatsapp_messages`

Audit log of every inbound and outbound message.

| Column            | Type        | Description                                    |
| ----------------- | ----------- | ---------------------------------------------- |
| `id`              | uuid        | Primary key                                    |
| `conversation_id` | uuid        | FK to `whatsapp_conversations`                 |
| `phone`           | text        | WhatsApp number                                |
| `direction`       | text        | `inbound` or `outbound`                        |
| `content`         | text        | Message body                                   |
| `message_type`    | text        | `text`, `interactive`, `template`, etc.        |
| `wa_message_id`   | text        | Meta's message ID (used for idempotency dedup) |
| `status`          | text        | `received` (inbound) or `sent` (outbound)      |
| `created_at`      | timestamptz | —                                              |

### `whatsapp_scheduled_messages`

Queue of future-dated messages to be sent by the cron job.

| Column            | Type        | Description                                       |
| ----------------- | ----------- | ------------------------------------------------- |
| `id`              | uuid        | Primary key                                       |
| `phone`           | text        | Recipient's WhatsApp number                       |
| `user_id`         | uuid        | FK to `users`                                     |
| `message_type`    | text        | `NOTIFICATION_TYPES` constant value               |
| `related_type`    | text        | `appointment`                                     |
| `related_id`      | uuid        | FK to the related appointment                     |
| `scheduled_at`    | timestamptz | When to send this message                         |
| `template_params` | jsonb       | Data to fill into the message template            |
| `template_name`   | text        | Meta template name (e.g., `appointment_reminder`) |
| `status`          | text        | `pending` / `sent` / `failed` / `cancelled`       |
| `sent_at`         | timestamptz | When it was actually sent                         |
| `retry_count`     | int         | Number of send attempts                           |
| `error_message`   | text        | Last error if failed                              |
| `updated_at`      | timestamptz | Auto-updated via trigger on row modification      |

---

## File Reference

```
lib/whatsapp/
├── service.js          Core API wrapper — sendTextMessage, sendButtonMessage,
│                       sendListMessage, sendTemplateMessage, markAsRead
├── constants.js        FLOWS, BOOKING_STEPS, STATUS_STEPS, CANCEL_STEPS,
│                       RESCHEDULE_STEPS, ACTIONS, TIME_SLOTS, WA_TABLES,
│                       NOTIFICATION_TYPES, TEMPLATES, CLINIC_NAME, CLINIC_PHONE
├── conversation.js     DB CRUD for whatsapp_conversations — getOrCreateConversation,
│                       updateConversation, resetConversation, logMessage,
│                       linkConversationToUser
├── templates.js        All message text — chatbot flow messages AND notification messages
│                       (all plain text, not Meta-approved templates)
├── router.js           Main message router — parses incoming webhook payload,
│                       checks global commands, dispatches to flow handlers
├── notifications.js    scheduleAppointmentReminders (with dedup), scheduleFollowUpReminder,
│                       sendWhatsAppNotification (template+fallback), processScheduledMessages,
│                       isOptedOut, sendWithTemplateFallback, logOutboundNotification
└── flows/
    ├── booking.js      Full booking flow — name→email→reason→date→time→confirm
    └── manage.js       Status check, cancel, and reschedule flows

app/api/whatsapp/
├── webhook/route.js    GET (Meta verification) + POST (incoming messages)
├── cron/route.js       GET — processes scheduled messages (protected by CRON_SECRET)
└── send/route.js       POST — admin-only manual send endpoint
```

---

## End-to-End Message Flow

### Incoming Message (Patient → System)

```
1. Patient sends WhatsApp message
2. Meta sends POST to /api/whatsapp/webhook
3. Webhook verifies X-Hub-Signature-256 (if WHATSAPP_APP_SECRET is set)
4. Rate limiter checks IP (60 req/min max)
5. webhook/route.js parses the payload
6. Idempotency check — skip if wa_message_id already processed
7. parseIncomingMessage() extracts text/interactive content
8. handleIncomingMessage() is called asynchronously
9. markAsRead() marks the message as read (shows blue ticks)
10. getOrCreateConversation() loads the patient's state from DB
11. logMessage() saves inbound message to audit log
12. Check STOP/START for opt-out handling
13. Check for conversation timeout (30 min inactivity)
14. Dispatches to the appropriate flow handler
15. Flow handler processes the step, updates conversation state in DB
16. Flow handler sends response back to patient via service.js
17. Webhook returns 200 immediately (Meta requirement)
```

### Outbound Notification (System → Patient)

```
1. System event occurs (admin approves appointment, etc.)
2. API route calls sendWhatsAppNotification(phone, type, params)
3. Check if patient opted out (isOptedOut) — skip if opted out
4. Map notification type to Meta template name (if available)
5. sendWithTemplateFallback() tries:
   a. Build template components via buildTemplateComponents()
   b. sendTemplateMessage() to Meta API
   c. On failure, fall back to sendTextMessage() with plain text
6. logOutboundNotification() saves audit record to whatsapp_messages
7. Patient receives the WhatsApp message
```

### Scheduled Reminder (Cron → Patient)

```
1. Appointment is booked → scheduleAppointmentReminders() deduplicates first
   (cancels any existing pending reminders for same related_id),
   then saves new reminder rows to DB with template_name
2. Cron fires GET /api/whatsapp/cron every 5 minutes
3. processScheduledMessages() queries: status='pending' AND scheduled_at <= now
4. For each due message:
   a. Check if patient opted out (skip if so, mark cancelled)
   b. Check if appointment was cancelled (skip if so)
   c. Fetch latest appointment details (for accurate date/time/doctor)
   d. Build params from template_params + fresh DB data
   e. sendWhatsAppNotification() sends the message (template + fallback)
   f. Update row: status='sent', sent_at=now
5. Returns count of processed/errors
```

---

## Testing the Integration

### Local Development with ngrok

```bash
# Install ngrok (https://ngrok.com)
ngrok http 3000

# Use the HTTPS URL as your webhook URL in Meta dashboard:
# https://xxxx.ngrok-free.app/api/whatsapp/webhook
```

### Test the Cron Endpoint Manually

```bash
curl "https://yourdomain.com/api/whatsapp/cron?token=<CRON_SECRET>"
```

### Check Scheduled Messages in DB

```sql
SELECT id, phone, message_type, scheduled_at, status, retry_count
FROM whatsapp_scheduled_messages
WHERE status = 'pending'
ORDER BY scheduled_at ASC;
```

### Check Conversation State

```sql
SELECT phone, flow, current_step, context, last_message_at
FROM whatsapp_conversations
ORDER BY last_message_at DESC
LIMIT 10;
```

### Simulate an Incoming Message (Meta Webhook Payload)

```bash
curl -X POST https://yourdomain.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "from": "919999999999",
            "id": "test_msg_id",
            "timestamp": "1234567890",
            "type": "text",
            "text": { "body": "hi" }
          }]
        }
      }]
    }]
  }'
```

---

## Known Limitations & Next Steps

| Issue                                          | Impact                                                                                              | Status                                                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Some notification types have no Meta template  | `PRESCRIPTION_READY`, `PRESCRIPTION_DISPENSED`, `FOLLOW_UP` use text only (fail outside 24h window) | Create and register additional templates in Meta Business Manager                                  |
| No phone number validation on patient accounts | Notifications sent to incorrect or landline numbers                                                 | Add E.164 format validation when saving phone numbers                                              |
| Cron must be set up externally (Netlify)       | Reminders never fire in production without it                                                       | Set up cron-job.org, Upstash QStash, or EasyCron (see [Cron section](#cron-job--why-its-required)) |
| Message audit log grows indefinitely           | DB table size                                                                                       | Add a cleanup cron to archive old messages >90 days                                                |
| 4 registered templates are under Meta review   | Templates use text fallback until approved                                                          | Monitor approval status in Meta Business Manager                                                   |
