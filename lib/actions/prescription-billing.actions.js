"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  INVOICE_STATUS,
  INVOICE_ITEM_TYPES,
  CREDIT_NOTE_STATUS,
} from "@/lib/billing.constants";
import { generateInvoiceNumber, getBillingSettings } from "./billing.actions";
import {
  calculateInvoiceItemWithGST,
  calculateInvoiceTotals,
} from "./gst.actions";
import { getTodayIST, formatDueDateIST } from "@/lib/utils";

// =============================================
// PRESCRIPTION-BILLING INTEGRATION ACTIONS
// =============================================

/**
 * Convert a prescription to an invoice
 * Creates invoice with all billable prescription items linked to inventory
 * @param {string} prescriptionId - The prescription ID
 * @param {string} createdBy - User creating the invoice
 * @param {object} options - Additional options (appointmentId, notes, etc.)
 */
export async function createInvoiceFromPrescription(
  prescriptionId,
  createdBy,
  options = {},
) {
  const supabase = supabaseAdmin;

  try {
    // Get prescription with items and patient info
    const { data: prescription, error: prescError } = await supabase
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        *,
        patient:patient_id(id, full_name, email, phone),
        doctor:doctor_id(id, user:user_id(full_name), consultation_fee),
        appointment:appointment_id(id, date, service),
        items:prescription_items(
          id,
          medication_name,
          dosage,
          frequency,
          duration,
          quantity,
          instructions,
          inventory_item_id,
          is_billable,
          unit_price
        )
      `,
      )
      .eq("id", prescriptionId)
      .single();

    if (prescError || !prescription) {
      return { success: false, error: "Prescription not found" };
    }

    // Check if prescription already has an invoice
    if (prescription.invoice_id) {
      return {
        success: false,
        error: "Prescription already has an invoice",
        existingInvoiceId: prescription.invoice_id,
      };
    }

    // Get billing settings
    const { settings } = await getBillingSettings();
    const taxEnabled =
      settings.tax_enabled === true || settings.tax_enabled === "true";
    const defaultTaxRate = parseFloat(settings.default_tax_rate) || 0;
    const paymentDueDays = parseInt(settings.payment_due_days) || 7;
    const clinicState = settings.clinic_state || "Tamil Nadu";

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate invoice date in IST
    const invoiceDate = getTodayIST();
    const dueDateStr = formatDueDateIST(paymentDueDays);

    // Prepare invoice items from prescription items
    const invoiceItems = [];
    let subtotal = 0;

    // Add consultation fee if this is linked to an appointment
    if (
      options.includeConsultation !== false &&
      prescription.appointment_id &&
      prescription.doctor?.consultation_fee
    ) {
      const consultationFee =
        parseFloat(prescription.doctor.consultation_fee) || 0;
      if (consultationFee > 0) {
        const consultationItem = {
          item_type: INVOICE_ITEM_TYPES.CONSULTATION,
          description: `Consultation with ${prescription.doctor?.user?.full_name || "Doctor"}`,
          quantity: 1,
          unit_price: consultationFee,
          unit: "service",
          sort_order: 0,
        };

        // Calculate GST for consultation
        if (taxEnabled) {
          const gstResult = await calculateInvoiceItemWithGST(
            consultationItem,
            {
              taxRate: defaultTaxRate,
              isIGST: false,
              hsnCode: "9983", // HSN for healthcare services
            },
          );
          if (gstResult.success) {
            Object.assign(consultationItem, gstResult.item);
          }
        }

        consultationItem.total = consultationFee;
        subtotal += consultationFee;
        invoiceItems.push(consultationItem);
      }
    }

    // Process prescription medication items
    for (let i = 0; i < (prescription.items || []).length; i++) {
      const item = prescription.items[i];

      // Skip non-billable items (e.g., samples)
      if (item.is_billable === false) {
        continue;
      }

      let unitPrice = parseFloat(item.unit_price) || 0;
      let inventoryItemId = item.inventory_item_id;
      let batchId = null;
      let hsnCode = null;

      // If inventory_item_id is set, get price from inventory
      if (inventoryItemId) {
        const { data: invItem } = await supabase
          .from("inventory_items")
          .select("id, name, selling_price, current_stock")
          .eq("id", inventoryItemId)
          .single();

        if (invItem) {
          unitPrice = parseFloat(invItem.selling_price) || unitPrice;

          // Get best batch (FIFO - First Expiry First Out)
          const { data: batch } = await supabase
            .from("inventory_batches")
            .select("id, selling_price, batch_number, expiry_date")
            .eq("item_id", inventoryItemId)
            .eq("status", "active")
            .gt("available_quantity", 0)
            .order("expiry_date", { ascending: true })
            .limit(1)
            .single();

          if (batch) {
            batchId = batch.id;
            unitPrice = parseFloat(batch.selling_price) || unitPrice;
          }
        }
      } else {
        // Try to find inventory item by name
        const { data: invItem } = await supabase
          .from("inventory_items")
          .select("id, name, selling_price, current_stock")
          .ilike("name", `%${item.medication_name}%`)
          .eq("is_active", true)
          .limit(1)
          .single();

        if (invItem) {
          inventoryItemId = invItem.id;
          unitPrice = parseFloat(invItem.selling_price) || unitPrice;

          // Get best batch
          const { data: batch } = await supabase
            .from("inventory_batches")
            .select("id, selling_price")
            .eq("item_id", inventoryItemId)
            .eq("status", "active")
            .gt("available_quantity", 0)
            .order("expiry_date", { ascending: true })
            .limit(1)
            .single();

          if (batch) {
            batchId = batch.id;
            unitPrice = parseFloat(batch.selling_price) || unitPrice;
          }
        }
      }

      const quantity = parseInt(item.quantity) || 1;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      const invoiceItem = {
        item_type: INVOICE_ITEM_TYPES.MEDICATION,
        description: `${item.medication_name}${item.dosage ? ` - ${item.dosage}` : ""}${item.frequency ? ` (${item.frequency})` : ""}`,
        quantity: quantity,
        unit_price: unitPrice,
        unit: "units",
        inventory_item_id: inventoryItemId,
        batch_id: batchId,
        prescription_id: prescriptionId,
        prescription_item_id: item.id,
        sort_order: i + 1,
        stock_deducted: false,
      };

      // Calculate GST for medication
      if (taxEnabled) {
        const gstResult = await calculateInvoiceItemWithGST(invoiceItem, {
          taxRate: defaultTaxRate,
          isIGST: false,
          hsnCode: hsnCode || "3004", // HSN for medicines
        });
        if (gstResult.success) {
          Object.assign(invoiceItem, gstResult.item);
        }
      }

      invoiceItem.total = lineTotal;
      invoiceItems.push(invoiceItem);
    }

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .insert({
        invoice_number: invoiceNumber,
        patient_id: prescription.patient_id,
        appointment_id: prescription.appointment_id,
        status: INVOICE_STATUS.PENDING,
        subtotal: subtotal,
        tax_rate: taxEnabled ? defaultTaxRate : 0,
        tax_amount: 0,
        discount_amount: options.discountAmount || 0,
        discount_reason: options.discountReason || null,
        total_amount: subtotal,
        amount_paid: 0,
        invoice_date: invoiceDate,
        due_date: dueDateStr,
        notes: options.notes || `Invoice for prescription`,
        internal_notes: options.internalNotes || null,
        created_by: createdBy,
        bill_type: "pharmacy",
        is_quick_bill: false,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Insert invoice items
    const itemsToInsert = invoiceItems.map((item) => ({
      ...item,
      invoice_id: invoice.id,
    }));

    const { error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .insert(itemsToInsert);

    if (itemsError) {
      console.error("Error creating invoice items:", itemsError);
      // Rollback invoice
      await supabase
        .from(BILLING_TABLES.INVOICES)
        .delete()
        .eq("id", invoice.id);
      return { success: false, error: itemsError.message };
    }

    // Recalculate totals with GST
    if (taxEnabled) {
      const totalsResult = await calculateInvoiceTotals(invoice.id);
      if (!totalsResult.success) {
        console.error("Error calculating invoice totals:", totalsResult.error);
      }
    }

    // Update prescription with invoice reference
    await supabase
      .from(TABLES.PRESCRIPTIONS)
      .update({
        invoice_id: invoice.id,
        billing_status: "invoiced",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prescriptionId);

    // Fetch complete invoice with items
    const { data: completeInvoice } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        `
        *,
        items:invoice_items(*),
        patient:patient_id(id, full_name, email, phone)
      `,
      )
      .eq("id", invoice.id)
      .single();

    return {
      success: true,
      invoice: completeInvoice,
      message: "Invoice created successfully from prescription",
    };
  } catch (error) {
    console.error("Error in createInvoiceFromPrescription:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get prescription billing status and invoice details
 * @param {string} prescriptionId - The prescription ID
 */
export async function getPrescriptionBillingStatus(prescriptionId) {
  const supabase = supabaseAdmin;

  try {
    const { data: prescription, error } = await supabase
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        id,
        status,
        billing_status,
        invoice_id,
        invoice:invoice_id(
          id,
          invoice_number,
          status,
          total_amount,
          amount_paid,
          amount_due
        )
      `,
      )
      .eq("id", prescriptionId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      prescription,
      hasInvoice: !!prescription.invoice_id,
      invoiceStatus: prescription.invoice?.status || null,
      canDispense:
        prescription.invoice?.status === INVOICE_STATUS.PAID ||
        prescription.invoice?.status === INVOICE_STATUS.PARTIAL,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if prescription can be dispensed (requires paid/partial invoice)
 * @param {string} prescriptionId - The prescription ID
 */
export async function canDispensePrescription(prescriptionId) {
  const supabase = supabaseAdmin;

  try {
    const { data: prescription, error } = await supabase
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        id,
        status,
        billing_status,
        invoice_id,
        invoice:invoice_id(
          id,
          invoice_number,
          status,
          total_amount,
          amount_paid
        )
      `,
      )
      .eq("id", prescriptionId)
      .single();

    if (error) {
      return { success: false, canDispense: false, error: error.message };
    }

    // Check if already dispensed
    if (prescription.status === "dispensed") {
      return {
        success: true,
        canDispense: false,
        reason: "Prescription already dispensed",
      };
    }

    // Check if cancelled
    if (prescription.status === "cancelled") {
      return {
        success: true,
        canDispense: false,
        reason: "Prescription is cancelled",
      };
    }

    // Check for invoice
    if (!prescription.invoice_id) {
      return {
        success: true,
        canDispense: false,
        reason:
          "No invoice created for this prescription. Create an invoice first.",
        needsInvoice: true,
      };
    }

    // Check invoice status - must be paid or partial
    const allowedStatuses = [INVOICE_STATUS.PAID, INVOICE_STATUS.PARTIAL];
    if (!allowedStatuses.includes(prescription.invoice?.status)) {
      return {
        success: true,
        canDispense: false,
        reason: `Invoice must be paid before dispensing. Current status: ${prescription.invoice?.status}`,
        invoiceId: prescription.invoice_id,
        invoiceNumber: prescription.invoice?.invoice_number,
        needsPayment: true,
      };
    }

    return {
      success: true,
      canDispense: true,
      invoiceId: prescription.invoice_id,
      invoiceNumber: prescription.invoice?.invoice_number,
      amountPaid: prescription.invoice?.amount_paid,
    };
  } catch (error) {
    return { success: false, canDispense: false, error: error.message };
  }
}

/**
 * Search inventory items for prescription autocomplete
 * @param {string} query - Search query
 * @param {object} options - Search options
 */
export async function searchInventoryForPrescription(query, options = {}) {
  const supabase = supabaseAdmin;
  const { limit = 10, categoryType = "medication" } = options;

  try {
    let searchQuery = supabase
      .from("inventory_items")
      .select(
        `
        id,
        name,
        generic_name,
        strength,
        dosage_form,
        potency,
        selling_price,
        current_stock,
        unit_of_measure,
        requires_prescription
      `,
      )
      .eq("is_active", true)
      .eq("item_type", categoryType)
      .gt("current_stock", 0);

    if (query) {
      searchQuery = searchQuery.or(
        `name.ilike.%${query}%,generic_name.ilike.%${query}%`,
      );
    }

    const { data, error } = await searchQuery
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, items: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update prescription billing status based on invoice status
 * @param {string} invoiceId - The invoice ID
 */
export async function syncPrescriptionBillingStatus(invoiceId) {
  const supabase = supabaseAdmin;

  try {
    // Get invoice status
    const { data: invoice, error: invError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("id, status")
      .eq("id", invoiceId)
      .single();

    if (invError || !invoice) {
      return { success: false, error: "Invoice not found" };
    }

    // Map invoice status to billing status
    let billingStatus = "invoiced";
    if (invoice.status === INVOICE_STATUS.PAID) {
      billingStatus = "paid";
    } else if (invoice.status === INVOICE_STATUS.PARTIAL) {
      billingStatus = "partial";
    } else if (
      invoice.status === INVOICE_STATUS.CANCELLED ||
      invoice.status === INVOICE_STATUS.REFUNDED
    ) {
      billingStatus = "unbilled";
    }

    // Update prescriptions linked to this invoice
    const { error: updateError } = await supabase
      .from(TABLES.PRESCRIPTIONS)
      .update({
        billing_status: billingStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("invoice_id", invoiceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, billingStatus };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get prescriptions awaiting billing (unbilled prescriptions)
 * @param {object} options - Filter options
 */
export async function getPrescriptionsAwaitingBilling(options = {}) {
  const supabase = supabaseAdmin;
  const { page = 1, limit = 20, patientId = null } = options;

  try {
    let query = supabase
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        *,
        patient:patient_id(id, full_name, email, phone),
        doctor:doctor_id(id, user:user_id(full_name)),
        items:prescription_items(
          id,
          medication_name,
          quantity,
          inventory_item_id,
          is_billable
        )
      `,
        { count: "exact" },
      )
      .eq("billing_status", "unbilled")
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false });

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      prescriptions: data,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
