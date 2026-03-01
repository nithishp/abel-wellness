# Abel Wellness & Homoeopathic Care Center (AWHCC) — Copilot Instructions

## Project Overview

A full-stack healthcare management system for a homeopathic clinic. The app handles patient appointments, doctor consultations, pharmacy/inventory management, billing, and a public-facing marketing website with blog.

- **App Name:** AWHCC — Abel Wellness & Homoeopathic Care Center
- **Domain:** Homeopathic healthcare clinic management
- **Locale:** India (IST timezone, INR currency, DD/MM/YYYY dates, GST tax system)

---

## Tech Stack

| Layer           | Technology                                                                              |
| --------------- | --------------------------------------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, React 19)                                                   |
| Language        | **JavaScript** (JSX, no TypeScript)                                                     |
| Styling         | **Tailwind CSS 3.4** + **shadcn/ui** (New York style, zinc base, CSS variables)         |
| Database        | **Supabase** (PostgreSQL) via `@supabase/supabase-js`                                   |
| Auth            | Custom session-based (no Supabase Auth for sessions — server-side session tokens in DB) |
| Email           | **Nodemailer** (SMTP)                                                                   |
| UI Components   | shadcn/ui primitives + Radix UI + custom components                                     |
| Animations      | **Framer Motion**                                                                       |
| Icons           | **react-icons** (Feather set `fi`) for dashboards, **lucide-react** for marketing pages |
| Charts          | **Recharts** (via shadcn/ui chart wrapper)                                              |
| Rich Text       | **TipTap** editor (for blog content)                                                    |
| PDF             | **@react-pdf/renderer** (case sheet exports)                                            |
| Toast           | **Sonner** (via shadcn/ui)                                                              |
| Date Picker     | **react-datepicker**                                                                    |
| Font            | **Poppins** (Google Fonts, weights 100–800)                                             |
| Theme           | **Dark theme** — dark slate/gray backgrounds, emerald/teal accents                      |
| Package Manager | npm                                                                                     |

---

## Project Structure

