"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  INVOICE_ITEM_TYPES,
} from "@/lib/billing.constants";
import {
  createInvoiceLedgerEntry,
  createPaymentLedgerEntry,
  createRefundLedgerEntry,
} from "./ledger.actions";
import {
  auditInvoiceCreate,
  auditInvoiceUpdate,
  auditInvoiceStatusChange,
  auditPaymentCreate,
  auditRefundCreate,
  auditSettingChange,
} from "./audit.actions";
import {
  deductStockForInvoice,
  restoreStockForCancelledInvoice,
} from "./inventory-billing.actions";
import {
  calculateInvoiceItemWithGST,
  calculateInvoiceTotals,
} from "./gst.actions";

// =============================================
// BILLING SETTINGS ACTIONS
// =============================================

export async function getBillingSettings() {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from(BILLING_TABLES.BILLING_SETTINGS)
    .select("*")
    .order("category", { ascending: true });

  if (error) {
    console.error("Error fetching billing settings:", error);
    return { success: false, error: error.message };
  }

  // Convert to key-value object for easier access
  const settings = {};
  data.forEach((setting) => {
    settings[setting.setting_key] = setting.setting_value;
  });

  return { success: true, settings, rawSettings: data };
}

export async function updateBillingSetting(settingKey, settingValue) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from(BILLING_TABLES.BILLING_SETTINGS)
    .update({
      setting_value: settingValue,
      updated_at: new Date().toISOString(),
    })
    .eq("setting_key", settingKey)
    .select()
    .single();

  if (error) {
    console.error("Error updating billing setting:", error);
    return { success: false, error: error.message };
  }

  return { success: true, setting: data };
}

export async function updateBillingSettings(settings) {
  const supabase = supabaseAdmin;
  const updates = [];

  for (const [key, value] of Object.entries(settings)) {
    updates.push(
      supabase
        .from(BILLING_TABLES.BILLING_SETTINGS)
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq("setting_key", key)
    );
  }

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);

  if (errors.length > 0) {
    console.error("Error updating billing settings:", errors);
    return { success: false, error: "Failed to update some settings" };
  }

  return { success: true };
}

// =============================================
// INVOICE ACTIONS
// =============================================

