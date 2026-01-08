# Billing Module Documentation

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Module Architecture](#module-architecture)
4. [Core Features](#core-features)
5. [Billing Flow](#billing-flow)
6. [API Endpoints](#api-endpoints)
7. [User Interfaces](#user-interfaces)
8. [Configuration & Settings](#configuration--settings)
9. [Payment Processing](#payment-processing)
10. [Reporting & Analytics](#reporting--analytics)

---

## Overview

The Billing Module is a comprehensive financial management system designed for healthcare operations. It handles invoice generation, payment processing, refunds, and financial reporting with multi-role support (Admin, Patient, Doctor).

### Key Capabilities

- Automated invoice generation from appointments
- Multiple payment methods (Cash, Card, UPI, Bank Transfer, Online, Cheque)
- Flexible taxation and discount systems
- Payment tracking and reconciliation
- Refund management
- Comprehensive financial reporting
- Role-based access control

---

## Database Schema

### Core Tables

#### 1. **invoices**

Primary table for storing invoice records.

| Column          | Type             | Description                                                        |
| --------------- | ---------------- | ------------------------------------------------------------------ |
| id              | uuid             | Primary key                                                        |
| invoice_number  | varchar (unique) | Auto-generated invoice number (e.g., INV-001001)                   |
| patient_id      | uuid             | Foreign key to users table                                         |
| appointment_id  | uuid             | Foreign key to appointments table (nullable)                       |
| status          | varchar          | Invoice status: draft, pending, partial, paid, cancelled, refunded |
| subtotal        | numeric          | Sum of all items before tax and discount                           |
| tax_rate        | numeric          | Tax percentage (default: 0)                                        |
| tax_amount      | numeric          | Calculated tax amount                                              |
| discount_amount | numeric          | Total discount applied                                             |
| discount_reason | text             | Reason for discount (nullable)                                     |
| total_amount    | numeric          | Final amount after tax and discount                                |
| amount_paid     | numeric          | Total amount paid so far                                           |
| amount_due      | numeric          | GENERATED: (total_amount - amount_paid)                            |
| invoice_date    | date             | Date of invoice creation                                           |
| due_date        | date             | Payment due date                                                   |
| paid_at         | timestamptz      | Timestamp when fully paid (nullable)                               |
| notes           | text             | Customer-visible notes (nullable)                                  |
| internal_notes  | text             | Internal staff notes (nullable)                                    |
| created_by      | uuid             | Foreign key to users table (nullable)                              |
| updated_by      | uuid             | Foreign key to users table (nullable)                              |
| created_at      | timestamptz      | Record creation timestamp                                          |
| updated_at      | timestamptz      | Last update timestamp                                              |

**Constraints:**

- `status` CHECK constraint: Must be one of the valid status values
- Unique invoice_number
- RLS (Row Level Security) enabled

**Relationships:**

- `patient_id` → users.id
- `appointment_id` → appointments.id
- `created_by` → users.id
- `updated_by` → users.id

---

#### 2. **invoice_items**

Line items for each invoice.

| Column           | Type        | Description                                                           |
| ---------------- | ----------- | --------------------------------------------------------------------- |
| id               | uuid        | Primary key                                                           |
| invoice_id       | uuid        | Foreign key to invoices table                                         |
| item_type        | varchar     | consultation, medication, supply, procedure, lab_test, service, other |
| description      | text        | Item description                                                      |
| quantity         | numeric     | Quantity (default: 1)                                                 |
| unit             | varchar     | Unit of measure (default: 'unit')                                     |
| unit_price       | numeric     | Price per unit                                                        |
| discount_percent | numeric     | Discount percentage (default: 0)                                      |
| discount_amount  | numeric     | Calculated discount amount                                            |
| tax_rate         | numeric     | Tax rate for this item (default: 0)                                   |
| tax_amount       | numeric     | Calculated tax amount                                                 |
| total            | numeric     | Final total for this line item                                        |
| reference_type   | varchar     | Type of referenced entity (nullable)                                  |
| reference_id     | uuid        | ID of referenced entity (nullable)                                    |
| sort_order       | integer     | Display order (default: 0)                                            |
| created_at       | timestamptz | Record creation timestamp                                             |

**Constraints:**

- `item_type` CHECK constraint: Must be valid item type
- RLS enabled

**Relationships:**

- `invoice_id` → invoices.id (cascade delete)

**Calculation Logic:**

```
subtotal = quantity × unit_price
discount_amount = (subtotal × discount_percent) / 100
taxable_amount = subtotal - discount_amount
tax_amount = (taxable_amount × tax_rate) / 100
total = taxable_amount + tax_amount
```

---

#### 3. **payments**

Payment records for invoices.

| Column                | Type        | Description                                           |
| --------------------- | ----------- | ----------------------------------------------------- |
| id                    | uuid        | Primary key                                           |
| invoice_id            | uuid        | Foreign key to invoices table                         |
| patient_id            | uuid        | Foreign key to users table                            |
| amount                | numeric     | Payment amount (CHECK: amount > 0)                    |
| payment_method        | varchar     | cash, card, upi, bank_transfer, online, cheque, other |
| status                | varchar     | pending, completed, failed, refunded, cancelled       |
| transaction_reference | varchar     | External transaction reference (nullable)             |
| payment_date          | timestamptz | Payment timestamp (default: now())                    |
| payment_gateway       | varchar     | Gateway name (nullable)                               |
| gateway_order_id      | varchar     | Gateway order ID (nullable)                           |
| gateway_payment_id    | varchar     | Gateway payment ID (nullable)                         |
| gateway_signature     | varchar     | Gateway signature for verification (nullable)         |
| gateway_response      | jsonb       | Full gateway response (nullable)                      |
| notes                 | text        | Payment notes (nullable)                              |
| received_by           | uuid        | Staff who received payment (nullable)                 |
| created_at            | timestamptz | Record creation timestamp                             |
| updated_at            | timestamptz | Last update timestamp                                 |

**Constraints:**

- `amount` CHECK: amount > 0
- `payment_method` CHECK: Must be valid payment method
- `status` CHECK: Must be valid status
- RLS enabled

**Relationships:**

- `invoice_id` → invoices.id
- `patient_id` → users.id
- `received_by` → users.id

---

#### 4. **payment_refunds**

Refund records for payments.

| Column            | Type        | Description                           |
| ----------------- | ----------- | ------------------------------------- |
| id                | uuid        | Primary key                           |
| payment_id        | uuid        | Foreign key to payments table         |
| invoice_id        | uuid        | Foreign key to invoices table         |
| amount            | numeric     | Refund amount (CHECK: amount > 0)     |
| reason            | text        | Reason for refund                     |
| status            | varchar     | pending, completed, failed            |
| gateway_refund_id | varchar     | Gateway refund ID (nullable)          |
| gateway_response  | jsonb       | Gateway response (nullable)           |
| refunded_by       | uuid        | Staff who processed refund (nullable) |
| refunded_at       | timestamptz | Refund timestamp (default: now())     |
| created_at        | timestamptz | Record creation timestamp             |

**Constraints:**

- `amount` CHECK: amount > 0
- `status` CHECK: Must be valid status
- RLS enabled

**Relationships:**

- `payment_id` → payments.id
- `invoice_id` → invoices.id
- `refunded_by` → users.id

---

#### 5. **billing_settings**

Configuration settings for billing module.

| Column        | Type             | Description                           |
| ------------- | ---------------- | ------------------------------------- |
| id            | uuid             | Primary key                           |
| setting_key   | varchar (unique) | Setting identifier                    |
| setting_value | jsonb            | Setting value (flexible JSON)         |
| category      | varchar          | Setting category (default: 'general') |
| description   | text             | Setting description (nullable)        |
| created_at    | timestamptz      | Record creation timestamp             |
| updated_at    | timestamptz      | Last update timestamp                 |

**Constraints:**

- Unique setting_key
- RLS enabled

**Common Settings:**

- `invoice_prefix`: "INV" - Invoice number prefix
- `payment_due_days`: 7 - Days until payment due
- `default_tax_rate`: 0 - Default tax rate percentage
- `tax_enabled`: true/false - Enable tax calculation
- `auto_add_consultation_fee`: true/false - Auto-add doctor consultation fee
- `currency`: "INR" - Currency code
- `decimal_places`: 2 - Number of decimal places
- `terms_and_conditions`: "..." - Default T&C text
- `company_name`: "..." - Organization name
- `company_address`: "..." - Organization address
- `company_tax_id`: "..." - Tax registration number
- `company_email`: "..." - Contact email
- `company_phone`: "..." - Contact phone

---

## Module Architecture

### Directory Structure

```
abel-wellness/
├── lib/
│   ├── actions/
│   │   └── billing.actions.js          # Server-side billing logic
│   └── billing.constants.js            # Constants and enums
├── app/
│   ├── admin/billing/                  # Admin billing UI
│   │   ├── page.jsx                    # Dashboard
│   │   ├── invoices/                   # Invoice management
│   │   │   ├── page.jsx                # Invoice list
│   │   │   ├── create/page.jsx         # Create invoice
│   │   │   └── [id]/page.jsx           # Invoice detail/edit
│   │   ├── settings/page.jsx           # Billing settings
│   │   └── components/
│   │       └── InvoicePDF.jsx          # PDF generation
│   ├── patient/billing/                # Patient billing UI
│   │   ├── page.jsx                    # Patient billing list
│   │   └── [id]/page.jsx               # Invoice view
│   └── api/billing/                    # API routes
│       ├── invoices/route.js           # Invoice CRUD
│       ├── payments/route.js           # Payment processing
│       ├── refunds/route.js            # Refund management
│       ├── reports/route.js            # Reporting endpoints
│       └── settings/route.js           # Settings management
└── documents/
    └── BILLING_MODULE_DOCUMENTATION.md # This file
```

### Component Layers

1. **Database Layer** (Supabase)

   - PostgreSQL database with RLS policies
   - Automated triggers for calculations
   - Foreign key constraints for data integrity

2. **Server Actions Layer** (`lib/actions/billing.actions.js`)

   - Business logic implementation
   - Data validation
   - Transaction management
   - Error handling

3. **API Layer** (`app/api/billing/`)

   - RESTful endpoints
   - Request validation
   - Response formatting
   - Authentication checks

4. **UI Layer** (`app/admin/billing/`, `app/patient/billing/`)
   - Role-specific interfaces
   - Form validation
   - Data presentation
   - Real-time updates

---

## Core Features

### 1. Invoice Management

#### Invoice Creation

- Manual invoice creation by admin
- Automated generation from completed appointments
- Automatic invoice numbering with configurable prefix
- Support for multiple line items
- Individual item tax and discount
- Overall invoice discount with reason tracking

#### Invoice Statuses

- **Draft**: Invoice being prepared, not sent to patient
- **Pending**: Invoice issued, awaiting payment
- **Partial**: Partial payment received
- **Paid**: Fully paid
- **Cancelled**: Invoice cancelled, no payment expected
- **Refunded**: Payment refunded

#### Invoice Operations

- Create, Read, Update, Delete (CRUD)
- Status transitions with validation
- Add/Edit/Remove line items
- Apply discounts and taxes
- Generate PDF invoices
- Send invoice notifications

---

### 2. Payment Processing

#### Payment Methods Supported

- **Cash**: Physical cash payment
- **Card**: Credit/Debit card
- **UPI**: Unified Payments Interface
- **Bank Transfer**: Direct bank transfer
- **Online**: Online payment gateway
- **Cheque**: Cheque payment
- **Other**: Other payment methods

#### Payment Flow

1. Patient receives invoice (pending status)
2. Patient/Admin initiates payment
3. Payment recorded with method and reference
4. Invoice status automatically updated
5. Receipt generated

#### Payment Validation

- Cannot pay more than amount due
- Cannot pay cancelled invoices
- Cannot pay already-paid invoices
- Amount validation (must be > 0)

#### Automatic Status Updates

- Invoice status changes based on payment:
  - If `amount_paid == total_amount`: Status → **Paid**
  - If `0 < amount_paid < total_amount`: Status → **Partial**
  - If payment received on pending: Status → **Partial** or **Paid**

---

### 3. Refund Management

#### Refund Process

1. Admin initiates refund on a completed payment
2. Refund amount validated (cannot exceed payment)
3. Refund recorded with reason
4. Invoice amount_paid reduced
5. Invoice status updated:
   - If `amount_paid == 0`: Status → **Refunded**
   - If `0 < amount_paid < total_amount`: Status → **Partial**
6. Gateway refund processed (if applicable)

#### Refund Constraints

- Only completed payments can be refunded
- Total refunds cannot exceed payment amount
- Partial refunds supported
- Reason required for all refunds

---

### 4. Appointment Integration

#### Auto-Invoice Generation

When appointment is completed:

1. Check if invoice already exists
2. If `auto_add_consultation_fee` is enabled:
   - Fetch doctor's consultation fee
   - Create invoice with consultation line item
3. If disabled:
   - Create empty invoice for manual item addition
4. Set invoice status based on configuration
5. Link invoice to appointment

#### Prescription Items Addition

- Prescription items can be added to invoice
- System attempts to match with inventory items
- If match found: Uses inventory selling price
- If no match: Uses default price (0, manual entry required)
- Medication details included in description

---

## Billing Flow

### Complete Billing Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    BILLING FLOW DIAGRAM                      │
└─────────────────────────────────────────────────────────────┘

1. APPOINTMENT BOOKING
   └─> Patient books appointment
       └─> Appointment created (status: pending)

2. APPOINTMENT COMPLETION
   └─> Doctor completes consultation
       └─> Medical record created
       └─> Prescription created (if needed)
       └─> Appointment status: completed

3. INVOICE GENERATION (Automated)
   └─> System checks billing settings
       ├─> If auto_add_consultation_fee = true
       │   └─> Create invoice with consultation item
       │       └─> Item: Doctor consultation fee
       └─> If auto_add_consultation_fee = false
           └─> Create empty invoice

4. INVOICE ENRICHMENT (Optional)
   └─> Admin/Staff adds additional items:
       ├─> Medications from prescription
       ├─> Lab tests
       ├─> Procedures
       ├─> Supplies
       └─> Other services

5. INVOICE FINALIZATION
   └─> Calculate totals:
       ├─> Subtotal = Sum of all items
       ├─> Tax = (Subtotal - Discount) × Tax Rate
       └─> Total = Subtotal - Discount + Tax
   └─> Apply discount (if any)
   └─> Set due date (invoice_date + payment_due_days)
   └─> Change status: draft → pending

6. PATIENT NOTIFICATION
   └─> Patient receives invoice notification
       └─> Can view invoice in patient portal
       └─> PDF invoice available for download

7. PAYMENT PROCESSING
   ├─> OPTION A: Cash/Card at Clinic
   │   └─> Admin records payment manually
   │       └─> Payment method: cash/card/upi/cheque
   │       └─> Transaction reference (optional)
   │       └─> Received by: Staff user ID
   │
   ├─> OPTION B: Online Payment (Future)
   │   └─> Patient initiates online payment
   │       └─> Payment gateway integration
   │       └─> Gateway response recorded
   │       └─> Automatic payment confirmation
   │
   └─> Payment Recorded:
       ├─> Payment status: completed
       ├─> Invoice amount_paid updated
       └─> Invoice status updated:
           ├─> If full payment: status → paid
           └─> If partial payment: status → partial

8. POST-PAYMENT
   ├─> Receipt generated
   ├─> Patient notification sent
   └─> Payment recorded in financial reports

9. REFUND PROCESS (If Needed)
   └─> Admin initiates refund
       └─> Refund reason required
       └─> Refund amount validated
       └─> Refund record created
       └─> Invoice amount_paid reduced
       └─> Invoice status updated
       └─> Gateway refund (if applicable)
       └─> Patient notification

10. REPORTING & ANALYTICS
    └─> Revenue reports
    └─> Outstanding invoices report
    └─> Payment method breakdown
    └─> Daily/Monthly revenue tracking
```

---

### Status Transition Diagram

```
INVOICE STATUS FLOW:

    [DRAFT]
       │
       ├─> (Invoice sent to patient)
       │
       ▼
   [PENDING]
       │
       ├─> (Partial payment received)
       │
       ├─> [PARTIAL]
       │       │
       │       ├─> (Remaining payment received)
       │       │
       │       └─> [PAID]
       │
       ├─> (Full payment received)
       │
       ├─> [PAID]
       │       │
       │       └─> (Full refund)
       │           │
       │           └─> [REFUNDED]
       │
       └─> (Invoice cancelled)
           │
           └─> [CANCELLED]

PAYMENT STATUS FLOW:

   [PENDING]
       │
       ├─> (Payment successful)
       │
       ├─> [COMPLETED]
       │       │
       │       └─> (Refund issued)
       │           │
       │           └─> [REFUNDED]
       │
       ├─> (Payment failed)
       │
       ├─> [FAILED]
       │
       └─> (Payment cancelled)
           │
           └─> [CANCELLED]
```

---

## API Endpoints

### Base URL: `/api/billing`

### 1. Invoices

#### GET `/api/billing/invoices`

Fetch invoices with filtering and pagination.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string|array): Filter by status
- `patientId` (uuid): Filter by patient
- `appointmentId` (uuid): Filter by appointment
- `startDate` (date): Filter by invoice date >= startDate
- `endDate` (date): Filter by invoice date <= endDate
- `search` (string): Search invoice numbers
- `sortBy` (string): Sort column (default: created_at)
- `sortOrder` (string): asc/desc (default: desc)

**Response:**

```json
{
  "success": true,
  "invoices": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

---

#### POST `/api/billing/invoices`

Create a new invoice.

**Request Body:**

```json
{
  "patient_id": "uuid",
  "appointment_id": "uuid",
  "status": "pending",
  "items": [
    {
      "item_type": "consultation",
      "description": "Doctor consultation",
      "quantity": 1,
      "unit_price": 500,
      "tax_rate": 0
    }
  ],
  "discount_amount": 0,
  "discount_reason": "",
  "notes": "",
  "created_by": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "invoice": {...},
  "items": [...]
}
```

---

#### GET `/api/billing/invoices/[id]`

Fetch single invoice with full details.

**Response:**

```json
{
  "success": true,
  "invoice": {
    "id": "uuid",
    "invoice_number": "INV-001001",
    "patient": {...},
    "appointment": {...},
    "items": [...],
    "payments": [...],
    "status": "pending",
    "total_amount": 1000,
    "amount_paid": 0,
    "amount_due": 1000,
    ...
  }
}
```

---

#### PUT `/api/billing/invoices/[id]`

Update invoice details.

**Request Body:**

```json
{
  "status": "pending",
  "discount_amount": 100,
  "discount_reason": "Senior citizen discount",
  "notes": "Updated notes",
  "updated_by": "uuid"
}
```

---

#### DELETE `/api/billing/invoices/[id]`

Delete invoice (only if no completed payments).

**Response:**

```json
{
  "success": true
}
```

---

#### GET `/api/billing/invoices/[id]/pdf`

Generate and download PDF invoice.

**Response:** PDF file stream

---

### 2. Payments

#### GET `/api/billing/payments`

Fetch payments with filtering.

**Query Parameters:**

- `page`, `limit`: Pagination
- `invoiceId`: Filter by invoice
- `patientId`: Filter by patient
- `paymentMethod`: Filter by method
- `status`: Filter by status
- `startDate`, `endDate`: Date range
- `sortBy`, `sortOrder`: Sorting

---

#### POST `/api/billing/payments`

Record a new payment.

**Request Body:**

```json
{
  "invoice_id": "uuid",
  "patient_id": "uuid",
  "amount": 500,
  "payment_method": "cash",
  "status": "completed",
  "transaction_reference": "TXN123",
  "notes": "",
  "received_by": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "payment": {...},
  "invoice": {...}
}
```

---

### 3. Refunds

#### POST `/api/billing/refunds`

Process a refund.

**Request Body:**

```json
{
  "payment_id": "uuid",
  "amount": 500,
  "reason": "Service not satisfactory",
  "refunded_by": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "refund": {...}
}
```

---

### 4. Reports

#### GET `/api/billing/reports?type=dashboard`

Get billing dashboard statistics.

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalInvoices": 150,
    "pendingInvoices": 25,
    "paidInvoices": 120,
    "totalOutstanding": 50000,
    "todayRevenue": 5000,
    "monthRevenue": 150000
  }
}
```

---

#### GET `/api/billing/reports?type=revenue`

Get revenue report with date grouping.

**Query Parameters:**

- `startDate`, `endDate`: Date range
- `groupBy`: day/week/month

**Response:**

```json
{
  "success": true,
  "report": {
    "totalRevenue": 150000,
    "transactionCount": 120,
    "byPaymentMethod": {
      "cash": { "count": 50, "total": 50000 },
      "card": { "count": 40, "total": 60000 },
      "upi": { "count": 30, "total": 40000 }
    },
    "byDate": [
      { "date": "2026-01-01", "count": 10, "total": 10000 },
      ...
    ]
  }
}
```

---

#### GET `/api/billing/reports?type=outstanding`

Get outstanding invoices report.

**Response:**

```json
{
  "success": true,
  "invoices": [...],
  "totalOutstanding": 50000,
  "pagination": {...}
}
```

---

### 5. Settings

#### GET `/api/billing/settings`

Get all billing settings.

**Response:**

```json
{
  "success": true,
  "settings": {
    "invoice_prefix": "INV",
    "payment_due_days": 7,
    "default_tax_rate": 0,
    "tax_enabled": false,
    "auto_add_consultation_fee": true,
    ...
  },
  "rawSettings": [...]
}
```

---

#### PUT `/api/billing/settings`

Update billing settings (batch update).

**Request Body:**

```json
{
  "invoice_prefix": "ABEL",
  "payment_due_days": 14,
  "default_tax_rate": 5,
  "tax_enabled": true
}
```

---

## User Interfaces

### Admin Billing Interface

#### 1. Billing Dashboard (`/admin/billing`)

**Purpose:** Overview of billing activities and key metrics.

**Features:**

- **Statistics Cards:**

  - Total Invoices
  - Pending Invoices
  - Today's Revenue
  - Month Revenue
  - Total Outstanding
  - Paid Invoices

- **Recent Invoices List:**

  - Last 5 invoices with status
  - Quick view of patient and amount
  - Click to view details

- **Outstanding Invoices:**

  - Top 5 overdue/pending invoices
  - Sortable by due date
  - Quick payment action

- **Quick Actions:**
  - Create New Invoice
  - View All Invoices
  - Payment Reports
  - Billing Settings

---

#### 2. Invoice List (`/admin/billing/invoices`)

**Purpose:** Comprehensive invoice management.

**Features:**

- **Filters:**

  - Status filter (Draft, Pending, Partial, Paid, Cancelled, Refunded)
  - Date range filter
  - Patient search
  - Invoice number search

- **Table View:**

  - Invoice Number
  - Patient Name
  - Date
  - Amount
  - Paid Amount
  - Status Badge
  - Actions (View, Edit, Delete, PDF)

- **Bulk Actions:**

  - Export to CSV
  - Bulk status update
  - Send reminders

- **Pagination:**
  - Configurable items per page
  - Page navigation

---

#### 3. Create Invoice (`/admin/billing/invoices/create`)

**Purpose:** Manual invoice creation.

**Features:**

- **Patient Selection:**

  - Search and select patient
  - View patient details

- **Appointment Link (Optional):**

  - Link to existing appointment
  - Auto-fill consultation fee

- **Invoice Items:**

  - Add multiple line items
  - Item type selection
  - Description, quantity, unit price
  - Individual item discount and tax
  - Sort/reorder items
  - Remove items

- **Invoice Details:**

  - Invoice date
  - Due date
  - Overall discount
  - Notes (customer-visible)
  - Internal notes

- **Totals Preview:**

  - Real-time calculation
  - Subtotal, discount, tax, total display

- **Actions:**
  - Save as Draft
  - Save and Send (status: pending)
  - Cancel

---

#### 4. Invoice Detail/Edit (`/admin/billing/invoices/[id]`)

**Purpose:** View and manage single invoice.

**Features:**

- **Invoice Header:**

  - Invoice number, date, status
  - Patient information
  - Linked appointment (if any)

- **Line Items:**

  - Detailed breakdown
  - Edit items (if not paid)
  - Add new items

- **Payment History:**

  - All payments for this invoice
  - Payment method, date, amount
  - Transaction references

- **Actions:**

  - Edit invoice (if not paid/cancelled)
  - Record payment
  - Issue refund
  - Change status
  - Download PDF
  - Send to patient
  - Cancel invoice
  - Print

- **Financial Summary:**
  - Total amount
  - Amount paid
  - Amount due
  - Payment progress indicator

---

#### 5. Billing Settings (`/admin/billing/settings`)

**Purpose:** Configure billing module behavior.

**Settings Categories:**

**General Settings:**

- Invoice prefix
- Payment due days
- Currency
- Decimal places

**Tax Settings:**

- Enable/disable tax
- Default tax rate
- Tax label

**Automation:**

- Auto-add consultation fee
- Auto-send invoice on appointment completion

**Company Information:**

- Company name
- Address
- Tax ID
- Contact details
- Logo upload

**Terms & Conditions:**

- Default T&C text for invoices

---

### Patient Billing Interface

#### 1. Billing List (`/patient/billing`)

**Purpose:** View patient's own invoices.

**Features:**

- **Invoice Cards/List:**

  - Invoice number and date
  - Service description (from appointment)
  - Amount and status
  - Payment status
  - Actions: View, Pay, Download PDF

- **Filters:**

  - Status filter
  - Date range

- **Summary:**
  - Total billed
  - Total paid
  - Total due

---

#### 2. Invoice Detail (`/patient/billing/[id]`)

**Purpose:** View single invoice details.

**Features:**

- **Invoice Information:**

  - Invoice number, date, due date
  - Doctor/service details
  - Line item breakdown
  - Subtotal, tax, discount, total

- **Payment History:**

  - All payments made
  - Payment method and date

- **Actions:**

  - Pay Now (if unpaid)
  - Download PDF
  - Contact support

- **Payment Options (Future):**
  - Online payment gateway integration
  - Multiple payment method selection

---

## Configuration & Settings

### Default Billing Settings

The system comes pre-configured with the following defaults:

```json
{
  "invoice_prefix": "INV",
  "payment_due_days": 7,
  "default_tax_rate": 0,
  "tax_enabled": false,
  "auto_add_consultation_fee": true,
  "currency": "INR",
  "decimal_places": 2,
  "company_name": "Abel Wellness Clinic",
  "terms_and_conditions": "Payment due within specified due date..."
}
```

### How to Modify Settings

1. **Via Admin UI:**

   - Navigate to `/admin/billing/settings`
   - Update desired settings
   - Click Save

2. **Via API:**

   ```javascript
   PUT /api/billing/settings
   {
     "invoice_prefix": "CLINIC",
     "payment_due_days": 14
   }
   ```

3. **Via Server Action:**

   ```javascript
   import { updateBillingSettings } from "@/lib/actions/billing.actions";

   await updateBillingSettings({
     invoice_prefix: "CLINIC",
     payment_due_days: 14,
   });
   ```

### Setting Categories

#### General Settings

- **invoice_prefix:** Prefix for invoice numbers (e.g., "INV", "BILL", "CLINIC")
- **payment_due_days:** Number of days until payment is due (e.g., 7, 14, 30)
- **currency:** Currency code (e.g., "INR", "USD")
- **decimal_places:** Number of decimal places for amounts (typically 2)

#### Tax Settings

- **tax_enabled:** Boolean to enable/disable tax calculation
- **default_tax_rate:** Default tax percentage (e.g., 0, 5, 18)
- **tax_label:** Display label for tax (e.g., "GST", "VAT", "Sales Tax")

#### Automation Settings

- **auto_add_consultation_fee:** Automatically add doctor's consultation fee to invoice
- **auto_send_invoice:** Automatically send invoice notification on creation

#### Company Information

- **company_name:** Organization name
- **company_address:** Full address
- **company_tax_id:** Tax registration number
- **company_email:** Contact email
- **company_phone:** Contact phone
- **company_logo:** Logo URL for invoices

#### Terms & Conditions

- **terms_and_conditions:** Default terms text for all invoices

---

## Payment Processing

### Supported Payment Flows

#### 1. Manual Cash Payment (Current)

**Scenario:** Patient pays at clinic reception.

**Flow:**

1. Admin opens invoice in system
2. Clicks "Record Payment"
3. Selects payment method: Cash
4. Enters amount received
5. Adds optional transaction reference
6. Records staff member who received payment
7. Submits payment
8. System updates invoice status
9. Receipt printed/emailed to patient

**Code Example:**

```javascript
import { addPayment } from "@/lib/actions/billing.actions";

const result = await addPayment({
  invoice_id: "invoice-uuid",
  patient_id: "patient-uuid",
  amount: 500,
  payment_method: "cash",
  status: "completed",
  received_by: "admin-uuid",
  notes: "Paid at reception",
});
```

---

#### 2. Manual Card/UPI Payment (Current)

**Scenario:** Patient pays via card/UPI at clinic.

**Flow:**

1. Admin/Staff processes payment on POS/phone
2. Notes transaction reference number
3. Records payment in system with:
   - Payment method: card/upi
   - Transaction reference
   - Amount
4. System updates invoice

---

#### 3. Online Payment Gateway (Future Integration)

**Scenario:** Patient pays online via payment gateway.

**Planned Flow:**

1. Patient views invoice in portal
2. Clicks "Pay Online"
3. Redirected to payment gateway
4. Completes payment
5. Gateway redirects back with response
6. System verifies payment signature
7. Records payment with gateway details
8. Updates invoice status
9. Sends confirmation

**Required Fields:**

- `payment_gateway`: Gateway name (e.g., "razorpay", "stripe")
- `gateway_order_id`: Order ID from gateway
- `gateway_payment_id`: Payment ID from gateway
- `gateway_signature`: Signature for verification
- `gateway_response`: Full JSON response from gateway

---

### Payment Validation Rules

1. **Amount Validation:**

   - Amount must be > 0
   - Amount cannot exceed invoice amount due
   - Prevents overpayment

2. **Invoice Status Validation:**

   - Cannot pay cancelled invoices
   - Cannot pay fully paid invoices
   - Can pay pending/partial invoices

3. **Payment Method Validation:**

   - Must be one of allowed methods
   - Required field

4. **Concurrent Payment Protection:**
   - Uses database transactions
   - Prevents race conditions
   - Ensures amount_paid accuracy

---

### Payment Receipt Generation

After successful payment:

1. Receipt PDF generated
2. Contains:
   - Receipt number
   - Payment date and method
   - Invoice reference
   - Amount paid
   - Balance due (if any)
   - Company details
3. Emailed to patient
4. Available for print

---

## Reporting & Analytics

### Available Reports

#### 1. Dashboard Statistics

**Endpoint:** `/api/billing/reports?type=dashboard`

**Metrics:**

- Total invoices (all time)
- Pending invoices count
- Paid invoices count
- Total outstanding amount
- Today's revenue
- Current month revenue

**Use Cases:**

- Quick overview for management
- Daily revenue tracking
- Outstanding balance monitoring

---

#### 2. Revenue Report

**Endpoint:** `/api/billing/reports?type=revenue`

**Parameters:**

- `startDate`, `endDate`: Date range
- `groupBy`: day/week/month

**Includes:**

- Total revenue in period
- Transaction count
- Revenue by payment method
- Daily/weekly/monthly breakdown
- Payment method distribution

**Use Cases:**

- Monthly financial statements
- Payment method preference analysis
- Revenue trend analysis
- Forecasting

---

#### 3. Outstanding Invoices Report

**Endpoint:** `/api/billing/reports?type=outstanding`

**Shows:**

- All pending/partial invoices
- Amount due per invoice
- Total outstanding amount
- Sorted by due date
- Aging analysis (overdue days)

**Use Cases:**

- Collections follow-up
- Cash flow management
- Overdue invoice identification

---

#### 4. Payment History Report

**Endpoint:** `/api/billing/payments`

**Filters:**

- Date range
- Payment method
- Patient
- Status

**Includes:**

- All payments in period
- Payment method breakdown
- Daily collection summary
- Staff performance (who received)

**Use Cases:**

- Daily collection reconciliation
- Staff performance tracking
- Payment method analysis

---

### Report Export

**Supported Formats:**

- JSON (API response)
- CSV (for Excel/analysis)
- PDF (for printing/archiving)

**Implementation:**

```javascript
// Export payments to CSV
const payments = await getPayments({
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  limit: 1000,
});

// Convert to CSV and download
```

---

## Advanced Features

### 1. Invoice Numbering System

**Format:** `PREFIX-NNNNNN`

**Logic:**

- Prefix configurable (e.g., "INV", "BILL")
- Sequential numbering starting from 1001
- 6-digit zero-padded numbers
- Examples: INV-001001, INV-001002, CLINIC-001045

**Code:**

```javascript
async function generateInvoiceNumber() {
  const prefix = "INV"; // From settings
  const lastInvoice = await getLastInvoice();
  const lastNumber = parseLastNumber(lastInvoice);
  const nextNumber = lastNumber + 1;
  return `${prefix}-${String(nextNumber).padStart(6, "0")}`;
}
```

---

### 2. Tax Calculation System

**Supports:**

- Item-level tax rates
- Invoice-level default tax
- Tax-inclusive/exclusive pricing
- Multiple tax types (future)

**Calculation:**

```javascript
// Per item:
subtotal = quantity × unit_price
discountAmount = (subtotal × discount_percent) / 100
taxableAmount = subtotal - discountAmount
taxAmount = (taxableAmount × tax_rate) / 100
total = taxableAmount + taxAmount

// Invoice totals:
invoiceSubtotal = Σ(item.subtotal)
invoiceDiscount = overall_discount_amount
invoiceTaxableAmount = invoiceSubtotal - invoiceDiscount
invoiceTax = (invoiceTaxableAmount × invoice_tax_rate) / 100
invoiceTotal = invoiceTaxableAmount + invoiceTax
```

---

### 3. Discount System

**Types:**

- Item-level percentage discount
- Item-level fixed discount
- Invoice-level overall discount

**Tracking:**

- Discount amount recorded
- Discount reason required for audit
- Discount authorization tracking

**Use Cases:**

- Senior citizen discounts
- Staff discounts
- Promotional offers
- Loyalty rewards
- Financial hardship assistance

---

### 4. Due Date Management

**Calculation:**

```
due_date = invoice_date + payment_due_days
```

**Default:** 7 days (configurable)

**Overdue Detection:**

```javascript
const isOverdue =
  new Date() > new Date(invoice.due_date) && invoice.status !== "paid";
```

**Overdue Actions:**

- Highlight in UI (red badge)
- Automated reminders (future)
- Late fee calculation (future)
- Collections workflow (future)

---

### 5. Audit Trail

**Tracked Events:**

- Invoice creation (created_by)
- Invoice updates (updated_by)
- Status changes
- Payment receipts (received_by)
- Refunds (refunded_by)
- Timestamp on all actions

**Audit Log Access:**

- Via updated_at timestamps
- Via user ID relationships
- Activity reports (future feature)

---

## Security & Permissions

### Row Level Security (RLS)

All billing tables have RLS enabled for data isolation.

### Role-Based Access

#### Admin Role

- Full access to all billing features
- Create, edit, delete invoices
- Record payments
- Issue refunds
- View all reports
- Modify settings

#### Patient Role

- View own invoices only
- View own payment history
- Download own invoice PDFs
- Initiate payments (future)
- Cannot modify invoices

#### Doctor Role

- View invoices for own patients
- Read-only access
- Cannot modify invoices
- Cannot process payments

#### Pharmacist Role (Future)

- View invoices with medication items
- Update prescription item charges
- Limited payment recording

---

## Error Handling

### Common Error Scenarios

#### 1. Invoice Creation Errors

- **Patient not found:** "Patient not found"
- **Duplicate invoice:** "Invoice already exists for this appointment"
- **Invalid status:** "Invalid invoice status"
- **Missing required fields:** "Patient ID is required"

#### 2. Payment Errors

- **Overpayment:** "Payment amount exceeds amount due"
- **Invalid invoice:** "Cannot pay cancelled invoice"
- **Already paid:** "Invoice is already fully paid"
- **Invalid amount:** "Payment amount must be greater than 0"

#### 3. Refund Errors

- **Exceeds payment:** "Refund amount exceeds available payment amount"
- **Invalid payment:** "Can only refund completed payments"
- **Payment not found:** "Payment not found"

#### 4. Database Errors

- Foreign key violations
- Unique constraint violations
- Connection errors

**Error Response Format:**

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

---

## Future Enhancements

### Planned Features

1. **Online Payment Gateway Integration**

   - Razorpay/Stripe integration
   - Real-time payment processing
   - Automatic reconciliation

2. **Automated Invoicing**

   - Auto-send on appointment completion
   - Scheduled invoice generation
   - Recurring invoices (for subscriptions)

3. **Payment Reminders**

   - Email reminders before due date
   - SMS reminders
   - Overdue notifications

4. **Advanced Reporting**

   - Aging analysis (30/60/90 days)
   - Revenue forecasting
   - Payment trend analysis
   - Export to accounting software

5. **Multi-Currency Support**

   - Currency conversion
   - Exchange rate tracking

6. **Payment Plans**

   - Installment payments
   - EMI support
   - Partial payment scheduling

7. **Late Fees**

   - Automatic late fee calculation
   - Configurable late fee rules

8. **Credit Notes**

   - Issue credit notes for refunds
   - Credit note tracking
   - Credit balance management

9. **Batch Invoicing**

   - Generate multiple invoices at once
   - Bulk actions on invoices

10. **Integration with Inventory**
    - Auto-update stock on invoice payment
    - Link prescription items to inventory
    - Real-time pricing from inventory

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: Invoice totals not calculating correctly

**Solution:**

- Check tax_enabled setting
- Verify item-level tax rates
- Ensure discount amounts are correct
- Recalculate invoice totals:
  ```javascript
  await recalculateInvoice(invoiceId);
  ```

#### Issue: Payment not updating invoice status

**Solution:**

- Check invoice amount_paid vs total_amount
- Verify payment status is "completed"
- Check database triggers are active
- Manually refresh invoice status:
  ```javascript
  await updateInvoiceStatus(invoiceId, calculateStatus());
  ```

#### Issue: Cannot delete invoice

**Solution:**

- Check if invoice has completed payments
- Use cancel invoice instead of delete:
  ```javascript
  await updateInvoiceStatus(invoiceId, "cancelled");
  ```

#### Issue: Duplicate invoice numbers

**Solution:**

- Check invoice_prefix setting
- Verify invoice numbering logic
- Manually fix sequence if needed

#### Issue: Patient cannot see invoice

**Solution:**

- Verify RLS policies
- Check patient_id matches
- Ensure invoice status is not "draft"

---

## Database Maintenance

### Regular Maintenance Tasks

#### 1. Archive Old Invoices

- Archive paid invoices older than 1 year
- Move to archive table
- Maintain foreign key relationships

#### 2. Cleanup Orphaned Records

- Find and remove orphaned invoice items
- Check for payments without invoices
- Cleanup cancelled transactions

#### 3. Performance Optimization

- Create indexes on:
  - `invoices.patient_id`
  - `invoices.invoice_date`
  - `invoices.status`
  - `payments.invoice_id`
  - `payments.payment_date`
- Vacuum and analyze tables

#### 4. Backup Strategy

- Daily full backups
- Point-in-time recovery enabled
- Test restore procedures monthly

---

## Testing Checklist

### Feature Testing

- [ ] Invoice creation (manual)
- [ ] Invoice creation (from appointment)
- [ ] Add invoice items
- [ ] Edit invoice items
- [ ] Delete invoice items
- [ ] Apply discount
- [ ] Calculate tax
- [ ] Record cash payment
- [ ] Record card payment
- [ ] Record UPI payment
- [ ] Partial payment
- [ ] Full payment
- [ ] Invoice status transitions
- [ ] Issue refund
- [ ] Partial refund
- [ ] Cancel invoice
- [ ] Generate PDF invoice
- [ ] Dashboard statistics
- [ ] Revenue report
- [ ] Outstanding invoices report
- [ ] Payment history
- [ ] Patient billing view
- [ ] Billing settings update
- [ ] Invoice number generation
- [ ] Due date calculation
- [ ] Payment validation
- [ ] Refund validation
- [ ] Error handling
- [ ] RLS policies
- [ ] Role-based access

---

## API Usage Examples

### Example 1: Create Invoice with Items

```javascript
const response = await fetch("/api/billing/invoices", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    patient_id: "patient-uuid",
    appointment_id: "appointment-uuid",
    items: [
      {
        item_type: "consultation",
        description: "Homeopathic Consultation",
        quantity: 1,
        unit_price: 500,
      },
      {
        item_type: "medication",
        description: "Arnica Montana 30C",
        quantity: 2,
        unit_price: 150,
      },
    ],
    notes: "Follow-up in 2 weeks",
  }),
});

const { invoice, items } = await response.json();
console.log(`Invoice ${invoice.invoice_number} created`);
```

### Example 2: Record Payment

```javascript
const response = await fetch("/api/billing/payments", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    invoice_id: "invoice-uuid",
    patient_id: "patient-uuid",
    amount: 800,
    payment_method: "upi",
    transaction_reference: "UPI/123456789",
    received_by: "admin-uuid",
  }),
});

const { payment, invoice } = await response.json();
console.log(`Payment recorded. Invoice status: ${invoice.status}`);
```

### Example 3: Generate Revenue Report

```javascript
const response = await fetch(
  "/api/billing/reports?type=revenue&startDate=2026-01-01&endDate=2026-01-31&groupBy=day"
);

const { report } = await response.json();
console.log(`Total revenue: ₹${report.totalRevenue}`);
console.log(`Transactions: ${report.transactionCount}`);
```

---

## Support & Maintenance

### Contact Information

- **Technical Support:** admin@abelwellness.com
- **Bug Reports:** GitHub Issues
- **Feature Requests:** Product Team

### Documentation Updates

This documentation should be updated whenever:

- New features are added
- API endpoints change
- Database schema is modified
- Business logic is updated

**Last Updated:** January 8, 2026  
**Version:** 1.0  
**Author:** Abel Wellness Development Team

---

## Appendix

### A. Database Relationships Diagram

```
users ─┬─── invoices
       │      ├─── invoice_items
       │      ├─── payments
       │      │      └─── payment_refunds
       │      └─── [linked to appointments]
       │
       ├─── appointments
       │      └─── [consultation generates invoice]
       │
       └─── doctors
              └─── [consultation_fee used in invoices]
```

### B. Invoice Status Meanings

| Status    | Description              | Can Edit | Can Pay | Can Cancel |
| --------- | ------------------------ | -------- | ------- | ---------- |
| Draft     | Being prepared           | Yes      | No      | Yes        |
| Pending   | Issued, awaiting payment | Yes      | Yes     | Yes        |
| Partial   | Partially paid           | No       | Yes     | No         |
| Paid      | Fully paid               | No       | No      | No         |
| Cancelled | Cancelled                | No       | No      | No         |
| Refunded  | Fully refunded           | No       | No      | No         |

### C. Payment Method Codes

| Code          | Display Name  | Description                |
| ------------- | ------------- | -------------------------- |
| cash          | Cash          | Physical cash payment      |
| card          | Card          | Credit/Debit card          |
| upi           | UPI           | Unified Payments Interface |
| bank_transfer | Bank Transfer | Direct bank transfer       |
| online        | Online        | Online payment gateway     |
| cheque        | Cheque        | Cheque payment             |
| other         | Other         | Other payment methods      |

### D. Invoice Item Types

| Code         | Display Name | Usage                   |
| ------------ | ------------ | ----------------------- |
| consultation | Consultation | Doctor consultation fee |
| medication   | Medication   | Prescribed medications  |
| supply       | Supply       | Medical supplies        |
| procedure    | Procedure    | Medical procedures      |
| lab_test     | Lab Test     | Laboratory tests        |
| service      | Service      | Other services          |
| other        | Other        | Miscellaneous items     |

---

**End of Documentation**