```
abel-wellness/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout (Server Component) — RoleAuthProvider + Toaster
│   ├── page.js                   # Home/landing page (Server Component)
│   ├── globals.css               # Global styles + dark theme + custom scrollbars
│   │
│   ├── components/               # Landing page components (About, Hero, FAQ, etc.)
│   │   └── ui/                   # App-level shared UI (AppointmentModal, ImageUpload, RichTextEditor)
│   │
│   ├── admin/                    # Admin portal
│   │   ├── page.jsx              # Admin login/entry
│   │   ├── components/           # AdminSidebar.jsx
│   │   ├── dashboard/            # Admin dashboard
│   │   ├── appointments/         # Appointment management
│   │   ├── patients/             # Patient records
│   │   ├── billing/              # Billing management
│   │   ├── inventory/            # Inventory management
│   │   ├── blogs/                # Blog CMS
│   │   ├── users/                # Staff management (doctors, pharmacists)
│   │   ├── settings/             # Clinic settings
│   │   └── reset-password/       # Password reset
│   │
│   ├── doctor/                   # Doctor portal
│   │   ├── components/           # DoctorSidebar, MedicationSearch, OOREPWidget
│   │   ├── dashboard/            # Doctor dashboard
│   │   ├── appointments/         # Assigned appointments
│   │   ├── consultation/         # Consultation form ([id] dynamic route)
│   │   ├── repertory/            # OOREP homeopathic repertory
│   │   └── login/                # Doctor login
│   │
│   ├── patient/                  # Patient portal
│   │   ├── components/           # PatientSidebar, CaseSheetPDF, ExportCaseSheetDialog
│   │   ├── dashboard/            # Patient dashboard
│   │   ├── appointments/         # Appointment history
│   │   ├── prescriptions/        # Prescription history
│   │   ├── records/              # Medical records
│   │   ├── billing/              # Billing history
│   │   ├── complete-profile/     # Profile completion
│   │   └── login/                # Patient OTP login
│   │
│   ├── pharmacist/               # Pharmacist portal
│   │   ├── components/           # PharmacistSidebar
│   │   ├── dashboard/            # Pharmacist dashboard
│   │   ├── prescriptions/        # Prescription dispensing
│   │   ├── inventory/            # Inventory management
│   │   └── login/                # Pharmacist login
│   │
│   ├── api/                      # API Routes (all server-side)
│   │   ├── auth/                 # login, logout, session, otp/send, otp/verify
│   │   ├── admin/                # appointments, patients, users, blogs, settings
│   │   ├── doctor/               # dashboard, appointments, consultation
│   │   ├── patient/              # dashboard, appointments, billing, prescriptions, records
│   │   ├── pharmacist/           # dashboard, prescriptions, dispense
│   │   ├── billing/              # invoices, payments, refunds, credit-notes, reports, ledger, settings
│   │   ├── inventory/            # items, categories, batches, suppliers, purchase-orders, alerts
│   │   ├── appointments/         # Public appointment creation (no auth)
│   │   ├── doctors/              # Public doctor listing
│   │   ├── notifications/        # User notifications
│   │   ├── oorep/                # Homeopathic repertory integration
│   │   ├── whatsapp/             # WhatsApp chatbot (webhook, send, cron)
│   │   ├── clinic/               # Public clinic branding
│   │   └── upload-image/         # Image upload to Supabase Storage
│   │
│   ├── blog/                     # Public blog pages
│   ├── services/                 # Service pages (6 categories + shared template)
│   ├── consent/                  # Consent page
│   ├── privacy-policy/           # Privacy policy
│   ├── refund-policy/            # Refund policy
│   └── terms-conditions/         # Terms & conditions
│
├── components/ui/                # shadcn/ui primitives (button, card, dialog, etc.)
├── lib/                          # Shared libraries
│   ├── supabase.config.js        # Supabase clients + TABLES + ROLES + STATUS enums
│   ├── supabase.client.js        # Client-side Supabase (legacy, subset)
│   ├── billing.constants.js      # Billing enums (invoice/payment statuses, GST, HSN codes)
│   ├── oorep-session.js          # OOREP authentication session manager
│   ├── utils.js                  # IST date utils, currency formatting, cn()
│   ├── auth/                     # RoleAuthContext, RoleProtectedRoute, AuthContext, ProtectedRoute
│   ├── actions/                  # Server actions + client fetch wrappers (15 files)
│   ├── email/                    # Nodemailer service + HTML email templates
│   ├── whatsapp/                 # WhatsApp chatbot engine (service, router, flows, notifications)
│   │   ├── service.js            # Core WhatsApp API wrapper (send text/buttons/lists/templates)
│   │   ├── constants.js          # Chatbot flows, steps, actions, time slots, table names
│   │   ├── conversation.js       # Conversation state management (Supabase CRUD)
│   │   ├── templates.js          # All message text templates (booking, notifications, menus)
│   │   ├── router.js             # Message router (parses incoming → dispatches to flows)
│   │   ├── notifications.js      # Scheduled reminders, instant notifications, retry processing
│   │   └── flows/                # Conversation flows
│   │       ├── booking.js        # Appointment booking flow (name→email→reason→date→time→confirm)
│   │       └── manage.js         # Status check, cancel, reschedule flows
│   └── hooks/                    # useInfiniteScroll hook
│
├── supabase/migrations/          # 6 SQL migration files
├── scripts/                      # seed-inventory.mjs, setup-admin.mjs
├── public/                       # Static assets (icons, profile images)
└── documents/                    # Documentation files
```

---

## Architecture & Patterns

### Rendering Strategy

- **Root layout (`app/layout.js`)** — Server Component wrapping `RoleAuthProvider` + `Toaster`
- **Home page (`app/page.js`)** — Server Component composing client sub-components
- **All other pages** — Client Components (`"use client"`) with `useEffect` data fetching
- **No SSR data fetching** — no `getServerSideProps`, no RSC async data, no `use()` hook

### Data Fetching Pattern

All pages fetch data client-side:

```jsx
"use client";
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (authLoading) return;
  if (!user) {
    router.push("/login");
    return;
  }
  if (user.role !== "expectedRole") {
    router.push("/");
    return;
  }
  fetchData();
}, [user, authLoading]);

const fetchData = async () => {
  try {
    const res = await fetch("/api/role/endpoint");
    const data = await res.json();
    setData(data);
  } finally {
    setLoading(false);
  }
};
```

### API Route Pattern

