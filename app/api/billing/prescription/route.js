import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES } from "@/lib/supabase.config";
import {
  createInvoiceFromPrescription,
  getPrescriptionBillingStatus,
  canDispensePrescription,
  getPrescriptionsAwaitingBilling,
  searchInventoryForPrescription,
} from "@/lib/actions/prescription-billing.actions";

// Helper to verify session
async function verifySession(allowedRoles = ["admin", "pharmacist"]) {
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

  if (!allowedRoles.includes(session.user?.role)) {
    return null;
  }

  return session.user;
}

// POST - Create invoice from prescription
export async function POST(request) {
  try {
    const user = await verifySession(["admin", "pharmacist"]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prescriptionId, options = {} } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { error: "Prescription ID is required" },
        { status: 400 },
      );
    }

    const result = await createInvoiceFromPrescription(
      prescriptionId,
      user.id,
      options,
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, existingInvoiceId: result.existingInvoiceId },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      invoice: result.invoice,
      message: result.message,
    });
  } catch (error) {
    console.error("Error creating invoice from prescription:", error);
    return NextResponse.json(
      { error: "Failed to create invoice from prescription" },
      { status: 500 },
    );
  }
}

// GET - Get prescription billing status or list prescriptions awaiting billing
export async function GET(request) {
  try {
    const user = await verifySession(["admin", "pharmacist", "doctor"]);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prescriptionId = searchParams.get("prescriptionId");
    const action = searchParams.get("action");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const patientId = searchParams.get("patientId");
    const query = searchParams.get("query");

    // Search inventory for prescription autocomplete
    if (action === "search-inventory") {
      const result = await searchInventoryForPrescription(query || "", {
        limit: parseInt(searchParams.get("limit")) || 10,
      });

      return NextResponse.json(result);
    }

    // Get prescriptions awaiting billing
    if (action === "awaiting-billing") {
      const result = await getPrescriptionsAwaitingBilling({
        page,
        limit,
        patientId,
      });

      return NextResponse.json(result);
    }

    // Check if prescription can be dispensed
    if (action === "can-dispense" && prescriptionId) {
      const result = await canDispensePrescription(prescriptionId);
      return NextResponse.json(result);
    }

    // Get single prescription billing status
    if (prescriptionId) {
      const result = await getPrescriptionBillingStatus(prescriptionId);
      return NextResponse.json(result);
    }

    // Default: return prescriptions awaiting billing
    const result = await getPrescriptionsAwaitingBilling({ page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting prescription billing:", error);
    return NextResponse.json(
      { error: "Failed to get prescription billing info" },
      { status: 500 },
    );
  }
}
