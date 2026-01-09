// =============================================
// BILLING TABLES CONSTANTS
// =============================================

export const BILLING_TABLES = {
  INVOICES: "invoices",
  INVOICE_ITEMS: "invoice_items",
  PAYMENTS: "payments",
  PAYMENT_REFUNDS: "payment_refunds",
  BILLING_SETTINGS: "billing_settings",
  TREATMENT_CASES: "treatment_cases",
  CREDIT_NOTES: "credit_notes",
  CREDIT_NOTE_ITEMS: "credit_note_items",
  LEDGER_ENTRIES: "ledger_entries",
  AUDIT_LOGS: "billing_audit_logs",
};

export const INVOICE_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  PARTIAL: "partial",
  PAID: "paid",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

export const PAYMENT_METHODS = {
  CASH: "cash",
  CARD: "card",
  UPI: "upi",
  BANK_TRANSFER: "bank_transfer",
  ONLINE: "online",
  CHEQUE: "cheque",
  OTHER: "other",
};

export const INVOICE_ITEM_TYPES = {
  CONSULTATION: "consultation",
  MEDICATION: "medication",
  SUPPLY: "supply",
  PROCEDURE: "procedure",
  LAB_TEST: "lab_test",
  SERVICE: "service",
  OTHER: "other",
};

// =============================================
// TREATMENT CASE CONSTANTS
// =============================================

export const TREATMENT_CASE_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  ON_HOLD: "on_hold",
};

// =============================================
// CREDIT NOTE CONSTANTS
// =============================================

export const CREDIT_NOTE_STATUS = {
  DRAFT: "draft",
  ISSUED: "issued",
  APPLIED: "applied",
  CANCELLED: "cancelled",
};

// =============================================
// LEDGER ENTRY CONSTANTS
// =============================================

export const LEDGER_ENTRY_TYPES = {
  INVOICE: "invoice",
  PAYMENT: "payment",
  CREDIT_NOTE: "credit_note",
  REFUND: "refund",
  ADJUSTMENT: "adjustment",
  OPENING_BALANCE: "opening_balance",
};

// =============================================
// AUDIT LOG CONSTANTS
// =============================================

export const AUDIT_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  STATUS_CHANGE: "status_change",
  PAYMENT: "payment",
  REFUND: "refund",
  CANCEL: "cancel",
  SYNC: "sync",
  PRINT: "print",
  EMAIL: "email",
};

export const AUDIT_ENTITY_TYPES = {
  INVOICE: "invoice",
  INVOICE_ITEM: "invoice_item",
  PAYMENT: "payment",
  REFUND: "refund",
  CREDIT_NOTE: "credit_note",
  TREATMENT_CASE: "treatment_case",
  BILLING_SETTING: "billing_setting",
  LEDGER_ENTRY: "ledger_entry",
};

// =============================================
// GST CONSTANTS
// =============================================

export const GST_RATES = {
  ZERO: 0,
  FIVE: 5,
  TWELVE: 12,
  EIGHTEEN: 18,
  TWENTY_EIGHT: 28,
};

export const TAX_TYPES = {
  CGST: "cgst",
  SGST: "sgst",
  IGST: "igst",
};

// Common HSN codes for healthcare
export const HSN_CODES = {
  CONSULTATION: "9983",
  MEDICINES_HOMEOPATHY: "3004",
  MEDICINES_GENERAL: "3004",
  LAB_TESTS: "9983",
  MEDICAL_SUPPLIES: "3006",
  MEDICAL_EQUIPMENT: "9018",
};

// =============================================
// SYNC STATUS CONSTANTS
// =============================================

export const SYNC_STATUS = {
  PENDING: "pending",
  SYNCED: "synced",
  FAILED: "failed",
  CONFLICT: "conflict",
};

// =============================================
// BILL TYPE CONSTANTS
// =============================================

export const BILL_TYPES = {
  STANDARD: "standard",
  QUICK: "quick",
  PHARMACY: "pharmacy",
  COMBINED: "combined",
};
