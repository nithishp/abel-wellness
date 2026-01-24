"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  INVOICE_STATUS,
  CREDIT_NOTE_STATUS,
  LEDGER_ENTRY_TYPES,
} from "@/lib/billing.constants";

// =============================================
// CREDIT NOTE ACTIONS
// =============================================

/**
 * Generate credit note number
 */
export async function generateCreditNoteNumber() {
  const supabase = supabaseAdmin;

  // Get prefix from settings or default
  const { data: prefixSetting } = await supabase
    .from(BILLING_TABLES.BILLING_SETTINGS)
    .select("setting_value")
    .eq("setting_key", "credit_note_prefix")
    .single();

  const prefix = prefixSetting?.setting_value?.replace(/"/g, "") || "CN";

  // Get the next credit note number
  const { data: lastCN } = await supabase
    .from(BILLING_TABLES.CREDIT_NOTES)
    .select("credit_note_number")
    .like("credit_note_number", `${prefix}-%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1001;
  if (lastCN?.credit_note_number) {
    const match = lastCN.credit_note_number.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${String(nextNum).padStart(6, "0")}`;
}

/**
 * Create a credit note for an invoice
 * Used for returns/refunds - maintains accounting immutability
 * @param {string} invoiceId - The original invoice ID
 * @param {object} creditNoteData - Credit note details
 * @param {string} createdBy - User creating the credit note
 */
export async function createCreditNote(invoiceId, creditNoteData, createdBy) {
  const supabase = supabaseAdmin;

  try {
    // Get the original invoice with items
    const { data: invoice, error: invError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        `
        *,
        items:invoice_items(*),
        patient:patient_id(id, full_name)
      `,
      )
      .eq("id", invoiceId)
      .single();

    if (invError || !invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Check invoice status - can only create credit note for paid/partial invoices
    if (
      ![INVOICE_STATUS.PAID, INVOICE_STATUS.PARTIAL].includes(invoice.status)
    ) {
      return {
        success: false,
        error:
          "Credit notes can only be created for paid or partially paid invoices",
      };
    }

    // Generate credit note number
    const creditNoteNumber = await generateCreditNoteNumber();

    // Determine items to include in credit note
    const itemsToCredit = creditNoteData.items || invoice.items;

    // Calculate credit note totals
    let subtotal = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const creditNoteItems = [];

    for (const item of itemsToCredit) {
      // If partial return, check for quantity override
      const quantity = item.returnQuantity || item.quantity;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const lineTotal = quantity * unitPrice;

      // Calculate proportional tax
      const itemCgst =
        (parseFloat(item.cgst_amount) || 0) * (quantity / (item.quantity || 1));
      const itemSgst =
        (parseFloat(item.sgst_amount) || 0) * (quantity / (item.quantity || 1));
      const itemIgst =
        (parseFloat(item.igst_amount) || 0) * (quantity / (item.quantity || 1));

      subtotal += lineTotal;
      cgstAmount += itemCgst;
      sgstAmount += itemSgst;
      igstAmount += itemIgst;

      creditNoteItems.push({
        invoice_item_id: item.id,
        item_type: item.item_type,
        description: item.description,
        quantity: quantity,
        unit: item.unit,
        unit_price: unitPrice,
        hsn_code: item.hsn_code,
        cgst_rate: item.cgst_rate || 0,
        cgst_amount: itemCgst,
        sgst_rate: item.sgst_rate || 0,
        sgst_amount: itemSgst,
        igst_rate: item.igst_rate || 0,
        igst_amount: itemIgst,
        total: lineTotal + itemCgst + itemSgst + itemIgst,
        inventory_item_id: item.inventory_item_id,
        batch_id: item.batch_id,
        stock_restored: false,
        sort_order: item.sort_order || 0,
      });
    }

    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = subtotal + totalTaxAmount;

    // Create credit note
    const { data: creditNote, error: cnError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .insert({
        credit_note_number: creditNoteNumber,
        invoice_id: invoiceId,
        patient_id: invoice.patient_id,
        subtotal: subtotal,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        total_tax_amount: totalTaxAmount,
        total_amount: totalAmount,
        reason: creditNoteData.reason || "Return/Refund",
        status: CREDIT_NOTE_STATUS.DRAFT,
        credit_note_date: new Date().toISOString().split("T")[0],
        created_by: createdBy,
      })
      .select()
      .single();

    if (cnError) {
      console.error("Error creating credit note:", cnError);
      return { success: false, error: cnError.message };
    }

    // Insert credit note items
    const itemsToInsert = creditNoteItems.map((item) => ({
      ...item,
      credit_note_id: creditNote.id,
    }));

    const { error: itemsError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTE_ITEMS)
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error creating credit note items:", itemsError);
      // Rollback credit note
      await supabase
        .from(BILLING_TABLES.CREDIT_NOTES)
        .delete()
        .eq("id", creditNote.id);
      return { success: false, error: itemsError.message };
    }

    return {
      success: true,
      creditNote: { ...creditNote, items: creditNoteItems },
      message: "Credit note created as draft",
    };
  } catch (error) {
    console.error("Error in createCreditNote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Issue (approve) a credit note and optionally restore stock
 * @param {string} creditNoteId - The credit note ID
 * @param {string} approvedBy - User approving the credit note
 * @param {object} options - Options including restoreStock flag
 */
export async function issueCreditNote(creditNoteId, approvedBy, options = {}) {
  const supabase = supabaseAdmin;
  const { restoreStock = true } = options;

  try {
    // Get credit note with items
    const { data: creditNote, error: cnError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .select(
        `
        *,
        items:credit_note_items(*),
        invoice:invoice_id(id, invoice_number, patient_id)
      `,
      )
      .eq("id", creditNoteId)
      .single();

    if (cnError || !creditNote) {
      return { success: false, error: "Credit note not found" };
    }

    if (creditNote.status !== CREDIT_NOTE_STATUS.DRAFT) {
      return { success: false, error: "Only draft credit notes can be issued" };
    }

    // Restore stock for inventory items
    if (restoreStock) {
      for (const item of creditNote.items || []) {
        if (item.inventory_item_id && !item.stock_restored) {
          const quantity = parseInt(item.quantity) || 0;

          // Update inventory item stock
          const { data: invItem } = await supabase
            .from("inventory_items")
            .select("current_stock")
            .eq("id", item.inventory_item_id)
            .single();

          if (invItem) {
            const newStock = (invItem.current_stock || 0) + quantity;

            await supabase
              .from("inventory_items")
              .update({
                current_stock: newStock,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.inventory_item_id);

            // Record stock movement
            await supabase.from("inventory_stock_movements").insert({
              item_id: item.inventory_item_id,
              batch_id: item.batch_id || null,
              movement_type: "return",
              quantity: quantity,
              quantity_before: invItem.current_stock,
              quantity_after: newStock,
              reference_type: "credit_note",
              reference_id: creditNoteId,
              reason: `Stock restored via credit note ${creditNote.credit_note_number}`,
              performed_by: approvedBy,
            });

            // If batch specified, restore batch quantity too
            if (item.batch_id) {
              const { data: batch } = await supabase
                .from("inventory_batches")
                .select("available_quantity, status")
                .eq("id", item.batch_id)
                .single();

              if (batch) {
                await supabase
                  .from("inventory_batches")
                  .update({
                    available_quantity:
                      (batch.available_quantity || 0) + quantity,
                    status: "active",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", item.batch_id);
              }
            }
          }

          // Mark item as stock restored
          await supabase
            .from(BILLING_TABLES.CREDIT_NOTE_ITEMS)
            .update({
              stock_restored: true,
              stock_restored_at: new Date().toISOString(),
            })
            .eq("id", item.id);
        }
      }
    }

    // Update credit note status to issued
    const { error: updateError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .update({
        status: CREDIT_NOTE_STATUS.ISSUED,
        approved_by: approvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditNoteId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Create ledger entry for credit note
    const entryNumber = `LE-CN-${Date.now()}`;
    await supabase.from(BILLING_TABLES.LEDGER_ENTRIES).insert({
      entry_number: entryNumber,
      entry_date: new Date().toISOString(),
      entry_type: LEDGER_ENTRY_TYPES.CREDIT_NOTE,
      reference_type: "credit_note",
      reference_id: creditNoteId,
      reference_number: creditNote.credit_note_number,
      patient_id: creditNote.patient_id,
      debit_amount: 0,
      credit_amount: creditNote.total_amount,
      description: `Credit note ${creditNote.credit_note_number} issued`,
      created_by: approvedBy,
    });

    return {
      success: true,
      message: "Credit note issued successfully",
      stockRestored: restoreStock,
    };
  } catch (error) {
    console.error("Error in issueCreditNote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Apply credit note to reduce invoice balance or issue refund
 * @param {string} creditNoteId - The credit note ID
 * @param {object} applicationData - How to apply (refund method, etc.)
 * @param {string} appliedBy - User applying the credit note
 */
export async function applyCreditNote(
  creditNoteId,
  applicationData,
  appliedBy,
) {
  const supabase = supabaseAdmin;

  try {
    // Get credit note
    const { data: creditNote, error: cnError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .select(
        `
        *,
        invoice:invoice_id(id, invoice_number, patient_id, amount_paid, status)
      `,
      )
      .eq("id", creditNoteId)
      .single();

    if (cnError || !creditNote) {
      return { success: false, error: "Credit note not found" };
    }

    if (creditNote.status !== CREDIT_NOTE_STATUS.ISSUED) {
      return {
        success: false,
        error: "Only issued credit notes can be applied",
      };
    }

    // If issuing refund, create payment refund record
    if (applicationData.issueRefund) {
      // Get original payment to refund against
      const { data: payment } = await supabase
        .from(BILLING_TABLES.PAYMENTS)
        .select("id")
        .eq("invoice_id", creditNote.invoice_id)
        .eq("status", "completed")
        .order("payment_date", { ascending: false })
        .limit(1)
        .single();

      if (payment) {
        await supabase.from(BILLING_TABLES.PAYMENT_REFUNDS).insert({
          payment_id: payment.id,
          invoice_id: creditNote.invoice_id,
          amount: creditNote.total_amount,
          reason: `Refund via credit note ${creditNote.credit_note_number}`,
          status: "completed",
          refunded_by: appliedBy,
          refunded_at: new Date().toISOString(),
        });
      }

      // Update invoice amount_paid
      const newAmountPaid = Math.max(
        0,
        (creditNote.invoice?.amount_paid || 0) - creditNote.total_amount,
      );
      await supabase
        .from(BILLING_TABLES.INVOICES)
        .update({
          amount_paid: newAmountPaid,
          status:
            newAmountPaid === 0
              ? INVOICE_STATUS.REFUNDED
              : INVOICE_STATUS.PARTIAL,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creditNote.invoice_id);
    }

    // Update credit note status to applied
    await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .update({
        status: CREDIT_NOTE_STATUS.APPLIED,
        applied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditNoteId);

    return {
      success: true,
      message: applicationData.issueRefund
        ? "Credit note applied and refund issued"
        : "Credit note applied successfully",
    };
  } catch (error) {
    console.error("Error in applyCreditNote:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get credit notes for an invoice or patient
 * @param {object} filters - Filter options
 */
export async function getCreditNotes(filters = {}) {
  const supabase = supabaseAdmin;
  const { invoiceId, patientId, status, page = 1, limit = 20 } = filters;

  try {
    let query = supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .select(
        `
        *,
        invoice:invoice_id(id, invoice_number),
        patient:patient_id(id, full_name),
        items:credit_note_items(*)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false });

    if (invoiceId) {
      query = query.eq("invoice_id", invoiceId);
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      creditNotes: data,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get a single credit note by ID
 * @param {string} creditNoteId - The credit note ID
 */
export async function getCreditNoteById(creditNoteId) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .select(
        `
        *,
        invoice:invoice_id(
          id, 
          invoice_number,
          status,
          total_amount,
          amount_paid
        ),
        patient:patient_id(id, full_name, email, phone),
        items:credit_note_items(*),
        created_by_user:created_by(id, full_name),
        approved_by_user:approved_by(id, full_name)
      `,
      )
      .eq("id", creditNoteId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, creditNote: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a credit note (only if draft)
 * @param {string} creditNoteId - The credit note ID
 */
export async function cancelCreditNote(creditNoteId) {
  const supabase = supabaseAdmin;

  try {
    const { data: creditNote, error: cnError } = await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .select("status")
      .eq("id", creditNoteId)
      .single();

    if (cnError || !creditNote) {
      return { success: false, error: "Credit note not found" };
    }

    if (creditNote.status !== CREDIT_NOTE_STATUS.DRAFT) {
      return {
        success: false,
        error: "Only draft credit notes can be cancelled",
      };
    }

    await supabase
      .from(BILLING_TABLES.CREDIT_NOTES)
      .update({
        status: CREDIT_NOTE_STATUS.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq("id", creditNoteId);

    return { success: true, message: "Credit note cancelled" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