Every protected API route follows this structure:

```js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

// Local session verification helper (duplicated per file)
async function verifyRoleSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;
  const { data: session } = await supabaseAdmin
    .from("user_sessions")
    .select("*, user:users(*)")
    .eq("token", sessionToken)
    .single();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  if (session.user?.role !== "expected_role") return null;
  return session.user;
}

export async function GET(request) {
  try {
    const user = await verifyRoleSession();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Business logic using supabaseAdmin...
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Server Actions Pattern

```js
"use server";
import { supabaseAdmin } from "@/lib/supabase.config";

export async function createSomething(data) {
  const { data: result, error } = await supabaseAdmin
    .from("table")
    .insert(data)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, data: result };
}
```

### Dashboard Page Pattern

Every role's dashboard follows the same layout:

```
┌──────────────────────────────────────────┐
│ <RoleSidebar />  │  Page Content          │
│  (fixed left,    │  ┌──────────────────┐  │
│   collapsible,   │  │ Stat Cards Grid   │  │
│   mobile drawer) │  │ (4-col responsive)│  │
│                  │  ├──────────────────┤  │
│                  │  │ Tables / Lists    │  │
│                  │  └──────────────────┘  │
└──────────────────────────────────────────┘
```

- No shared layout.jsx per role — each page imports its own sidebar
- Sidebar components: `AdminSidebar`, `DoctorSidebar`, `PatientSidebar`, `PharmacistSidebar`

---

## Authentication System

### Two Auth Contexts (coexist)

| Context                              | File                           | Purpose                                   |
| ------------------------------------ | ------------------------------ | ----------------------------------------- |
| `RoleAuthProvider` / `useRoleAuth()` | `lib/auth/RoleAuthContext.jsx` | **Primary** — role-aware, custom sessions |
| `AuthProvider` / `useAuth()`         | `lib/auth/AuthContext.jsx`     | **Legacy** — wraps Supabase native auth   |

### Session Management

- **Mechanism:** Server-side sessions in `user_sessions` table
- **Token:** 32 random bytes (hex), stored in `session_token` httpOnly cookie
- **Cookie flags:** `httpOnly`, `secure` in production, `sameSite: lax`, `path: /`
- **No JWT, no localStorage** — all state is server-side

### Auth Flows by Role

| Role       | Login Path           | Method                                      | Session TTL |
| ---------- | -------------------- | ------------------------------------------- | ----------- |
| Patient    | `/patient/login`     | Email → 6-digit OTP (10min expiry) → verify | 7 days      |
| Doctor     | `/doctor/login`      | Email + password (bcrypt)                   | 24 hours    |
| Pharmacist | `/pharmacist/login`  | Email + password (bcrypt)                   | 24 hours    |
| Admin      | `/login` or `/admin` | Email + password (bcrypt)                   | 24 hours    |

### Route Protection

- **Client-side:** `RoleProtectedRoute` wrapper components (`AdminRoute`, `DoctorRoute`, etc.)
- **Server-side:** Each API route has its own `verifyXxxSession()` helper
- **No Next.js middleware** (`middleware.js` does not exist)

---

## Database Schema (Supabase PostgreSQL)

### 25 Tables across 6 migration files:

**Core (001):** `users`, `doctors`, `pharmacists`, `otp_codes`, `appointments`, `medical_records`, `prescriptions`, `prescription_items`, `notifications`, `user_sessions`

**Legacy:** `blogs`, `admins`

**Inventory (002):** `inventory_categories`, `inventory_suppliers`, `inventory_items`, `inventory_batches`, `inventory_stock_movements`, `purchase_orders`, `purchase_order_items`, `inventory_alerts`

**Billing (004):** `billing_settings`, `invoices`, `invoice_items`, `payments`, `payment_refunds`

**WhatsApp (005):** `whatsapp_conversations`, `whatsapp_messages`, `whatsapp_scheduled_messages`

**WhatsApp Enhancements (006):** Adds `opted_out` column to `whatsapp_conversations`, `updated_at` trigger to `whatsapp_scheduled_messages`

### Key Relationships

```
users ──→ doctors, pharmacists, appointments, medical_records, prescriptions, notifications, sessions, invoices, payments
doctors ──→ appointments, medical_records, prescriptions
appointments ──→ medical_records, prescriptions, invoices
medical_records ──→ prescriptions ──→ prescription_items
inventory_items ──→ inventory_batches, stock_movements, alerts
inventory_suppliers ──→ inventory_items, batches, purchase_orders
invoices ──→ invoice_items, payments ──→ payment_refunds
```

### Supabase Clients

| Client          | Import                     | Usage                                                                         |
| --------------- | -------------------------- | ----------------------------------------------------------------------------- |
| `supabaseAdmin` | `@/lib/supabase.config`    | **Server-only** (API routes, server actions) — service role key, bypasses RLS |
| `supabase`      | `@/lib/supabase.config`    | Client-side — anon key, respects RLS                                          |
| `supabase`      | `@/lib/supabase.client.js` | Legacy client-side (subset of tables)                                         |

### Constants & Enums (from `lib/supabase.config.js`)

```js
TABLES: { BLOGS, APPOINTMENTS, ADMINS, USERS, DOCTORS, PHARMACISTS, OTP_CODES,
          MEDICAL_RECORDS, PRESCRIPTIONS, PRESCRIPTION_ITEMS, NOTIFICATIONS, USER_SESSIONS }
