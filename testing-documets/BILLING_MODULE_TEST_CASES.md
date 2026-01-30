# Billing Module - Comprehensive Test Cases and Scenarios

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Module:** Billing & Accounting  
**Product:** Abel Wellness Clinic Management System

---

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Invoice Management Tests](#invoice-management-tests)
4. [Payment Processing Tests](#payment-processing-tests)
5. [Refund & Credit Note Tests](#refund--credit-note-tests)
6. [Offline Billing Tests](#offline-billing-tests)
7. [Pharmacy Billing Tests](#pharmacy-billing-tests)
8. [Inventory Integration Tests](#inventory-integration-tests)
9. [Treatment Case Tests](#treatment-case-tests)
10. [GST Compliance Tests](#gst-compliance-tests)
11. [Ledger System Tests](#ledger-system-tests)
12. [Audit Log Tests](#audit-log-tests)
13. [Quick Bill Mode Tests](#quick-bill-mode-tests)
14. [Reporting Tests](#reporting-tests)
15. [Security & Permissions Tests](#security--permissions-tests)
16. [Performance Tests](#performance-tests)
17. [Edge Cases & Error Handling](#edge-cases--error-handling)
18. [Integration Tests](#integration-tests)
19. [End-to-End Scenarios](#end-to-end-scenarios)

---

## Testing Overview

### Testing Approach

This testing documentation follows a comprehensive approach covering:

- **Functional Testing**: Verify all billing features work as specified
- **Integration Testing**: Ensure billing integrates with inventory, appointments, and user management
- **Data Integrity Testing**: Validate financial calculations and immutability constraints
- **Security Testing**: Verify role-based access and data protection
- **Performance Testing**: Ensure system handles load efficiently
- **Compliance Testing**: Validate GST and audit requirements

### Test Data Requirements

#### Test Users

- **Admin User**: admin@abelwellness.com (Full access)
- **Doctor User**: doctor@abelwellness.com (View access)
- **Pharmacist User**: pharmacist@abelwellness.com (Pharmacy billing access)
- **Patient Users**:
  - patient1@test.com
  - patient2@test.com
  - patient3@test.com

#### Test Inventory Items

- Arnica Montana 30C (Stock: 100 units, Price: ₹150)
- Belladonna 200C (Stock: 50 units, Price: ₹180)
- Calc Carb 1M (Stock: 30 units, Price: ₹250)

#### Test Configuration

- Default GST Rate: 18%
- CGST: 9%
- SGST: 9%
- Invoice Number Prefix: INV-
- Payment Due Days: 7

---

## Test Environment Setup

### TC-ENV-001: Database Initialization

**Priority:** Critical  
**Prerequisites:** Fresh database installation

**Test Steps:**

1. Run billing module migrations
2. Verify all tables are created:
   - invoices
   - invoice_items
   - payments
   - payment_refunds
   - credit_notes
   - credit_note_items
   - treatment_cases
   - ledger_entries
   - billing_audit_logs
   - billing_settings
3. Verify indexes are created
4. Verify RLS policies are active
5. Verify constraints are in place

**Expected Results:**

- All tables created successfully
- All foreign keys established
- All CHECK constraints active
- RLS policies enabled
- Default billing settings inserted

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-ENV-002: Seed Test Data

**Priority:** Critical  
**Prerequisites:** TC-ENV-001 passed

**Test Steps:**

1. Create test users (admin, doctor, pharmacist, 3 patients)
2. Create test inventory items
3. Create test appointments
4. Configure billing settings

**Expected Results:**

- All test users created with correct roles
- Inventory items with valid stock levels
- Appointments linked to patients and doctors
- Billing settings configured

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Invoice Management Tests

### TC-INV-001: Create Draft Invoice

**Priority:** Critical  
**Role:** Admin/Pharmacist  
**Prerequisites:** Patient exists

**Test Steps:**

1. Login as admin
2. Navigate to billing section
3. Select patient
4. Create new invoice
5. Add consultation fee (₹500)
6. Leave status as 'draft'
7. Save invoice

**Expected Results:**

- Invoice created with status: 'draft'
- Invoice number generated (e.g., INV-001001)
- Subtotal = ₹500
- Tax calculated correctly
- Total amount = Subtotal + Tax
- Amount due = Total amount
- Created timestamp recorded
- Created by = logged-in user ID

**Test Data:**

```json
{
  "patient_id": "patient1@test.com",
  "items": [
    {
      "item_type": "consultation",
      "description": "Initial Consultation",
      "quantity": 1,
      "unit_price": 500,
      "tax_rate": 18
    }
  ]
}
```

**Expected Calculations:**

- Subtotal: ₹500.00
- Tax (18%): ₹90.00
- Total: ₹590.00
- Amount Due: ₹590.00

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-002: Create Invoice with Multiple Items

**Priority:** High  
**Role:** Admin/Pharmacist

**Test Steps:**

1. Create new invoice
2. Add consultation fee: ₹500
3. Add medication: Arnica Montana 30C, Qty: 2, Price: ₹150 each
4. Add lab test: ₹800
5. Calculate totals
6. Set status to 'pending'
7. Save invoice

**Expected Results:**

- All items added successfully
- Individual item totals calculated correctly
- Overall subtotal: ₹1,600 (500 + 300 + 800)
- Tax calculated on subtotal
- Final total accurate
- Invoice status: 'pending'

**Test Data:**

```json
{
  "patient_id": "patient1@test.com",
  "items": [
    {
      "item_type": "consultation",
      "description": "Follow-up Consultation",
      "quantity": 1,
      "unit_price": 500,
      "tax_rate": 18
    },
    {
      "item_type": "medication",
      "description": "Arnica Montana 30C",
      "quantity": 2,
      "unit_price": 150,
      "tax_rate": 18,
      "reference_id": "arnica_montana_30c_id"
    },
    {
      "item_type": "lab_test",
      "description": "Complete Blood Count",
      "quantity": 1,
      "unit_price": 800,
      "tax_rate": 18
    }
  ]
}
```

**Expected Calculations:**

- Item 1 Total: ₹590.00 (500 + 90)
- Item 2 Total: ₹354.00 (300 + 54)
- Item 3 Total: ₹944.00 (800 + 144)
- Invoice Total: ₹1,888.00
- Amount Due: ₹1,888.00

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-003: Apply Discount to Invoice

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create invoice with total ₹1,000
2. Apply 10% discount
3. Add discount reason: "Senior Citizen Discount"
4. Recalculate totals
5. Save invoice

**Expected Results:**

- Discount amount: ₹100
- New subtotal: ₹900
- Tax calculated on discounted amount
- Discount reason stored
- Audit log created for discount

**Test Data:**

```json
{
  "subtotal": 1000,
  "discount_percent": 10,
  "discount_reason": "Senior Citizen Discount",
  "tax_rate": 18
}
```

**Expected Calculations:**

- Original Subtotal: ₹1,000.00
- Discount (10%): ₹100.00
- Discounted Subtotal: ₹900.00
- Tax (18%): ₹162.00
- Final Total: ₹1,062.00

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-004: Update Draft Invoice

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Create draft invoice
2. Add items
3. Save
4. Reopen invoice
5. Add additional item
6. Update quantities
7. Save changes

**Expected Results:**

- Draft invoice can be modified
- New items added successfully
- Quantities updated correctly
- Totals recalculated
- Updated timestamp changed
- Updated by field set
- Audit log entry created

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-005: Prevent Editing Finalized Invoice

**Priority:** Critical  
**Role:** Admin

**Test Steps:**

1. Create invoice with status 'paid'
2. Attempt to edit invoice items
3. Attempt to change amounts
4. Attempt to delete items

**Expected Results:**

- System prevents editing
- Error message: "Cannot modify finalized invoice"
- Original invoice unchanged
- No audit log entry for attempted edit

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-006: Invoice Number Sequence

**Priority:** Critical  
**Role:** Admin

**Test Steps:**

1. Check last invoice number (e.g., INV-001050)
2. Create new invoice
3. Verify invoice number is sequential (INV-001051)
4. Create multiple invoices simultaneously
5. Verify no duplicate numbers
6. Verify no gaps in sequence

**Expected Results:**

- Invoice numbers are sequential
- No duplicates
- No gaps in sequence
- Thread-safe number generation

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-007: Invoice with Custom Tax Rates

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Create invoice
2. Add item with 0% tax
3. Add item with 5% tax
4. Add item with 18% tax
5. Calculate totals

**Expected Results:**

- Each item taxed at specified rate
- Tax amounts calculated correctly per item
- Total tax = sum of all item taxes
- Tax breakdown visible

**Test Data:**

```json
{
  "items": [
    { "description": "Basic Service", "amount": 1000, "tax_rate": 0 },
    { "description": "Medicine", "amount": 500, "tax_rate": 5 },
    { "description": "Consultation", "amount": 1000, "tax_rate": 18 }
  ]
}
```

**Expected Calculations:**

- Item 1: ₹1,000 + ₹0 = ₹1,000
- Item 2: ₹500 + ₹25 = ₹525
- Item 3: ₹1,000 + ₹180 = ₹1,180
- Total: ₹2,705

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-008: Delete Draft Invoice

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Create draft invoice
2. Attempt to delete
3. Confirm deletion
4. Verify invoice removed

**Expected Results:**

- Draft invoices can be deleted
- Related invoice items deleted (cascade)
- Audit log entry created
- Invoice number gap is acceptable for drafts

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-009: Prevent Deleting Paid Invoice

**Priority:** Critical  
**Role:** Admin

**Test Steps:**

1. Create and pay invoice
2. Attempt to delete
3. Verify error message

**Expected Results:**

- System prevents deletion
- Error: "Cannot delete paid invoice. Use refund process instead."
- Invoice remains in database

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-010: Invoice Due Date Calculation

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Set billing setting: payment_due_days = 7
2. Create invoice on 2026-01-30
3. Verify due date = 2026-02-06
4. Create invoice with custom due date
5. Verify custom due date used

**Expected Results:**

- Default due date = invoice_date + payment_due_days
- Custom due date overrides default
- Due date stored correctly

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Payment Processing Tests

### TC-PAY-001: Record Cash Payment (Full)

**Priority:** Critical  
**Role:** Admin/Pharmacist

**Test Steps:**

1. Create invoice: Total ₹1,000
2. Record payment: ₹1,000 (Cash)
3. Save payment

**Expected Results:**

- Payment recorded successfully
- Payment method: 'cash'
- Payment status: 'completed'
- Invoice amount_paid = ₹1,000
- Invoice amount_due = ₹0
- Invoice status changed to 'paid'
- Invoice paid_at timestamp set
- Ledger entry created (credit)
- Audit log entry created

**Test Data:**

```json
{
  "invoice_id": "invoice_uuid",
  "amount": 1000,
  "payment_method": "cash",
  "payment_date": "2026-01-30T10:30:00Z",
  "received_by": "admin_user_id"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-002: Record Partial Payment

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create invoice: Total ₹2,000
2. Record payment: ₹1,200 (UPI)
3. Save payment
4. Verify invoice status

**Expected Results:**

- Payment recorded: ₹1,200
- Invoice amount_paid = ₹1,200
- Invoice amount_due = ₹800
- Invoice status = 'partial'
- Invoice NOT marked as paid
- paid_at remains NULL
- Ledger entry created for ₹1,200

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-003: Multiple Partial Payments

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create invoice: Total ₹3,000
2. Record payment 1: ₹1,000 (Cash)
3. Verify status = 'partial'
4. Record payment 2: ₹1,500 (Card)
5. Verify status = 'partial'
6. Record payment 3: ₹500 (UPI)
7. Verify status = 'paid'

**Expected Results:**

- After payment 1: amount_paid = ₹1,000, due = ₹2,000, status = 'partial'
- After payment 2: amount_paid = ₹2,500, due = ₹500, status = 'partial'
- After payment 3: amount_paid = ₹3,000, due = ₹0, status = 'paid'
- paid_at set after final payment
- Three separate payment records
- Three ledger entries

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-004: Online Payment Gateway Integration

**Priority:** High  
**Role:** Patient/Admin

**Test Steps:**

1. Create invoice
2. Initiate online payment
3. Receive gateway order ID
4. Complete payment on gateway
5. Receive payment confirmation webhook
6. Update payment status
7. Update invoice status

**Expected Results:**

- Payment gateway order created
- Gateway order ID stored
- Payment status initially 'pending'
- After webhook: status = 'completed'
- Gateway payment ID stored
- Gateway signature verified
- Full gateway response stored in JSONB field
- Invoice marked as paid

**Test Data:**

```json
{
  "payment_method": "online",
  "payment_gateway": "razorpay",
  "gateway_order_id": "order_xyz123",
  "gateway_payment_id": "pay_abc456",
  "gateway_signature": "signature_hash",
  "gateway_response": {
    "razorpay_order_id": "order_xyz123",
    "razorpay_payment_id": "pay_abc456",
    "razorpay_signature": "signature_hash"
  }
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-005: Failed Payment Handling

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create invoice
2. Initiate online payment
3. Payment fails at gateway
4. Receive failure webhook
5. Update payment status

**Expected Results:**

- Payment status = 'failed'
- Invoice status remains 'pending'
- amount_paid unchanged
- Gateway error response stored
- Notification sent to admin
- Patient can retry payment

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-006: Overpayment Handling

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Create invoice: Total ₹1,000
2. Attempt to record payment: ₹1,500
3. Verify system response

**Expected Results:**

- System prevents overpayment, OR
- System accepts and creates credit balance, OR
- System prompts for confirmation with note

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-007: Payment with Notes

**Priority:** Low  
**Role:** Admin

**Test Steps:**

1. Record payment
2. Add note: "Partial payment, balance to be paid next week"
3. Save payment

**Expected Results:**

- Payment recorded
- Notes stored
- Notes visible in payment details
- Notes included in audit log

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-008: Payment Date Validation

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Create invoice dated 2026-01-30
2. Attempt to record payment dated 2026-01-25 (before invoice)
3. Verify validation

**Expected Results:**

- System prevents payment date before invoice date, OR
- System shows warning but allows with reason

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-009: Cheque Payment Processing

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Record payment method: 'cheque'
2. Enter cheque number in transaction reference
3. Set payment status: 'pending'
4. After cheque clears, update status to 'completed'

**Expected Results:**

- Cheque payment recorded with pending status
- Cheque number stored
- Invoice status remains 'pending'
- After clearing: invoice status = 'paid'
- Audit trail shows status change

**Test Data:**

```json
{
  "payment_method": "cheque",
  "transaction_reference": "CHQ123456",
  "status": "pending",
  "notes": "HDFC Bank cheque"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PAY-010: Bank Transfer Payment

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Record payment method: 'bank_transfer'
2. Enter transaction reference (UTR number)
3. Mark as completed
4. Save payment

**Expected Results:**

- Payment recorded
- UTR stored in transaction_reference
- Payment status: 'completed'
- Invoice updated

**Test Data:**

```json
{
  "payment_method": "bank_transfer",
  "transaction_reference": "UTR2026013012345678",
  "status": "completed"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Refund & Credit Note Tests

### TC-REF-001: Full Refund with Credit Note

**Priority:** Critical  
**Role:** Admin

**Test Steps:**

1. Create and pay invoice: ₹1,000
2. Initiate refund: Full amount
3. Enter refund reason: "Service cancelled"
4. Process refund

**Expected Results:**

- Credit note created
- Credit note number generated (e.g., CN-001001)
- Credit note amount = ₹1,000
- Credit note linked to original invoice
- Original invoice status changed to 'refunded'
- Refund entry created in payment_refunds table
- Ledger entry created (debit to reverse credit)
- If pharmacy items: stock restored
- Original invoice data UNCHANGED
- Audit log entries created
- Patient notified

**Test Data:**

```json
{
  "invoice_id": "invoice_uuid",
  "refund_amount": 1000,
  "reason": "Service cancelled by patient",
  "refund_method": "cash"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-REF-002: Partial Refund with Credit Note

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create and pay invoice: ₹2,000
2. Initiate partial refund: ₹800
3. Enter reason: "One service not provided"
4. Process refund

**Expected Results:**

- Credit note created for ₹800
- Original invoice status remains 'paid'
- New field invoice.refunded_amount = ₹800
- Net invoice value = ₹1,200
- Ledger entry for ₹800 debit
- Audit log created

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-REF-003: Refund with Stock Restoration

**Priority:** Critical  
**Role:** Admin

**Test Steps:**

1. Create pharmacy invoice with medications
   - Arnica Montana 30C: 2 units (stock reduced from 100 to 98)
2. Complete payment
3. Verify stock: 98 units
4. Process full refund
5. Verify stock restored: 100 units

**Expected Results:**

- Credit note created
- Stock movements recorded:
  - Type: SALE, Quantity: -2 (when paid)
  - Type: REFUND, Quantity: +2 (when refunded)
- Final stock: 100 units
- Batch information maintained
- Audit trail complete

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-REF-004: Prevent Refund Exceeding Invoice Amount

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Invoice total: ₹1,000
2. Already refunded: ₹600
3. Attempt refund: ₹500 (would exceed ₹1,000)
4. Verify error

**Expected Results:**

- System prevents refund
- Error: "Refund amount exceeds remaining invoice amount"
- Max refund allowed: ₹400
- No credit note created

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-REF-005: Gateway Refund Processing

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Invoice paid via online gateway (₹2,000)
2. Initiate refund
3. System calls gateway refund API
4. Gateway processes refund
5. Update refund status

**Expected Results:**

- Gateway refund initiated
- Gateway refund ID stored
- Refund status: 'pending' initially
- After gateway confirmation: status = 'completed'
- Gateway response stored
- Timeline: Refund may take 5-7 business days
- Patient notified of timeline

**Test Data:**

```json
{
  "payment_id": "payment_uuid",
  "gateway_payment_id": "pay_abc456",
  "refund_amount": 2000,
  "gateway_response": {
    "razorpay_refund_id": "rfnd_xyz789",
    "status": "processed"
  }
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-REF-006: Credit Note Number Sequence

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Process multiple refunds
2. Verify credit note numbers are sequential
3. Verify format: CN-XXXXXX

**Expected Results:**

- Sequential numbering
- No duplicates
- No gaps
- Separate sequence from invoices

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-REF-007: Multiple Partial Refunds

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Invoice: ₹3,000 (paid)
2. Refund 1: ₹1,000
3. Refund 2: ₹500
4. Refund 3: ₹1,500
5. Verify total refunded = ₹3,000

**Expected Results:**

- Three credit notes created
- Total refunds tracked correctly
- Invoice status = 'refunded' after total refund
- All refunds linked to invoice
- Ledger entries balanced

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-REF-008: Refund on Partially Paid Invoice

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Invoice: ₹2,000
2. Payment: ₹1,200 (partial)
3. Attempt refund: ₹500
4. Verify behavior

**Expected Results:**

- Refund allowed (refunding part of payment)
- Credit note created
- amount_paid reduced to ₹700
- amount_due remains ₹800
- OR system prevents refund until fully paid

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Offline Billing Tests

### TC-OFF-001: Create Offline Invoice

**Priority:** Critical  
**Role:** Admin/Pharmacist

**Test Steps:**

1. Disconnect internet
2. Verify offline mode indicator
3. Create new invoice
4. Add items
5. Complete payment
6. Save invoice

**Expected Results:**

- Invoice created with offline ID: OFF-{timestamp}-{deviceId}
- Invoice stored in IndexedDB/LocalStorage
- is_offline flag = true
- sync_status = 'PENDING'
- Invoice number temporary
- Receipt printed with "Offline - To be synced" note
- All data captured correctly

**Test Data:**

```json
{
  "offline_id": "OFF-1738252800000-DEVICE001",
  "is_offline": true,
  "sync_status": "PENDING",
  "patient_id": "patient1_id",
  "total_amount": 1000,
  "created_at_local": "2026-01-30T10:30:00"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-OFF-002: Sync Offline Invoice to Server

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Create 3 offline invoices
2. Reconnect to internet
3. Trigger sync process
4. Monitor sync status

**Expected Results:**

- Sync process detects pending invoices
- Invoices sent to server sequentially
- Server assigns real invoice numbers
- Server updates invoice records
- Local records updated with server IDs
- sync_status = 'SYNCED'
- synced_at timestamp set
- Offline ID preserved for reference
- No data loss
- No duplicates created

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-OFF-003: Conflict Resolution - Duplicate Patient Invoice

**Priority:** High  
**Role:** System

**Test Steps:**

1. Create offline invoice for Patient A
2. While offline, server creates invoice for same patient (different device)
3. Sync offline invoice
4. Verify conflict resolution

**Expected Results:**

- System detects potential duplicate
- Conflict resolution strategy applied:
  - Check timestamps
  - Check invoice items
  - If truly duplicate: merge or flag for review
  - If different: both retained
- Admin notified of conflict
- Audit log entry created

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-OFF-004: Failed Sync Retry

**Priority:** High  
**Role:** System

**Test Steps:**

1. Create offline invoices
2. Attempt sync
3. Simulate network error during sync
4. Verify retry mechanism

**Expected Results:**

- Sync fails gracefully
- sync_status = 'FAILED'
- Error message logged
- Retry attempted after interval
- Max retry attempts: 5
- After max retries: admin notification
- Manual sync option available

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-OFF-005: Offline Invoice Number Sequence

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Create offline invoices on Device A: OFF-001, OFF-002
2. Create offline invoices on Device B: OFF-003, OFF-004
3. Sync both devices
4. Verify server invoice numbers are sequential

**Expected Results:**

- Server assigns: INV-001001, INV-001002, INV-001003, INV-001004
- Sequential order maintained based on sync order
- No gaps in server sequence
- Offline IDs preserved for tracking

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-OFF-006: Offline Payment Recording

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create offline invoice
2. Record cash payment offline
3. Sync to server
4. Verify payment synced

**Expected Results:**

- Payment recorded offline
- Linked to offline invoice ID
- After sync: payment linked to server invoice ID
- Payment data complete
- Ledger entry created on server

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-OFF-007: Offline Mode Indicator

**Priority:** Low  
**Role:** User

**Test Steps:**

1. Disconnect internet
2. Check UI for offline indicator
3. Reconnect
4. Verify indicator disappears

**Expected Results:**

- Clear "Offline Mode" badge visible
- Sync status shown
- Pending sync count displayed
- Color coding: Yellow for offline, Green for online

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Pharmacy Billing Tests

### TC-PHR-001: Standalone Pharmacy Bill

**Priority:** High  
**Role:** Pharmacist

**Test Steps:**

1. Login as pharmacist
2. Create pharmacy bill (no appointment)
3. Search and add medicine: Arnica Montana 30C
4. Set quantity: 2
5. Verify stock availability
6. Complete billing

**Expected Results:**

- Medicine search works
- Auto-populated: price, batch, expiry
- Stock check: Available qty shown
- Invoice item_type = 'medication'
- Reference to inventory item stored
- Total calculated correctly
- No stock deduction until paid

**Test Data:**

```json
{
  "item_type": "medication",
  "reference_id": "arnica_id",
  "description": "Arnica Montana 30C",
  "quantity": 2,
  "unit_price": 150,
  "batch_no": "BATCH123",
  "expiry_date": "2027-12-31"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PHR-002: Combined Consultation + Medicine Bill

**Priority:** High  
**Role:** Pharmacist

**Test Steps:**

1. Select appointment
2. Add consultation fee: ₹500
3. Add medicines from prescription
4. Calculate total
5. Save invoice

**Expected Results:**

- Consultation item added
- Medicine items added
- Total = consultation + medicines + tax
- Appointment linked to invoice
- Prescription items referenced

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PHR-003: Insufficient Stock Prevention

**Priority:** Critical  
**Role:** Pharmacist

**Test Steps:**

1. Medicine stock: Belladonna 200C = 5 units
2. Create pharmacy bill
3. Attempt to add 10 units
4. Verify system response

**Expected Results:**

- System prevents adding to bill
- Error message: "Insufficient stock. Available: 5 units"
- Suggestion to reduce quantity or check alternative stock
- Bill not created with insufficient stock

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PHR-004: Batch Selection for Medicine

**Priority:** Medium  
**Role:** Pharmacist

**Test Steps:**

1. Medicine has multiple batches:
   - Batch A: 20 units, Expiry: 2026-06-30
   - Batch B: 50 units, Expiry: 2027-12-31
2. Add medicine to bill
3. Select batch
4. Verify batch details shown

**Expected Results:**

- Batch dropdown/selection available
- Shows: Batch number, Expiry date, Available quantity
- Default: Nearest expiry batch (FEFO - First Expiry First Out)
- Selected batch stored in invoice item

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PHR-005: Expired Medicine Prevention

**Priority:** Critical  
**Role:** Pharmacist

**Test Steps:**

1. Medicine batch with expiry: 2025-12-31 (expired)
2. Attempt to add to bill
3. Verify system prevents

**Expected Results:**

- System blocks expired medicines
- Warning: "Cannot bill expired medicine"
- Expired batches not shown in selection
- Inventory alert for expired stock

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PHR-006: Medicine Search and Auto-complete

**Priority:** Medium  
**Role:** Pharmacist

**Test Steps:**

1. Start typing medicine name: "Arn"
2. Verify auto-complete suggestions
3. Select from suggestions
4. Verify item details populated

**Expected Results:**

- Search returns relevant results
- Shows: Name, Potency, Stock, Price
- Selection auto-fills invoice item
- Fast, responsive search

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Inventory Integration Tests

### TC-INV-001: Stock Deduction on Payment

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Initial stock: Arnica = 100 units
2. Create pharmacy invoice: 5 units
3. Invoice status: 'pending' (unpaid)
4. Verify stock: Still 100
5. Complete payment
6. Verify stock: Now 95

**Expected Results:**

- Stock not deducted when invoice created
- Stock deducted ONLY when invoice status = 'paid'
- Stock movement record created:
  - Type: SALE
  - Quantity: -5
  - Reference: invoice_id
  - Timestamp: payment completion time
- Accurate stock count

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-002: Stock Restoration on Refund

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Stock: 100 units
2. Sell 10 units (paid invoice)
3. Stock: 90 units
4. Process refund
5. Verify stock: 100 units

**Expected Results:**

- Refund triggers stock restoration
- Stock movement record:
  - Type: REFUND
  - Quantity: +10
  - Reference: credit_note_id
- Stock restored to original batch
- Batch expiry not changed

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-003: Stock Restoration on Cancelled Invoice

**Priority:** High  
**Role:** System

**Test Steps:**

1. Create and pay invoice: 7 units
2. Stock reduced: 93 units
3. Cancel invoice
4. Verify stock: 100 units

**Expected Results:**

- Cancellation restores stock
- Stock movement: Type = REFUND/CANCELLATION
- Invoice marked as cancelled
- Payment handling as per policy (refund or credit)

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-004: Prevent Negative Stock

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Stock: 5 units
2. Create invoice: 3 units (paid, stock: 2)
3. Attempt to create another invoice: 5 units
4. Verify prevention

**Expected Results:**

- System checks available stock before sale
- Error: "Insufficient stock"
- Second invoice not created
- Stock integrity maintained

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-005: Multi-Item Stock Deduction

**Priority:** High  
**Role:** System

**Test Steps:**

1. Invoice with 3 medicines:
   - Medicine A: 2 units
   - Medicine B: 5 units
   - Medicine C: 1 unit
2. Pay invoice
3. Verify all stocks deducted correctly

**Expected Results:**

- All items stock deducted atomically
- If any item insufficient: entire transaction fails
- Stock movements for all items created
- Batch-wise deduction tracked

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-006: Stock Alert on Low Inventory

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Medicine minimum stock level: 10 units
2. Current stock: 12 units
3. Create invoice: 5 units
4. Pay invoice
5. New stock: 7 units
6. Verify alert triggered

**Expected Results:**

- Stock drops below minimum
- Alert notification sent to pharmacist/admin
- Medicine flagged in inventory as "Low Stock"
- Reorder suggestion displayed

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INV-007: Batch-wise Stock Deduction (FEFO)

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Medicine with batches:
   - Batch A: 30 units, Expiry: 2026-03-31
   - Batch B: 70 units, Expiry: 2027-12-31
2. Sell 25 units (no batch specified)
3. Verify deduction from Batch A first

**Expected Results:**

- System auto-selects batch with nearest expiry (FEFO)
- Batch A: 5 units remaining
- Batch B: 70 units (unchanged)
- Stock movement specifies batch

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Treatment Case Tests

### TC-TRT-001: Create Treatment Case

**Priority:** High  
**Role:** Doctor/Admin

**Test Steps:**

1. Login as doctor
2. Create new treatment case
3. Set patient
4. Set diagnosis: "Chronic Migraine"
5. Set start date
6. Save case

**Expected Results:**

- Case created successfully
- Unique case ID generated
- Status: 'active'
- Patient linked
- Created by doctor recorded
- Timeline started

**Test Data:**

```json
{
  "patient_id": "patient1_id",
  "diagnosis": "Chronic Migraine",
  "start_date": "2026-01-30",
  "status": "active",
  "created_by": "doctor_id"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-TRT-002: Link Invoice to Treatment Case

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create treatment case
2. Create invoice
3. Link invoice to case via treatment_case_id
4. View case details
5. Verify invoice appears in case

**Expected Results:**

- Invoice linked to case
- Invoice shown in case timeline
- Case financials updated
- Multiple invoices can link to same case

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-TRT-003: Case Financial Summary

**Priority:** High  
**Role:** Doctor/Admin

**Test Steps:**

1. Treatment case with 5 visits
2. Each visit has invoice
3. Invoices:
   - Visit 1: ₹500 (paid)
   - Visit 2: ₹700 (paid)
   - Visit 3: ₹600 (partial: ₹400)
   - Visit 4: ₹500 (pending)
   - Visit 5: ₹800 (paid)
4. View case financial summary

**Expected Results:**

- Total case cost: ₹3,100
- Total paid: ₹2,400
- Total due: ₹700
- Payment breakdown by invoice
- Payment history timeline
- Clear visual indicators

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-TRT-004: Complete Treatment Case

**Priority:** Medium  
**Role:** Doctor

**Test Steps:**

1. Active treatment case
2. Mark case as completed
3. Set end date
4. Add completion notes

**Expected Results:**

- Case status changed to 'completed'
- End date recorded
- Completion notes saved
- Case locked from further invoices (or warning shown)
- Case appears in completed cases list

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-TRT-005: Case-wise Reporting

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Generate report: "Treatment Cases - January 2026"
2. Verify report includes:
   - All active cases
   - Financial summary per case
   - Treatment duration
   - Payment status

**Expected Results:**

- Comprehensive case listing
- Accurate financial calculations
- Exportable to PDF/Excel
- Filterable by status, doctor, date range

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## GST Compliance Tests

### TC-GST-001: CGST/SGST Calculation (Intra-State)

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Set clinic state: Maharashtra
2. Set patient state: Maharashtra (same state)
3. Create invoice: ₹1,000 subtotal
4. GST rate: 18%
5. Verify tax breakdown

**Expected Results:**

- CGST (9%): ₹90
- SGST (9%): ₹90
- IGST: ₹0
- Total Tax: ₹180
- Total Amount: ₹1,180
- Invoice PDF shows breakdown

**Test Data:**

```json
{
  "clinic_state": "Maharashtra",
  "patient_state": "Maharashtra",
  "subtotal": 1000,
  "gst_rate": 18,
  "cgst": 90,
  "sgst": 90,
  "igst": 0
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-GST-002: IGST Calculation (Inter-State)

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Set clinic state: Maharashtra
2. Set patient state: Karnataka (different state)
3. Create invoice: ₹1,000 subtotal
4. GST rate: 18%
5. Verify tax breakdown

**Expected Results:**

- CGST: ₹0
- SGST: ₹0
- IGST (18%): ₹180
- Total Tax: ₹180
- Total Amount: ₹1,180
- Invoice PDF shows IGST

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-GST-003: HSN Code on Invoice Items

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Configure medicine with HSN code: 3003
2. Add to invoice
3. Generate invoice PDF
4. Verify HSN code displayed

**Expected Results:**

- HSN code stored in invoice_items
- HSN code shown on invoice PDF
- HSN code used for tax categorization

**Test Data:**

```json
{
  "item": "Arnica Montana 30C",
  "hsn_code": "3003",
  "description": "Medicaments consisting of two or more constituents"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-GST-004: GST Summary Report

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Generate GST report for January 2026
2. Verify report includes:
   - Total sales
   - CGST collected
   - SGST collected
   - IGST collected
   - Total GST
3. Export to Excel

**Expected Results:**

- Accurate GST calculations
- Breakdown by tax type
- Filterable by date range
- Exportable format
- Compliant with GST filing requirements

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-GST-005: Multiple GST Rates on Single Invoice

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Invoice with items:
   - Item A: ₹1,000 @ 18% GST
   - Item B: ₹500 @ 5% GST
   - Item C: ₹200 @ 0% GST
2. Calculate totals

**Expected Results:**

- Item A tax: ₹180
- Item B tax: ₹25
- Item C tax: ₹0
- Total tax: ₹205
- Total: ₹1,905
- Tax breakdown shown on invoice

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-GST-006: Clinic GSTIN Display

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Configure clinic GSTIN: 27AABCU9603R1ZM
2. Generate invoice
3. Verify GSTIN on invoice

**Expected Results:**

- GSTIN displayed on invoice header
- Format validated (15 characters)
- Mandatory for GST compliance

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Ledger System Tests

### TC-LED-001: Ledger Entry on Invoice Creation

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Create invoice: ₹1,000
2. Verify ledger entry created

**Expected Results:**

- Ledger entry created
- Entry type: 'INVOICE'
- Reference ID: invoice_id
- Debit: ₹1,000 (accounts receivable)
- Credit: ₹0
- Running balance updated

**Test Data:**

```json
{
  "entry_type": "INVOICE",
  "reference_id": "invoice_uuid",
  "reference_number": "INV-001001",
  "debit": 1000,
  "credit": 0,
  "description": "Invoice created for Patient Name"
}
```

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-LED-002: Ledger Entry on Payment

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Record payment: ₹1,000 for invoice
2. Verify ledger entry created

**Expected Results:**

- Ledger entry created
- Entry type: 'PAYMENT'
- Reference ID: payment_id
- Debit: ₹0
- Credit: ₹1,000 (payment received)
- Running balance updated

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-LED-003: Ledger Entry on Credit Note

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Process refund: ₹500
2. Credit note created
3. Verify ledger entry

**Expected Results:**

- Ledger entry created
- Entry type: 'CREDIT_NOTE'
- Reference ID: credit_note_id
- Debit: ₹500 (reversal)
- Credit: ₹0
- Description includes credit note number and reason

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-LED-004: Ledger Balance Accuracy

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Create multiple transactions:
   - Invoice 1: ₹1,000 (debit)
   - Payment 1: ₹1,000 (credit)
   - Invoice 2: ₹2,000 (debit)
   - Payment 2: ₹1,200 (credit)
   - Credit Note: ₹500 (debit reversal)
2. Calculate running balance

**Expected Results:**

- Entry 1: Balance = ₹1,000
- Entry 2: Balance = ₹0
- Entry 3: Balance = ₹2,000
- Entry 4: Balance = ₹800
- Entry 5: Balance = ₹1,300
- Final balance accurate

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-LED-005: Ledger Immutability

**Priority:** Critical  
**Role:** System

**Test Steps:**

1. Create ledger entry
2. Attempt to UPDATE entry
3. Attempt to DELETE entry
4. Verify prevention

**Expected Results:**

- Database prevents UPDATE on ledger_entries
- Database prevents DELETE on ledger_entries
- Constraint error thrown
- Only INSERT allowed
- Corrections made via new reversing entries

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-LED-006: Ledger Report Generation

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Generate ledger report for date range
2. Verify all entries listed
3. Verify running balance shown
4. Export to PDF/Excel

**Expected Results:**

- Complete transaction history
- Chronological order
- Running balance column
- Entry types clearly indicated
- Reference numbers linked
- Exportable formats

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Audit Log Tests

### TC-AUD-001: Audit Log on Invoice Creation

**Priority:** High  
**Role:** System

**Test Steps:**

1. Create invoice
2. Query audit log
3. Verify entry

**Expected Results:**

- Audit log entry created
- Entity type: 'invoice'
- Entity ID: invoice_id
- Action: 'CREATE'
- old_value: null
- new_value: {invoice data}
- performed_by: user_id
- performed_at: timestamp
- IP address captured (if applicable)

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-AUD-002: Audit Log on Invoice Status Change

**Priority:** High  
**Role:** System

**Test Steps:**

1. Change invoice status: 'pending' → 'paid'
2. Query audit log

**Expected Results:**

- Audit entry created
- Action: 'STATUS_CHANGE'
- old_value: {"status": "pending"}
- new_value: {"status": "paid"}
- Timestamp captured
- User who made change recorded

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-AUD-003: Audit Log on Payment

**Priority:** High  
**Role:** System

**Test Steps:**

1. Record payment
2. Query audit log

**Expected Results:**

- Audit entry for payment creation
- Entity type: 'payment'
- Action: 'CREATE'
- Full payment data in new_value
- Audit entry for related invoice update

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-AUD-004: Audit Log on Refund

**Priority:** High  
**Role:** System

**Test Steps:**

1. Process refund
2. Query audit log

**Expected Results:**

- Multiple audit entries:
  1. Credit note creation
  2. Refund entry creation
  3. Invoice status change
  4. Stock restoration (if applicable)
- Complete audit trail
- Reason for refund captured

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-AUD-005: Audit Log on Settings Change

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Update billing settings: tax_rate 18% → 12%
2. Query audit log

**Expected Results:**

- Audit entry created
- Entity type: 'billing_settings'
- Action: 'UPDATE'
- old_value: {"tax_rate": 18}
- new_value: {"tax_rate": 12}
- Admin who changed recorded

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-AUD-006: Audit Trail View

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Open invoice details
2. View audit trail tab
3. Verify all changes listed chronologically

**Expected Results:**

- Complete history visible
- User-friendly display
- Timestamps in local timezone
- Actions color-coded
- Filterable by action type

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Quick Bill Mode Tests

### TC-QBL-001: Quick Bill Flow - Cash Payment

**Priority:** High  
**Role:** Receptionist/Admin

**Test Steps:**

1. Access Quick Bill mode
2. Select patient (search/select)
3. Select doctor
4. Enter amount: ₹500
5. Select payment method: Cash
6. Click "Complete & Print"
7. Measure time taken

**Expected Results:**

- Patient selection: Fast autocomplete
- Doctor selection: Dropdown
- Amount entry: Single field
- Payment captured immediately
- Invoice auto-created (consultation type)
- Payment recorded (status: completed)
- Receipt printed automatically
- Total time: < 15 seconds
- Invoice number generated
- All data accurate

**Actual Results:** **********\_**********

**Time Taken:** **\_\_** seconds

**Status:** [ ] Pass [ ] Fail

---

### TC-QBL-002: Quick Bill with Medicine Add

**Priority:** High  
**Role:** Receptionist

**Test Steps:**

1. Start Quick Bill
2. Select patient & doctor
3. Enter consultation: ₹500
4. Click "Add Medicine"
5. Select medicine from inventory
6. Set quantity
7. Complete payment
8. Print receipt

**Expected Results:**

- Medicine quick-add interface
- Stock check performed
- Medicine auto-added to invoice
- Total calculated: Consultation + Medicine
- Single payment for both
- Receipt shows itemized bill
- Stock deducted after payment

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-QBL-003: Quick Bill - No Item Editing

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Access Quick Bill mode
2. Verify no detailed invoice item editor visible
3. Verify simplified interface

**Expected Results:**

- No invoice_items table shown
- No tax rate editor
- No discount options (or minimal)
- Focus on speed
- For complex invoices: redirect to full billing mode

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-QBL-004: Quick Bill Error Handling

**Priority:** Medium  
**Role:** Receptionist

**Test Steps:**

1. Start Quick Bill
2. Skip selecting patient
3. Attempt to complete
4. Verify error

**Expected Results:**

- Validation errors shown clearly
- Required fields highlighted
- Error: "Please select a patient"
- Form not submitted
- User can correct and retry

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Reporting Tests

### TC-RPT-001: Daily Sales Report

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Generate report: Daily Sales for 2026-01-30
2. Verify report includes:
   - Total invoices created
   - Total sales amount
   - Total payments received
   - Total pending
   - Payment method breakdown
3. Export to PDF

**Expected Results:**

- Accurate calculations
- All invoices for the day included
- Breakdown by payment method
- Summary totals correct
- Exportable to PDF/Excel
- Printable format

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-RPT-002: Monthly Revenue Report

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Generate report: Monthly Revenue - January 2026
2. Verify includes:
   - Total revenue
   - Day-wise breakdown
   - Payment status breakdown
   - Refunds/Credit notes
   - Net revenue

**Expected Results:**

- Complete monthly view
- Daily trend visible
- Refunds deducted from revenue
- Net revenue = Gross - Refunds
- Graphical representation available
- Comparative data (vs previous month)

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-RPT-003: Outstanding Payments Report

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Generate report: Outstanding Payments
2. Filter: Overdue (due date passed)
3. Verify report shows:
   - Invoice number
   - Patient name
   - Amount due
   - Due date
   - Days overdue

**Expected Results:**

- All pending/partial invoices listed
- Sorted by due date (oldest first)
- Days overdue calculated
- Contact information for follow-up
- Exportable for collection calls
- Total outstanding amount

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-RPT-004: Payment Method Analysis

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Generate report: Payment Method Analysis - January 2026
2. Verify breakdown:
   - Cash: Amount & Count
   - Card: Amount & Count
   - UPI: Amount & Count
   - Bank Transfer: Amount & Count
   - Online: Amount & Count

**Expected Results:**

- All payment methods listed
- Amount and transaction count for each
- Percentage distribution
- Pie chart visualization
- Trend over time

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-RPT-005: Patient-wise Billing Report

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Select patient
2. Generate billing history report
3. Verify shows:
   - All invoices
   - Payment history
   - Outstanding balance
   - Total spent

**Expected Results:**

- Complete patient billing history
- Chronological order
- Payment timeline
- Current balance
- Treatment case linkage
- Exportable/Printable

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-RPT-006: Doctor-wise Revenue Report

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Generate report: Doctor-wise Revenue - January 2026
2. Verify includes:
   - Revenue per doctor
   - Number of consultations
   - Average billing per consultation

**Expected Results:**

- All doctors listed
- Accurate revenue attribution
- Consultation count
- Average values calculated
- Comparative analysis
- Helps in doctor performance review

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Security & Permissions Tests

### TC-SEC-001: Admin - Full Access

**Priority:** Critical  
**Role:** Admin

**Test Steps:**

1. Login as admin
2. Verify can:
   - Create invoices
   - Edit draft invoices
   - View all invoices
   - Record payments
   - Process refunds
   - Generate reports
   - Modify settings

**Expected Results:**

- All billing functions accessible
- No restrictions

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-SEC-002: Doctor - Limited Access

**Priority:** High  
**Role:** Doctor

**Test Steps:**

1. Login as doctor
2. Verify can:
   - View own patient invoices
   - View treatment cases
3. Verify cannot:
   - Create invoices (only admin/pharmacist)
   - Process payments
   - Process refunds
   - Modify settings

**Expected Results:**

- Read-only access to billing
- Can view but not modify
- Error on unauthorized actions

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-SEC-003: Pharmacist - Pharmacy Billing Only

**Priority:** High  
**Role:** Pharmacist

**Test Steps:**

1. Login as pharmacist
2. Verify can:
   - Create pharmacy bills
   - Record payments
   - View pharmacy invoices
3. Verify cannot:
   - Process refunds (admin only)
   - Modify settings
   - View all invoices (only pharmacy-related)

**Expected Results:**

- Limited to pharmacy operations
- Cannot access admin functions
- Row-level security enforced

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-SEC-004: Patient - Own Invoices Only

**Priority:** Critical  
**Role:** Patient

**Test Steps:**

1. Login as patient
2. Verify can view:
   - Own invoices only
   - Own payment history
3. Verify cannot:
   - View other patient invoices
   - Modify invoices
   - Process refunds

**Expected Results:**

- Can only see own billing data
- RLS (Row Level Security) prevents access to others
- Read-only access
- Can make online payments

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-SEC-005: Prevent SQL Injection

**Priority:** Critical  
**Role:** Attacker

**Test Steps:**

1. In invoice search, enter: `'; DROP TABLE invoices; --`
2. In patient search, enter: `' OR '1'='1`
3. Verify system is protected

**Expected Results:**

- Parameterized queries used
- Input sanitized
- No SQL executed
- Error handled gracefully
- Security log entry created

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-SEC-006: Prevent XSS Attacks

**Priority:** High  
**Role:** Attacker

**Test Steps:**

1. In invoice notes, enter: `<script>alert('XSS')</script>`
2. Save invoice
3. View invoice
4. Verify script not executed

**Expected Results:**

- Input sanitized
- HTML encoded
- Script not executed
- Safe rendering in UI

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-SEC-007: Session Timeout

**Priority:** Medium  
**Role:** User

**Test Steps:**

1. Login to system
2. Start creating invoice
3. Leave idle for configured timeout period (e.g., 30 minutes)
4. Attempt to save invoice

**Expected Results:**

- Session expires after timeout
- User redirected to login
- Unsaved data handled:
  - Option 1: Auto-save to draft
  - Option 2: Warning before timeout
  - Option 3: Data lost with warning

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Performance Tests

### TC-PRF-001: Invoice List Loading Time

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Database with 10,000 invoices
2. Open invoice list page
3. Measure loading time
4. Apply filter
5. Measure filter response time

**Expected Results:**

- Initial load: < 2 seconds
- Pagination used (20-50 per page)
- Filter response: < 1 second
- Smooth scrolling
- No browser freeze

**Test Data:**

- 10,000 invoices in database

**Actual Results:** **********\_**********

**Load Time:** **\_\_** seconds

**Status:** [ ] Pass [ ] Fail

---

### TC-PRF-002: Invoice Creation Performance

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Create invoice with 10 items
2. Measure time from create to save
3. Verify database transaction time

**Expected Results:**

- UI response: < 1 second
- Database insert: < 500ms
- Total save time: < 2 seconds
- No lag in UI

**Actual Results:** **********\_**********

**Time Taken:** **\_\_** ms

**Status:** [ ] Pass [ ] Fail

---

### TC-PRF-003: Payment Processing Speed

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Record payment on invoice
2. Measure time for:
   - Payment record creation
   - Invoice status update
   - Ledger entry creation
   - Stock deduction (if applicable)
   - Audit log creation

**Expected Results:**

- Complete transaction: < 2 seconds
- Atomic operation (all or nothing)
- No intermediate states visible

**Actual Results:** **********\_**********

**Time Taken:** **\_\_** seconds

**Status:** [ ] Pass [ ] Fail

---

### TC-PRF-004: Report Generation Time

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Generate monthly report with 1,000+ invoices
2. Measure generation time
3. Export to Excel
4. Measure export time

**Expected Results:**

- Report generation: < 5 seconds
- Export: < 3 seconds
- Large datasets handled efficiently
- Progress indicator shown

**Actual Results:** **********\_**********

**Generation Time:** **\_\_** seconds  
**Export Time:** **\_\_** seconds

**Status:** [ ] Pass [ ] Fail

---

### TC-PRF-005: Concurrent User Load

**Priority:** High  
**Role:** System

**Test Steps:**

1. Simulate 50 concurrent users
2. Each user creates invoice
3. Each user records payment
4. Measure system response

**Expected Results:**

- No deadlocks
- No data corruption
- Response time degradation: < 20%
- All transactions complete successfully
- Invoice number sequence maintained

**Test Setup:** Load testing tool (JMeter, K6, or similar)

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-PRF-006: Database Query Optimization

**Priority:** Medium  
**Role:** DBA

**Test Steps:**

1. Run EXPLAIN on key queries:
   - Invoice list with filters
   - Payment aggregation
   - Outstanding report
2. Verify indexes used
3. Check query execution plans

**Expected Results:**

- All major queries use indexes
- No full table scans on large tables
- Query time: < 100ms for most queries
- Indexes on:
  - invoice_number
  - patient_id
  - status
  - invoice_date
  - created_at

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Edge Cases & Error Handling

### TC-EDG-001: Zero Amount Invoice

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Attempt to create invoice with ₹0 total
2. Verify system behavior

**Expected Results:**

- System prevents OR allows with warning
- If allowed: Special handling
- Validation message clear

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-EDG-002: Negative Quantity

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Add invoice item
2. Set quantity: -5
3. Attempt to save

**Expected Results:**

- System prevents negative quantity
- Error: "Quantity must be positive"
- Invoice not saved

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-EDG-003: Extremely Large Amount

**Priority:** Low  
**Role:** Admin

**Test Steps:**

1. Create invoice with amount: ₹10,00,00,000 (1 crore)
2. Verify handling

**Expected Results:**

- System handles large numbers correctly
- No integer overflow
- Calculations accurate
- Display formatted correctly (1,00,00,000.00)

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-EDG-004: Special Characters in Notes

**Priority:** Medium  
**Role:** Admin

**Test Steps:**

1. Add invoice notes with special characters:
   - Quotes: "Test"
   - Apostrophe: It's
   - Symbols: @#$%
   - Unicode: émojis 🏥💊
2. Save and retrieve

**Expected Results:**

- All characters preserved
- No encoding issues
- Display correctly
- No SQL errors

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-EDG-005: Invoice Date in Future

**Priority:** Low  
**Role:** Admin

**Test Steps:**

1. Create invoice
2. Set invoice date: 2026-02-30 (future)
3. Verify system response

**Expected Results:**

- System warns OR prevents
- If allowed: Clear business justification
- Due date calculated from future date

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-EDG-006: Duplicate Payment Prevention

**Priority:** High  
**Role:** Admin

**Test Steps:**

1. Invoice: ₹1,000
2. Record payment: ₹1,000
3. Quickly click "Save Payment" twice
4. Verify duplicate prevention

**Expected Results:**

- Only one payment recorded
- No duplicate transaction
- UI prevents double-click
- Backend validation prevents duplicate

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-EDG-007: Network Interruption During Payment

**Priority:** High  
**Role:** System

**Test Steps:**

1. Start payment process
2. Simulate network interruption mid-transaction
3. Verify data integrity

**Expected Results:**

- Transaction rolled back OR completed
- No partial state
- User informed of status
- Can retry safely
- No duplicate charges

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-EDG-008: Browser Crash During Invoice Creation

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Start creating complex invoice
2. Simulate browser crash
3. Reopen browser
4. Check if draft saved

**Expected Results:**

- Auto-save functionality present
- Draft recovered (if implemented)
- OR: Data lost with user awareness
- Clear messaging to user

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Integration Tests

### TC-INT-001: Appointment to Invoice Flow

**Priority:** High  
**Role:** System

**Test Steps:**

1. Create appointment
2. Mark appointment as completed
3. Generate invoice from appointment
4. Verify data linkage

**Expected Results:**

- Invoice auto-populated:
  - Patient from appointment
  - Doctor from appointment
  - Date from appointment
  - Consultation fee
- appointment_id linked to invoice
- Invoice visible in appointment details

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INT-002: Prescription to Pharmacy Bill

**Priority:** High  
**Role:** Pharmacist

**Test Steps:**

1. Doctor creates prescription
2. Pharmacist accesses prescription
3. Generate pharmacy bill from prescription
4. Verify medicines populated

**Expected Results:**

- All prescribed medicines auto-added to invoice
- Quantities pre-filled
- Prices from inventory
- Prescription ID linked
- Stock check performed

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INT-003: Invoice to Receipt Generation

**Priority:** High  
**Role:** System

**Test Steps:**

1. Create and pay invoice
2. Generate receipt PDF
3. Verify receipt contents

**Expected Results:**

- Receipt auto-generated
- Contains:
  - Clinic header/logo
  - Receipt number
  - Invoice number
  - Date
  - Patient details
  - Itemized list
  - Tax breakdown
  - Payment details
  - Total paid
  - Balance due
  - Footer with terms
- Professional formatting
- Printable

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INT-004: User Management Integration

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Create new patient in user management
2. Immediately create invoice for patient
3. Verify patient available in billing

**Expected Results:**

- Real-time sync
- Patient appears in dropdown
- Patient details accurate
- No refresh needed

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-INT-005: Notification System Integration

**Priority:** Medium  
**Role:** System

**Test Steps:**

1. Create invoice for patient
2. Payment due date approaching
3. Verify notification sent
4. Payment completed
5. Verify receipt notification sent

**Expected Results:**

- Email/SMS notifications triggered:
  - Invoice created
  - Payment reminder (due date - 2 days)
  - Payment received confirmation
  - Receipt attached to email
- Notification log maintained

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## End-to-End Scenarios

### TC-E2E-001: Complete Patient Visit with Payment

**Priority:** Critical  
**Role:** Multiple

**Scenario:**
New patient visits clinic, sees doctor, gets prescription, buys medicines, pays bill.

**Test Steps:**

1. Receptionist creates patient record
2. Receptionist books appointment
3. Doctor completes consultation
4. Doctor creates prescription
5. Receptionist generates invoice (consultation fee)
6. Pharmacist adds medicines from prescription
7. Patient makes payment (UPI)
8. Receipt printed and given to patient
9. Medicines dispensed
10. Stock deducted

**Expected Results:**

- Seamless flow across modules
- All data linked correctly
- No manual re-entry
- Stock updated accurately
- Payment reflected immediately
- Complete audit trail
- Time taken: < 5 minutes

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-E2E-002: Refund Process - Full Lifecycle

**Priority:** High  
**Role:** Multiple

**Scenario:**
Patient paid for appointment but doctor cancelled. Full refund needed.

**Test Steps:**

1. Invoice exists: ₹1,000 (paid)
2. Appointment cancelled
3. Admin initiates refund
4. Enter cancellation reason
5. Process refund to online gateway
6. Gateway processes refund
7. Credit note generated
8. Patient notified
9. Accounting updated

**Expected Results:**

- Credit note created
- Original invoice unchanged
- Refund record created
- Gateway refund initiated
- Patient receives confirmation
- Ledger balanced
- Audit trail complete
- Stock restored (if medicines)

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-E2E-003: Treatment Case - Multi-Visit Billing

**Priority:** High  
**Role:** Doctor, Admin

**Scenario:**
Patient with chronic condition - 6 months treatment with monthly visits.

**Test Steps:**

1. Doctor creates treatment case
2. Visit 1: Invoice ₹500 (paid)
3. Visit 2: Invoice ₹600 (partial ₹400)
4. Visit 3: Invoice ₹500 (pending)
5. Visit 4: Invoice ₹700 (paid)
6. Patient makes payment for Visit 2 balance
7. View case financial summary
8. Generate case report

**Expected Results:**

- All invoices linked to case
- Case shows:
  - Total: ₹2,300
  - Paid: ₹1,900
  - Due: ₹400
- Timeline view available
- Progress tracking clear
- Report comprehensive

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-E2E-004: Offline-to-Online Sync Complete Flow

**Priority:** High  
**Role:** Pharmacist

**Scenario:**
Internet outage during evening hours. Multiple bills created offline. Internet restored at night.

**Test Steps:**

1. Internet goes down at 6 PM
2. Pharmacist creates 5 offline bills (6:15 - 7:30 PM)
3. All bills paid in cash
4. Receipts printed with offline note
5. Internet restored at 9 PM
6. Sync triggered automatically
7. All 5 bills synced to server
8. Invoice numbers assigned
9. Accounting updated

**Expected Results:**

- All offline bills synced successfully
- Sequential invoice numbers assigned
- No data loss
- Stock movements recorded on server
- Ledger entries created
- Duplicate detection worked
- Offline IDs preserved
- Updated receipts generated

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

### TC-E2E-005: Month-End Accounting Reconciliation

**Priority:** Critical  
**Role:** Accountant

**Scenario:**
Month-end closing - verify all transactions balanced.

**Test Steps:**

1. Generate month-end reports:
   - Revenue report
   - Payment method summary
   - Outstanding invoices
   - Refunds & credit notes
   - Ledger summary
2. Cross-verify:
   - Total invoices created
   - Total payments received
   - Total refunds issued
   - Net revenue
3. Verify ledger balance
4. Check for discrepancies

**Expected Results:**

- All reports match
- Ledger balanced
- No orphan transactions
- All payments accounted
- Stock movements reconciled
- Tax calculations accurate
- Ready for filing
- No errors or warnings

**Actual Results:** **********\_**********

**Status:** [ ] Pass [ ] Fail

---

## Test Summary Template

### Test Execution Summary

**Test Period:** ********\_\_\_\_********  
**Tester Name:** ********\_\_\_\_********  
**Environment:** [ ] Development [ ] Staging [ ] Production

**Overall Statistics:**

| Category               | Total   | Passed | Failed | Blocked | Not Run |
| ---------------------- | ------- | ------ | ------ | ------- | ------- |
| Invoice Management     | 10      |        |        |         |         |
| Payment Processing     | 10      |        |        |         |         |
| Refund & Credit Notes  | 8       |        |        |         |         |
| Offline Billing        | 7       |        |        |         |         |
| Pharmacy Billing       | 6       |        |        |         |         |
| Inventory Integration  | 7       |        |        |         |         |
| Treatment Cases        | 5       |        |        |         |         |
| GST Compliance         | 6       |        |        |         |         |
| Ledger System          | 6       |        |        |         |         |
| Audit Logs             | 6       |        |        |         |         |
| Quick Bill Mode        | 4       |        |        |         |         |
| Reporting              | 6       |        |        |         |         |
| Security & Permissions | 7       |        |        |         |         |
| Performance            | 6       |        |        |         |         |
| Edge Cases             | 8       |        |        |         |         |
| Integration            | 5       |        |        |         |         |
| End-to-End Scenarios   | 5       |        |        |         |         |
| **TOTAL**              | **112** |        |        |         |         |

**Critical Issues Found:**

1. ***
2. ***
3. ***

**High Priority Issues Found:**

1. ***
2. ***
3. ***

**Recommendations:**

---

---

---

**Sign-off:**

Tester: **********\_\_********** Date: ****\_\_****  
QA Lead: ********\_\_\_\_******** Date: ****\_\_****  
Project Manager: ******\_****** Date: ****\_\_****

---

## Appendix A: Test Data Setup Scripts

### SQL Script: Create Test Users

```sql
-- Create test users
INSERT INTO users (email, full_name, role, status) VALUES
  ('admin@abelwellness.com', 'Admin User', 'admin', 'active'),
  ('doctor@abelwellness.com', 'Dr. Smith', 'doctor', 'active'),
  ('pharmacist@abelwellness.com', 'Pharmacist User', 'pharmacist', 'active'),
  ('patient1@test.com', 'John Doe', 'patient', 'active'),
  ('patient2@test.com', 'Jane Smith', 'patient', 'active'),
  ('patient3@test.com', 'Bob Johnson', 'patient', 'active');
```

### SQL Script: Create Test Inventory

```sql
-- Create test inventory items
INSERT INTO inventory_items (name, potency, price, stock_quantity, minimum_stock, hsn_code) VALUES
  ('Arnica Montana', '30C', 150, 100, 10, '3003'),
  ('Belladonna', '200C', 180, 50, 10, '3003'),
  ('Calc Carb', '1M', 250, 30, 5, '3003');
```

### SQL Script: Configure Billing Settings

```sql
-- Configure billing settings
INSERT INTO billing_settings (
  invoice_number_prefix,
  invoice_number_start,
  tax_rate,
  cgst_rate,
  sgst_rate,
  igst_rate,
  payment_due_days,
  clinic_gstin
) VALUES (
  'INV-',
  1001,
  18,
  9,
  9,
  18,
  7,
  '27AABCU9603R1ZM'
);
```

---

## Appendix B: Automation Test Scripts

### Example: Jest Test for Invoice Creation

```javascript
describe("Invoice Creation", () => {
  test("TC-INV-001: Create Draft Invoice", async () => {
    const invoiceData = {
      patient_id: "patient1_uuid",
      status: "draft",
      items: [
        {
          item_type: "consultation",
          description: "Initial Consultation",
          quantity: 1,
          unit_price: 500,
          tax_rate: 18,
        },
      ],
    };

    const response = await createInvoice(invoiceData);

    expect(response.status).toBe(201);
    expect(response.data.invoice_number).toMatch(/INV-\d{6}/);
    expect(response.data.status).toBe("draft");
    expect(response.data.subtotal).toBe(500);
    expect(response.data.tax_amount).toBe(90);
    expect(response.data.total_amount).toBe(590);
    expect(response.data.amount_due).toBe(590);
  });
});
```

---

## Appendix C: Performance Benchmarks

| Operation                     | Target Time | Acceptable Time | Unacceptable Time |
| ----------------------------- | ----------- | --------------- | ----------------- |
| Invoice List Load (100 items) | < 1s        | < 2s            | > 3s              |
| Invoice Creation              | < 500ms     | < 1s            | > 2s              |
| Payment Processing            | < 1s        | < 2s            | > 3s              |
| Report Generation (monthly)   | < 3s        | < 5s            | > 10s             |
| PDF Export                    | < 2s        | < 3s            | > 5s              |
| Search/Autocomplete           | < 300ms     | < 500ms         | > 1s              |
| Offline Sync (10 invoices)    | < 5s        | < 10s           | > 20s             |

---

## Appendix D: Known Limitations

1. **Offline Billing**: Maximum 100 offline invoices before sync required
2. **Concurrent Editing**: Last save wins, no merge conflict resolution
3. **Payment Gateway**: Supports Razorpay only (extensible for others)
4. **File Size**: Invoice PDFs limited to 5MB
5. **Export**: Excel exports limited to 10,000 rows
6. **Stock**: No support for serial number tracking
7. **Multi-currency**: Only INR supported in current version

---

## Revision History

| Version | Date       | Author  | Changes                                  |
| ------- | ---------- | ------- | ---------------------------------------- |
| 1.0     | 2026-01-30 | Copilot | Initial comprehensive test documentation |

---

**END OF DOCUMENT**
