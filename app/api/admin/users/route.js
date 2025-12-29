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

// GET - List users (doctors and pharmacists)
export async function GET(request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const includeInactive = searchParams.get("includeInactive") === "true";

    let query = supabaseAdmin.from(TABLES.USERS).select("*");

    if (role) {
      query = query.eq("role", role);
    } else {
      query = query.in("role", [ROLES.DOCTOR, ROLES.PHARMACIST]);
    }

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data: users, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
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
      })
    );

    return NextResponse.json({ users: usersWithRoleData });
  } catch (error) {
    console.error("Error in GET users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    // Validate role
    if (![ROLES.DOCTOR, ROLES.PHARMACIST].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be doctor or pharmacist" },
        { status: 400 }
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
            { status: 500 }
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
        { status: 400 }
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
        { status: 500 }
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
      { status: 500 }
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
        { status: 400 }
      );
    }

    const data = await request.json();
    const { password, roleData, name, ...userData } = data;

    // Update user - map name to full_name for database
    const updateData = { ...userData };
    if (name !== undefined) {
      updateData.full_name = name;
    }

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    const { data: updatedUser, error: userError } = await supabaseAdmin
      .from(TABLES.USERS)
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (userError) {
      console.error("Error updating user:", userError);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Update role-specific data if provided
    if (roleData) {
      if (updatedUser.role === ROLES.DOCTOR) {
        await supabaseAdmin
          .from(TABLES.DOCTORS)
          .update(roleData)
          .eq("user_id", userId);
      } else if (updatedUser.role === ROLES.PHARMACIST) {
        await supabaseAdmin
          .from(TABLES.PHARMACISTS)
          .update(roleData)
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
      { status: 500 }
    );
  }
}

// DELETE - Hard delete user
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
        { status: 400 }
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

    // Check for active appointments (prevent deletion if doctor has pending appointments)
    if (user.role === ROLES.DOCTOR) {
      const { data: activeAppointments } = await supabaseAdmin
        .from(TABLES.APPOINTMENTS)
        .select("id")
        .eq("doctor_id", userId)
        .in("status", ["pending", "confirmed", "in_progress"]);

      if (activeAppointments && activeAppointments.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete doctor with ${activeAppointments.length} active appointment(s). Please complete or reassign them first.`,
          },
          { status: 400 }
        );
      }
    }

    // Handle appointments as patient - set patient_id to null to preserve appointment history
    await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .update({ patient_id: null })
      .eq("patient_id", userId);

    // Handle appointments assigned_by this user
    await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .update({ assigned_by: null })
      .eq("assigned_by", userId);

    // Handle prescriptions as patient
    await supabaseAdmin
      .from(TABLES.PRESCRIPTIONS)
      .update({ patient_id: null })
      .eq("patient_id", userId);

    // Handle medical records as patient
    await supabaseAdmin
      .from(TABLES.MEDICAL_RECORDS)
      .update({ patient_id: null })
      .eq("patient_id", userId);

    // Disconnect user_id from role-specific records but keep historical data
    if (user.role === ROLES.DOCTOR) {
      // Set user_id to null in doctors table to break the link
      // This keeps the doctor record with all specialization details intact
      // All appointments, prescriptions, and medical records remain linked to the doctor record
      await supabaseAdmin
        .from(TABLES.DOCTORS)
        .update({ user_id: null })
        .eq("user_id", userId);
    } else if (user.role === ROLES.PHARMACIST) {
      // Set user_id to null in pharmacists table to break the link
      // This keeps the pharmacist record intact with all prescriptions they dispensed
      await supabaseAdmin
        .from(TABLES.PHARMACISTS)
        .update({ user_id: null })
        .eq("user_id", userId);
    }

    // Delete user notifications
    await supabaseAdmin
      .from(TABLES.NOTIFICATIONS)
      .delete()
      .eq("user_id", userId);

    // Delete all sessions for this user
    await supabaseAdmin
      .from(TABLES.USER_SESSIONS)
      .delete()
      .eq("user_id", userId);

    // Finally, delete the user
    const { error: deleteError } = await supabaseAdmin
      .from(TABLES.USERS)
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
