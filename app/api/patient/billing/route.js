import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

// Helper function to verify patient session
async function verifyPatientSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) return null;

    const { data: session } = await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .select("*, user:users(*)")
      .eq("session_token", sessionToken)
      .single();

    if (!session || new Date(session.expires_at) < new Date()) return null;
    if (session.user?.role !== ROLES.PATIENT) return null;

    return session.user;
  } catch (error) {
    console.error("Error verifying patient session:", error);
    return null;
  }
}

// GET - Get patient's invoices and stats
export async function GET(request) {
  try {
    const user = await verifyPatientSession();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Build query for invoices - use user.id directly as patient_id
    let query = supabaseAdmin
      .from("invoices")
      .select(
        `
        *,
        items:invoice_items(*),
        payments(*)
      `,
      )
      .eq("patient_id", user.id)
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
        { status: 500 },
      );
    }

    // Calculate stats with field names matching the frontend expectations
    const paidInvoices = invoices.filter((inv) => inv.status === "paid");
    const pendingInvoices = invoices.filter((inv) =>
      ["pending", "partial"].includes(inv.status),
    );

    const stats = {
      total: invoices.length,
      pending: pendingInvoices.length,
      paid: paidInvoices.length,
      totalAmount: invoices.reduce(
        (sum, inv) => sum + (inv.total_amount || 0),
        0,
      ),
      paidAmount: invoices.reduce(
        (sum, inv) => sum + (inv.amount_paid || 0),
        0,
      ),
      pendingAmount: pendingInvoices.reduce(
        (sum, inv) => sum + (inv.amount_due || 0),
        0,
      ),
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
      { status: 500 },
    );
  }
}