export async function generateInvoiceNumber() {
  const supabase = supabaseAdmin;

  // Get prefix from settings
  const { data: prefixSetting } = await supabase
    .from(BILLING_TABLES.BILLING_SETTINGS)
    .select("setting_value")
    .eq("setting_key", "invoice_prefix")
    .single();

  const prefix = prefixSetting?.setting_value?.replace(/"/g, "") || "INV";

  // Get the next invoice number
  const { data: lastInvoice } = await supabase
    .from(BILLING_TABLES.INVOICES)
    .select("invoice_number")
    .like("invoice_number", `${prefix}-%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1001;
  if (lastInvoice?.invoice_number) {
    const match = lastInvoice.invoice_number.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `${prefix}-${String(nextNum).padStart(6, "0")}`;
}

export async function createInvoice(invoiceData) {
  const supabase = supabaseAdmin;

  try {
    // Generate invoice number if not provided
    const invoiceNumber =
      invoiceData.invoice_number || (await generateInvoiceNumber());

    // Get default settings
    const { settings } = await getBillingSettings();
    const paymentDueDays = parseInt(settings.payment_due_days) || 7;
    const defaultTaxRate = parseFloat(settings.default_tax_rate) || 0;
    const taxEnabled =
      settings.tax_enabled === true || settings.tax_enabled === "true";

    // Calculate due date
    const invoiceDate =
      invoiceData.invoice_date || new Date().toISOString().split("T")[0];
    const dueDate =
      invoiceData.due_date ||
      new Date(
        new Date(invoiceDate).getTime() + paymentDueDays * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .insert({
        invoice_number: invoiceNumber,
        patient_id: invoiceData.patient_id,
        appointment_id: invoiceData.appointment_id || null,
        status: invoiceData.status || INVOICE_STATUS.DRAFT,
        subtotal: 0,
        tax_rate: taxEnabled ? invoiceData.tax_rate ?? defaultTaxRate : 0,
        tax_amount: 0,
        discount_amount: invoiceData.discount_amount || 0,
        discount_reason: invoiceData.discount_reason || null,
        total_amount: 0,
        amount_paid: 0,
        invoice_date: invoiceDate,
        due_date: dueDate,
        notes: invoiceData.notes || null,
        internal_notes: invoiceData.internal_notes || null,
        created_by: invoiceData.created_by || null,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Add invoice items if provided
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsResult = await addInvoiceItems(invoice.id, invoiceData.items, {
        defaultTaxRate: taxEnabled ? defaultTaxRate : 0,
      });

      if (!itemsResult.success) {
        // Rollback invoice creation
        await supabase
          .from(BILLING_TABLES.INVOICES)
          .delete()
          .eq("id", invoice.id);
        return { success: false, error: itemsResult.error };
      }

      // Refresh invoice to get updated totals
      const { data: updatedInvoice, error: refreshError } = await supabase
        .from(BILLING_TABLES.INVOICES)
        .select("*")
        .eq("id", invoice.id)
        .single();

      if (refreshError) {
        return { success: false, error: refreshError.message };
      }

      // Create ledger entry for new invoice
      await createInvoiceLedgerEntry(updatedInvoice, invoiceData.created_by);

      // Create audit log for invoice creation
      await auditInvoiceCreate(
        updatedInvoice,
        itemsResult.items,
        invoiceData.created_by
      );

      return {
        success: true,
        invoice: updatedInvoice,
        items: itemsResult.items,
      };
    }

    return { success: true, invoice };
  } catch (error) {
    console.error("Error in createInvoice:", error);
    return { success: false, error: error.message };
  }
}

export async function addInvoiceItems(invoiceId, items, options = {}) {
  const supabase = supabaseAdmin;
  const { defaultTaxRate = 0 } = options;

  try {
    const itemsToInsert = items.map((item, index) => {
      const quantity = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const discountPercent = parseFloat(item.discount_percent) || 0;
      const taxRate = parseFloat(item.tax_rate) ?? defaultTaxRate;

      const subtotal = quantity * unitPrice;
      const discountAmount = (subtotal * discountPercent) / 100;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const total = taxableAmount + taxAmount;

      return {
        invoice_id: invoiceId,
        item_type: item.item_type || INVOICE_ITEM_TYPES.SERVICE,
        description: item.description,
        quantity: quantity,
        unit: item.unit || "unit",
        unit_price: unitPrice,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: total,
        reference_type: item.reference_type || null,
        reference_id: item.reference_id || null,
        sort_order: item.sort_order ?? index,
      };
    });

    const { data, error } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error("Error adding invoice items:", error);
      return { success: false, error: error.message };
    }

    return { success: true, items: data };
  } catch (error) {
    console.error("Error in addInvoiceItems:", error);
    return { success: false, error: error.message };
  }
}

export async function updateInvoiceItem(itemId, itemData) {
  const supabase = supabaseAdmin;

  try {
    const quantity = parseFloat(itemData.quantity) || 1;
    const unitPrice = parseFloat(itemData.unit_price) || 0;
    const discountPercent = parseFloat(itemData.discount_percent) || 0;
    const taxRate = parseFloat(itemData.tax_rate) || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = (subtotal * discountPercent) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    const { data, error } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .update({
        item_type: itemData.item_type,
        description: itemData.description,
        quantity: quantity,
        unit: itemData.unit || "unit",
        unit_price: unitPrice,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total: total,
        reference_type: itemData.reference_type || null,
        reference_id: itemData.reference_id || null,
        sort_order: itemData.sort_order,
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      console.error("Error updating invoice item:", error);
      return { success: false, error: error.message };
    }

    return { success: true, item: data };
  } catch (error) {
    console.error("Error in updateInvoiceItem:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteInvoiceItem(itemId) {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from(BILLING_TABLES.INVOICE_ITEMS)
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Error deleting invoice item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getInvoices(options = {}) {
  const supabase = supabaseAdmin;
  const {
    page = 1,
    limit = 20,
    status,
    patientId,
    appointmentId,
    startDate,
    endDate,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
  } = options;

  try {
    let query = supabase.from(BILLING_TABLES.INVOICES).select(
      `
        *,
        patient:users!invoices_patient_id_fkey(id, full_name, email, phone),
        appointment:appointments(id, date, reason_for_visit),
        created_by_user:users!invoices_created_by_fkey(id, full_name)
      `,
      { count: "exact" }
    );

    // Apply filters
    if (status) {
      if (Array.isArray(status)) {
        query = query.in("status", status);
      } else {
        query = query.eq("status", status);
      }
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    if (appointmentId) {
      query = query.eq("appointment_id", appointmentId);
    }

    if (startDate) {
      query = query.gte("invoice_date", startDate);
    }

    if (endDate) {
      query = query.lte("invoice_date", endDate);
    }

    if (search) {
      // Note: Can only search on direct columns, not joined tables
      query = query.ilike("invoice_number", `%${search}%`);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching invoices:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      invoices: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasMore: from + data.length < count,
      },
    };
  } catch (error) {
    console.error("Error in getInvoices:", error);
    return { success: false, error: error.message };
  }
}

export async function getInvoiceById(invoiceId) {
  const supabase = supabaseAdmin;

  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        `
        *,
        patient:users!invoices_patient_id_fkey(id, full_name, email, phone, address),
        appointment:appointments(id, date, reason_for_visit, doctor:doctors(id, user:users(full_name), specialization, consultation_fee)),
        created_by_user:users!invoices_created_by_fkey(id, full_name)
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Fetch invoice items
    const { data: items, error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("sort_order", { ascending: true });

    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError);
      return { success: false, error: itemsError.message };
    }

    // Fetch payments
    const { data: payments, error: paymentsError } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .select(
        `
        *,
        received_by_user:users!payments_received_by_fkey(id, full_name)
      `
      )
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: false });

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
      return { success: false, error: paymentsError.message };
    }

    return {
      success: true,
      invoice: {
        ...invoice,
        items,
        payments,
      },
    };
  } catch (error) {
    console.error("Error in getInvoiceById:", error);
    return { success: false, error: error.message };
  }
}

