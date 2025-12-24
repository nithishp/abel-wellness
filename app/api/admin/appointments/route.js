import { NextResponse } from "next/server";
import { supabaseAdmin, TABLES } from "@/lib/supabase.config";

// Transform appointment from DB format to match previous Appwrite format
function transformAppointment(appointment) {
  if (!appointment) return null;
  return {
    $id: appointment.id,
    $createdAt: appointment.created_at,
    $updatedAt: appointment.updated_at,
    name: appointment.name,
    email: appointment.email,
    phone: appointment.phone,
    date: appointment.date,
    service: appointment.service,
    message: appointment.message,
    status: appointment.status,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;

    const { data: appointments, error } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase error fetching appointments:", error);
      return NextResponse.json(
        { error: "Failed to fetch appointments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointments: appointments.map(transformAppointment),
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("id");
    const updateData = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const { data: updatedAppointment, error } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .update(updateData)
      .eq("id", appointmentId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating appointment:", error);
      return NextResponse.json(
        { error: "Failed to update appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: transformAppointment(updatedAppointment),
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("id");

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .delete()
      .eq("id", appointmentId);

    if (error) {
      console.error("Supabase error deleting appointment:", error);
      return NextResponse.json(
        { error: "Failed to delete appointment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