ROLES: { PATIENT: "patient", ADMIN: "admin", DOCTOR: "doctor", PHARMACIST: "pharmacist" }
APPOINTMENT_STATUS: { PENDING, APPROVED, REJECTED, RESCHEDULED, COMPLETED, CANCELLED }
CONSULTATION_STATUS: { PENDING, IN_PROGRESS, COMPLETED, CANCELLED }
PRESCRIPTION_STATUS: { PENDING, PROCESSING, DISPENSED, CANCELLED }
STORAGE_BUCKETS: { BLOG_IMAGES: "blog-images", AVATARS: "avatars" }
```

### Billing Constants (from `lib/billing.constants.js`)

```js
BILLING_TABLES: { INVOICES, INVOICE_ITEMS, PAYMENTS, PAYMENT_REFUNDS, BILLING_SETTINGS,
                  TREATMENT_CASES, CREDIT_NOTES, CREDIT_NOTE_ITEMS, LEDGER_ENTRIES, BILLING_AUDIT_LOGS }
INVOICE_STATUS: { DRAFT, PENDING, PARTIAL, PAID, CANCELLED, REFUNDED }
PAYMENT_METHODS: { CASH, CARD, UPI, BANK_TRANSFER, ONLINE, CHEQUE, OTHER }
GST_RATES: { ZERO: 0, FIVE: 5, TWELVE: 12, EIGHTEEN: 18, TWENTY_EIGHT: 28 }
HSN_CODES: { CONSULTATION: "9983", HOMEOPATHY_MEDICINES: "3004", ... }
```

---

## Appointment Workflow

```
Patient books appointment (public, creates account if new)
  → Admin reviews → Approve + assign doctor / Reject / Reschedule
    → Doctor consults patient → fills medical record + prescription
      → Pharmacist dispenses medication
        → Patient views history in dashboard
