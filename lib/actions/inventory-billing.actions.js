"use server";

import { supabaseAdmin } from "@/lib/supabase.config";
import {
  BILLING_TABLES,
  INVOICE_STATUS,
  INVOICE_ITEM_TYPES,
} from "@/lib/billing.constants";

// =============================================
// INVENTORY-BILLING INTEGRATION ACTIONS
// =============================================

/**
 * Deduct stock for invoice items when payment is completed
 * Only deducts for medication and supply items that have inventory references
 * @param {string} invoiceId - The invoice ID
 * @param {string} performedBy - User performing the action
 */
export async function deductStockForInvoice(invoiceId, performedBy) {
  const supabase = supabaseAdmin;

  try {
    // Get invoice items that need stock deduction
    const { data: items, error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .select("*")
      .eq("invoice_id", invoiceId)
      .in("item_type", [
        INVOICE_ITEM_TYPES.MEDICATION,
        INVOICE_ITEM_TYPES.SUPPLY,
      ])
      .eq("stock_deducted", false);

    if (itemsError) {
      console.error("Error fetching invoice items:", itemsError);
      return { success: false, error: itemsError.message };
    }

    if (!items || items.length === 0) {
      return { success: true, message: "No items require stock deduction" };
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      // Skip if no inventory reference
      if (!item.inventory_item_id) {
        continue;
      }

      try {
        // Get current stock
        const { data: inventoryItem, error: invError } = await supabase
          .from("inventory_items")
          .select("id, name, current_stock")
          .eq("id", item.inventory_item_id)
          .single();

        if (invError || !inventoryItem) {
          errors.push({
            itemId: item.id,
            error: "Inventory item not found",
          });
          continue;
        }

        const quantityToDeduct = parseInt(item.quantity) || 1;
        const currentStock = parseInt(inventoryItem.current_stock) || 0;

        // Check if sufficient stock
        if (currentStock < quantityToDeduct) {
          errors.push({
            itemId: item.id,
            itemName: inventoryItem.name,
            error: `Insufficient stock. Available: ${currentStock}, Required: ${quantityToDeduct}`,
          });
          continue;
        }

        const newStock = currentStock - quantityToDeduct;

        // Update inventory stock
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.inventory_item_id);

        if (updateError) {
          errors.push({
            itemId: item.id,
            error: updateError.message,
          });
          continue;
        }

        // Create stock movement record
        await supabase.from("inventory_stock_movements").insert({
          item_id: item.inventory_item_id,
          batch_id: item.batch_id || null,
          movement_type: "sale",
          quantity: -quantityToDeduct,
          quantity_before: currentStock,
          quantity_after: newStock,
          reference_type: "invoice_item",
          reference_id: item.id,
          reason: `Sold via invoice`,
          performed_by: performedBy,
        });

        // If batch is specified, update batch available quantity
        if (item.batch_id) {
          const { data: batch } = await supabase
            .from("inventory_batches")
            .select("available_quantity")
            .eq("id", item.batch_id)
            .single();

          if (batch) {
            await supabase
              .from("inventory_batches")
              .update({
                available_quantity: Math.max(
                  0,
                  (batch.available_quantity || 0) - quantityToDeduct
                ),
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.batch_id);
          }
        }

        // Mark invoice item as stock deducted
        await supabase
          .from(BILLING_TABLES.INVOICE_ITEMS)
          .update({
            stock_deducted: true,
            stock_deducted_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.push({
          itemId: item.id,
          inventoryItemId: item.inventory_item_id,
          quantityDeducted: quantityToDeduct,
          newStock,
        });
      } catch (error) {
        errors.push({
          itemId: item.id,
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
      message:
        errors.length > 0
          ? `Stock deducted with ${errors.length} error(s)`
          : "Stock deducted successfully",
    };
  } catch (error) {
    console.error("Error in deductStockForInvoice:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Restore stock for invoice items (on refund/cancellation/credit note)
 * @param {Array} invoiceItems - Items to restore stock for
 * @param {string} referenceType - Type of reference (refund, cancellation, credit_note)
 * @param {string} referenceId - ID of the reference document
 * @param {string} performedBy - User performing the action
 */
export async function restoreStockForInvoiceItems(
  invoiceItems,
  referenceType,
  referenceId,
  performedBy
) {
  const supabase = supabaseAdmin;

  try {
    const results = [];
    const errors = [];

    for (const item of invoiceItems) {
      // Skip if no inventory reference or stock wasn't deducted
      if (!item.inventory_item_id || !item.stock_deducted) {
        continue;
      }

      try {
        // Get current stock
        const { data: inventoryItem, error: invError } = await supabase
          .from("inventory_items")
          .select("id, name, current_stock")
          .eq("id", item.inventory_item_id)
          .single();

        if (invError || !inventoryItem) {
          errors.push({
            itemId: item.id,
            error: "Inventory item not found",
          });
          continue;
        }

        const quantityToRestore = parseInt(item.quantity) || 1;
        const currentStock = parseInt(inventoryItem.current_stock) || 0;
        const newStock = currentStock + quantityToRestore;

        // Update inventory stock
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.inventory_item_id);

        if (updateError) {
          errors.push({
            itemId: item.id,
            error: updateError.message,
          });
          continue;
        }

        // Create stock movement record
        await supabase.from("inventory_stock_movements").insert({
          item_id: item.inventory_item_id,
          batch_id: item.batch_id || null,
          movement_type: "return",
          quantity: quantityToRestore,
          quantity_before: currentStock,
          quantity_after: newStock,
          reference_type: referenceType,
          reference_id: referenceId,
          reason: `Stock restored due to ${referenceType}`,
          performed_by: performedBy,
        });

        // If batch is specified, update batch available quantity
        if (item.batch_id) {
          const { data: batch } = await supabase
            .from("inventory_batches")
            .select("available_quantity, quantity")
            .eq("id", item.batch_id)
            .single();

          if (batch) {
            await supabase
              .from("inventory_batches")
              .update({
                available_quantity: Math.min(
                  batch.quantity,
                  (batch.available_quantity || 0) + quantityToRestore
                ),
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.batch_id);
          }
        }

        // Mark invoice item as stock restored
        await supabase
          .from(BILLING_TABLES.INVOICE_ITEMS)
          .update({
            stock_restored: true,
            stock_restored_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.push({
          itemId: item.id,
          inventoryItemId: item.inventory_item_id,
          quantityRestored: quantityToRestore,
          newStock,
        });
      } catch (error) {
        errors.push({
          itemId: item.id,
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error in restoreStockForInvoiceItems:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Restore stock for a cancelled invoice
 */
export async function restoreStockForCancelledInvoice(invoiceId, performedBy) {
  const supabase = supabaseAdmin;

  try {
    // Get invoice items that had stock deducted
    const { data: items, error: itemsError } = await supabase
      .from(BILLING_TABLES.INVOICE_ITEMS)
      .select("*")
      .eq("invoice_id", invoiceId)
      .eq("stock_deducted", true)
      .eq("stock_restored", false);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    if (!items || items.length === 0) {
      return { success: true, message: "No stock to restore" };
    }

    return restoreStockForInvoiceItems(
      items,
      "invoice_cancellation",
      invoiceId,
      performedBy
    );
  } catch (error) {
    console.error("Error in restoreStockForCancelledInvoice:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Check stock availability for invoice items before billing
 * @param {Array} items - Items to check
 * @returns {Object} - Availability status for each item
 */
export async function checkStockAvailability(items) {
  const supabase = supabaseAdmin;

  try {
    const results = [];

    for (const item of items) {
      if (!item.inventory_item_id) {
        continue;
      }

      const { data: inventoryItem, error } = await supabase
        .from("inventory_items")
        .select("id, name, current_stock, minimum_stock")
        .eq("id", item.inventory_item_id)
        .single();

      if (error || !inventoryItem) {
        results.push({
          inventoryItemId: item.inventory_item_id,
          available: false,
          error: "Item not found",
        });
        continue;
      }

      const requiredQuantity = parseInt(item.quantity) || 1;
      const availableStock = parseInt(inventoryItem.current_stock) || 0;
      const isAvailable = availableStock >= requiredQuantity;

      results.push({
        inventoryItemId: item.inventory_item_id,
        itemName: inventoryItem.name,
        requiredQuantity,
        availableStock,
        available: isAvailable,
        shortfall: isAvailable ? 0 : requiredQuantity - availableStock,
        lowStockWarning: availableStock <= (inventoryItem.minimum_stock || 10),
      });
    }

    const allAvailable = results.every((r) => r.available);
    const hasLowStockWarnings = results.some((r) => r.lowStockWarning);

    return {
      success: true,
      allAvailable,
      hasLowStockWarnings,
      items: results,
    };
  } catch (error) {
    console.error("Error in checkStockAvailability:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get inventory items for pharmacy billing
 */
export async function getInventoryItemsForBilling(options = {}) {
  const supabase = supabaseAdmin;
  const { search, categoryId, limit = 50, page = 1 } = options;

  try {
    let query = supabase
      .from("inventory_items")
      .select(
        `
        id,
        sku,
        barcode,
        name,
        generic_name,
        category_id,
        item_type,
        dosage_form,
        strength,
        potency,
        manufacturer,
        current_stock,
        minimum_stock,
        selling_price,
        unit_of_measure,
        requires_prescription,
        category:inventory_categories(id, name)
      `,
        { count: "exact" }
      )
      .eq("is_active", true)
      .gt("current_stock", 0);

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,generic_name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`
      );
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    query = query
      .order("name", { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching inventory items:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      items: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error("Error in getInventoryItemsForBilling:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get batches for an inventory item (for FIFO selection)
 */
export async function getItemBatchesForBilling(itemId) {
  const supabase = supabaseAdmin;

  try {
    const { data, error } = await supabase
      .from("inventory_batches")
      .select("*")
      .eq("item_id", itemId)
      .eq("status", "active")
      .gt("available_quantity", 0)
      .order("expiry_date", { ascending: true }) // FIFO by expiry
      .order("received_date", { ascending: true });

    if (error) {
      console.error("Error fetching batches:", error);
      return { success: false, error: error.message };
    }

    return { success: true, batches: data };
  } catch (error) {
    console.error("Error in getItemBatchesForBilling:", error);
    return { success: false, error: error.message };
  }
}
