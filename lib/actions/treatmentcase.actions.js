"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import { BILLING_TABLES, TREATMENT_CASE_STATUS } from "@/lib/billing.constants";
import { auditTreatmentCaseCreate } from "./audit.actions";

// =============================================
// TREATMENT CASE ACTIONS
// =============================================

/**
 * Generate a unique case number
 */
async function generateCaseNumber() {
  const supabase = supabaseAdmin;

  const { data } = await supabase
    .from(BILLING_TABLES.TREATMENT_CASES)
    .select("case_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let nextNum = 1;
  if (data?.case_number) {
    const match = data.case_number.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `CASE-${String(nextNum).padStart(6, "0")}`;
}

/**
 * Create a new treatment case
 * @param {Object} params - Treatment case parameters
 * @param {string} params.patientId - Patient UUID
 * @param {string} params.diagnosis - Diagnosis/condition
 * @param {string} params.description - Case description
 * @param {string} params.startDate - Start date
 * @param {number} params.totalEstimatedCost - Estimated total cost
 * @param {string} params.notes - Additional notes
 * @param {string} params.createdBy - User creating the case
 */
export async function createTreatmentCase(params) {
  const supabase = supabaseAdmin;

  try {
    const caseNumber = await generateCaseNumber();

    const { data, error } = await supabase
      .from(BILLING_TABLES.TREATMENT_CASES)
      .insert({
        case_number: caseNumber,
        patient_id: params.patientId,
        diagnosis: params.diagnosis || null,
        description: params.description || null,
        start_date: params.startDate || new Date().toISOString().split("T")[0],
        end_date: params.endDate || null,
        status: params.status || TREATMENT_CASE_STATUS.ACTIVE,
        total_estimated_cost: params.totalEstimatedCost || 0,
        notes: params.notes || null,
        created_by: params.createdBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating treatment case:", error);
      return { success: false, error: error.message };
    }

    // Create audit log
    await auditTreatmentCaseCreate(data, params.createdBy);

    return { success: true, treatmentCase: data };
  } catch (error) {
    console.error("Error in createTreatmentCase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get treatment cases with filtering
 */
export async function getTreatmentCases(options = {}) {
  const supabase = supabaseAdmin;
  const {
    page = 1,
    limit = 20,
    patientId,
    status,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
  } = options;

  try {
    let query = supabase.from(BILLING_TABLES.TREATMENT_CASES).select(
      `
        *,
        patient:users!treatment_cases_patient_id_fkey(id, full_name, email, phone),
        created_by_user:users!treatment_cases_created_by_fkey(id, full_name)
      `,
      { count: "exact" }
    );

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    if (status) {
      if (Array.isArray(status)) {
        query = query.in("status", status);
      } else {
        query = query.eq("status", status);
      }
    }

    if (search) {
      query = query.or(
        `case_number.ilike.%${search}%,diagnosis.ilike.%${search}%`
      );
    }

    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching treatment cases:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      treatmentCases: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getTreatmentCases:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get treatment case by ID with full billing details
 */
export async function getTreatmentCaseById(caseId) {
  const supabase = supabaseAdmin;

  try {
    // Get the treatment case
    const { data: treatmentCase, error: caseError } = await supabase
      .from(BILLING_TABLES.TREATMENT_CASES)
      .select(
        `
        *,
        patient:users!treatment_cases_patient_id_fkey(id, full_name, email, phone, address),
        created_by_user:users!treatment_cases_created_by_fkey(id, full_name)
      `
      )
      .eq("id", caseId)
      .single();

    if (caseError) {
      console.error("Error fetching treatment case:", caseError);
      return { success: false, error: caseError.message };
    }

    // Get all invoices for this case
    const { data: invoices, error: invoicesError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select(
        `
        *,
        appointment:appointments(id, date, reason_for_visit)
      `
      )
      .eq("treatment_case_id", caseId)
      .order("invoice_date", { ascending: false });

    if (invoicesError) {
      console.error("Error fetching case invoices:", invoicesError);
      return { success: false, error: invoicesError.message };
    }

    // Calculate billing summary
    const billingSummary = invoices.reduce(
      (acc, inv) => {
        acc.totalBilled += parseFloat(inv.total_amount) || 0;
        acc.totalPaid += parseFloat(inv.amount_paid) || 0;
        acc.invoiceCount++;
        if (inv.status === "pending" || inv.status === "partial") {
          acc.pendingCount++;
        }
        return acc;
      },
      { totalBilled: 0, totalPaid: 0, invoiceCount: 0, pendingCount: 0 }
    );

    billingSummary.totalDue =
      billingSummary.totalBilled - billingSummary.totalPaid;

    return {
      success: true,
      treatmentCase: {
        ...treatmentCase,
        invoices,
        billingSummary,
      },
    };
  } catch (error) {
    console.error("Error in getTreatmentCaseById:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update treatment case
 */
export async function updateTreatmentCase(caseId, updateData) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.TREATMENT_CASES)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", caseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating treatment case:", error);
      return { success: false, error: error.message };
    }

    return { success: true, treatmentCase: data };
  } catch (error) {
    console.error("Error in updateTreatmentCase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update treatment case status
 */
export async function updateTreatmentCaseStatus(caseId, status, options = {}) {
  const supabase = supabaseAdmin;

  try {
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === TREATMENT_CASE_STATUS.COMPLETED) {
      updateData.end_date = new Date().toISOString().split("T")[0];
    }

    if (options.updatedBy) {
      updateData.updated_by = options.updatedBy;
    }

    const { data, error } = await supabase
      .from(BILLING_TABLES.TREATMENT_CASES)
      .update(updateData)
      .eq("id", caseId)
      .select()
      .single();

    if (error) {
      console.error("Error updating treatment case status:", error);
      return { success: false, error: error.message };
    }

    return { success: true, treatmentCase: data };
  } catch (error) {
    console.error("Error in updateTreatmentCaseStatus:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Link an invoice to a treatment case
 */
export async function linkInvoiceToCase(invoiceId, caseId, updatedBy = null) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .update({
        treatment_case_id: caseId,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) {
      console.error("Error linking invoice to case:", error);
      return { success: false, error: error.message };
    }

    return { success: true, invoice: data };
  } catch (error) {
    console.error("Error in linkInvoiceToCase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Unlink an invoice from a treatment case
 */
export async function unlinkInvoiceFromCase(invoiceId, updatedBy = null) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .update({
        treatment_case_id: null,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) {
      console.error("Error unlinking invoice from case:", error);
      return { success: false, error: error.message };
    }

    return { success: true, invoice: data };
  } catch (error) {
    console.error("Error in unlinkInvoiceFromCase:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get patient's treatment cases
 */
export async function getPatientTreatmentCases(patientId, options = {}) {
  const { includeInvoices = false } = options;

  const result = await getTreatmentCases({
    patientId,
    sortBy: "start_date",
    sortOrder: "desc",
    ...options,
  });

  if (!result.success || !includeInvoices) {
    return result;
  }

  // Fetch invoices for each case
  const supabase = supabaseAdmin;
  const casesWithInvoices = await Promise.all(
    result.treatmentCases.map(async (tc) => {
      const { data: invoices } = await supabase
        .from(BILLING_TABLES.INVOICES)
        .select(
          "id, invoice_number, status, total_amount, amount_paid, invoice_date"
        )
        .eq("treatment_case_id", tc.id)
        .order("invoice_date", { ascending: false });

      const summary = (invoices || []).reduce(
        (acc, inv) => {
          acc.totalBilled += parseFloat(inv.total_amount) || 0;
          acc.totalPaid += parseFloat(inv.amount_paid) || 0;
          return acc;
        },
        { totalBilled: 0, totalPaid: 0 }
      );

      return {
        ...tc,
        invoices: invoices || [],
        invoiceCount: invoices?.length || 0,
        ...summary,
        totalDue: summary.totalBilled - summary.totalPaid,
      };
    })
  );

  return {
    ...result,
    treatmentCases: casesWithInvoices,
  };
}
