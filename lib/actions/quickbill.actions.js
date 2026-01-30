"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  INVOICE_ITEM_TYPES,
  BILL_TYPES,
} from "@/lib/billing.constants";
import { generateInvoiceNumber, getBillingSettings } from "./billing.actions";
import {
  createInvoiceLedgerEntry,
  createPaymentLedgerEntry,
} from "./ledger.actions";
import { auditInvoiceCreate, auditPaymentCreate } from "./audit.actions";
import {
  deductStockForInvoice,
  checkStockAvailability,
} from "./inventory-billing.actions";
import {
  calculateInvoiceItemWithGST,
  calculateInvoiceTotals,
  getDefaultGSTRate,
  getDefaultHSNCode,
} from "./gst.actions";

// =============================================
// QUICK BILL ACTIONS
// =============================================

/**
 * Create a quick bill - streamlined flow for reception
 * Select patient → Select doctor → Enter amount → Pay → Print
 * @param {Object} params - Quick bill parameters
 * @param {string} params.patientId - Patient UUID
 * @param {string} params.doctorId - Doctor UUID (optional)
 * @param {number} params.consultationFee - Consultation fee amount
 * @param {string} params.paymentMethod - Payment method
 * @param {string} params.createdBy - User creating the bill
 * @param {Array} params.additionalItems - Additional items (optional)
 */