export async function updateInvoice(invoiceId, invoiceData) {
  const supabase = supabaseAdmin;

  try {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are provided
    if (invoiceData.status !== undefined)
      updateData.status = invoiceData.status;
    if (invoiceData.discount_amount !== undefined)
      updateData.discount_amount = invoiceData.discount_amount;
    if (invoiceData.discount_reason !== undefined)
      updateData.discount_reason = invoiceData.discount_reason;
    if (invoiceData.tax_rate !== undefined)
      updateData.tax_rate = invoiceData.tax_rate;
    if (invoiceData.due_date !== undefined)
      updateData.due_date = invoiceData.due_date;
    if (invoiceData.notes !== undefined) updateData.notes = invoiceData.notes;
    if (invoiceData.internal_notes !== undefined)
      updateData.internal_notes = invoiceData.internal_notes;
    if (invoiceData.updated_by !== undefined)
      updateData.updated_by = invoiceData.updated_by;

    const { data, error } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .update(updateData)
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) {
      console.error("Error updating invoice:", error);
      return { success: false, error: error.message };
    }

    return { success: true, invoice: data };
  } catch (error) {
    console.error("Error in updateInvoice:", error);
    return { success: false, error: error.message };
  }
}

export async function updateInvoiceStatus(invoiceId, status, options = {}) {
  const supabase = supabaseAdmin;

  try {
    // Get current invoice state for audit
    const { data: oldInvoice } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("*")
      .eq("id", invoiceId)
      .single();

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (options.updatedBy) {
      updateData.updated_by = options.updatedBy;
    }

    if (status === INVOICE_STATUS.CANCELLED) {
      // Cancel any pending payments
      await supabase
        .from(BILLING_TABLES.PAYMENTS)
        .update({ status: PAYMENT_STATUS.CANCELLED })
        .eq("invoice_id", invoiceId)
        .eq("status", PAYMENT_STATUS.PENDING);

      // Restore stock for cancelled invoice (if previously paid)
      if (oldInvoice?.status === INVOICE_STATUS.PAID) {
        await restoreStockForCancelledInvoice(invoiceId, options.updatedBy);
      }
    }

    const { data, error } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .update(updateData)
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) {
      console.error("Error updating invoice status:", error);
      return { success: false, error: error.message };
    }

    // Create audit log for status change
    await auditInvoiceStatusChange(
      data,
      oldInvoice?.status,
      status,
      options.updatedBy
    );

    return { success: true, invoice: data };
  } catch (error) {
    console.error("Error in updateInvoiceStatus:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteInvoice(invoiceId) {
  const supabase = supabaseAdmin;

  try {
    // Check if invoice has any completed payments
    const { data: payments } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .select("id")
      .eq("invoice_id", invoiceId)
      .eq("status", PAYMENT_STATUS.COMPLETED);

    if (payments && payments.length > 0) {
      return {
        success: false,
        error:
          "Cannot delete invoice with completed payments. Cancel the invoice instead.",
      };
    }

    // Delete the invoice (cascade will delete items)
    const { error } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .delete()
      .eq("id", invoiceId);

    if (error) {
      console.error("Error deleting invoice:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteInvoice:", error);
    return { success: false, error: error.message };
  }
}

// =============================================
// PAYMENT ACTIONS
// =============================================

export async function addPayment(paymentData) {
  const supabase = supabaseAdmin;

  try {
    // Validate invoice exists and is payable
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        "id, invoice_number, total_amount, amount_paid, status, patient_id"
      )
      .eq("id", paymentData.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: "Invoice not found" };
    }

    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      return {
        success: false,
        error: "Cannot add payment to a cancelled invoice",
      };
    }

    if (invoice.status === INVOICE_STATUS.PAID) {
      return { success: false, error: "Invoice is already fully paid" };
    }

    const amountDue = invoice.total_amount - invoice.amount_paid;
    const paymentAmount = parseFloat(paymentData.amount);

    if (paymentAmount > amountDue) {
      return {
        success: false,
        error: `Payment amount (${paymentAmount}) exceeds amount due (${amountDue})`,
      };
    }

    // Create the payment
    const { data: payment, error: paymentError } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .insert({
        invoice_id: paymentData.invoice_id,
        patient_id: paymentData.patient_id,
        amount: paymentAmount,
        payment_method: paymentData.payment_method,
        status: paymentData.status || PAYMENT_STATUS.COMPLETED,
        transaction_reference: paymentData.transaction_reference || null,
        payment_date: paymentData.payment_date || new Date().toISOString(),
        payment_gateway: paymentData.payment_gateway || null,
        gateway_order_id: paymentData.gateway_order_id || null,
        gateway_payment_id: paymentData.gateway_payment_id || null,
        gateway_signature: paymentData.gateway_signature || null,
        gateway_response: paymentData.gateway_response || null,
        notes: paymentData.notes || null,
        received_by: paymentData.received_by || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error adding payment:", paymentError);
      return { success: false, error: paymentError.message };
    }

    // Create ledger entry for payment
    await createPaymentLedgerEntry(payment, invoice, paymentData.received_by);

    // Create audit log
    await auditPaymentCreate(payment, invoice, paymentData.received_by);

    // Refresh invoice to get updated status (trigger handles this)
    const { data: updatedInvoice } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("*")
      .eq("id", paymentData.invoice_id)
      .single();

    // If invoice is now fully paid, deduct stock for medication items
    if (updatedInvoice.status === INVOICE_STATUS.PAID) {
      await deductStockForInvoice(
        paymentData.invoice_id,
        paymentData.received_by
      );
    }

    return {
      success: true,
      payment,
      invoice: updatedInvoice,
    };
  } catch (error) {
    console.error("Error in addPayment:", error);
    return { success: false, error: error.message };
  }
}