```

Email notifications are sent at each step via Nodemailer.

---

## Key Integrations

### OOREP (Open Online Repertory for Homeopathy)

- **Purpose:** Doctors search homeopathic repertories and materia medicas
- **Architecture:** Hybrid local Docker instance (`localhost:9000`) + remote `oorep.com`
- **Session:** 2-step cookie auth with 20-min cache (`lib/oorep-session.js`)
- **API Routes:** `/api/oorep/search`, `/api/oorep/remedies`, `/api/oorep/materia-medica`, `/api/oorep/config`

### Email Service (`lib/email/service.js`)

- **12 HTML email templates** — OTP, appointment lifecycle, doctor assignment, prescription dispensing, welcome
- **SMTP transport** via Nodemailer
- **Branded templates** with indigo (#4F46E5) theme and CTA buttons

### WhatsApp Chatbot (Meta Business Cloud API)

- **Purpose:** Full conversational chatbot for appointment booking, status checks, cancellations, rescheduling + automated notifications (reminders, follow-ups, prescription alerts)
- **Provider:** Meta WhatsApp Business Cloud API (graph.facebook.com v21.0)
- **Architecture:** Webhook-based — Meta sends messages to `/api/whatsapp/webhook`, chatbot engine processes and responds
- **Chatbot Engine:** `lib/whatsapp/` — stateful conversation flows stored in `whatsapp_conversations` table
- **API Routes:**
  - `/api/whatsapp/webhook` — GET (verification) + POST (incoming messages)
  - `/api/whatsapp/send` — Admin-only authenticated endpoint for sending messages
  - `/api/whatsapp/cron` — Processes scheduled reminders/follow-ups (called by external cron)
- **Conversation Flows:**
  - **Booking:** name → email → reason → date (DD/MM/YYYY) → time slot (interactive list) → confirm (buttons) → creates appointment + patient account
  - **Status:** finds patient by phone → shows formatted list of appointments
  - **Cancel:** shows active appointments as list → confirm → updates DB
  - **Reschedule:** select appointment → new date → new time → confirm → updates DB
  - **Help/Menu:** global commands (`hi`, `menu`, `book`, `status`, `cancel`, `reschedule`, `help`)
- **Notifications (triggered from existing APIs):**
  - Appointment confirmed/rejected/rescheduled/cancelled (from admin appointments API)
  - Prescription ready (from doctor consultation API on completion)
  - Prescription dispensed (from pharmacist dispense API)
  - 24-hour and 1-hour appointment reminders (scheduled in `whatsapp_scheduled_messages`)
  - 7-day follow-up reminders (scheduled on consultation completion)
- **Conversation timeout:** 30 minutes of inactivity resets to main menu
- **Message types:** text, interactive buttons (max 3), interactive lists (sections with rows), Meta-approved templates
- **Meta Templates:** 6 templates registered (`appointment_confirmation`, `appointment_cancelled`, `appointment_reminder`, `missed_appointment`, `rescheduled`, `rejected`) with graceful text fallback via `sendWithTemplateFallback()`
- **Webhook Security:** Signature verification (`X-Hub-Signature-256`), rate limiting (60 req/min), idempotency dedup
- **Opt-out:** Patients send STOP/START to manage notifications; checked at router, notification, and cron levels
- **DB Tables:** `whatsapp_conversations` (state machine + opt-out), `whatsapp_messages` (audit log), `whatsapp_scheduled_messages` (reminders queue)
- **Web booking integration:** Website bookings via `/api/appointments` also schedule WhatsApp reminders

---

## Utility Functions (`lib/utils.js`)

### Core

- `cn(...inputs)` — Tailwind class merging (clsx + twMerge)
- `parseStringify(value)` — Deep clone via JSON round-trip

### IST Date/Time (India Standard Time — `Asia/Kolkata`)

All date formatting functions are IST-aware: `formatDateIST()`, `formatTimeIST()`, `formatDateTimeIST()`, `formatRelativeTimeIST()`, `getTodayIST()`, `getStartOfDayIST()`, `getEndOfDayIST()`, `isTodayIST()`, `isPastIST()`, `isFutureIST()`, `addDaysIST()`, `formatDateForInput()`, `formatDateForDB()`, etc.

### Currency

- `formatCurrencyINR(amount)` — Formats as `₹1,234.56`
- `formatNumberINR(num)` — Indian numbering (lakh/crore separators)

---

## Custom Hooks

### `useInfiniteScroll(fetchFn, options)` — `lib/hooks/useInfiniteScroll.js`

Intersection Observer-based infinite scroll. Returns `{ items, loading, loadingMore, hasMore, totalCount, loadMore, reset, sentinelRef, page }`.

---

## Server Actions (`lib/actions/`)

| File                              | Type                 | Purpose                                                                  |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| `billing.actions.js`              | Server action        | Invoice CRUD, payment processing, settings                               |
| `inventory.actions.js`            | Server action        | Full inventory CRUD (categories, items, batches, suppliers, POs, alerts) |
| `audit.actions.js`                | Server action        | Billing audit logging                                                    |
| `ledger.actions.js`               | Server action        | Financial ledger entries                                                 |
| `gst.actions.js`                  | Server action        | GST tax calculation                                                      |
| `creditnote.actions.js`           | Server action        | Credit note management                                                   |
| `quickbill.actions.js`            | Server action        | Quick bill creation                                                      |
| `treatmentcase.actions.js`        | Server action        | Treatment case management                                                |
| `prescription-billing.actions.js` | Server action        | Prescription-to-invoice conversion                                       |
| `inventory-billing.actions.js`    | Server action        | Stock deduction/restoration on invoicing                                 |
| `offline-billing.actions.js`      | Server action        | Offline billing support                                                  |
| `appointment.actions.js`          | Client fetch wrapper | Calls `/api/appointments`                                                |
| `admin.actions.js`                | Client fetch wrapper | Admin operations                                                         |
| `blog.actions.js`                 | Client fetch wrapper | Blog CRUD                                                                |

---

## Environment Variables

| Variable                        | Purpose                                                     | Required |
| ------------------------------- | ----------------------------------------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                        | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key                                    | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-only, bypasses RLS)       | Yes      |
| `NEXT_PUBLIC_APP_URL`           | Public app URL (for email links)                            | Yes      |
| `SMTP_HOST`                     | Email SMTP host                                             | Yes      |
| `SMTP_PORT`                     | Email SMTP port (default: 587)                              | Yes      |
| `SMTP_USER`                     | SMTP username                                               | Yes      |
| `SMTP_PASSWORD`                 | SMTP password                                               | Yes      |
| `SMTP_FROM_EMAIL`               | Sender email address                                        | Optional |
| `SMTP_SECURE`                   | Use TLS (`"true"/"false"`)                                  | Optional |
| `OOREP_API_URL`                 | Local OOREP instance URL (default: `http://localhost:9000`) | Optional |
| `NEXT_PUBLIC_OOREP_ENABLED`     | Enable OOREP feature (`"true"`)                             | Optional |
| `WHATSAPP_ACCESS_TOKEN`         | Meta WhatsApp Business Cloud API access token               | Yes\*    |
| `WHATSAPP_PHONE_NUMBER_ID`      | WhatsApp Business phone number ID (from Meta dashboard)     | Yes\*    |
| `WHATSAPP_BUSINESS_ACCOUNT_ID`  | WhatsApp Business Account ID                                | Yes\*    |
| `WHATSAPP_VERIFY_TOKEN`         | Webhook verification token (set in Meta dashboard)          | Yes\*    |
| `WHATSAPP_APP_SECRET`           | Meta App Secret for webhook signature verification          | Yes\*    |
| `CRON_SECRET`                   | Secret token for cron endpoint auth (`/api/whatsapp/cron`)  | Yes\*    |

