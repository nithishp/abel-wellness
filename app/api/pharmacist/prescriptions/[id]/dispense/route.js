import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES, PRESCRIPTION_STATUS } from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";
import {
  dispensePrescriptionItems,
  checkStockAvailability,
} from "@/lib/actions/inventory.actions";
import {
  canDispensePrescription,
  createInvoiceFromPrescription,
  syncPrescriptionBillingStatus,
} from "@/lib/actions/prescription-billing.actions";
import { deductStockForInvoice } from "@/lib/actions/inventory-billing.actions";
import { INVOICE_STATUS } from "@/lib/billing.constants";

// Helper to verify pharmacist session
async function verifyPharmacistSession() {
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

  if (error || !session || session.user?.role !== "pharmacist") {
    return null;
  }

  return session.user;
}

// POST - Mark prescription as dispensed
export async function POST(request, { params }) {
  try {
    const pharmacist = await verifyPharmacistSession();
    if (!pharmacist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const forceDispense = body.forceDispense || false;

    // Get pharmacist profile
    const { data: pharmacistProfile } = await supabaseAdmin
      .from(TABLES.PHARMACISTS)
      .select("id")
      .eq("user_id", pharmacist.id)
      .single();

    if (!pharmacistProfile) {
      return NextResponse.json(
        { error: "Pharmacist profile not found" },
        { status: 404 },
      );
    }

    // Get prescription with invoice info
    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        *,
        patient:patient_id(id, full_name, email),
        doctor:doctor_id(id, user:user_id(full_name)),
        items:prescription_items(*),
        invoice:invoice_id(id, invoice_number, status, total_amount, amount_paid)
      `,
      )
      .eq("id", id)
      .single();

    if (prescriptionError || !prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    if (prescription.status === PRESCRIPTION_STATUS.DISPENSED) {
      return NextResponse.json(
        { error: "Prescription already dispensed" },
        { status: 400 },
      );
    }

    // ========================================
    // BILLING CHECK: Cannot dispense without paid invoice
    // ========================================
    const billingCheck = await canDispensePrescription(id);

    if (!billingCheck.success) {
      return NextResponse.json(
        { error: billingCheck.error || "Failed to check billing status" },
        { status: 500 },
      );
    }

    if (!billingCheck.canDispense) {
      // Return detailed response based on what's needed
      if (billingCheck.needsInvoice) {
        return NextResponse.json(
          {
            success: false,
            error: "Invoice required",
            message: billingCheck.reason,
            needsInvoice: true,
            prescriptionId: id,
          },
          { status: 400 },
        );
      }

      if (billingCheck.needsPayment) {
        return NextResponse.json(
          {
            success: false,
            error: "Payment required",
            message: billingCheck.reason,
            needsPayment: true,
            invoiceId: billingCheck.invoiceId,
            invoiceNumber: billingCheck.invoiceNumber,
            prescriptionId: id,
          },
          { status: 400 },
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: billingCheck.reason || "Cannot dispense prescription",
        },
        { status: 400 },
      );
    }

    // Check inventory stock availability
    if (prescription.items && prescription.items.length > 0) {
      const itemsToCheck = prescription.items.map((item) => ({
        medication_name: item.medication_name,
        quantity: item.quantity || 1,
      }));

      // Check stock availability
      const stockCheck = await checkStockAvailability(itemsToCheck);

      if (!stockCheck.success) {
        return NextResponse.json(
          { error: stockCheck.error || "Failed to check stock" },
          { status: 500 },
        );
      }

      // If there are insufficient stock items and forceDispense is false, return warning
      if (
        stockCheck.insufficientItems &&
        stockCheck.insufficientItems.length > 0 &&
        !forceDispense
      ) {
        return NextResponse.json(
          {
            success: false,
            requiresConfirmation: true,
            message: "Some items have insufficient stock",
            insufficientItems: stockCheck.insufficientItems,
            availabilityDetails: stockCheck.items,
          },
          { status: 200 },
        );
      }

      // ========================================
      // STOCK DEDUCTION: Use invoice-based deduction for proper tracking
      // ========================================
      // Deduct stock through the invoice system for proper audit trail
      if (prescription.invoice_id) {
        const stockDeductResult = await deductStockForInvoice(
          prescription.invoice_id,
          pharmacist.id,
        );

        if (!stockDeductResult.success && !forceDispense) {
          return NextResponse.json(
            {
              success: false,
              requiresConfirmation: true,
              message: stockDeductResult.error || "Failed to deduct stock",
              stockErrors: stockDeductResult.errors,
            },
            { status: 200 },
          );
        }
      } else {
        // Fallback: Direct dispensing if no invoice (shouldn't happen with billing check)
        const dispenseResult = await dispensePrescriptionItems(
          id,
          itemsToCheck,
          pharmacist.id,
          forceDispense,
        );

        if (!dispenseResult.success && !forceDispense) {
          return NextResponse.json(
            {
              success: false,
              requiresConfirmation: true,
              message: dispenseResult.error || "Failed to dispense items",
              insufficientItems: dispenseResult.insufficientItems,
            },
            { status: 200 },
          );
        }
      }
    }

    // Update prescription status
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .update({
        status: PRESCRIPTION_STATUS.DISPENSED,
        dispensed_by: pharmacistProfile.id,
        dispensed_at: new Date().toISOString(),
        billing_status: "paid", // Mark as paid since we've verified payment above
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Sync prescription billing status
    if (prescription.invoice_id) {
      await syncPrescriptionBillingStatus(prescription.invoice_id);
    }

    // Send notification to patient
    if (prescription.patient?.email) {
      try {
        await sendEmail({
          to: prescription.patient.email,
          ...emailTemplates.prescriptionDispensed(
            prescription.patient.full_name,
            {
              id: id,
              itemCount: prescription.items?.length || 0,
            },
          ),
        });
      } catch (emailError) {
        console.error("Error sending dispensed email:", emailError);
      }
    }

    // Create notification for patient
    await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert({
      user_id: prescription.patient_id,
      type: "prescription_dispensed",
      title: "Prescription Dispensed",
      message: "Your prescription has been dispensed and is ready for pickup",
      related_id: id,
      related_type: "prescription",
    });

    return NextResponse.json({
      message: "Prescription marked as dispensed",
      prescription: {
        id,
        status: PRESCRIPTION_STATUS.DISPENSED,
        dispensed_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error dispensing prescription:", error);
    return NextResponse.json(
      { error: "Failed to dispense prescription" },
      { status: 500 },
    );
  }
}
