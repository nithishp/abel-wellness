# 📄 Billing System Enhancement – AI Agent Requirement Document

**Product:** Abel Wellness Clinic Management System
**Module:** Billing & Accounting
**Purpose:** Upgrade the existing billing system to enterprise-grade, audit-safe, clinic-ready billing with offline capability, pharmacy integration, accounting correctness, and homeopathy-specific workflows.

---

# 🎯 OBJECTIVES

The AI agent must extend the current billing system to support:

1. Offline billing
2. Pharmacy billing with stock deduction
3. Inventory integration
4. Credit note system
5. Case-wise treatment billing
6. GST-compliant tax structure
7. Immutable accounting ledger
8. Full audit logging
9. Quick billing workflow for reception

---

# 🧱 1. OFFLINE BILLING SYSTEM

## Functional Requirements

* The system must allow:

  * Creating bills
  * Recording payments
  * Printing bills
  * Even when internet is unavailable

* Offline bills must:

  * Be stored locally (IndexedDB / SQLite / LocalStorage)
  * Have a temporary ID: `OFF-<timestamp>-<deviceId>`
  * Be marked as `sync_status = PENDING`

* On internet reconnection:

  * Automatically sync to server
  * Server assigns real invoice number
  * Conflicts must be resolved safely (no duplicates)

## Database Changes

Add:

```sql
invoices:
- is_offline boolean
- offline_id varchar
- synced_at timestamptz
```

## UI

* Show badge: “Offline Bill”
* Show sync status: Pending / Synced / Failed

---

# 💊 2. PHARMACY BILLING

## Functional Requirements

* Allow:

  * Standalone pharmacy bills (without appointment)
  * Combined consultation + medicine bills

* Pharmacy billing screen must:

  * Search medicines from inventory
  * Auto-fetch price, batch, expiry
  * Prevent billing if stock insufficient

## New Bill Item Type

```text
item_type = medication
```

---

# 📦 3. INVENTORY STOCK DEDUCTION

## Rules

* Stock must be deducted:

  * Only when invoice is PAID
* On:

  * Refund → restore stock
  * Cancellation → restore stock

## Required Integration

* `invoice_items.reference_id` → `inventory_items.id`
* Maintain:

```sql
stock_movements:
- item_id
- batch_no
- quantity
- type: SALE | REFUND | ADJUSTMENT
- reference_invoice_id
```

---

# 🧾 4. CREDIT NOTE SYSTEM

## Accounting Rule

* Invoices must NEVER be edited after finalization.
* Refunds must generate:

```text
CREDIT NOTE
```

## New Tables

```sql
credit_notes:
- id
- credit_note_number
- invoice_id
- amount
- reason
- created_by
- created_at
```

## Behavior

* Refund flow:

  * Create credit note
  * Do NOT modify original invoice
  * Ledger entry should be reversed via credit note

---

# 🗂️ 5. CASE-WISE TREATMENT BILLING

## Concept

A **Treatment Case** spans multiple visits and months.

## New Tables

```sql
treatment_cases:
- id
- patient_id
- diagnosis
- start_date
- end_date
- status

invoices:
- treatment_case_id
```

## UI

* Show:

  * All invoices under a case
  * Total case cost
  * Total paid
  * Total due

---

# 🇮🇳 6. GST COMPLIANCE STRUCTURE

## Tax Model Upgrade

Replace:

```text
single tax_rate
```

With:

```sql
tax_components:
- cgst
- sgst
- igst
- hsn_code
```

## Invoice Item Must Store:

* HSN code
* Individual tax breakup
* Total tax

## Invoice PDF Must Show:

* CGST / SGST / IGST separately
* GST number of clinic

---

# 📒 7. IMMUTABLE LEDGER SYSTEM

## Rule

Once posted:

* No invoice
* No payment
* No refund
  can be deleted or edited.

## New Table

```sql
ledger_entries:
- id
- entry_type: INVOICE | PAYMENT | CREDIT_NOTE | ADJUSTMENT
- reference_id
- debit
- credit
- balance
- created_at
```

## All Financial Events Must:

* Append ledger entries
* Never modify existing rows

---

# 🕵️ 8. AUDIT LOG SYSTEM

## New Table

```sql
audit_logs:
- id
- entity_type
- entity_id
- action: CREATE | UPDATE | DELETE | STATUS_CHANGE
- old_value jsonb
- new_value jsonb
- performed_by
- performed_at
```

## Must Log:

* Invoice creation
* Invoice status change
* Payment add
* Refund / credit note
* Settings change
* Inventory stock change

---

# ⚡ 9. QUICK BILL MODE

## Purpose

For reception:

> Select patient → Select doctor → Enter amount → Pay → Print

## Features

* One-screen flow
* No invoice item editor
* Auto-add:

  * Consultation fee
  * Optional medicine quick add
* Direct payment capture

## Result

* Invoice created
* Payment recorded
* Receipt printed in < 15 seconds

---

# 🔒 SYSTEM-WIDE RULES

* All money-affecting actions must:

  * Create ledger entry
  * Create audit log
* Stock must never go negative
* Invoice numbers must remain sequential and gapless (except offline temp)

---

# 🧪 TESTING REQUIREMENTS

AI agent must create tests for:

* Offline → Online sync
* Stock deduction & rollback
* Credit note correctness
* Ledger balance correctness
* GST calculation accuracy
* Case-wise billing totals

---

# 📦 DELIVERABLES FROM AI AGENT

1. Database migrations
2. Backend logic updates
3. API endpoints
4. UI screens
5. PDF invoice format update
6. Ledger engine
7. Audit logger
8. Sync engine for offline bills
9. Test cases

---

# ⚠️ CRITICAL CONSTRAINTS

* Must NOT break existing invoices
* Must migrate existing data safely
* Must be backward compatible

---

# 🧠 FINAL INSTRUCTION TO AI AGENT

> Treat this system as a **financial system**, not a CRUD app.
> Data integrity, auditability, and correctness are higher priority than convenience.

