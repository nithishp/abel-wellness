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

// GET - Get patient's invoices and stats
export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query for invoices
    let query = supabaseAdmin
      .from("invoices")
      .select(
        `
        *,
        items:invoice_items(*),
        payments(*)
      `
      )
      .eq("patient_id", patient.id)
      .neq("status", "draft") // Don't show draft invoices to patients
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: invoices, error: invoicesError } = await query;

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      total_invoices: invoices.length,
      total_amount: invoices.reduce(
        (sum, inv) => sum + (inv.total_amount || 0),
        0
      ),
      total_paid: invoices.reduce(
        (sum, inv) => sum + (inv.amount_paid || 0),
        0
      ),
      total_outstanding: invoices
        .filter((inv) => ["pending", "partial"].includes(inv.status))
        .reduce((sum, inv) => sum + (inv.amount_due || 0), 0),
    };

    return NextResponse.json({
      success: true,
      invoices,
      stats,
    });
  } catch (error) {
    console.error("Error in patient billing GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