export async function createQuickBill(params) {
  const supabase = supabaseAdmin;

  try {
    // Normalize parameter names (handle both camelCase and snake_case)
    const patientId = params.patientId || params.patient_id;
    const doctorId = params.doctorId || params.doctor_id;
    const createdBy = params.createdBy || params.created_by;
    const paymentMethod = params.paymentMethod || params.payment_method;
    const appointmentId = params.appointmentId || params.appointment_id;

    // Get billing settings
    const { settings } = await getBillingSettings();
    const taxEnabled =
      settings.tax_enabled === true || settings.tax_enabled === "true";
    const defaultTaxRate = parseFloat(settings.default_tax_rate) || 0;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Build invoice items
    const items = [];
    let doctorName = "Doctor";
    let specialization = "Consultation";

    // Get doctor details if provided
    if (doctorId) {
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id, specialization, consultation_fee, user:users(full_name)")
        .eq("id", doctorId)
        .single();

      if (doctor) {
        doctorName = doctor.user?.full_name || "Doctor";
        specialization = doctor.specialization || "General";
      }
    }

    // Handle items array format (from quick bill page)
    if (params.items && params.items.length > 0) {
      for (const item of params.items) {
        const gstRate = taxEnabled
          ? item.tax_rate ?? getDefaultGSTRate(item.item_type)
          : 0;
        const itemCalc = calculateInvoiceItemWithGST(
          {
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            discount_percent: item.discount_percent || 0,
            tax_rate: gstRate,
          },
          params.isIgst || false
        );

        // If it's a consultation item and we have doctor info, append doctor name
        let description = item.description;
        if (
          item.item_type === "consultation" &&
          doctorId &&
          !description.includes("Dr.")
        ) {
          description = `${description} - Dr. ${doctorName} (${specialization})`;
        }

        items.push({
          item_type: item.item_type || INVOICE_ITEM_TYPES.SERVICE,
          description,
          quantity: item.quantity || 1,
          unit: item.unit || "unit",
          unit_price: item.unit_price || 0,
          hsn_code: item.hsn_code || getDefaultHSNCode(item.item_type),
          inventory_item_id: item.inventory_item_id || null,
          batch_id: item.batch_id || null,
          ...itemCalc,
        });
      }
    }

    // Add consultation fee (legacy format support)
    const consultationFee = parseFloat(params.consultationFee) || 0;
    if (consultationFee > 0) {
      const gstRate = taxEnabled ? defaultTaxRate : 0;
      const itemCalc = calculateInvoiceItemWithGST(
        {
          quantity: 1,
          unit_price: consultationFee,
          discount_percent: 0,
          tax_rate: gstRate,
        },
        params.isIgst || false
      );

      items.push({
        item_type: INVOICE_ITEM_TYPES.CONSULTATION,
        description: `Consultation - Dr. ${doctorName} (${specialization})`,
        quantity: 1,
        unit: "session",
        unit_price: consultationFee,
        hsn_code: getDefaultHSNCode("consultation"),
        ...itemCalc,
      });
    }

    // Add any additional items (like quick medicine add)
    if (params.additionalItems && params.additionalItems.length > 0) {
      for (const addItem of params.additionalItems) {
        const gstRate = taxEnabled
          ? addItem.tax_rate ?? getDefaultGSTRate(addItem.item_type)
          : 0;
        const itemCalc = calculateInvoiceItemWithGST(
          {
            quantity: addItem.quantity || 1,
            unit_price: addItem.unit_price || 0,
            discount_percent: addItem.discount_percent || 0,
            tax_rate: gstRate,
          },
          params.isIgst || false
        );

        items.push({
          item_type: addItem.item_type || INVOICE_ITEM_TYPES.SERVICE,
          description: addItem.description,
          quantity: addItem.quantity || 1,
          unit: addItem.unit || "unit",
          unit_price: addItem.unit_price || 0,
          hsn_code: addItem.hsn_code || getDefaultHSNCode(addItem.item_type),
          inventory_item_id: addItem.inventory_item_id || null,
          batch_id: addItem.batch_id || null,
          ...itemCalc,
        });
      }
    }

    if (items.length === 0) {
      return { success: false, error: "No items to bill" };
    }

    // Calculate invoice totals
    const invoiceTotals = calculateInvoiceTotals(items);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .insert({
        invoice_number: invoiceNumber,
        patient_id: patientId,
        appointment_id: appointmentId || null,
        status: INVOICE_STATUS.PAID, // Quick bill is paid immediately
        subtotal: invoiceTotals.subtotal,
        tax_rate: taxEnabled ? defaultTaxRate : 0,
        tax_amount: invoiceTotals.tax_amount,
        cgst_amount: invoiceTotals.cgst_amount,
        sgst_amount: invoiceTotals.sgst_amount,
        igst_amount: invoiceTotals.igst_amount,
        is_igst: params.isIgst || false,
        discount_amount: invoiceTotals.discount_amount,
        total_amount: invoiceTotals.total_amount,
        amount_paid: invoiceTotals.total_amount,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date().toISOString().split("T")[0],
        paid_at: new Date().toISOString(),
        notes: params.notes || "Quick Bill",
        is_quick_bill: true,
        bill_type: BILL_TYPES.QUICK,
        created_by: createdBy,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating quick bill invoice:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Insert invoice items
    const itemsToInsert = items.map((item, index) => ({
      invoice_id: invoice.id,
      ...item,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback invoice
      await supabase
        .from(BILLING_TABLES.INVOICES)
        .delete()
        .eq("id", invoice.id);
      return { success: false, error: itemsError.message };
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from(BILLING_TABLES.PAYMENTS)
      .insert({
        invoice_id: invoice.id,
        patient_id: patientId,
        amount: invoiceTotals.total_amount,
        payment_method: paymentMethod || "cash",
        status: PAYMENT_STATUS.COMPLETED,
        payment_date: new Date().toISOString(),
        transaction_reference: params.transactionReference || null,
        notes: "Quick Bill Payment",
        received_by: createdBy,
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating quick bill payment:", paymentError);
      // Don't rollback - invoice is created, payment can be added later
    }

    // Create ledger entries
    await createInvoiceLedgerEntry(invoice, createdBy);
    if (payment) {
      await createPaymentLedgerEntry(payment, invoice, createdBy);
    }

    // Create audit logs
    await auditInvoiceCreate(invoice, createdBy);
    if (payment) {
      await auditPaymentCreate(payment, invoice, createdBy);
    }

    // Deduct stock for medication items
    const medicationItems = items.filter(
      (i) =>
        i.inventory_item_id &&
        (i.item_type === "medication" || i.item_type === "supply")
    );
    if (medicationItems.length > 0) {
      await deductStockForInvoice(invoice.id, createdBy);
    }

    return {
      success: true,
      invoice: {
        ...invoice,
        items: itemsToInsert,
        payment,
      },
    };
  } catch (error) {
    console.error("Error in createQuickBill:", error);
    return { success: false, error: error.message };
  }
}

// =============================================
// PHARMACY BILL ACTIONS
// =============================================

/**
 * Create a pharmacy bill - for standalone medicine sales
 * @param {Object} params - Pharmacy bill parameters
 * @param {string} params.patientId - Patient UUID
 * @param {Array} params.items - Medication items with inventory references
 * @param {string} params.paymentMethod - Payment method
 * @param {boolean} params.isPaid - Whether payment is completed
 * @param {string} params.createdBy - User creating the bill
 */
export async function createPharmacyBill(params) {
  const supabase = supabaseAdmin;

  try {
    if (!params.items || params.items.length === 0) {
      return { success: false, error: "No items to bill" };
    }

    // Check stock availability first
    const stockCheck = await checkStockAvailability(params.items);
    if (!stockCheck.allAvailable) {
      const unavailable = stockCheck.items
        .filter((i) => !i.available)
        .map(
          (i) =>
            `${i.itemName}: need ${i.requiredQuantity}, have ${i.availableStock}`
        )
        .join(", ");
      return {
        success: false,
        error: `Insufficient stock: ${unavailable}`,
        stockCheck,
      };
    }

    // Get billing settings
    const { settings } = await getBillingSettings();
    const taxEnabled =
      settings.tax_enabled === true || settings.tax_enabled === "true";

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Calculate items with GST
    const calculatedItems = params.items.map((item) => {
      const gstRate = taxEnabled
        ? item.tax_rate ?? getDefaultGSTRate("medication")
        : 0;
      const itemCalc = calculateInvoiceItemWithGST(
        {
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percent: item.discount_percent || 0,
          tax_rate: gstRate,
        },
        params.isIgst || false
      );

      return {
        item_type: INVOICE_ITEM_TYPES.MEDICATION,
        description: item.description || item.name,
        quantity: item.quantity || 1,
        unit: item.unit || "units",
        unit_price: item.unit_price || 0,
        hsn_code: item.hsn_code || getDefaultHSNCode("medication"),
        inventory_item_id: item.inventory_item_id,
        batch_id: item.batch_id || null,
        reference_type: "inventory_item",
        reference_id: item.inventory_item_id,
        ...itemCalc,
      };
    });

    // Calculate invoice totals
    const invoiceTotals = calculateInvoiceTotals(calculatedItems);
    const isPaid = params.isPaid !== false; // Default to paid
    const status = isPaid ? INVOICE_STATUS.PAID : INVOICE_STATUS.PENDING;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .insert({
        invoice_number: invoiceNumber,
        patient_id: params.patientId,
        appointment_id: null, // Pharmacy bills don't need appointments
        status: status,
        subtotal: invoiceTotals.subtotal,
        tax_rate: 0, // GST is item-wise
        tax_amount: invoiceTotals.tax_amount,
        cgst_amount: invoiceTotals.cgst_amount,
        sgst_amount: invoiceTotals.sgst_amount,
        igst_amount: invoiceTotals.igst_amount,
        is_igst: params.isIgst || false,
        discount_amount: invoiceTotals.discount_amount,
        total_amount: invoiceTotals.total_amount,
        amount_paid: isPaid ? invoiceTotals.total_amount : 0,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date().toISOString().split("T")[0],
        paid_at: isPaid ? new Date().toISOString() : null,
        notes: params.notes || "Pharmacy Bill",
        is_quick_bill: false,
        bill_type: BILL_TYPES.PHARMACY,
        treatment_case_id: params.treatmentCaseId || null,
        created_by: params.createdBy,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating pharmacy bill:", invoiceError);
      return { success: false, error: invoiceError.message };
    }

    // Insert invoice items
    const itemsToInsert = calculatedItems.map((item, index) => ({
      invoice_id: invoice.id,
      ...item,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .insert(itemsToInsert);

    if (itemsError) {
      await supabase
        .from(BILLING_TABLES.INVOICES)
        .delete()
        .eq("id", invoice.id);
      return { success: false, error: itemsError.message };
    }

    let payment = null;

    // Create payment if paid
    if (isPaid) {
      const { data: paymentData, error: paymentError } = await supabase
        .from(BILLING_TABLES.PAYMENTS)
        .insert({
          invoice_id: invoice.id,
          patient_id: params.patientId,
          amount: invoiceTotals.total_amount,
          payment_method: params.paymentMethod || "cash",
          status: PAYMENT_STATUS.COMPLETED,
          payment_date: new Date().toISOString(),
          transaction_reference: params.transactionReference || null,
          notes: "Pharmacy Bill Payment",
          received_by: params.createdBy,
        })
        .select()
        .single();

      if (!paymentError) {
        payment = paymentData;
      }
    }

    // Create ledger entries
    await createInvoiceLedgerEntry(invoice, params.createdBy);
    if (payment) {
      await createPaymentLedgerEntry(payment, invoice, params.createdBy);
    }

    // Audit logs
    await auditInvoiceCreate(invoice, params.createdBy);
    if (payment) {
      await auditPaymentCreate(payment, invoice, params.createdBy);
    }

    // Deduct stock if paid
    if (isPaid) {
      await deductStockForInvoice(invoice.id, params.createdBy);
    }

    return {
      success: true,
      invoice: {
        ...invoice,
        items: itemsToInsert,
        payment,
      },
      stockWarnings: stockCheck.hasLowStockWarnings
        ? stockCheck.items.filter((i) => i.lowStockWarning)
        : undefined,
    };
  } catch (error) {
    console.error("Error in createPharmacyBill:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a combined consultation + pharmacy bill
 */
export async function createCombinedBill(params) {
  const supabase = supabaseAdmin;

  try {
    // Get billing settings
    const { settings } = await getBillingSettings();
    const taxEnabled =
      settings.tax_enabled === true || settings.tax_enabled === "true";
    const defaultTaxRate = parseFloat(settings.default_tax_rate) || 0;

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    const allItems = [];

    // Add consultation item
    if (params.consultationFee && params.consultationFee > 0) {
      const gstRate = taxEnabled ? defaultTaxRate : 0;
      const itemCalc = calculateInvoiceItemWithGST(
        {
          quantity: 1,
          unit_price: params.consultationFee,
          discount_percent: 0,
          tax_rate: gstRate,
        },
        params.isIgst || false
      );

      allItems.push({
        item_type: INVOICE_ITEM_TYPES.CONSULTATION,
        description: params.consultationDescription || "Consultation",
        quantity: 1,
        unit: "session",
        unit_price: params.consultationFee,
        hsn_code: getDefaultHSNCode("consultation"),
        ...itemCalc,
      });
    }

    // Add medication items
    if (params.medicationItems && params.medicationItems.length > 0) {
      // Check stock availability
      const stockCheck = await checkStockAvailability(params.medicationItems);
      if (!stockCheck.allAvailable) {
        const unavailable = stockCheck.items
          .filter((i) => !i.available)
          .map(
            (i) =>
              `${i.itemName}: need ${i.requiredQuantity}, have ${i.availableStock}`
          )
          .join(", ");
        return {
          success: false,
          error: `Insufficient stock: ${unavailable}`,
          stockCheck,
        };
      }

      for (const item of params.medicationItems) {
        const gstRate = taxEnabled
          ? item.tax_rate ?? getDefaultGSTRate("medication")
          : 0;
        const itemCalc = calculateInvoiceItemWithGST(
          {
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            discount_percent: item.discount_percent || 0,
            tax_rate: gstRate,
          },
          params.isIgst || false
        );

        allItems.push({
          item_type: INVOICE_ITEM_TYPES.MEDICATION,
          description: item.description || item.name,
          quantity: item.quantity || 1,
          unit: item.unit || "units",
          unit_price: item.unit_price || 0,
          hsn_code: item.hsn_code || getDefaultHSNCode("medication"),
          inventory_item_id: item.inventory_item_id,
          batch_id: item.batch_id || null,
          reference_type: "inventory_item",
          reference_id: item.inventory_item_id,
          ...itemCalc,
        });
      }
    }

    if (allItems.length === 0) {
      return { success: false, error: "No items to bill" };
    }

    // Calculate totals
    const invoiceTotals = calculateInvoiceTotals(allItems);
    const isPaid = params.isPaid !== false;
    const status = isPaid ? INVOICE_STATUS.PAID : INVOICE_STATUS.PENDING;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .insert({
        invoice_number: invoiceNumber,
        patient_id: params.patientId,
        appointment_id: params.appointmentId || null,
        status: status,
        subtotal: invoiceTotals.subtotal,
        tax_rate: 0,
        tax_amount: invoiceTotals.tax_amount,
        cgst_amount: invoiceTotals.cgst_amount,
        sgst_amount: invoiceTotals.sgst_amount,
        igst_amount: invoiceTotals.igst_amount,
        is_igst: params.isIgst || false,
        discount_amount: invoiceTotals.discount_amount,
        total_amount: invoiceTotals.total_amount,
        amount_paid: isPaid ? invoiceTotals.total_amount : 0,
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: new Date().toISOString().split("T")[0],
        paid_at: isPaid ? new Date().toISOString() : null,
        notes: params.notes || "Combined Bill",
        is_quick_bill: false,
        bill_type: BILL_TYPES.COMBINED,
        treatment_case_id: params.treatmentCaseId || null,
        created_by: params.createdBy,
      })
      .select()
      .single();

    if (invoiceError) {
      return { success: false, error: invoiceError.message };
    }

    // Insert items
    const itemsToInsert = allItems.map((item, index) => ({
      invoice_id: invoice.id,
      ...item,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .insert(itemsToInsert);

    if (itemsError) {
      await supabase
        .from(BILLING_TABLES.INVOICES)
        .delete()
        .eq("id", invoice.id);
      return { success: false, error: itemsError.message };
    }

    let payment = null;

    if (isPaid) {
      const { data: paymentData } = await supabase
        .from(BILLING_TABLES.PAYMENTS)
        .insert({
          invoice_id: invoice.id,
          patient_id: params.patientId,
          amount: invoiceTotals.total_amount,
          payment_method: params.paymentMethod || "cash",
          status: PAYMENT_STATUS.COMPLETED,
          payment_date: new Date().toISOString(),
          received_by: params.createdBy,
        })
        .select()
        .single();

      payment = paymentData;
    }

    // Ledger entries
    await createInvoiceLedgerEntry(invoice, params.createdBy);
    if (payment) {
      await createPaymentLedgerEntry(payment, invoice, params.createdBy);
    }

    // Audit
    await auditInvoiceCreate(invoice, params.createdBy);
    if (payment) {
      await auditPaymentCreate(payment, invoice, params.createdBy);
    }

    // Deduct stock if paid
    if (isPaid) {
      await deductStockForInvoice(invoice.id, params.createdBy);
    }

    return {
      success: true,
      invoice: {
        ...invoice,
        items: itemsToInsert,
        payment,
      },
    };
  } catch (error) {
    console.error("Error in createCombinedBill:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get patients for quick search
 */
export async function searchPatientsForBilling(search, limit = 10) {
  const supabase = supabaseAdmin;

  try {
    let query = supabase
      .from("users")
      .select("id, full_name, email, phone, address")
      .eq("role", "patient")
      .eq("is_active", true)
      .limit(limit);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, error } = await query.order("full_name", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, patients: data };
  } catch (error) {
    console.error("Error in searchPatientsForBilling:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get doctors for quick bill
 */
export async function getDoctorsForBilling() {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from("doctors")
      .select(
        `
        id,
        specialization,
        consultation_fee,
        is_available,
        user:users!inner(id, full_name, email)
      `
      )
      .eq("is_available", true)
      .order("created_at", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    // Filter out doctors with no valid user data (deleted users)
    const validDoctors = data.filter(
      (doctor) => doctor.user && doctor.user.full_name
    );

    return { success: true, doctors: validDoctors };
  } catch (error) {
    console.error("Error in getDoctorsForBilling:", error);
    return { success: false, error: error.message };
  }
}
