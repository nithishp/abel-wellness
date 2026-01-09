"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  CREDIT_NOTE_STATUS,
  INVOICE_STATUS,
} from "@/lib/billing.constants";
import { createCreditNoteLedgerEntry } from "./ledger.actions";
import { auditCreditNoteCreate } from "./audit.actions";
import { restoreStockForInvoiceItems } from "./inventory-billing.actions";

// =============================================
// CREDIT NOTE ACTIONS
// =============================================

/**
 * Generate a unique credit note number
 */
async function generateCreditNoteNumber() {
  const supabase = supabaseAdmin;

  const { data } = await supabase
    .from(BILLING_TABLES.CREDIT_NOTES)
    .select("credit_note_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (data?.credit_note_number) {
    const match = data.credit_note_number.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `CN-${String(nextNum).padStart(6, "0")}`;
}

/**
 * Create a credit note for an invoice
 * This is the proper way to handle refunds - never modify the original invoice
 * @param {Object} params - Credit note parameters
 * @param {string} params.invoiceId - The invoice to credit
 * @param {string} params.reason - Reason for the credit note
 * @param {Array} params.items - Items to credit (if partial, otherwise credits full invoice)
 * @param {string} params.createdBy - User creating the credit note
 */
export async function createCreditNote(params) {
  const supabase = supabaseAdmin;

  try {
    // Get the invoice with items
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        `
        *,
        patient:users!invoices_patient_id_fkey(id, full_name, email)
      `
      )
      .eq("id", params.invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Check if invoice can have a credit note
    if (invoice.status === INVOICE_STATUS.DRAFT) {
      return {
        success: false,
        error: "Cannot create credit note for draft invoice",
      };
    }

    // Get invoice items
    const { data: invoiceItems, error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .select("*")
      .eq("invoice_id", params.invoiceId)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    // Generate credit note number
    const creditNoteNumber = await generateCreditNoteNumber();

    // Calculate credit note amounts
    let creditItems = [];
    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let totalTaxAmount = 0;

    if (params.items && params.items.length > 0) {
      // Partial credit - only specified items
      for (const itemSpec of params.items) {
        const originalItem = invoiceItems.find(
          (i) => i.id === itemSpec.invoiceItemId
        );
        if (originalItem) {
          const quantity = itemSpec.quantity || originalItem.quantity;
          const unitPrice = originalItem.unit_price;
          const itemSubtotal = quantity * unitPrice;
          const itemCgst = (itemSubtotal * (originalItem.cgst_rate || 0)) / 100;
          const itemSgst = (itemSubtotal * (originalItem.sgst_rate || 0)) / 100;
          const itemIgst = (itemSubtotal * (originalItem.igst_rate || 0)) / 100;
          const itemTotal = itemSubtotal + itemCgst + itemSgst + itemIgst;

          creditItems.push({
            invoice_item_id: originalItem.id,
            item_type: originalItem.item_type,
            description: originalItem.description,
            quantity: quantity,
            unit: originalItem.unit,
            unit_price: unitPrice,
            hsn_code: originalItem.hsn_code,
            cgst_rate: originalItem.cgst_rate || 0,
            cgst_amount: itemCgst,
            sgst_rate: originalItem.sgst_rate || 0,
            sgst_amount: itemSgst,
            igst_rate: originalItem.igst_rate || 0,
            igst_amount: itemIgst,
            total: itemTotal,
          });

          subtotal += itemSubtotal;
          cgstAmount += itemCgst;
          sgstAmount += itemSgst;
          igstAmount += itemIgst;
        }
      }
    } else {
      // Full credit - credit all items
      for (const originalItem of invoiceItems) {
        const itemSubtotal = originalItem.quantity * originalItem.unit_price;
        const itemCgst = originalItem.cgst_amount || 0;
        const itemSgst = originalItem.sgst_amount || 0;
        const itemIgst = originalItem.igst_amount || 0;

        creditItems.push({
          invoice_item_id: originalItem.id,
          item_type: originalItem.item_type,
          description: originalItem.description,
          quantity: originalItem.quantity,
          unit: originalItem.unit,
          unit_price: originalItem.unit_price,
          hsn_code: originalItem.hsn_code,
          cgst_rate: originalItem.cgst_rate || 0,
          cgst_amount: itemCgst,
          sgst_rate: originalItem.sgst_rate || 0,
          sgst_amount: itemSgst,
          igst_rate: originalItem.igst_rate || 0,
          igst_amount: itemIgst,
          total: originalItem.total,
        });

        subtotal += itemSubtotal;
        cgstAmount += itemCgst;
        sgstAmount += itemSgst;
        igstAmount += itemIgst;
      }
    }

    totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = subtotal + totalTaxAmount;

    // Create the credit note
    const { data: creditNote, error: cnError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .insert({
        credit_note_number: creditNoteNumber,
        invoice_id: params.invoiceId,
        patient_id: invoice.patient_id,
        subtotal: subtotal,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        total_tax_amount: totalTaxAmount,
        total_amount: totalAmount,
        reason: params.reason,
        status: params.status || CREDIT_NOTE_STATUS.ISSUED,
        credit_note_date:
          params.creditNoteDate || new Date().toISOString().split("T")[0],
        created_by: params.createdBy,
      })
      .select()
      .single();

    if (cnError) {
      console.error("Error creating credit note:", cnError);
      return { success: false, error: cnError.message };
    }

    // Create credit note items
    const itemsToInsert = creditItems.map((item, index) => ({
      ...item,
      credit_note_id: creditNote.id,
      sort_order: index,
    }));

    const { error: itemsInsertError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTE_ITEMS)
      .insert(itemsToInsert);

    if (itemsInsertError) {
      // Rollback credit note
      await supabase
        .from(BILLING_TABLES.CREDIT_NOTES)
        .delete()
        .eq("id", creditNote.id);
      return { success: false, error: itemsInsertError.message };
    }

    // Create ledger entry
    await createCreditNoteLedgerEntry(creditNote, invoice, params.createdBy);

    // Create audit log
    await auditCreditNoteCreate(creditNote, params.createdBy);

    // Restore stock for credited items if they were medication/supply
    const medicationItems = creditItems.filter(
      (i) => i.item_type === "medication" || i.item_type === "supply"
    );
    if (medicationItems.length > 0) {
      // Get the original invoice items with inventory references
      const originalItems = invoiceItems.filter((oi) =>
        medicationItems.some((ci) => ci.invoice_item_id === oi.id)
      );
      await restoreStockForInvoiceItems(
        originalItems,
        "credit_note",
        creditNote.id,
        params.createdBy
      );
    }

    return {
      success: true,
      creditNote: {
        ...creditNote,
        items: itemsToInsert,
      },
    };
  } catch (error) {
    console.error("Error in createCreditNote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get credit notes with filtering
 */
export async function getCreditNotes(options = {}) {
  const supabase = supabaseAdmin;
  const {
    page = 1,
    limit = 20,
    invoiceId,
    patientId,
    status,
    startDate,
    endDate,
    search,
  } = options;

  try {
    let query = supabase.from(BILLING_TABLES.CREDIT_NOTES).select(
      `
        *,
        invoice:invoices(id, invoice_number, total_amount),
        patient:users!credit_notes_patient_id_fkey(id, full_name, email, phone),
        created_by_user:users!credit_notes_created_by_fkey(id, full_name)
      `,
      { count: "exact" }
    );

    if (invoiceId) {
      query = query.eq("invoice_id", invoiceId);
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("credit_note_date", startDate);
    }

    if (endDate) {
      query = query.lte("credit_note_date", endDate);
    }

    if (search) {
      query = query.ilike("credit_note_number", `%${search}%`);
    }

    query = query
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching credit notes:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      creditNotes: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getCreditNotes:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get credit note by ID with items
 */
export async function getCreditNoteById(creditNoteId) {
  const supabase = supabaseAdmin;

  try {
    const { data: creditNote, error: cnError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .select(
        `
        *,
        invoice:invoices(id, invoice_number, total_amount, invoice_date),
        patient:users!credit_notes_patient_id_fkey(id, full_name, email, phone, address),
        created_by_user:users!credit_notes_created_by_fkey(id, full_name),
        approved_by_user:users!credit_notes_approved_by_fkey(id, full_name)
      `
      )
      .eq("id", creditNoteId)
      .single();

    if (cnError) {
      console.error("Error fetching credit note:", cnError);
      return { success: false, error: cnError.message };
    }

    // Get credit note items
    const { data: items, error: itemsError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTE_ITEMS)
      .select("*")
      .eq("credit_note_id", creditNoteId)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Error fetching credit note items:", itemsError);
      return { success: false, error: itemsError.message };
    }

    return {
      success: true,
      creditNote: {
        ...creditNote,
        items,
      },
    };
  } catch (error) {
    console.error("Error in getCreditNoteById:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update credit note status
 */
export async function updateCreditNoteStatus(
  creditNoteId,
  status,
  options = {}
) {
  const supabase = supabaseAdmin;

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === CREDIT_NOTE_STATUS.APPLIED) {
      updateData.applied_at = new Date().toISOString();
    }

    if (options.approvedBy) {
      updateData.approved_by = options.approvedBy;
    }

    const { data, error } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .update(updateData)
      .eq("id", creditNoteId)
      .select()
      .single();

    if (error) {
      console.error("Error updating credit note status:", error);
      return { success: false, error: error.message };
    }

    return { success: true, creditNote: data };
  } catch (error) {
    console.error("Error in updateCreditNoteStatus:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get credit notes for an invoice
 */
export async function getCreditNotesForInvoice(invoiceId) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .select(
        `
        *,
        created_by_user:users!credit_notes_created_by_fkey(id, full_name)
      `
      )
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching credit notes for invoice:", error);
      return { success: false, error: error.message };
    }

    const totalCredited = data.reduce(
      (sum, cn) =>
        cn.status !== CREDIT_NOTE_STATUS.CANCELLED
          ? sum + parseFloat(cn.total_amount)
          : sum,
      0
    );

    return {
      success: true,
      creditNotes: data,
      totalCredited,
    };
  } catch (error) {
    console.error("Error in getCreditNotesForInvoice:", error);
    return { success: false, error: error.message };
  }
}
