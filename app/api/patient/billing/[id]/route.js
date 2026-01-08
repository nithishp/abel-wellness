import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to get user from session
async function getUserFromSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return null;
    }

    // Get session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session) {
      return null;
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return null;
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", session.user_id)
      .single();

    if (userError || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user from session:", error);
    return null;
  }
}

// GET - Get specific invoice for patient
export async function GET(request, { params }) {
  try {
    const user = await getUserFromSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "patient") {
      return NextResponse.json(
        { success: false, error: "Access denied. Patient access only." },
        { status: 403 }
      );
    }

    // Get patient record
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { success: false, error: "Patient record not found" },
        { status: 404 }
      );
    }

    const { id } = await params;

    // Fetch invoice with related data
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select(
        `
        *,
        items:invoice_items(*),
        payments(*),
        appointment:appointments(
          id,
          date,
          time_slot,
          reason_for_visit,
          doctor:doctors(
            id,
            specialization,
            user:users(name, email)
          )
        )
      `
      )
      .eq("id", id)
      .eq("patient_id", patient.id)
      .neq("status", "draft") // Don't show draft invoices
      .single();

    if (invoiceError) {
      console.error("Error fetching invoice:", invoiceError);
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Sort items by created_at
    if (invoice.items) {
      invoice.items.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    }

    // Sort payments by payment_date
    if (invoice.payments) {
      invoice.payments.sort(
        (a, b) => new Date(b.payment_date) - new Date(a.payment_date)
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error in patient billing GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
