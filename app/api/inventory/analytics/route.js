import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";

// Helper to verify admin/pharmacist session
async function verifyAdminOrPharmacist() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return null;
  }

  const { data: session } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    return null;
  }

  if (!["admin", "pharmacist"].includes(session.user.role)) {
    return null;
  }

  return session.user;
}

// GET /api/inventory/analytics - Get inventory analytics data for charts
export async function GET(request) {
  try {
    const user = await verifyAdminOrPharmacist();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get items by category
    const { data: itemsByCategory, error: catError } = await supabaseAdmin
      .from("inventory_items")
      .select(
        `
        id,
        item_type,
        current_stock,
        cost_price,
        category:inventory_categories(name)
      `
      )
      .eq("is_active", true);

    if (catError) {
      console.error("Error fetching items by category:", catError);
    }

    // Aggregate by category
    const categoryData = {};
    const typeData = {};

    for (const item of itemsByCategory || []) {
      const categoryName = item.category?.name || "Uncategorized";
      const typeName = item.item_type || "other";

      if (!categoryData[categoryName]) {
        categoryData[categoryName] = { count: 0, value: 0 };
      }
      categoryData[categoryName].count++;
      categoryData[categoryName].value += item.current_stock * item.cost_price;

      if (!typeData[typeName]) {
        typeData[typeName] = { count: 0, stock: 0 };
      }
      typeData[typeName].count++;
      typeData[typeName].stock += item.current_stock;
    }

    // Get stock movements for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: movements, error: movError } = await supabaseAdmin
      .from("inventory_stock_movements")
      .select("movement_type, quantity, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (movError) {
      console.error("Error fetching movements:", movError);
    }

    // Aggregate movements by day
    const movementsByDay = {};
    for (const mov of movements || []) {
      const date = new Date(mov.created_at).toISOString().split("T")[0];
      if (!movementsByDay[date]) {
        movementsByDay[date] = {
          date,
          stock_in: 0,
          stock_out: 0,
          adjustments: 0,
        };
      }

      if (["purchase", "return", "opening_stock"].includes(mov.movement_type)) {
        movementsByDay[date].stock_in += mov.quantity;
      } else if (
        ["sale", "dispensed", "transfer_out"].includes(mov.movement_type)
      ) {
        movementsByDay[date].stock_out += mov.quantity;
      } else {
        movementsByDay[date].adjustments += mov.quantity;
      }
    }

    // Get stock status overview
    const { data: stockStatus, error: stockError } = await supabaseAdmin
      .from("inventory_items")
      .select("current_stock, minimum_stock, reorder_level")
      .eq("is_active", true);

    if (stockError) {
      console.error("Error fetching stock status:", stockError);
    }

    let healthy = 0;
    let lowStock = 0;
    let reorderNeeded = 0;
    let outOfStock = 0;

    for (const item of stockStatus || []) {
      if (item.current_stock === 0) {
        outOfStock++;
      } else if (item.current_stock <= item.minimum_stock) {
        lowStock++;
      } else if (item.current_stock <= item.reorder_level) {
        reorderNeeded++;
      } else {
        healthy++;
      }
    }

    // Get recent purchase orders stats (if table exists)
    let purchaseOrderStats = {};
    try {
      const { data: poStats, error: poError } = await supabaseAdmin
        .from("purchase_orders")
        .select("status, total_amount")
        .gte(
          "created_at",
          new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString()
        );

      if (!poError && poStats) {
        for (const po of poStats) {
          if (!purchaseOrderStats[po.status]) {
            purchaseOrderStats[po.status] = { count: 0, value: 0 };
          }
          purchaseOrderStats[po.status].count++;
          purchaseOrderStats[po.status].value += po.total_amount || 0;
        }
      }
    } catch (e) {
      // Table might not exist, silently ignore
    }

    // Get expiry distribution - include both active and expired batches with quantity
    const { data: batches, error: batchError } = await supabaseAdmin
      .from("inventory_batches")
      .select("expiry_date, available_quantity, status")
      .in("status", ["active", "expired"])
      .gt("available_quantity", 0);

    if (batchError) {
      console.error("Error fetching batches:", batchError);
    }

    // Also count unresolved expired alerts from inventory_alerts table for consistency
    const { count: expiredAlertsCount, error: alertsError } =
      await supabaseAdmin
        .from("inventory_alerts")
        .select("*", { count: "exact", head: true })
        .eq("alert_type", "expired")
        .eq("is_resolved", false);

    if (alertsError) {
      console.error("Error fetching expired alerts count:", alertsError);
    }

    const today = new Date();
    let expired = 0;
    let expiring7 = 0;
    let expiring30 = 0;
    let expiring90 = 0;
    let safe = 0;

    for (const batch of batches || []) {
      // Count batches with status "expired" as expired
      if (batch.status === "expired") {
        expired++;
        continue;
      }

      if (!batch.expiry_date) {
        safe++;
        continue;
      }
      const expiryDate = new Date(batch.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) expired++;
      else if (daysUntilExpiry <= 7) expiring7++;
      else if (daysUntilExpiry <= 30) expiring30++;
      else if (daysUntilExpiry <= 90) expiring90++;
      else safe++;
    }

    // Use the alerts count if it's higher (for consistency with alerts page)
    const expiredCount = Math.max(expired, expiredAlertsCount || 0);

    return NextResponse.json({
      success: true,
      categoryDistribution: Object.entries(categoryData).map(
        ([name, data]) => ({
          name,
          items: data.count,
          value: Math.round(data.value),
        })
      ),
      typeDistribution: Object.entries(typeData).map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        items: data.count,
        stock: data.stock,
      })),
      stockMovements: Object.values(movementsByDay).slice(-14), // Last 14 days
      stockStatus: {
        healthy,
        lowStock,
        reorderNeeded,
        outOfStock,
      },
      purchaseOrderStats: Object.entries(purchaseOrderStats).map(
        ([status, data]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count: data.count,
          value: Math.round(data.value),
        })
      ),
      expiryDistribution: [
        { name: "Expired", value: expiredCount, fill: "var(--color-expired)" },
        { name: "7 Days", value: expiring7, fill: "var(--color-expiring7)" },
        { name: "30 Days", value: expiring30, fill: "var(--color-expiring30)" },
        { name: "90 Days", value: expiring90, fill: "var(--color-expiring90)" },
        { name: "Safe", value: safe, fill: "var(--color-safe)" },
      ],
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
