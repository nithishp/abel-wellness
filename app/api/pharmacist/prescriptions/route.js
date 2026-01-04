import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES } from "@/lib/supabase.config";

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

// GET - Fetch all prescriptions for pharmacist with pagination
export async function GET(request) {
  try {
    const pharmacist = await verifyPharmacistSession();
    if (!pharmacist) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    // First get total count - we need to do this differently since we're joining
    const { count: totalCount } = await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select("*", { count: "exact", head: true });

    let query = supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .select(
        `
        id,
        notes,
        status,
        created_at,
        dispensed_at,
        patient:patient_id(id, full_name, email, phone, address),
        doctor:doctor_id(id, user:user_id(full_name)),
        items:prescription_items(
          id,
          medication_name,
          dosage,
          frequency,
          duration,
          quantity,
          instructions
        )
      `
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: prescriptions, error } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      throw error;
    }

    // Filter by search if provided (client-side since we're searching joined data)
    let filteredPrescriptions = prescriptions || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPrescriptions = filteredPrescriptions.filter(
        (p) =>
          p.patient?.full_name?.toLowerCase().includes(searchLower) ||
          p.doctor?.user?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    const formattedPrescriptions = filteredPrescriptions.map((p) => ({
      id: p.id,
      notes: p.notes,
      status: p.status,
      created_at: p.created_at,
      dispensed_at: p.dispensed_at,
      patient_name: p.patient?.full_name || "Unknown Patient",
      patient_email: p.patient?.email,
      patient_phone: p.patient?.phone,
      patient_address: p.patient?.address,
      doctor_name: p.doctor?.user?.full_name || "Unknown Doctor",
      items: p.items || [],
    }));

    const hasMore = offset + prescriptions.length < totalCount;

    return NextResponse.json({
      prescriptions: formattedPrescriptions,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch prescriptions" },
      { status: 500 }
    );
  }
}
