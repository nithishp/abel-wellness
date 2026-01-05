"use server";

import { supabaseAdmin } from "@/lib/supabase.config";

// =============================================
// INVENTORY CATEGORIES ACTIONS
// =============================================

export async function getInventoryCategories(options = {}) {
  const supabase = supabaseAdmin;
  const { type, includeInactive = false } = options;

  let query = supabase
    .from("inventory_categories")
    .select("*")
    .order("name", { ascending: true });

  if (type) {
    query = query.eq("type", type);
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: error.message };
  }

  return { success: true, categories: data };
}

export async function createInventoryCategory(categoryData) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_categories")
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    console.error("Error creating category:", error);
    return { success: false, error: error.message };
  }

  return { success: true, category: data };
}

export async function updateInventoryCategory(id, categoryData) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_categories")
    .update({ ...categoryData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating category:", error);
    return { success: false, error: error.message };
  }

  return { success: true, category: data };
}

export async function deleteInventoryCategory(id) {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from("inventory_categories")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// INVENTORY SUPPLIERS ACTIONS
// =============================================

export async function getInventorySuppliers(options = {}) {
  const supabase = supabaseAdmin;
  const { search, includeInactive = false, page = 1, limit = 50 } = options;

  let query = supabase
    .from("inventory_suppliers")
    .select("*", { count: "exact" })
    .order("name", { ascending: true });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching suppliers:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    suppliers: data,
    pagination: {
      total: count,
      page,
      limit,
      hasMore: from + limit < count,
    },
  };
}

export async function getSupplierById(id) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_suppliers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching supplier:", error);
    return { success: false, error: error.message };
  }

  return { success: true, supplier: data };
}

// Alias for backward compatibility
export async function getInventorySupplierById(id) {
  return getSupplierById(id);
}

export async function createInventorySupplier(supplierData) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_suppliers")
    .insert(supplierData)
    .select()
    .single();

  if (error) {
    console.error("Error creating supplier:", error);
    return { success: false, error: error.message };
  }

  return { success: true, supplier: data };
}

export async function updateInventorySupplier(id, supplierData) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_suppliers")
    .update({ ...supplierData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: error.message };
  }

  return { success: true, supplier: data };
}

export async function deleteInventorySupplier(id) {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from("inventory_suppliers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// INVENTORY ITEMS ACTIONS
// =============================================

export async function getInventoryItems(options = {}) {
  const supabase = supabaseAdmin;
  const {
    search,
    categoryId,
    supplierId,
    itemType,
    lowStock = false,
    includeInactive = false,
    page = 1,
    limit = 20,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

  let query = supabase
    .from("inventory_items")
    .select(
      `
      *,
      category:inventory_categories(id, name, type),
      supplier:inventory_suppliers(id, name)
    `,
      { count: "exact" }
    )
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,generic_name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`
    );
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (supplierId) {
    query = query.eq("supplier_id", supplierId);
  }

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  if (lowStock) {
    query = query.lte("current_stock", supabase.raw("minimum_stock"));
  }

  if (!includeInactive) {
    query = query.eq("is_active", true);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching inventory items:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    items: data,
    pagination: {
      total: count,
      page,
      limit,
      hasMore: from + limit < count,
    },
  };
}

export async function getInventoryItemById(id) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      `
      *,
      category:inventory_categories(id, name, type),
      supplier:inventory_suppliers(id, name, contact_person, phone, email)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching inventory item:", error);
    return { success: false, error: error.message };
  }

  return { success: true, item: data };
}

export async function searchInventoryItems(searchTerm, options = {}) {
  const supabase = supabaseAdmin;
  const { itemType, limit = 20, onlyActive = true } = options;

  let query = supabase
    .from("inventory_items")
    .select(
      "id, name, generic_name, sku, current_stock, unit_of_measure, selling_price, item_type"
    )
    .or(
      `name.ilike.%${searchTerm}%,generic_name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`
    )
    .limit(limit);

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  if (onlyActive) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error searching inventory items:", error);
    return { success: false, error: error.message };
  }

  return { success: true, items: data };
}

export async function createInventoryItem(itemData, userId) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_items")
    .insert({ ...itemData, created_by: userId, updated_by: userId })
    .select()
    .single();

  if (error) {
    console.error("Error creating inventory item:", error);
    return { success: false, error: error.message };
  }

  return { success: true, item: data };
}

