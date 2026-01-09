"use server";

import { NextResponse } from "next/server";
import {
  getAuditLogs,
  getAuditLogsForEntity,
} from "@/lib/actions/audit.actions";

// GET /api/billing/audit-logs - Get audit logs with filters
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");
    const action = searchParams.get("action");
    const userId = searchParams.get("user_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // If requesting logs for a specific entity
    if (entityType && entityId) {
      const result = await getAuditLogsForEntity(entityType, entityId);
      return NextResponse.json(result);
    }

    // Get audit logs with filters
    const result = await getAuditLogs({
      entityType,
      action,
      userId,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