export async function getPayments(options = {}) {
  const supabase = supabaseAdmin;
  const {
    page = 1,
    limit = 20,
    invoiceId,
    patientId,
    paymentMethod,
    status,
    startDate,
    endDate,
    sortBy = "payment_date",
    sortOrder = "desc",
  } = options;

  try {
    let query = supabase.from(BILLING_TABLES.PAYMENTS).select(
      `
        *,
        invoice:invoices(id, invoice_number, total_amount),
        patient:users!payments_patient_id_fkey(id, full_name, email, phone),
        received_by_user:users!payments_received_by_fkey(id, full_name)
      `,
      { count: "exact" }
    );

    if (invoiceId) {
      query = query.eq("invoice_id", invoiceId);
    }

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (startDate) {
      query = query.gte("payment_date", startDate);
    }

    if (endDate) {
      query = query.lte("payment_date", endDate);
    }

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching payments:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      payments: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasMore: from + data.length < count,
      },
    };
  } catch (error) {
    console.error("Error in getPayments:", error);
    return { success: false, error: error.message };
  }
}

export async function updatePaymentStatus(paymentId, status, options = {}) {
  const supabase = supabaseAdmin;

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .update(updateData)
      .eq("id", paymentId)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment status:", error);
      return { success: false, error: error.message };
    }

    return { success: true, payment: data };
  } catch (error) {
    console.error("Error in updatePaymentStatus:", error);
    return { success: false, error: error.message };
  }
}

