import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase.config";
import { TABLES } from "@/lib/supabase.config";

// Helper to verify doctor session
async function verifyDoctorSession() {
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

  if (session.user?.role !== "doctor") {
    return null;
  }

  return session.user;
}

// GET - Fetch all appointments for the logged-in doctor with pagination
export async function GET(request) {
  try {
    const doctor = await verifyDoctorSession();
    if (!doctor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get doctor profile
    const { data: doctorProfile, error: doctorError } = await supabaseAdmin
      .from(TABLES.DOCTORS)
      .select("id")
      .eq("user_id", doctor.id)
      .single();

    if (doctorError || !doctorProfile) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // First get total count
    let countQuery = supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*", { count: "exact", head: true })
      .eq("doctor_id", doctorProfile.id)
      .in("status", ["approved", "completed"]);

    if (search) {
      countQuery = countQuery.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { count: totalCount } = await countQuery;

    // Fetch paginated appointments for this doctor
    let query = supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select(
        `
        id,
        name,
        email,
        phone,
        date,
        time,
        status,
        consultation_status,
        reason_for_visit,
        created_at,
        updated_at,
        patient:patient_id(id, full_name, age, sex)
      `
      )
      .eq("doctor_id", doctorProfile.id)
      .in("status", ["approved", "completed"])
      .order("date", { ascending: false })
      .order("time", { ascending: true });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data: appointments, error: appointmentsError } = await query.range(
      offset,
      offset + limit - 1
    );

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    const hasMore = offset + appointments.length < totalCount;

    return NextResponse.json({
      appointments: appointments || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error in doctor appointments API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
