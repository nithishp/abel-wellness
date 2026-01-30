import { NextResponse } from "next/server";
import {
  supabaseAdmin,
  TABLES,
  ROLES,
  APPOINTMENT_STATUS,
} from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";
import {
  publicAppointmentSchema,
  validateRequest,
} from "@/lib/validation/schemas";

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate request body with Zod schema
    const validation = validateRequest(publicAppointmentSchema, data);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, details: validation.details },
        { status: 400 },
      );
    }

    const validatedData = validation.data;
    const normalizedEmail = validatedData.email;
    const patientName = `${validatedData.firstName} ${validatedData.lastName}`;

    // Validate that appointment date is not too far in the future (e.g., max 6 months)
    const appointmentDate = new Date(validatedData.schedule);
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);

    if (appointmentDate > maxDate) {
      return NextResponse.json(
        {
          error:
            "Appointment cannot be scheduled more than 6 months in advance",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    let { data: existingUser } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    let patientId = existingUser?.id;
    let isExistingPatient = !!existingUser;

    // Create new patient if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: userError } = await supabaseAdmin
        .from(TABLES.USERS)
        .insert({
          email: normalizedEmail,
          full_name: patientName,
          phone: validatedData.phoneNumber,
          age: validatedData.age || null,
          sex: validatedData.sex || null,
          role: ROLES.PATIENT,
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating patient user:", userError);
        return NextResponse.json(
          { error: "Failed to create patient account" },
          { status: 500 },
        );
      }

      patientId = newUser.id;

      // Send welcome email to new patient
      await sendEmail(
        normalizedEmail,
        emailTemplates.welcomePatient(patientName),
      );
    } else {
      // Update existing patient info if provided
      const updateData = {};
      if (
        validatedData.phoneNumber &&
        validatedData.phoneNumber !== existingUser.phone
      ) {
        updateData.phone = validatedData.phoneNumber;
      }
      if (validatedData.age && validatedData.age !== existingUser.age) {
        updateData.age = validatedData.age;
      }

      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin
          .from(TABLES.USERS)
          .update(updateData)
          .eq("id", existingUser.id);
      }
    }

    // Create appointment with patient reference
    const appointmentData = {
      patient_id: patientId,
      name: patientName,
      email: normalizedEmail,
      phone: validatedData.phoneNumber,
      date: validatedData.schedule,
      reason_for_visit:
        validatedData.message || validatedData.reasonForVisit || null,
      message: validatedData.message || "",
      status: APPOINTMENT_STATUS.PENDING,
      consultation_status: "pending",
    };

    const { data: newAppointment, error } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .insert(appointmentData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating appointment:", error);
      return NextResponse.json(
        { error: "Failed to create appointment" },
        { status: 500 },
      );
    }

    // Format date for emails
    const appointmentDateForEmail = new Date(validatedData.schedule);
    const formattedDate = appointmentDateForEmail.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDateForEmail.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send confirmation email to patient
    await sendEmail(
      normalizedEmail,
      emailTemplates.appointmentConfirmation(patientName, {
        date: formattedDate,
        time: formattedTime,
        reason: validatedData.message || "General Consultation",
      }),
    );

    // Notify admins about new appointment
    const { data: admins } = await supabaseAdmin
      .from(TABLES.USERS)
      .select("id, email")
      .eq("role", ROLES.ADMIN)
      .eq("is_active", true);

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        // Send email
        await sendEmail(
          admin.email,
          emailTemplates.newAppointmentAdmin({
            patientName,
            email: normalizedEmail,
            phone: validatedData.phoneNumber,
            date: formattedDate,
            time: formattedTime,
            reason: validatedData.message || "General Consultation",
          }),
        );

        // Create notification
        await supabaseAdmin.from(TABLES.NOTIFICATIONS).insert({
          user_id: admin.id,
          title: "New Appointment Request",
          message: `${patientName} has requested an appointment for ${formattedDate} at ${formattedTime}`,
          type: "appointment",
          related_type: "appointment",
          related_id: newAppointment.id,
        });
      }
    }

    // Transform to match previous format for compatibility
    const transformedAppointment = {
      $id: newAppointment.id,
      $createdAt: newAppointment.created_at,
      $updatedAt: newAppointment.updated_at,
      ...newAppointment,
    };

    return NextResponse.json({
      success: true,
      appointment: transformedAppointment,
      isExistingPatient,
      patientId,
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}
