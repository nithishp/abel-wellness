// =============================================
// BILLING TABLES CONSTANTS
// =============================================

export const BILLING_TABLES = {
  INVOICES: "invoices",
  INVOICE_ITEMS: "invoice_items",
  PAYMENTS: "payments",
  PAYMENT_REFUNDS: "payment_refunds",
  BILLING_SETTINGS: "billing_settings",
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
