"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "@/lib/billing.constants";

// =============================================
// AUDIT LOG ACTIONS
// =============================================

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.entityType - Type of entity (invoice, payment, etc.)
 * @param {string} params.entityId - UUID of the entity
 * @param {string} params.entityIdentifier - Human-readable identifier (invoice number, etc.)
 * @param {string} params.action - Action performed (create, update, delete, etc.)
 * @param {Object} params.oldValue - Previous value (for updates)
 * @param {Object} params.newValue - New value
 * @param {Object} params.changes - Specific changes made
 * @param {string} params.performedBy - User ID who performed the action
 * @param {Object} params.metadata - Additional metadata
 */
export async function createAuditLog(params) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.AUDIT_LOGS)
      .insert({
        entity_type: params.entityType,
        entity_id: params.entityId,
        entity_identifier: params.entityIdentifier || null,
        action: params.action,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        changes: params.changes || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        session_id: params.sessionId || null,
        performed_by: params.performedBy || null,
        metadata: params.metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating audit log:", error);
      return { success: false, error: error.message };
    }

    return { success: true, auditLog: data };
  } catch (error) {
    console.error("Error in createAuditLog:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(
  entityType,
  entityId,
  options = {}
) {
  const supabase = supabaseAdmin;
  const { page = 1, limit = 50 } = options;

  try {
    const { data, error, count } = await supabase
      .from(BILLING_TABLES.AUDIT_LOGS)
      .select(
        `
        *,
        performed_by_user:users!billing_audit_logs_performed_by_fkey(id, full_name, email)
      `,
        { count: "exact" }
      )
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("performed_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error("Error fetching audit logs:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      auditLogs: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getAuditLogsForEntity:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all audit logs with filtering
 */
export async function getAuditLogs(options = {}) {
  const supabase = supabaseAdmin;
  const {
    page = 1,
    limit = 50,
    entityType,
    action,
    performedBy,
    startDate,
    endDate,
    search,
  } = options;

  try {
    let query = supabase.from(BILLING_TABLES.AUDIT_LOGS).select(
      `
        *,
        performed_by_user:users!billing_audit_logs_performed_by_fkey(id, full_name, email)
      `,
      { count: "exact" }
    );

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (action) {
      query = query.eq("action", action);
    }

    if (performedBy) {
      query = query.eq("performed_by", performedBy);
    }

    if (startDate) {
      query = query.gte("performed_at", startDate);
    }

    if (endDate) {
      query = query.lte("performed_at", endDate);
    }

    if (search) {
      query = query.or(
        `entity_identifier.ilike.%${search}%,entity_type.ilike.%${search}%`
      );
    }

    query = query
      .order("performed_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      auditLogs: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getAuditLogs:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper to calculate changes between old and new values (internal function)
 */
function calculateChanges(oldValue, newValue) {
  if (!oldValue || !newValue) return null;

  const changes = {};
  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

  for (const key of allKeys) {
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
      changes[key] = {
        from: oldValue[key],
        to: newValue[key],
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

// =============================================
// AUDIT LOG WRAPPERS FOR BILLING OPERATIONS
// =============================================

export async function auditInvoiceCreate(invoice, performedBy) {
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.INVOICE,
    entityId: invoice.id,
    entityIdentifier: invoice.invoice_number,
    action: AUDIT_ACTIONS.CREATE,
    newValue: invoice,
    performedBy,
    metadata: { patient_id: invoice.patient_id },
  });
}

export async function auditInvoiceUpdate(oldInvoice, newInvoice, performedBy) {
  const changes = calculateChanges(oldInvoice, newInvoice);
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.INVOICE,
    entityId: newInvoice.id,
    entityIdentifier: newInvoice.invoice_number,
    action: AUDIT_ACTIONS.UPDATE,
    oldValue: oldInvoice,
    newValue: newInvoice,
    changes,
    performedBy,
  });
}

export async function auditInvoiceStatusChange(
  invoice,
  oldStatus,
  newStatus,
  performedBy
) {
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.INVOICE,
    entityId: invoice.id,
    entityIdentifier: invoice.invoice_number,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    oldValue: { status: oldStatus },
    newValue: { status: newStatus },
    changes: { status: { from: oldStatus, to: newStatus } },
    performedBy,
  });
}

export async function auditPaymentCreate(payment, invoice, performedBy) {
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.PAYMENT,
    entityId: payment.id,
    entityIdentifier: invoice?.invoice_number,
    action: AUDIT_ACTIONS.PAYMENT,
    newValue: payment,
    performedBy,
    metadata: {
      invoice_id: payment.invoice_id,
      patient_id: payment.patient_id,
    },
  });
}

export async function auditRefundCreate(refund, invoice, performedBy) {
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.REFUND,
    entityId: refund.id,
    entityIdentifier: invoice?.invoice_number,
    action: AUDIT_ACTIONS.REFUND,
    newValue: refund,
    performedBy,
    metadata: { invoice_id: refund.invoice_id, payment_id: refund.payment_id },
  });
}

export async function auditCreditNoteCreate(creditNote, performedBy) {
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.CREDIT_NOTE,
    entityId: creditNote.id,
    entityIdentifier: creditNote.credit_note_number,
    action: AUDIT_ACTIONS.CREATE,
    newValue: creditNote,
    performedBy,
    metadata: {
      invoice_id: creditNote.invoice_id,
      patient_id: creditNote.patient_id,
    },
  });
}

export async function auditTreatmentCaseCreate(treatmentCase, performedBy) {
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.TREATMENT_CASE,
    entityId: treatmentCase.id,
    entityIdentifier: treatmentCase.case_number,
    action: AUDIT_ACTIONS.CREATE,
    newValue: treatmentCase,
    performedBy,
    metadata: { patient_id: treatmentCase.patient_id },
  });
}

export async function auditSettingChange(
  settingKey,
  oldValue,
  newValue,
  performedBy
) {
  return createAuditLog({
    entityType: AUDIT_ENTITY_TYPES.BILLING_SETTING,
    entityId: settingKey, // Using key as ID since settings use key
    entityIdentifier: settingKey,
    action: AUDIT_ACTIONS.UPDATE,
    oldValue: { value: oldValue },
    newValue: { value: newValue },
    changes: { value: { from: oldValue, to: newValue } },
    performedBy,
  });
}