// =============================================
// REFUND ACTIONS
// =============================================

export async function createRefund(refundData) {
  const supabase = supabaseAdmin;

  try {
    // Get the payment
    const { data: payment, error: paymentError } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .select("*, invoice:invoices(id, amount_paid, status)")
      .eq("id", refundData.payment_id)
      .single();

    if (paymentError || !payment) {
      return { success: false, error: "Payment not found" };
    }

    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      return { success: false, error: "Can only refund completed payments" };
    }

    // Check refund amount doesn't exceed payment
    const existingRefunds = await supabase
      .from(BILLING_TABLES.PAYMENT_REFUNDS)
      .select("amount")
      .eq("payment_id", refundData.payment_id)
      .eq("status", "completed");

    const totalRefunded = (existingRefunds.data || []).reduce(
      (sum, r) => sum + parseFloat(r.amount),
      0
    );

    const refundAmount = parseFloat(refundData.amount);
    if (totalRefunded + refundAmount > parseFloat(payment.amount)) {
      return {
        success: false,
        error: "Refund amount exceeds available payment amount",
      };
    }

    // Create the refund
    const { data: refund, error: refundError } = await supabase
      .from(BILLING_TABLES.PAYMENT_REFUNDS)
      .insert({
        payment_id: refundData.payment_id,
        invoice_id: payment.invoice_id,
        amount: refundAmount,
        reason: refundData.reason,
        status: refundData.status || "completed",
        gateway_refund_id: refundData.gateway_refund_id || null,
        gateway_response: refundData.gateway_response || null,
        refunded_by: refundData.refunded_by || null,
      })
      .select()
      .single();

    if (refundError) {
      console.error("Error creating refund:", refundError);
      return { success: false, error: refundError.message };
    }

    // Update invoice amount_paid
    const newAmountPaid =
      parseFloat(payment.invoice.amount_paid) - refundAmount;

    const { data: updatedInvoice } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .update({
        amount_paid: newAmountPaid,
        status:
          newAmountPaid <= 0
            ? INVOICE_STATUS.REFUNDED
            : newAmountPaid < payment.invoice.total_amount
            ? INVOICE_STATUS.PARTIAL
            : INVOICE_STATUS.PAID,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.invoice_id)
      .select()
      .single();

    // Create ledger entry for refund
    await createRefundLedgerEntry(
      refund,
      updatedInvoice || payment.invoice,
      refundData.refunded_by
    );

    // Create audit log
    await auditRefundCreate(
      refund,
      updatedInvoice || payment.invoice,
      refundData.refunded_by
    );

    return { success: true, refund };
  } catch (error) {
    console.error("Error in createRefund:", error);
    return { success: false, error: error.message };
  }
}

// =============================================
// REPORTING ACTIONS
// =============================================