\*Required if WhatsApp chatbot feature is enabled

---

## Coding Conventions

### General

- **JavaScript only** — no TypeScript (uses jsconfig.json with `@/*` path alias)
- **File extensions:** `.js` for utilities/config, `.jsx` for components/pages
- **Imports:** Use `@/` path alias (e.g., `@/lib/utils`, `@/components/ui/button`)
- **No semicolons:** Project uses inconsistent semicolons (follow existing file patterns)
- **`"use client"`** directive on every page and interactive component

### Component Conventions

- **PascalCase** file names for custom components (`AdminSidebar.jsx`, `NotificationBell.jsx`)
- **lowercase** file names for shadcn/ui primitives (`button.jsx`, `card.jsx`, `dialog.jsx`)
- Sidebar components follow `{Role}Sidebar` naming (`AdminSidebar`, `DoctorSidebar`, etc.)
- Service pages use `ServicePageTemplate.jsx` shared template

### Styling

- **Dark theme by default** — dark slate/gray backgrounds (`#0a0a0a`, `#1e293b`)
- **Color palette:** emerald/teal accents for admin, blue/indigo for doctor, purple/violet for pharmacist
- Use shadcn/ui CSS variables for theming (`--background`, `--foreground`, `--primary`, etc.)
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Custom scrollbar styles defined in `globals.css`
- Responsive breakpoints: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)

### API Routes

- Always use `supabaseAdmin` (service role) in API routes — never the anon client
- Verify sessions with a local `verifyXxxSession()` helper at the top of each route
- Return `{ error: "message" }` with appropriate HTTP status on failure
- Use `try/catch` around all handlers; log errors with `console.error`
- Use constants from `@/lib/supabase.config` (`TABLES`, `ROLES`, status enums)
- Use constants from `@/lib/billing.constants.js` for billing-related routes

### Server Actions

