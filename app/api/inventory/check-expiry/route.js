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

  const { data: session, error } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !session) {
    return null;
  }

  if (!["admin", "pharmacist"].includes(session.user.role)) {
    return null;
  }

  return session.user;
}

// POST - Run expiry check manually
export async function POST() {
  try {
    const user = await verifyAdminOrPharmacist();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get batches expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringBatches, error: batchError } = await supabaseAdmin
      .from("inventory_batches")
      .select(
        `
        id,
        item_id,
        batch_number,
        expiry_date,
        available_quantity,
        status,
        item:inventory_items(id, name)
      `
      )
      .eq("status", "active")
      .not("expiry_date", "is", null)
      .lte("expiry_date", thirtyDaysFromNow.toISOString())
      .gt("available_quantity", 0);

    if (batchError) {
      throw batchError;
    }

    const alertsCreated = [];
    const batchesUpdated = [];

    for (const batch of expiringBatches || []) {
      const expiryDate = new Date(batch.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      const daysToExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );

      // Check if alert already exists
      const { data: existingAlert } = await supabaseAdmin
        .from("inventory_alerts")
        .select("id")
        .eq("batch_id", batch.id)
        .in("alert_type", ["expiring_soon", "expired"])
        .eq("is_resolved", false)
        .single();

      if (existingAlert) {
        continue; // Skip if alert already exists
      }

      let alertType, severity, message;

      if (daysToExpiry <= 0) {
        // Batch has expired
        alertType = "expired";
        severity = "critical";
        message = `Batch "${batch.batch_number}" of "${batch.item?.name}" has expired! Qty: ${batch.available_quantity}`;

        // Update batch status to expired
        await supabaseAdmin
          .from("inventory_batches")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .eq("id", batch.id);

        batchesUpdated.push(batch.id);
      } else if (daysToExpiry <= 7) {
        // Expiring within 7 days - high severity
        alertType = "expiring_soon";
        severity = "high";
        message = `Batch "${batch.batch_number}" of "${batch.item?.name}" expires in ${daysToExpiry} days! Qty: ${batch.available_quantity}`;
      } else {
        // Expiring within 30 days - medium severity
        alertType = "expiring_soon";
        severity = "medium";
        message = `Batch "${batch.batch_number}" of "${batch.item?.name}" expires in ${daysToExpiry} days. Qty: ${batch.available_quantity}`;
      }

      // Create alert
      const { data: alert, error: alertError } = await supabaseAdmin
        .from("inventory_alerts")
        .insert({
          item_id: batch.item_id,
          batch_id: batch.id,
          alert_type: alertType,
          severity,
          message,
        })
        .select()
        .single();

      if (!alertError && alert) {
        alertsCreated.push(alert);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Expiry check completed",
      alertsCreated: alertsCreated.length,
      batchesUpdated: batchesUpdated.length,
      details: {
        batchesChecked: expiringBatches?.length || 0,
        alerts: alertsCreated,
      },
    });
  } catch (error) {
    console.error("Error running expiry check:", error);
    return NextResponse.json(
      { error: "Failed to run expiry check" },
      { status: 500 }
    );
  }
}
