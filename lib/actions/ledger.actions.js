"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import { BILLING_TABLES, LEDGER_ENTRY_TYPES } from "@/lib/billing.constants";

// =============================================
// LEDGER ENTRY ACTIONS
// =============================================

/**
 * Generate a unique ledger entry number
 */
async function generateLedgerEntryNumber() {
  const supabase = supabaseAdmin;

  const { data } = await supabase
    .from(BILLING_TABLES.LEDGER_ENTRIES)
    .select("entry_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (data?.entry_number) {
    const match = data.entry_number.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `LED-${String(nextNum).padStart(8, "0")}`;
}

/**
 * Get the current running balance
 */
async function getCurrentBalance(patientId = null) {
  const supabase = supabaseAdmin;

  let query = supabase
    .from(BILLING_TABLES.LEDGER_ENTRIES)
    .select("running_balance")
    .order("created_at", { ascending: false })
    .limit(1);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data } = await query.single();
  return data?.running_balance || 0;
}

/**
 * Create an immutable ledger entry
 * @param {Object} params - Ledger entry parameters
 * @param {string} params.entryType - Type of entry (invoice, payment, credit_note, refund, adjustment)
 * @param {string} params.referenceType - Type of reference document
 * @param {string} params.referenceId - UUID of reference document
 * @param {string} params.referenceNumber - Human-readable reference number
 * @param {string} params.patientId - Patient UUID (optional)
 * @param {number} params.debitAmount - Debit amount (increases receivable)
 * @param {number} params.creditAmount - Credit amount (decreases receivable)
 * @param {string} params.description - Description of the entry
 * @param {string} params.createdBy - User ID who created the entry
 */