- Mark with `"use server"` directive
- Return `{ success: boolean, error?: string, ...data }` consistently
- Use `supabaseAdmin` for database access

### Date & Currency

- **Always use IST** — use utility functions from `@/lib/utils` (never raw `new Date().toLocaleString()`)
- **Always use INR** — use `formatCurrencyINR()` for currency display
- Store dates as ISO strings in the database via `formatDateForDB()`

---

## Important Notes

1. **No Next.js middleware** — route protection is client-side only (via `RoleProtectedRoute` wrappers); API routes individually verify sessions server-side
2. **No TypeScript** — the project is pure JavaScript with JSX
3. **No shared dashboard layout** — each page imports its own sidebar; there are no `layout.jsx` files in role directories
4. **Two auth contexts coexist** — `RoleAuthProvider` (primary) and `AuthProvider` (legacy); new code should use `useRoleAuth()`
5. **Patient accounts are created implicitly** when they book their first appointment — there is no self-registration
6. **Session verification is duplicated** per API route file (not extracted to a shared helper)
7. **No schema validation library** (no Zod, no Yup) — validation is manual field checks
8. **Supabase Storage** is used for blog images (`blog-images` bucket) and avatars (`avatars` bucket)
9. The billing module supports **GST (Indian tax system)** with CGST/SGST/IGST and HSN codes
10. Medical records follow **homeopathic case-taking format** (chief complaints, mental/emotional state, totality analysis, etc.)

---

## Agent Rules: Keeping This File Updated

**This file (`copilot-instructions.md`) is the single source of truth for AI agents working on this project.** Any agent making structural changes to the codebase MUST update this file to reflect those changes.

### When to Update This File

Update this file whenever you make changes that affect any of the following:

| Change Type                     | What to Update                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| **New table / column**          | Update "Database Schema" section (table list, relationships, migration count)                   |
| **New API route**               | Update "Project Structure" and note the pattern in "API Routes" if it deviates                  |
| **New page / route**            | Update "Project Structure" tree                                                                 |
| **New component**               | Update "Project Structure" tree; note in "Component Conventions" if it introduces a new pattern |
| **New server action**           | Update "Server Actions" table                                                                   |
| **New environment variable**    | Update "Environment Variables" table                                                            |
| **New dependency / library**    | Update "Tech Stack" table                                                                       |
| **New integration**             | Add to "Key Integrations" section                                                               |
| **New constant / enum**         | Update "Constants & Enums" or "Billing Constants" section                                       |
| **Auth flow change**            | Update "Authentication System" section                                                          |
| **New hook**                    | Update "Custom Hooks" section                                                                   |
| **New utility function**        | Update "Utility Functions" section                                                              |
| **Workflow change**             | Update "Appointment Workflow" or relevant workflow section                                      |
| **Breaking pattern change**     | Update "Architecture & Patterns" and "Coding Conventions" sections                              |
| **Important gotcha discovered** | Add to "Important Notes" list                                                                   |

### How to Update

1. Make your code changes first
2. Before finishing, re-read the relevant section(s) of this file
3. Edit **only the affected sections** — do not rewrite the entire file
4. Keep the same formatting style (Markdown tables, code blocks, etc.)
5. If adding a new major feature area, add a new `##` section in the appropriate place

### What NOT to Update

- Do not update this file for minor bug fixes, styling tweaks, or refactors that don't change the architecture
- Do not add TODO items or work-in-progress notes — this file documents the **current** state only
- Do not remove existing sections unless the feature has been fully removed from the codebase

---

## Agent Rules: Using Supabase MCP for Database Access

**This project has a Supabase MCP server connected to the production database.** Always prefer MCP tools over manual SQL or guessing at schema details.

### Available Supabase MCP Tools

