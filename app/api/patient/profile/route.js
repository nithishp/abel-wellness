import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

async function verifyPatientSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  const { data: session } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("token", sessionToken)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) return null;
  if (session.user?.role !== ROLES.PATIENT) return null;
  return session.user;
}

// GET - Fetch patient profile
export async function GET() {
  try {
    const user = await verifyPatientSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      age: user.age,
      sex: user.sex,
      occupation: user.occupation,
      address: user.address,
      avatar_url: user.avatar_url,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update patient profile
export async function PUT(request) {
  try {
    const user = await verifyPatientSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, age, sex, occupation, address } = body;

    // Basic validation
    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 },
      );
    }

    if (phone && !/^[0-9+\-\s()]{7,15}$/.test(phone.trim())) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 },
      );
    }

    if (age !== null && age !== undefined && age !== "") {
      const parsedAge = parseInt(age, 10);
      if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
        return NextResponse.json(
          { error: "Age must be between 0 and 150" },
          { status: 400 },
        );
      }
    }

    if (sex && !["male", "female", "other"].includes(sex.toLowerCase())) {
      return NextResponse.json(
        { error: "Sex must be male, female, or other" },
        { status: 400 },
      );
    }

    const updateData = {
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
      age: age ? parseInt(age, 10) : null,
      sex: sex?.toLowerCase() || null,
      occupation: occupation?.trim() || null,
      address: address?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from(TABLES.USERS)
      .update(updateData)
      .eq("id", user.id)
      .select(
        "id, email, full_name, phone, age, sex, occupation, address, avatar_url",
      )
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
