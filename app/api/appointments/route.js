import { NextResponse } from "next/server";
import {
  supabaseAdmin,
  TABLES,
  ROLES,
  APPOINTMENT_STATUS,
} from "@/lib/supabase.config";
import { sendEmail, emailTemplates } from "@/lib/email/service";

export async function POST(request) {
  try {
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "schedule",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    const patientName = `${data.firstName} ${data.lastName}`;

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
          phone: data.phoneNumber,
          age: data.age ? parseInt(data.age) : null,
          role: ROLES.PATIENT,
          is_active: true,
        })
        .select()
        .single();

      if (userError) {
        console.error("Error creating patient user:", userError);
        return NextResponse.json(
          { error: "Failed to create patient account" },
          { status: 500 }
        );
      }

      patientId = newUser.id;

      // Send welcome email to new patient
      await sendEmail(
        normalizedEmail,
        emailTemplates.welcomePatient(patientName)
      );
    } else {
      // Update existing patient info if provided
      const updateData = {};
      if (data.phoneNumber && data.phoneNumber !== existingUser.phone) {
        updateData.phone = data.phoneNumber;
      }
      if (data.age && parseInt(data.age) !== existingUser.age) {
        updateData.age = parseInt(data.age);
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
      phone: data.phoneNumber,
      date: data.schedule,
      reason_for_visit: data.message || data.reasonForVisit || null,
      message: data.message || "",
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
        { error: "Failed to create appointment", message: error.message },
        { status: 500 }
      );
    }

    // Format date for emails
    const appointmentDate = new Date(data.schedule);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send confirmation email to patient
    await sendEmail(
      normalizedEmail,
      emailTemplates.appointmentConfirmation(patientName, {
        date: formattedDate,
        time: formattedTime,
        reason: data.message || "General Consultation",
      })
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
            phone: data.phoneNumber,
            date: formattedDate,
            time: formattedTime,
            reason: data.message || "General Consultation",
          })
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
      {
        error: "Failed to create appointment",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
