import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

// Helper function to verify admin session
async function verifyAdminSession() {
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

  if (session.user?.role !== ROLES.ADMIN) {
    return null;
  }

  return session.user;
}

// GET - List all patients
export async function GET(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    let query = supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("role", ROLES.PATIENT);

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: patients, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching patients:", error);
      return NextResponse.json(
        { error: "Failed to fetch patients" },
        { status: 500 }
      );
    }

    // Get appointment counts for each patient
    const patientsWithStats = await Promise.all(
      patients.map(async (patient) => {
        // Get appointment count
        const { count: appointmentCount } = await supabaseAdmin
          .from(TABLES.APPOINTMENTS)
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patient.id);

        // Get medical records count
        const { count: recordsCount } = await supabaseAdmin
          .from(TABLES.MEDICAL_RECORDS)
          .select("*", { count: "exact", head: true })
          .eq("patient_id", patient.id);

        // Remove password hash from response
        const { password_hash, ...safePatient } = patient;
        return {
          ...safePatient,
          appointmentCount: appointmentCount || 0,
          recordsCount: recordsCount || 0,
        };
      })
    );

    return NextResponse.json({ patients: patientsWithStats });
  } catch (error) {
    console.error("Error in GET patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update patient details
export async function PUT(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("id");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { name, phone, is_active } = data;

    // Verify the user is a patient
    const { data: existingPatient } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("id", patientId)
      .eq("role", ROLES.PATIENT)
      .single();

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.full_name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedPatient, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update(updateData)
      .eq("id", patientId)
      .select()
      .single();

    if (error) {
      console.error("Error updating patient:", error);
      return NextResponse.json(
        { error: "Failed to update patient" },
        { status: 500 }
      );
    }

    const { password_hash, ...safePatient } = updatedPatient;
    return NextResponse.json({ patient: safePatient });
  } catch (error) {
    console.error("Error in PUT patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate a patient (soft delete)
export async function DELETE(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("id");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Verify the user is a patient
    const { data: existingPatient } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("id", patientId)
      .eq("role", ROLES.PATIENT)
      .single();

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ is_active: false })
      .eq("id", patientId);

    if (error) {
      console.error("Error deactivating patient:", error);
      return NextResponse.json(
        { error: "Failed to deactivate patient" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE patient:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