export async function createLedgerEntry(params) {
  const supabase = supabaseAdmin;

  try {
    const entryNumber = await generateLedgerEntryNumber();
    const currentBalance = await getCurrentBalance(params.patientId);

    // Calculate new running balance
    // Debit increases (receivable from patient), Credit decreases
    const debit = parseFloat(params.debitAmount) || 0;
    const credit = parseFloat(params.creditAmount) || 0;
    const newBalance = currentBalance + debit - credit;

    const { data, error } = await supabase
      .from(BILLING_TABLES.LEDGER_ENTRIES)
      .insert({
        entry_number: entryNumber,
        entry_date: params.entryDate || new Date().toISOString(),
        entry_type: params.entryType,
        reference_type: params.referenceType,
        reference_id: params.referenceId,
        reference_number: params.referenceNumber || null,
        patient_id: params.patientId || null,
        debit_amount: debit,
        credit_amount: credit,
        running_balance: newBalance,
        description: params.description,
        created_by: params.createdBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ledger entry:", error);
      return { success: false, error: error.message };
    }

    return { success: true, ledgerEntry: data };
  } catch (error) {
    console.error("Error in createLedgerEntry:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create ledger entry for invoice creation
 */
export async function createInvoiceLedgerEntry(invoice, createdBy) {
  return createLedgerEntry({
    entryType: LEDGER_ENTRY_TYPES.INVOICE,
    referenceType: "invoice",
    referenceId: invoice.id,
    referenceNumber: invoice.invoice_number,
    patientId: invoice.patient_id,
    debitAmount: invoice.total_amount, // Patient owes this amount
    creditAmount: 0,
    description: `Invoice ${invoice.invoice_number} created - Amount: ₹${invoice.total_amount}`,
    createdBy,
  });
}

/**
 * Create ledger entry for payment received
 */
export async function createPaymentLedgerEntry(payment, invoice, createdBy) {
  return createLedgerEntry({
    entryType: LEDGER_ENTRY_TYPES.PAYMENT,
    referenceType: "payment",
    referenceId: payment.id,
    referenceNumber: invoice?.invoice_number,
    patientId: payment.patient_id,
    debitAmount: 0,
    creditAmount: payment.amount, // Reduces receivable
    description: `Payment received for ${
      invoice?.invoice_number || "invoice"
    } - Amount: ₹${payment.amount} via ${payment.payment_method}`,
    createdBy,
  });
}

/**
 * Create ledger entry for credit note
 */
export async function createCreditNoteLedgerEntry(
  creditNote,
  invoice,
  createdBy
) {
  return createLedgerEntry({
    entryType: LEDGER_ENTRY_TYPES.CREDIT_NOTE,
    referenceType: "credit_note",
    referenceId: creditNote.id,
    referenceNumber: creditNote.credit_note_number,
    patientId: creditNote.patient_id,
    debitAmount: 0,
    creditAmount: creditNote.total_amount, // Reduces receivable
    description: `Credit Note ${creditNote.credit_note_number} issued against ${
      invoice?.invoice_number || "invoice"
    } - Amount: ₹${creditNote.total_amount}`,
    createdBy,
  });
}

/**
 * Create ledger entry for refund
 */
export async function createRefundLedgerEntry(
  refund,
  payment,
  invoice,
  createdBy
) {
  return createLedgerEntry({
    entryType: LEDGER_ENTRY_TYPES.REFUND,
    referenceType: "refund",
    referenceId: refund.id,
    referenceNumber: invoice?.invoice_number,
    patientId: payment?.patient_id,
    debitAmount: refund.amount, // Increases receivable (we owe the patient, or reversing their credit)
    creditAmount: 0,
    description: `Refund processed for ${
      invoice?.invoice_number || "invoice"
    } - Amount: ₹${refund.amount}`,
    createdBy,
  });
}

/**
 * Create adjustment ledger entry (for corrections)
 */
export async function createAdjustmentLedgerEntry(params) {
  return createLedgerEntry({
    entryType: LEDGER_ENTRY_TYPES.ADJUSTMENT,
    referenceType: params.referenceType || "adjustment",
    referenceId: params.referenceId,
    referenceNumber: params.referenceNumber,
    patientId: params.patientId,
    debitAmount: params.debitAmount || 0,
    creditAmount: params.creditAmount || 0,
    description: params.description || "Adjustment entry",
    createdBy: params.createdBy,
  });
}

/**
 * Get ledger entries with filtering
 */
export async function getLedgerEntries(options = {}) {
  const supabase = supabaseAdmin;
  const {
    page = 1,
    limit = 50,
    patientId,
    entryType,
    startDate,
    endDate,
    referenceType,
  } = options;

  try {
    let query = supabase.from(BILLING_TABLES.LEDGER_ENTRIES).select(
      `
        *,
        patient:users!ledger_entries_patient_id_fkey(id, full_name, email),
        created_by_user:users!ledger_entries_created_by_fkey(id, full_name)
      `,
      { count: "exact" }
    );

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    if (entryType) {
      query = query.eq("entry_type", entryType);
    }

    if (referenceType) {
      query = query.eq("reference_type", referenceType);
    }

    if (startDate) {
      query = query.gte("entry_date", startDate);
    }

    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    query = query
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching ledger entries:", error);
      return { success: false, error: error.message };
    }

    // Calculate totals
    const totals = data.reduce(
      (acc, entry) => {
        acc.totalDebits += parseFloat(entry.debit_amount) || 0;
        acc.totalCredits += parseFloat(entry.credit_amount) || 0;
        return acc;
      },
      { totalDebits: 0, totalCredits: 0 }
    );

    return {
      success: true,
      entries: data,
      totals: {
        ...totals,
        netBalance: totals.totalDebits - totals.totalCredits,
      },
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getLedgerEntries:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get patient's ledger balance
 */
export async function getPatientLedgerBalance(patientId) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.LEDGER_ENTRIES)
      .select("running_balance, debit_amount, credit_amount")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching patient ledger balance:", error);
      return { success: false, error: error.message };
    }

    // Get totals
    const { data: totalsData } = await supabase
      .from(BILLING_TABLES.LEDGER_ENTRIES)
      .select("debit_amount, credit_amount")
      .eq("patient_id", patientId);

    const totals = (totalsData || []).reduce(
      (acc, entry) => {
        acc.totalDebits += parseFloat(entry.debit_amount) || 0;
        acc.totalCredits += parseFloat(entry.credit_amount) || 0;
        return acc;
      },
      { totalDebits: 0, totalCredits: 0 }
    );

    return {
      success: true,
      balance: data?.running_balance || 0,
      totalDebits: totals.totalDebits,
      totalCredits: totals.totalCredits,
      outstandingBalance: totals.totalDebits - totals.totalCredits,
    };
  } catch (error) {
    console.error("Error in getPatientLedgerBalance:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get overall ledger summary
 */
export async function getLedgerSummary(options = {}) {
  const supabase = supabaseAdmin;
  const { startDate, endDate } = options;

  try {
    let query = supabase
      .from(BILLING_TABLES.LEDGER_ENTRIES)
      .select("entry_type, debit_amount, credit_amount");

    if (startDate) {
      query = query.gte("entry_date", startDate);
    }

    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching ledger summary:", error);
      return { success: false, error: error.message };
    }

    // Group by entry type
    const byType = data.reduce((acc, entry) => {
      if (!acc[entry.entry_type]) {
        acc[entry.entry_type] = { count: 0, debits: 0, credits: 0 };
      }
      acc[entry.entry_type].count++;
      acc[entry.entry_type].debits += parseFloat(entry.debit_amount) || 0;
      acc[entry.entry_type].credits += parseFloat(entry.credit_amount) || 0;
      return acc;
    }, {});

    const totals = data.reduce(
      (acc, entry) => {
        acc.totalDebits += parseFloat(entry.debit_amount) || 0;
        acc.totalCredits += parseFloat(entry.credit_amount) || 0;
        return acc;
      },
      { totalDebits: 0, totalCredits: 0 }
    );

    return {
      success: true,
      summary: {
        byType,
        totals: {
          ...totals,
          netBalance: totals.totalDebits - totals.totalCredits,
        },
        entryCount: data.length,
      },
    };
  } catch (error) {
    console.error("Error in getLedgerSummary:", error);
    return { success: false, error: error.message };
  }
}