export async function getRevenueReport(options = {}) {
  const supabase = supabaseAdmin;
  const { startDate, endDate, groupBy = "day" } = options;

  try {
    let query = supabase
      .from(BILLING_TABLES.PAYMENTS)
      .select("amount, payment_method, payment_date, status")
      .eq("status", PAYMENT_STATUS.COMPLETED);

    if (startDate) {
      query = query.gte("payment_date", startDate);
    }

    if (endDate) {
      query = query.lte("payment_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching revenue data:", error);
      return { success: false, error: error.message };
    }

    // Process data for report
    const totalRevenue = data.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Group by payment method
    const byPaymentMethod = data.reduce((acc, p) => {
      const method = p.payment_method;
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      acc[method].total += parseFloat(p.amount);
      return acc;
    }, {});

    // Group by date
    const byDate = data.reduce((acc, p) => {
      let dateKey;
      const date = new Date(p.payment_date);

      switch (groupBy) {
        case "month":
          dateKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          break;
        case "week":
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          dateKey = weekStart.toISOString().split("T")[0];
          break;
        default:
          dateKey = date.toISOString().split("T")[0];
      }

      if (!acc[dateKey]) {
        acc[dateKey] = { count: 0, total: 0 };
      }
      acc[dateKey].count++;
      acc[dateKey].total += parseFloat(p.amount);
      return acc;
    }, {});

    return {
      success: true,
      report: {
        totalRevenue,
        transactionCount: data.length,
        byPaymentMethod,
        byDate: Object.entries(byDate)
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date)),
      },
    };
  } catch (error) {
    console.error("Error in getRevenueReport:", error);
    return { success: false, error: error.message };
  }
}

export async function getOutstandingInvoices(options = {}) {
  const supabase = supabaseAdmin;
  const { page = 1, limit = 20 } = options;

  try {
    const { data, error, count } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        `
        *,
        patient:users!invoices_patient_id_fkey(id, full_name, email, phone)
      `,
        { count: "exact" }
      )
      .in("status", [INVOICE_STATUS.PENDING, INVOICE_STATUS.PARTIAL])
      .order("due_date", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Error fetching outstanding invoices:", error);
      return { success: false, error: error.message };
    }

    const totalOutstanding = data.reduce(
      (sum, inv) =>
        sum + (parseFloat(inv.total_amount) - parseFloat(inv.amount_paid)),
      0
    );

    return {
      success: true,
      invoices: data,
      totalOutstanding,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getOutstandingInvoices:", error);
    return { success: false, error: error.message };
  }
}

export async function getBillingDashboardStats() {
  const supabase = supabaseAdmin;

  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const startOfDay = today.toISOString().split("T")[0];

    // Get invoice stats
    const { data: invoiceStats } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("status, total_amount, amount_paid");

    // Get today's payments
    const { data: todayPayments } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .select("amount")
      .eq("status", PAYMENT_STATUS.COMPLETED)
      .gte("payment_date", startOfDay);

    // Get this month's payments
    const { data: monthPayments } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .select("amount")
      .eq("status", PAYMENT_STATUS.COMPLETED)
      .gte("payment_date", startOfMonth);

    // Calculate stats
    const stats = {
      totalInvoices: invoiceStats?.length || 0,
      pendingInvoices:
        invoiceStats?.filter(
          (i) =>
            i.status === INVOICE_STATUS.PENDING ||
            i.status === INVOICE_STATUS.PARTIAL
        ).length || 0,
      paidInvoices:
        invoiceStats?.filter((i) => i.status === INVOICE_STATUS.PAID).length ||
        0,
      totalOutstanding:
        invoiceStats
          ?.filter(
            (i) =>
              i.status === INVOICE_STATUS.PENDING ||
              i.status === INVOICE_STATUS.PARTIAL
          )
          .reduce(
            (sum, i) =>
              sum + (parseFloat(i.total_amount) - parseFloat(i.amount_paid)),
            0
          ) || 0,
      todayRevenue:
        todayPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
      monthRevenue:
        monthPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Error in getBillingDashboardStats:", error);
    return { success: false, error: error.message };
  }
}

// =============================================
// PATIENT BILLING ACTIONS
// =============================================