| Tool                                | Purpose                                           | When to Use                                                                               |
| ----------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `mcp_supabase_execute_sql`          | Run SELECT/INSERT/UPDATE/DELETE queries           | Inspecting data, debugging issues, verifying schema, checking row counts, testing queries |
| `mcp_supabase_list_tables`          | List all tables in a schema                       | When you need to verify table names or discover the current schema                        |
| `mcp_supabase_apply_migration`      | Run DDL (CREATE TABLE, ALTER, etc.)               | When creating or modifying tables, columns, indexes, functions, triggers, RLS policies    |
| `mcp_supabase_list_migrations`      | List all applied migrations                       | Before creating a new migration, to check the current migration state                     |
| `mcp_supabase_get_logs`             | Fetch logs by service (postgres, api, auth, etc.) | Debugging errors, checking query performance, investigating auth issues                   |
| `mcp_supabase_get_advisors`         | Get security/performance advisories               | After DDL changes to catch missing RLS policies, or during security review                |
| `mcp_supabase_list_extensions`      | List installed PostgreSQL extensions              | Before using extension-specific features (e.g., `pgcrypto`, `uuid-ossp`)                  |
| `mcp_supabase_search_docs`          | Search Supabase documentation (GraphQL)           | When unsure about Supabase features, syntax, or best practices                            |
| `mcp_supabase_get_project_url`      | Get the Supabase project API URL                  | When configuring API endpoints or verifying project connection                            |
| `mcp_supabase_get_publishable_keys` | Get API keys (anon/publishable)                   | When verifying client-side key configuration                                              |

### Database Access Guidelines

1. **Always verify schema before writing queries.** Use `mcp_supabase_list_tables` and `mcp_supabase_execute_sql` (with `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'xxx'`) to confirm column names and types before writing code.

2. **Use MCP for migrations, not raw SQL files.** When creating new tables or altering schema:
   - First check existing migrations with `mcp_supabase_list_migrations`
   - Apply new migrations via `mcp_supabase_apply_migration` with a descriptive `snake_case` name
   - Also create the corresponding `.sql` file in `supabase/migrations/` so the repo stays in sync
   - Migration naming convention: `NNN_description.sql` (e.g., `005_add_clinic_hours.sql`)

3. **Run advisory checks after schema changes.** After any DDL change, run `mcp_supabase_get_advisors` with type `"security"` to catch missing RLS policies.

4. **Use `execute_sql` for data inspection.** When debugging issues or understanding the current state of data, query the database directly rather than guessing. Examples:

   ```sql
   -- Check table structure
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;

   -- Check existing RLS policies
   SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';

   -- Check triggers on a table
   SELECT trigger_name, event_manipulation, action_statement
   FROM information_schema.triggers WHERE event_object_table = 'inventory_items';

   -- Inspect data counts
   SELECT 'users' as tbl, count(*) FROM users
   UNION ALL SELECT 'appointments', count(*) FROM appointments;
   ```

5. **Never hardcode generated IDs in migrations.** Use subqueries or variables instead.

6. **Check logs for debugging.** Use `mcp_supabase_get_logs` with service `"postgres"` for DB errors, `"api"` for REST API issues, or `"auth"` for authentication problems.

### Schema Verification Workflow

Before writing any new API route, server action, or page that interacts with the database:

```
1. mcp_supabase_list_tables → confirm table exists
2. mcp_supabase_execute_sql → SELECT columns from information_schema for exact column names/types
3. Write the code using verified column names
4. If schema changes are needed → mcp_supabase_apply_migration + create .sql file in repo
5. mcp_supabase_get_advisors(type: "security") → verify no missing RLS policies
6. Update this copilot-instructions.md if schema changed
```

### Styling Rules

- **Always use Tailwind CSS** — never write custom CSS or inline styles
- Follow mobile-first responsive design: base → `sm:` → `md:` → `lg:` → `xl:`
- Use the project's color tokens from `tailwind.config.js` and CSS variables — don't hardcode colors
- Use `space-y-*` and `gap-*` for spacing between elements
- Cards use the shadcn/ui `Card` component with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- Use `framer-motion` for animations — keep them subtle and consistent with existing patterns

### Do NOT

- Do not create new UI component libraries or design tokens — use what exists
- Do not use raw `<input>`, `<select>`, `<button>` elements — always use shadcn/ui equivalents
- Do not mix CSS Modules, styled-components, or other CSS-in-JS — Tailwind only
- Do not create new modal/dialog implementations — use shadcn/ui `Dialog` or the existing `FormModal.jsx`
- Do not add new npm dependencies for UI without explicit approval — the project already has a comprehensive UI toolkit

## Design & UI Consistency Rules

**Every new screen and component MUST maintain visual consistency with the existing app.** The design system is comprehensive — use it, don't reinvent.
