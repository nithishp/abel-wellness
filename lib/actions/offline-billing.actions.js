"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  INVOICE_STATUS,
  SYNC_STATUS,
} from "@/lib/billing.constants";
import { generateInvoiceNumber } from "./billing.actions";
import {
  createInvoiceLedgerEntry,
  createPaymentLedgerEntry,
} from "./ledger.actions";
import {
  auditInvoiceCreate,
  auditPaymentCreate,
  createAuditLog,
} from "./audit.actions";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/billing.constants";

// =============================================
// OFFLINE BILLING SYNC ACTIONS
// =============================================

/**
 * Sync an offline bill to the server
 * @param {Object} offlineBill - The offline bill data
 * @param {string} offlineBill.offlineId - Unique offline ID (OFF-<timestamp>-<deviceId>)
 * @param {Object} offlineBill.invoice - Invoice data
 * @param {Array} offlineBill.items - Invoice items
 * @param {Object} offlineBill.payment - Payment data (optional)
 * @param {string} deviceId - Device identifier
 */
export async function syncOfflineBill(offlineBill, deviceId) {
  const supabase = supabaseAdmin;

  try {
    // Check if this offline bill was already synced
    const { data: existing } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("id, invoice_number, sync_status")
      .eq("offline_id", offlineBill.offlineId)
      .single();

    if (existing) {
      // Already synced
      return {
        success: true,
        alreadySynced: true,
        invoice: existing,
        message: `Bill already synced as ${existing.invoice_number}`,
      };
    }

    // Generate real invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create the invoice
    const invoiceData = {
      ...offlineBill.invoice,
      invoice_number: invoiceNumber,
      is_offline: true,
      offline_id: offlineBill.offlineId,
      sync_status: SYNC_STATUS.SYNCED,
      synced_at: new Date().toISOString(),
      device_id: deviceId,
    };

    // Remove fields that shouldn't be set from offline
    delete invoiceData.id;
    delete invoiceData.created_at;
    delete invoiceData.updated_at;

    const { data: invoice, error: invoiceError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error("Error syncing offline invoice:", invoiceError);
      return {
        success: false,
        error: invoiceError.message,
        syncStatus: SYNC_STATUS.FAILED,
      };
    }

    // Insert invoice items
    if (offlineBill.items && offlineBill.items.length > 0) {
      const itemsToInsert = offlineBill.items.map((item) => {
        const itemData = { ...item, invoice_id: invoice.id };
        delete itemData.id;
        delete itemData.created_at;
        return itemData;
      });

      const { error: itemsError } = await supabase
        .from(BILLING_TABLES.INVOICE_ITEMS)
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error syncing offline items:", itemsError);
        // Don't fail - invoice is created
      }
    }

    // Insert payment if exists
    let payment = null;
    if (offlineBill.payment) {
      const paymentData = {
        ...offlineBill.payment,
        invoice_id: invoice.id,
        patient_id: invoice.patient_id,
      };
      delete paymentData.id;
      delete paymentData.created_at;
      delete paymentData.updated_at;

      const { data: paymentResult, error: paymentError } = await supabase
        .from(BILLING_TABLES.PAYMENTS)
        .insert(paymentData)
        .select()
        .single();

      if (!paymentError) {
        payment = paymentResult;
      }
    }

    // Create ledger entries
    await createInvoiceLedgerEntry(invoice, invoice.created_by);
    if (payment) {
      await createPaymentLedgerEntry(payment, invoice, invoice.created_by);
    }

    // Audit log
    await createAuditLog({
      entityType: AUDIT_ENTITY_TYPES.INVOICE,
      entityId: invoice.id,
      entityIdentifier: invoice.invoice_number,
      action: AUDIT_ACTIONS.SYNC,
      newValue: invoice,
      performedBy: invoice.created_by,
      metadata: {
        offlineId: offlineBill.offlineId,
        deviceId: deviceId,
        syncedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      invoice: {
        ...invoice,
        payment,
      },
      offlineId: offlineBill.offlineId,
      serverInvoiceNumber: invoiceNumber,
    };
  } catch (error) {
    console.error("Error in syncOfflineBill:", error);
    return {
      success: false,
      error: error.message,
      syncStatus: SYNC_STATUS.FAILED,
    };
  }
}

/**
 * Batch sync multiple offline bills
 * @param {Array} offlineBills - Array of offline bills to sync
 * @param {string} deviceId - Device identifier
 */
export async function batchSyncOfflineBills(offlineBills, deviceId) {
  const results = {
    success: true,
    synced: [],
    failed: [],
    alreadySynced: [],
  };

  for (const bill of offlineBills) {
    try {
      const result = await syncOfflineBill(bill, deviceId);

      if (result.success) {
        if (result.alreadySynced) {
          results.alreadySynced.push({
            offlineId: bill.offlineId,
            serverInvoiceNumber: result.invoice.invoice_number,
          });
        } else {
          results.synced.push({
            offlineId: bill.offlineId,
            serverInvoiceNumber: result.serverInvoiceNumber,
            invoice: result.invoice,
          });
        }
      } else {
        results.failed.push({
          offlineId: bill.offlineId,
          error: result.error,
        });
        results.success = false;
      }
    } catch (error) {
      results.failed.push({
        offlineId: bill.offlineId,
        error: error.message,
      });
      results.success = false;
    }
  }

  return results;
}

/**
 * Get pending offline bills for a device
 * @param {string} deviceId - Device identifier
 */
export async function getPendingOfflineBills(deviceId) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("*")
      .eq("device_id", deviceId)
      .eq("sync_status", SYNC_STATUS.PENDING);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, bills: data };
  } catch (error) {
    console.error("Error in getPendingOfflineBills:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update sync status for a bill
 */
export async function updateSyncStatus(invoiceId, status, error = null) {
  const supabase = supabaseAdmin;

  try {
    const updateData = {
      sync_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === SYNC_STATUS.SYNCED) {
      updateData.synced_at = new Date().toISOString();
    }

    const { data, error: updateError } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .update(updateData)
      .eq("id", invoiceId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, invoice: data };
  } catch (error) {
    console.error("Error in updateSyncStatus:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check for sync conflicts
 * @param {string} offlineId - Offline bill ID
 * @param {Object} offlineData - Offline bill data
 */
export async function checkSyncConflict(offlineId, offlineData) {
  const supabase = supabaseAdmin;

  try {
    // Check if invoice with this offline ID exists
    const { data: existing } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("id, invoice_number, updated_at, sync_status")
      .eq("offline_id", offlineId)
      .single();

    if (!existing) {
      // No conflict - can sync
      return {
        success: true,
        hasConflict: false,
        canSync: true,
      };
    }

    // Check if server version is newer
    const serverUpdated = new Date(existing.updated_at);
    const offlineCreated = new Date(offlineData.created_at);

    if (serverUpdated > offlineCreated) {
      return {
        success: true,
        hasConflict: true,
        conflictType: "server_newer",
        serverInvoice: existing,
        message: "Server has a newer version of this bill",
      };
    }

    return {
      success: true,
      hasConflict: true,
      conflictType: "duplicate",
      serverInvoice: existing,
      message: "This bill was already synced",
    };
  } catch (error) {
    console.error("Error in checkSyncConflict:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate offline bill ID
 * Format: OFF-<timestamp>-<deviceId>
 */
export async function generateOfflineId(deviceId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `OFF-${timestamp}-${deviceId.substring(0, 8)}-${random}`;
}

/**
 * Get sync statistics for a device
 */
export async function getDeviceSyncStats(deviceId) {
  const supabase = supabaseAdmin;

  try {
    const { data: allBills, error } = await supabase
      .from(BILLING_TABLES.INVOICES)
      .select("sync_status, created_at, synced_at")
      .eq("device_id", deviceId)
      .eq("is_offline", true);

    if (error) {
      return { success: false, error: error.message };
    }

    const stats = allBills.reduce(
      (acc, bill) => {
        acc.total++;
        if (bill.sync_status === SYNC_STATUS.SYNCED) {
          acc.synced++;
        } else if (bill.sync_status === SYNC_STATUS.PENDING) {
          acc.pending++;
        } else if (bill.sync_status === SYNC_STATUS.FAILED) {
          acc.failed++;
        } else if (bill.sync_status === SYNC_STATUS.CONFLICT) {
          acc.conflicts++;
        }
        return acc;
      },
      { total: 0, synced: 0, pending: 0, failed: 0, conflicts: 0 }
    );

    return { success: true, stats };
  } catch (error) {
    console.error("Error in getDeviceSyncStats:", error);
    return { success: false, error: error.message };
  }
}