export async function getPatientBillingHistory(patientId, options = {}) {
  const supabase = supabaseAdmin;
  const { page = 1, limit = 10 } = options;

  try {
    const {
      data: invoices,
      error,
      count,
    } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        `
        *,
        appointment:appointments(id, date, reason_for_visit)
      `,
        { count: "exact" }
      )
      .eq("patient_id", patientId)
      .order("invoice_date", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Error fetching patient billing history:", error);
      return { success: false, error: error.message };
    }

    // Calculate totals
    const totalBilled =
      invoices?.reduce((sum, i) => sum + parseFloat(i.total_amount), 0) || 0;
    const totalPaid =
      invoices?.reduce((sum, i) => sum + parseFloat(i.amount_paid), 0) || 0;

    return {
      success: true,
      invoices,
      summary: {
        totalBilled,
        totalPaid,
        totalDue: totalBilled - totalPaid,
      },
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getPatientBillingHistory:", error);
    return { success: false, error: error.message };
  }
}

// =============================================
// INVOICE GENERATION FROM APPOINTMENTS
// =============================================

export async function createInvoiceFromAppointment(
  appointmentId,
  options = {}
) {
  const supabase = supabaseAdmin;

  try {
    // Get billing settings to check if auto consultation fee is enabled
    const { settings } = await getBillingSettings();
    const autoAddConsultationFee =
      settings?.auto_add_consultation_fee !== false;

    // Get appointment details with doctor info
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select(
        `
        *,
        doctor:doctors(id, user_id, consultation_fee, specialization, user:users(full_name))
      `
      )
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Check if invoice already exists for this appointment
    const { data: existingInvoice } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("id, invoice_number")
      .eq("appointment_id", appointmentId)
      .single();

    if (existingInvoice) {
      return {
        success: false,
        error: `Invoice ${existingInvoice.invoice_number} already exists for this appointment`,
        existingInvoice,
      };
    }

    // Build invoice items - only add consultation fee if enabled and fee is set
    const items = [];

    if (autoAddConsultationFee && appointment.doctor?.consultation_fee > 0) {
      items.push({
        item_type: INVOICE_ITEM_TYPES.CONSULTATION,
        description: `Consultation - Dr. ${
          appointment.doctor?.user?.full_name || "Doctor"
        } (${appointment.doctor?.specialization || "General"})`,
        quantity: 1,
        unit: "session",
        unit_price: appointment.doctor?.consultation_fee || 0,
        reference_type: "appointment",
        reference_id: appointmentId,
      });
    }

    const result = await createInvoice({
      patient_id: appointment.patient_id,
      appointment_id: appointmentId,
      status: options.status || INVOICE_STATUS.PENDING,
      items,
      notes: `Consultation on ${new Date(
        appointment.date
      ).toLocaleDateString()}${
        !autoAddConsultationFee ? " (Auto consultation fee disabled)" : ""
      }`,
      created_by: options.created_by,
    });

    return result;
  } catch (error) {
    console.error("Error in createInvoiceFromAppointment:", error);
    return { success: false, error: error.message };
  }
}

export async function addPrescriptionItemsToInvoice(invoiceId, prescriptionId) {
  const supabase = supabaseAdmin;

  try {
    // Get prescription items with inventory links
    const { data: prescriptionItems, error: itemsError } = await supabase
      .from("prescription_items")
      .select("*")
      .eq("prescription_id", prescriptionId);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    if (!prescriptionItems || prescriptionItems.length === 0) {
      return { success: false, error: "No prescription items found" };
    }

    // Get inventory items for pricing
    const items = [];
    for (const pi of prescriptionItems) {
      // Try to find matching inventory item
      const { data: inventoryItem } = await supabase
        .from("inventory_items")
        .select("id, name, selling_price")
        .ilike("name", `%${pi.medication_name}%`)
        .limit(1)
        .single();

      items.push({
        item_type: INVOICE_ITEM_TYPES.MEDICATION,
        description: `${pi.medication_name} - ${pi.dosage} (${pi.frequency})`,
        quantity: pi.quantity || 1,
        unit: "units",
        unit_price: inventoryItem?.selling_price || 0,
        reference_type: "prescription_item",
        reference_id: pi.id,
      });
    }

    const result = await addInvoiceItems(invoiceId, items);
    return result;
  } catch (error) {
    console.error("Error in addPrescriptionItemsToInvoice:", error);
    return { success: false, error: error.message };
  }
}