export async function updateInventoryItem(id, itemData, userId) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_items")
    .update({
      ...itemData,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating inventory item:", error);
    return { success: false, error: error.message };
  }

  return { success: true, item: data };
}

export async function deleteInventoryItem(id) {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting inventory item:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// INVENTORY BATCHES ACTIONS
// =============================================

export async function getInventoryBatches(options = {}) {
  const supabase = supabaseAdmin;
  const {
    itemId,
    status,
    expiringSoon = false,
    daysUntilExpiry = 30,
    page = 1,
    limit = 20,
  } = options;

  let query = supabase
    .from("inventory_batches")
    .select(
      `
      *,
      item:inventory_items(id, name, sku, unit_of_measure),
      supplier:inventory_suppliers(id, name)
    `,
      { count: "exact" }
    )
    .order("expiry_date", { ascending: true });

  if (itemId) {
    query = query.eq("item_id", itemId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (expiringSoon) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysUntilExpiry);
    query = query
      .lte("expiry_date", futureDate.toISOString())
      .eq("status", "active");
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching batches:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    batches: data,
    pagination: {
      total: count,
      page,
      limit,
      hasMore: from + limit < count,
    },
  };
}

export async function getBatchesByItem(itemId) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_batches")
    .select("*")
    .eq("item_id", itemId)
    .eq("status", "active")
    .gt("available_quantity", 0)
    .order("expiry_date", { ascending: true });

  if (error) {
    console.error("Error fetching item batches:", error);
    return { success: false, error: error.message };
  }

  return { success: true, batches: data };
}

export async function createInventoryBatch(batchData, userId) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_batches")
    .insert({
      ...batchData,
      available_quantity: batchData.quantity,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating batch:", error);
    return { success: false, error: error.message };
  }

  // Record stock movement
  await recordStockMovement({
    item_id: batchData.item_id,
    batch_id: data.id,
    movement_type: "purchase",
    quantity: batchData.quantity,
    unit_cost: batchData.cost_price,
    reference_type: batchData.purchase_order_id ? "purchase_order" : null,
    reference_id: batchData.purchase_order_id,
    performed_by: userId,
  });

  return { success: true, batch: data };
}

export async function updateInventoryBatch(id, batchData) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_batches")
    .update({ ...batchData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating batch:", error);
    return { success: false, error: error.message };
  }

  return { success: true, batch: data };
}

