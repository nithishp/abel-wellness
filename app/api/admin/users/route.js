import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";
import bcrypt from "bcryptjs";

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

// GET - List users (doctors and pharmacists) with pagination
export async function GET(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const includeInactive = searchParams.get("includeInactive") === "true";
    const status = searchParams.get("status"); // "active" | "inactive" | null (all)
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // First get total count for pagination
    let countQuery = supabaseAdmin
      .from(TABLES.USERS)
      .select("*", { count: "exact", head: true });

    if (role) {
      countQuery = countQuery.eq("role", role);
    } else {
      countQuery = countQuery.in("role", [ROLES.DOCTOR, ROLES.PHARMACIST]);
    }

    // Apply status filter: explicit status param takes priority over includeInactive
    if (status === "active") {
      countQuery = countQuery.eq("is_active", true);
    } else if (status === "inactive") {
      countQuery = countQuery.eq("is_active", false);
    } else if (!includeInactive) {
      countQuery = countQuery.eq("is_active", true);
    }

    if (search) {
      countQuery = countQuery.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%`,
      );
    }

    const { count: totalCount } = await countQuery;

    // Then get paginated data
    let query = supabaseAdmin.from(TABLES.USERS).select("*");

    if (role) {
      query = query.eq("role", role);
    } else {
      query = query.in("role", [ROLES.DOCTOR, ROLES.PHARMACIST]);
    }

    // Apply status filter: explicit status param takes priority over includeInactive
    if (status === "active") {
      query = query.eq("is_active", true);
    } else if (status === "inactive") {
      query = query.eq("is_active", false);
    } else if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    // Get additional role data for doctors and pharmacists
    const usersWithRoleData = await Promise.all(
      users.map(async (user) => {
        let roleData = null;

        if (user.role === ROLES.DOCTOR) {
          const { data } = await supabaseAdmin
            .from(TABLES.DOCTORS)
            .select("*")
            .eq("user_id", user.id)
            .single();
          roleData = data;
        } else if (user.role === ROLES.PHARMACIST) {
          const { data } = await supabaseAdmin
            .from(TABLES.PHARMACISTS)
            .select("*")
            .eq("user_id", user.id)
            .single();
          roleData = data;
        }

        // Remove password hash from response
        const { password_hash, ...safeUser } = user;
        return { ...safeUser, roleData };
      }),
    );

    const hasMore = offset + users.length < totalCount;

    return NextResponse.json({
      users: usersWithRoleData,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error in GET users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST - Create new staff user (doctor or pharmacist)
export async function POST(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { email, password, name, phone, role, ...roleSpecificData } = data;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "Email, password, name, and role are required" },
        { status: 400 },
      );
    }

    // Validate role
    if (![ROLES.DOCTOR, ROLES.PHARMACIST].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be doctor or pharmacist" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, is_active, role")
      .eq("email", email.toLowerCase())
      .single();

    if (existingUser) {
      // If user is inactive, we can reactivate them
      if (!existingUser.is_active) {
        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Reactivate and update user
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from(TABLES.USERS)
          .update({
            password_hash: passwordHash,
            full_name: name,
            phone,
            role,
            is_active: true,
          })
          .eq("id", existingUser.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error reactivating user:", updateError);
          return NextResponse.json(
            { error: "Failed to reactivate user" },
            { status: 500 },
          );
        }

        // Update or create role-specific record
        if (role === ROLES.DOCTOR) {
          // Check if doctor record exists
          const { data: existingDoctor } = await supabaseAdmin
            .from(TABLES.DOCTORS)
            .select("id")
            .eq("user_id", existingUser.id)
            .single();

          if (existingDoctor) {
            // Update existing doctor record
            await supabaseAdmin
              .from(TABLES.DOCTORS)
              .update({
                specialization: roleSpecificData.specialization || null,
                qualification: roleSpecificData.qualification || null,
                experience_years: roleSpecificData.experienceYears || null,
                consultation_fee: roleSpecificData.consultationFee || null,
                bio: roleSpecificData.bio || null,
                is_available: true,
                working_hours: roleSpecificData.workingHours || {
                  monday: { start: "09:00", end: "17:00" },
                  tuesday: { start: "09:00", end: "17:00" },
                  wednesday: { start: "09:00", end: "17:00" },
                  thursday: { start: "09:00", end: "17:00" },
                  friday: { start: "09:00", end: "17:00" },
                },
              })
              .eq("user_id", existingUser.id);
          } else {
            // Create new doctor record
            await supabaseAdmin.from(TABLES.DOCTORS).insert({
              user_id: existingUser.id,
              specialization: roleSpecificData.specialization || null,
              qualification: roleSpecificData.qualification || null,
              experience_years: roleSpecificData.experienceYears || null,
              consultation_fee: roleSpecificData.consultationFee || null,
              bio: roleSpecificData.bio || null,
              is_available: true,
              working_hours: roleSpecificData.workingHours || {
                monday: { start: "09:00", end: "17:00" },
                tuesday: { start: "09:00", end: "17:00" },
                wednesday: { start: "09:00", end: "17:00" },
                thursday: { start: "09:00", end: "17:00" },
                friday: { start: "09:00", end: "17:00" },
              },
            });
          }
        } else if (role === ROLES.PHARMACIST) {
          // Check if pharmacist record exists
          const { data: existingPharmacist } = await supabaseAdmin
            .from(TABLES.PHARMACISTS)
            .select("id")
            .eq("user_id", existingUser.id)
            .single();

          if (existingPharmacist) {
            // Update existing pharmacist record
            await supabaseAdmin
              .from(TABLES.PHARMACISTS)
              .update({
                license_number: roleSpecificData.licenseNumber || null,
              })
              .eq("user_id", existingUser.id);
          } else {
            // Create new pharmacist record
            await supabaseAdmin.from(TABLES.PHARMACISTS).insert({
              user_id: existingUser.id,
              license_number: roleSpecificData.licenseNumber || null,
            });
          }
        }

        // Remove password hash from response
        const { password_hash, ...safeUser } = updatedUser;

        return NextResponse.json({
          success: true,
          user: safeUser,
          reactivated: true,
        });
      }

      // If user is active, return error
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const { data: newUser, error: userError } = await supabaseAdmin
      .from(TABLES.USERS)
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: name,
        phone,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user:", userError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    // Create role-specific record
    if (role === ROLES.DOCTOR) {
      const { error: doctorError } = await supabaseAdmin
        .from(TABLES.DOCTORS)
        .insert({
          user_id: newUser.id,
          specialization: roleSpecificData.specialization || null,
          qualification: roleSpecificData.qualification || null,
          experience_years: roleSpecificData.experienceYears || null,
          consultation_fee: roleSpecificData.consultationFee || null,
          bio: roleSpecificData.bio || null,
          is_available: true,
          working_hours: roleSpecificData.workingHours || {
            monday: { start: "09:00", end: "17:00" },
            tuesday: { start: "09:00", end: "17:00" },
            wednesday: { start: "09:00", end: "17:00" },
            thursday: { start: "09:00", end: "17:00" },
            friday: { start: "09:00", end: "17:00" },
          },
        });

      if (doctorError) {
        console.error("Error creating doctor record:", doctorError);
      }
    } else if (role === ROLES.PHARMACIST) {
      const { error: pharmacistError } = await supabaseAdmin
        .from(TABLES.PHARMACISTS)
        .insert({
          user_id: newUser.id,
          license_number: roleSpecificData.licenseNumber || null,
        });

      if (pharmacistError) {
        console.error("Error creating pharmacist record:", pharmacistError);
      }
    }

    // Remove password hash from response
    const { password_hash, ...safeUser } = newUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in POST user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT - Update staff user
export async function PUT(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const data = await request.json();
    const {
      password,
      name,
      email,
      phone,
      role,
      // Doctor-specific fields
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      bio,
      // Pharmacist-specific fields
      licenseNumber,
      ...otherData
    } = data;

    // Build user update data (only fields that belong to users table)
    const updateData = {};
    if (name !== undefined) {
      updateData.full_name = name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (phone !== undefined) {
      updateData.phone = phone;
    }
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    // Only update user if there's data to update
    let updatedUser;
    if (Object.keys(updateData).length > 0) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from(TABLES.USERS)
        .update(updateData)
        .eq("id", userId)
        .select()
        .single();

      if (userError) {
        console.error("Error updating user:", userError);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 },
        );
      }
      updatedUser = userData;
    } else {
      // Fetch current user data if no updates
      const { data: userData } = await supabaseAdmin
        .from(TABLES.USERS)
        .select()
        .eq("id", userId)
        .single();
      updatedUser = userData;
    }

    // Update role-specific data
    if (updatedUser.role === ROLES.DOCTOR) {
      const doctorData = {};
      if (specialization !== undefined)
        doctorData.specialization = specialization || null;
      if (qualification !== undefined)
        doctorData.qualification = qualification || null;
      if (experienceYears !== undefined)
        doctorData.experience_years = experienceYears
          ? parseInt(experienceYears)
          : null;
      if (consultationFee !== undefined)
        doctorData.consultation_fee = consultationFee || null;
      if (bio !== undefined) doctorData.bio = bio || null;

      if (Object.keys(doctorData).length > 0) {
        await supabaseAdmin
          .from(TABLES.DOCTORS)
          .update(doctorData)
          .eq("user_id", userId);
      }
    } else if (updatedUser.role === ROLES.PHARMACIST) {
      const pharmacistData = {};
      if (licenseNumber !== undefined)
        pharmacistData.license_number = licenseNumber || null;

      if (Object.keys(pharmacistData).length > 0) {
        await supabaseAdmin
          .from(TABLES.PHARMACISTS)
          .update(pharmacistData)
          .eq("user_id", userId);
      }
    }

    const { password_hash, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Error in PUT user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH - Toggle user active status (activate / deactivate)
export async function PATCH(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    const action = searchParams.get("action"); // "activate" | "deactivate"

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
        { status: 400 },
      );
    }

    if (!["activate", "deactivate"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'activate' or 'deactivate'" },
        { status: 400 },
      );
    }

    const isActive = action === "activate";

    // If deactivating a doctor, check for active appointments first
    if (!isActive) {
      const { data: user } = await supabaseAdmin
        .from(TABLES.USERS)
        .select("role")
        .eq("id", userId)
        .single();

      if (user?.role === ROLES.DOCTOR) {
        const { data: activeAppointments } = await supabaseAdmin
          .from(TABLES.APPOINTMENTS)
          .select("id")
          .eq("doctor_id", userId)
          .in("status", ["pending", "confirmed", "in_progress"]);

        if (activeAppointments && activeAppointments.length > 0) {
          return NextResponse.json(
            {
              error: `Cannot deactivate doctor with ${activeAppointments.length} active appointment(s). Please complete or reassign them first.`,
            },
            { status: 400 },
          );
        }
      }
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ is_active: isActive })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating user status:", updateError);
      return NextResponse.json(
        { error: "Failed to update user status" },
        { status: 500 },
      );
    }

    // Invalidate all sessions when deactivating
    if (!isActive) {
      await supabaseAdmin
        .from(TABLES.USER_SESSIONS)
        .delete()
        .eq("user_id", userId);
    }

    const { password_hash, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Error in PATCH user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE - Soft deactivate user
export async function DELETE(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get user to check their role
    const { data: user, error: userFetchError } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("role")
      .eq("id", userId)
      .single();

    if (userFetchError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for active appointments (prevent deactivation if doctor has pending appointments)
    if (user.role === ROLES.DOCTOR) {
      const { data: activeAppointments } = await supabaseAdmin
        .from(TABLES.APPOINTMENTS)
        .select("id")
        .eq("doctor_id", userId)
        .in("status", ["pending", "confirmed", "in_progress"]);

      if (activeAppointments && activeAppointments.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot deactivate doctor with ${activeAppointments.length} active appointment(s). Please complete or reassign them first.`,
          },
          { status: 400 },
        );
      }
    }

    // Soft deactivate: set is_active = false
    const { error: updateError } = await supabaseAdmin
      .from(TABLES.USERS)
      .update({ is_active: false })
      .eq("id", userId);

    if (updateError) {
      console.error("Error deactivating user:", updateError);
      return NextResponse.json(
        { error: "Failed to deactivate user" },
        { status: 500 },
      );
    }

    // Invalidate all active sessions for this user
    await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .delete()
      .eq("user_id", userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
