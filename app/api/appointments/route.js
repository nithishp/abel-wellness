import { NextResponse } from "next/server";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";

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

    // Create appointment with correct database schema mapping
    const appointmentData = {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phoneNumber,
      date: data.schedule,
      message: data.message || "",
      status: "pending",
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