export async function deleteInventoryBatch(id) {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from("inventory_batches")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting batch:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// STOCK MOVEMENTS ACTIONS
// =============================================

export async function recordStockMovement(movementData) {
  const supabase = supabaseAdmin;

  // Get current stock
  const { data: item } = await supabase
    .from("inventory_items")
    .select("current_stock")
    .eq("id", movementData.item_id)
    .single();

  const quantityBefore = item?.current_stock || 0;
  const isAddition = [
    "purchase",
    "adjustment_add",
    "return_customer",
    "transfer_in",
    "opening_stock",
  ].includes(movementData.movement_type);

  const quantityAfter = isAddition
    ? quantityBefore + movementData.quantity
    : quantityBefore - movementData.quantity;

  const { data, error } = await supabase
    .from("inventory_stock_movements")
    .insert({
      ...movementData,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      total_cost: movementData.unit_cost
        ? movementData.unit_cost * movementData.quantity
        : null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error recording stock movement:", error);
    return { success: false, error: error.message };
  }

  return { success: true, movement: data };
}

export async function getStockMovements(options = {}) {
  const supabase = supabaseAdmin;
  const {
    itemId,
    batchId,
    movementType,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = options;

  let query = supabase
    .from("inventory_stock_movements")
    .select(
      `
      *,
      item:inventory_items(id, name, sku),
      batch:inventory_batches(id, batch_number),
      performed_by_user:users!inventory_stock_movements_performed_by_fkey(id, full_name)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (itemId) {
    query = query.eq("item_id", itemId);
  }

  if (batchId) {
    query = query.eq("batch_id", batchId);
  }

  if (movementType) {
    query = query.eq("movement_type", movementType);
  }

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching stock movements:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    movements: data,
    pagination: {
      total: count,
      page,
      limit,
      hasMore: from + limit < count,
    },
  };
}

export async function adjustStock(itemId, adjustment, userId) {
  const supabase = supabaseAdmin;
  const { quantity, reason, notes, batchId } = adjustment;

  // Get current stock
  const { data: item } = await supabase
    .from("inventory_items")
    .select("current_stock, name")
    .eq("id", itemId)
    .single();

  if (!item) {
    return { success: false, error: "Item not found" };
  }

  const movementType = quantity > 0 ? "adjustment_add" : "adjustment_subtract";
  const absQuantity = Math.abs(quantity);

  // If adjusting specific batch
  if (batchId) {
    const { data: batch } = await supabase
      .from("inventory_batches")
      .select("available_quantity")
      .eq("id", batchId)
      .single();

    if (quantity < 0 && batch.available_quantity < absQuantity) {
      return { success: false, error: "Insufficient batch quantity" };
    }

    await supabase
      .from("inventory_batches")
      .update({
        available_quantity: batch.available_quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batchId);
  } else {
    // Direct stock adjustment without batch
    await supabase
      .from("inventory_items")
      .update({
        current_stock: item.current_stock + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId);
  }

  // Record movement
  await recordStockMovement({
    item_id: itemId,
    batch_id: batchId,
    movement_type: movementType,
    quantity: absQuantity,
    reason,
    notes,
    performed_by: userId,
  });

  return { success: true };
}

// =============================================
// PURCHASE ORDERS ACTIONS
// =============================================

export async function getPurchaseOrders(options = {}) {
  const supabase = supabaseAdmin;
  const {
    status,
    supplierId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = options;

  let query = supabase
    .from("purchase_orders")
    .select(
      `
      *,
      supplier:inventory_suppliers(id, name, contact_person, phone),
      created_by_user:users!purchase_orders_created_by_fkey(id, full_name),
      items_count:purchase_order_items(count)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (supplierId) {
    query = query.eq("supplier_id", supplierId);
  }

  if (startDate) {
    query = query.gte("order_date", startDate);
  }

  if (endDate) {
    query = query.lte("order_date", endDate);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching purchase orders:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    orders: data,
    pagination: {
      total: count,
      page,
      limit,
      hasMore: from + limit < count,
    },
  };
}

export async function getPurchaseOrderById(id) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      `
      *,
      supplier:inventory_suppliers(*),
      created_by_user:users!purchase_orders_created_by_fkey(id, full_name, email),
      approved_by_user:users!purchase_orders_approved_by_fkey(id, full_name),
      received_by_user:users!purchase_orders_received_by_fkey(id, full_name),
      items:purchase_order_items(
        *,
        item:inventory_items(id, name, sku, unit_of_measure)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching purchase order:", error);
    return { success: false, error: error.message };
  }

  return { success: true, order: data };
}

export async function createPurchaseOrder(orderData, userId) {
  const supabase = supabaseAdmin;

  const { items, ...orderDetails } = orderData;

  // Create the purchase order
  const { data: order, error: orderError } = await supabase
    .from("purchase_orders")
    .insert({ ...orderDetails, created_by: userId })
    .select()
    .single();

  if (orderError) {
    console.error("Error creating purchase order:", orderError);
    return { success: false, error: orderError.message };
  }

  // Add items if provided
  if (items && items.length > 0) {
    const orderItems = items.map((item) => ({
      purchase_order_id: order.id,
      item_id: item.item_id,
      quantity_ordered: item.quantity_ordered,
      unit_cost: item.unit_cost,
      total_cost: item.quantity_ordered * item.unit_cost,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      notes: item.notes,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error adding purchase order items:", itemsError);
      // Rollback the order
      await supabase.from("purchase_orders").delete().eq("id", order.id);
      return { success: false, error: itemsError.message };
    }
  }

  return { success: true, order };
}

export async function updatePurchaseOrder(id, orderData, userId) {
  const supabase = supabaseAdmin;

  const { items, ...orderDetails } = orderData;

  const { data: order, error: orderError } = await supabase
    .from("purchase_orders")
    .update({ ...orderDetails, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (orderError) {
    console.error("Error updating purchase order:", orderError);
    return { success: false, error: orderError.message };
  }

  // Update items if provided
  if (items) {
    // Delete existing items
    await supabase
      .from("purchase_order_items")
      .delete()
      .eq("purchase_order_id", id);

    // Insert new items
    if (items.length > 0) {
      const orderItems = items.map((item) => ({
        purchase_order_id: id,
        item_id: item.item_id,
        quantity_ordered: item.quantity_ordered,
        unit_cost: item.unit_cost,
        total_cost: item.quantity_ordered * item.unit_cost,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        notes: item.notes,
      }));

      await supabase.from("purchase_order_items").insert(orderItems);
    }
  }

  return { success: true, order };
}

export async function approvePurchaseOrder(id, userId) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("purchase_orders")
    .update({
      status: "approved",
      approved_by: userId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error approving purchase order:", error);
    return { success: false, error: error.message };
  }

  return { success: true, order: data };
}

export async function receivePurchaseOrder(id, receivedItems, userId) {
  const supabase = supabaseAdmin;

  // Get the purchase order
  const { data: order } = await supabase
    .from("purchase_orders")
    .select("*, items:purchase_order_items(*)")
    .eq("id", id)
    .single();

  if (!order) {
    return { success: false, error: "Purchase order not found" };
  }

  // Process each received item
  for (const received of receivedItems) {
    const orderItem = order.items.find((i) => i.id === received.order_item_id);
    if (!orderItem) continue;

    // Update the order item with received quantity
    await supabase
      .from("purchase_order_items")
      .update({
        quantity_received:
          (orderItem.quantity_received || 0) + received.quantity_received,
        updated_at: new Date().toISOString(),
      })
      .eq("id", received.order_item_id);

    // Create batch for received items
    if (received.quantity_received > 0) {
      await createInventoryBatch(
        {
          item_id: orderItem.item_id,
          batch_number:
            received.batch_number || `PO-${order.order_number}-${Date.now()}`,
          lot_number: received.lot_number,
          quantity: received.quantity_received,
          manufacturing_date: received.manufacturing_date,
          expiry_date: received.expiry_date,
          cost_price: orderItem.unit_cost,
          supplier_id: order.supplier_id,
          purchase_order_id: id,
        },
        userId
      );
    }
  }

  // Check if all items are received
  const { data: updatedItems } = await supabase
    .from("purchase_order_items")
    .select("quantity_ordered, quantity_received")
    .eq("purchase_order_id", id);

  const allReceived = updatedItems.every(
    (item) => item.quantity_received >= item.quantity_ordered
  );
  const partiallyReceived = updatedItems.some(
    (item) => item.quantity_received > 0
  );

  // Update order status
  const newStatus = allReceived
    ? "received"
    : partiallyReceived
    ? "partial"
    : order.status;

  await supabase
    .from("purchase_orders")
    .update({
      status: newStatus,
      received_by: userId,
      received_date: allReceived
        ? new Date().toISOString().split("T")[0]
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return { success: true };
}

export async function cancelPurchaseOrder(id) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("purchase_orders")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error cancelling purchase order:", error);
    return { success: false, error: error.message };
  }

  return { success: true, order: data };
}

export async function deletePurchaseOrder(id) {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting purchase order:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// =============================================
// INVENTORY ALERTS ACTIONS
// =============================================

export async function getInventoryAlerts(options = {}) {
  const supabase = supabaseAdmin;
  const { alertType, isResolved, page = 1, limit = 50, itemId } = options;

  let query = supabase
    .from("inventory_alerts")
    .select(
      `
      *,
      item:inventory_items(id, name, sku, current_stock, minimum_stock),
      batch:inventory_batches(id, batch_number, expiry_date)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  // Only filter by is_resolved if explicitly provided, otherwise default to unresolved (false)
  if (isResolved !== undefined) {
    query = query.eq("is_resolved", isResolved);
  } else {
    query = query.eq("is_resolved", false);
  }

  if (alertType) {
    query = query.eq("alert_type", alertType);
  }

  if (itemId) {
    query = query.eq("item_id", itemId);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching alerts:", error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    alerts: data,
    pagination: {
      total: count,
      page,
      limit,
      hasMore: from + limit < count,
    },
  };
}

export async function getUnresolvedAlertCount() {
  const supabase = supabaseAdmin;

  const { count, error } = await supabase
    .from("inventory_alerts")
    .select("*", { count: "exact", head: true })
    .eq("is_resolved", false);

  if (error) {
    console.error("Error fetching alert count:", error);
    return { success: false, error: error.message };
  }

  return { success: true, count };
}

export async function resolveInventoryAlert(id, userId) {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_alerts")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error resolving alert:", error);
    return { success: false, error: error.message };
  }

  return { success: true, alert: data };
}

export async function createExpiryAlerts() {
  const supabase = supabaseAdmin;

  // Find batches expiring in 30 days
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  const { data: expiringBatches } = await supabase
    .from("inventory_batches")
    .select(
      `
      id,
      batch_number,
      expiry_date,
      item:inventory_items(id, name)
    `
    )
    .eq("status", "active")
    .gt("available_quantity", 0)
    .lte("expiry_date", futureDate.toISOString())
    .gt("expiry_date", new Date().toISOString());

  for (const batch of expiringBatches || []) {
    // Check if alert already exists
    const { data: existing } = await supabase
      .from("inventory_alerts")
      .select("id")
      .eq("batch_id", batch.id)
      .eq("alert_type", "expiring_soon")
      .eq("is_resolved", false)
      .single();

    if (!existing) {
      await supabase.from("inventory_alerts").insert({
        item_id: batch.item.id,
        batch_id: batch.id,
        alert_type: "expiring_soon",
        severity: "medium",
        message: `Batch ${batch.batch_number} of "${
          batch.item.name
        }" expires on ${new Date(batch.expiry_date).toLocaleDateString()}`,
      });
    }
  }

  // Find expired batches
  const { data: expiredBatches } = await supabase
    .from("inventory_batches")
    .select(
      `
      id,
      batch_number,
      expiry_date,
      item:inventory_items(id, name)
    `
    )
    .eq("status", "active")
    .gt("available_quantity", 0)
    .lte("expiry_date", new Date().toISOString());

  for (const batch of expiredBatches || []) {
    // Update batch status
    await supabase
      .from("inventory_batches")
      .update({ status: "expired" })
      .eq("id", batch.id);

    // Create alert
    const { data: existing } = await supabase
      .from("inventory_alerts")
      .select("id")
      .eq("batch_id", batch.id)
      .eq("alert_type", "expired")
      .eq("is_resolved", false)
      .single();

    if (!existing) {
      await supabase.from("inventory_alerts").insert({
        item_id: batch.item.id,
        batch_id: batch.id,
        alert_type: "expired",
        severity: "critical",
        message: `Batch ${batch.batch_number} of "${batch.item.name}" has expired!`,
      });
    }
  }

  return { success: true };
}

// =============================================
// DISPENSING ACTIONS (For Prescription Integration)
// =============================================

export async function checkStockAvailability(items) {
  const supabase = supabaseAdmin;
  const results = [];

  for (const item of items) {
    const { data: inventoryItem } = await supabase
      .from("inventory_items")
      .select("id, name, current_stock, unit_of_measure")
      .eq("name", item.medication_name)
      .single();

    if (!inventoryItem) {
      results.push({
        medication_name: item.medication_name,
        requested_quantity: item.quantity,
        available: false,
        current_stock: 0,
        message: "Item not found in inventory",
      });
    } else {
      const requestedQty = parseInt(item.quantity) || 1;
      const isAvailable = inventoryItem.current_stock >= requestedQty;

      results.push({
        medication_name: item.medication_name,
        item_id: inventoryItem.id,
        requested_quantity: requestedQty,
        current_stock: inventoryItem.current_stock,
        unit_of_measure: inventoryItem.unit_of_measure,
        available: isAvailable,
        message: isAvailable
          ? "Stock available"
          : `Insufficient stock. Available: ${inventoryItem.current_stock}`,
      });
    }
  }

  return { success: true, results };
}

export async function dispensePrescriptionItems(
  prescriptionId,
  items,
  userId,
  forceDispense = false
) {
  const supabase = supabaseAdmin;
  const dispensedItems = [];
  const warnings = [];

  for (const item of items) {
    // Find the inventory item
    const { data: inventoryItem } = await supabase
      .from("inventory_items")
      .select("id, name, current_stock")
      .eq("name", item.medication_name)
      .single();

    if (!inventoryItem) {
      warnings.push({
        medication_name: item.medication_name,
        warning: "Item not found in inventory - skipped",
      });
      continue;
    }

    const requestedQty = parseInt(item.quantity) || 1;

    // Check stock
    if (inventoryItem.current_stock < requestedQty && !forceDispense) {
      warnings.push({
        medication_name: item.medication_name,
        warning: `Insufficient stock. Available: ${inventoryItem.current_stock}, Requested: ${requestedQty}`,
        item_id: inventoryItem.id,
      });
      continue;
    }

    // Deduct from batches using FIFO (First Expiry First Out)
    let remainingQty = requestedQty;
    const { data: batches } = await supabase
      .from("inventory_batches")
      .select("*")
      .eq("item_id", inventoryItem.id)
      .eq("status", "active")
      .gt("available_quantity", 0)
      .order("expiry_date", { ascending: true });

    for (const batch of batches || []) {
      if (remainingQty <= 0) break;

      const deductQty = Math.min(batch.available_quantity, remainingQty);

      // Update batch
      await supabase
        .from("inventory_batches")
        .update({
          available_quantity: batch.available_quantity - deductQty,
          status:
            batch.available_quantity - deductQty <= 0 ? "depleted" : "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", batch.id);

      // Record movement
      await recordStockMovement({
        item_id: inventoryItem.id,
        batch_id: batch.id,
        movement_type: "dispensing",
        quantity: deductQty,
        unit_cost: batch.cost_price,
        reference_type: "prescription",
        reference_id: prescriptionId,
        notes: `Dispensed for prescription`,
        performed_by: userId,
      });

      remainingQty -= deductQty;
    }

    // If we couldn't deduct from batches but forceDispense is true
    if (remainingQty > 0 && forceDispense) {
      // Direct deduction from item stock
      await supabase
        .from("inventory_items")
        .update({
          current_stock: Math.max(
            0,
            inventoryItem.current_stock - requestedQty
          ),
          updated_at: new Date().toISOString(),
        })
        .eq("id", inventoryItem.id);

      await recordStockMovement({
        item_id: inventoryItem.id,
        movement_type: "dispensing",
        quantity: requestedQty,
        reference_type: "prescription",
        reference_id: prescriptionId,
        notes: `Force dispensed for prescription (stock override)`,
        performed_by: userId,
      });

      warnings.push({
        medication_name: item.medication_name,
        warning: "Stock was overridden - negative stock may occur",
      });
    }

    dispensedItems.push({
      medication_name: item.medication_name,
      quantity_dispensed: requestedQty - remainingQty,
    });
  }

  return { success: true, dispensedItems, warnings };
}

// =============================================
// REPORTS ACTIONS
// =============================================

export async function getStockValuationReport() {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      `
      id,
      name,
      sku,
      item_type,
      current_stock,
      unit_of_measure,
      cost_price,
      selling_price,
      category:inventory_categories(name)
    `
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    return { success: false, error: error.message };
  }

  const report = data.map((item) => ({
    ...item,
    total_cost_value: item.current_stock * item.cost_price,
    total_selling_value: item.current_stock * item.selling_price,
    potential_profit:
      item.current_stock * (item.selling_price - item.cost_price),
  }));

  const totals = {
    total_items: report.length,
    total_units: report.reduce((sum, item) => sum + item.current_stock, 0),
    total_cost_value: report.reduce(
      (sum, item) => sum + item.total_cost_value,
      0
    ),
    total_selling_value: report.reduce(
      (sum, item) => sum + item.total_selling_value,
      0
    ),
    total_potential_profit: report.reduce(
      (sum, item) => sum + item.potential_profit,
      0
    ),
  };

  return { success: true, report, totals };
}

export async function getLowStockReport() {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from("inventory_items")
    .select(
      `
      id,
      name,
      sku,
      item_type,
      current_stock,
      minimum_stock,
      reorder_level,
      unit_of_measure,
      supplier:inventory_suppliers(id, name, contact_person, phone)
    `
    )
    .eq("is_active", true)
    .order("current_stock", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  const lowStockItems = data.filter(
    (item) => item.current_stock <= item.minimum_stock
  );
  const outOfStockItems = data.filter((item) => item.current_stock === 0);
  const reorderNeeded = data.filter(
    (item) => item.current_stock <= item.reorder_level
  );

  return {
    success: true,
    lowStockItems,
    outOfStockItems,
    reorderNeeded,
    summary: {
      total_low_stock: lowStockItems.length,
      total_out_of_stock: outOfStockItems.length,
      total_reorder_needed: reorderNeeded.length,
    },
  };
}

export async function getExpiryReport(daysAhead = 90) {
  const supabase = supabaseAdmin;

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from("inventory_batches")
    .select(
      `
      id,
      batch_number,
      lot_number,
      available_quantity,
      expiry_date,
      status,
      item:inventory_items(id, name, sku, unit_of_measure)
    `
    )
    .in("status", ["active"])
    .gt("available_quantity", 0)
    .lte("expiry_date", futureDate.toISOString())
    .order("expiry_date", { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  const today = new Date();
  const categorizedBatches = {
    expired: [],
    expiring_7_days: [],
    expiring_30_days: [],
    expiring_90_days: [],
  };

  for (const batch of data || []) {
    const expiryDate = new Date(batch.expiry_date);
    const daysUntilExpiry = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24)
    );

    const batchWithDays = { ...batch, days_until_expiry: daysUntilExpiry };

    if (daysUntilExpiry <= 0) {
      categorizedBatches.expired.push(batchWithDays);
    } else if (daysUntilExpiry <= 7) {
      categorizedBatches.expiring_7_days.push(batchWithDays);
    } else if (daysUntilExpiry <= 30) {
      categorizedBatches.expiring_30_days.push(batchWithDays);
    } else {
      categorizedBatches.expiring_90_days.push(batchWithDays);
    }
  }

  return {
    success: true,
    batches: categorizedBatches,
    summary: {
      expired: categorizedBatches.expired.length,
      expiring_7_days: categorizedBatches.expiring_7_days.length,
      expiring_30_days: categorizedBatches.expiring_30_days.length,
      expiring_90_days: categorizedBatches.expiring_90_days.length,
    },
  };
}

export async function getStockMovementReport(options = {}) {
  const supabase = supabaseAdmin;
  const {
    startDate = new Date(
      new Date().setMonth(new Date().getMonth() - 1)
    ).toISOString(),
    endDate = new Date().toISOString(),
    itemId,
    movementType,
  } = options;

  let query = supabase
    .from("inventory_stock_movements")
    .select(
      `
      id,
      movement_type,
      quantity,
      quantity_before,
      quantity_after,
      unit_cost,
      total_cost,
      reason,
      created_at,
      item:inventory_items(id, name, sku)
    `
    )
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (itemId) {
    query = query.eq("item_id", itemId);
  }

  if (movementType) {
    query = query.eq("movement_type", movementType);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Aggregate by movement type
  const byType = {};
  for (const movement of data || []) {
    if (!byType[movement.movement_type]) {
      byType[movement.movement_type] = {
        count: 0,
        total_quantity: 0,
        total_value: 0,
      };
    }
    byType[movement.movement_type].count++;
    byType[movement.movement_type].total_quantity += movement.quantity;
    byType[movement.movement_type].total_value += movement.total_cost || 0;
  }

  return {
    success: true,
    movements: data,
    summary: byType,
    period: { startDate, endDate },
  };
}
