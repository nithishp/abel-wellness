"use server";

import { NextResponse } from "next/server";
import {
  syncOfflineBill,
  batchSyncOfflineBills,
  getPendingOfflineBills,
  getDeviceSyncStats,
} from "@/lib/actions/offline-billing.actions";

// POST /api/billing/sync - Sync offline bills
export async function POST(request) {
  try {
    const data = await request.json();
    const { bills, device_id } = data;

    // Batch sync if multiple bills
    if (Array.isArray(bills) && bills.length > 0) {
      const result = await batchSyncOfflineBills(bills);
      return NextResponse.json(result, {
        status: result.failed > 0 ? 207 : 200, // 207 Multi-Status if some failed
      });
    }

    // Single bill sync
    const result = await syncOfflineBill(data);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, conflict: result.conflict },
        { status: result.conflict ? 409 : 400 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error syncing offline bills:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/billing/sync - Get pending offline bills or sync stats
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("device_id");
    const stats = searchParams.get("stats");

    // Get device sync stats
    if (deviceId && stats === "true") {
      const result = await getDeviceSyncStats(deviceId);
      return NextResponse.json(result);
    }

    // Get pending offline bills for a device
    if (deviceId) {
      const result = await getPendingOfflineBills(deviceId);
      return NextResponse.json(result);
    }

    // Get all pending bills
    const result = await getPendingOfflineBills();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching offline bills:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
