import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { databases, DATABASE_ID } from "@/lib/appwrite.config";

const APPOINTMENTS_ID = process.env.APPOINTMENTS_ID || "appointments";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;

    const appointments = await databases.listDocuments(
      DATABASE_ID,
      APPOINTMENTS_ID,
      [Query.orderDesc("$createdAt"), Query.limit(limit)]
    );

    return NextResponse.json({
      success: true,
      appointments: appointments.documents,
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

    const updatedAppointment = await databases.updateDocument(
      DATABASE_ID,
      APPOINTMENTS_ID,
      appointmentId,
      updateData
    );

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
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

    await databases.deleteDocument(DATABASE_ID, APPOINTMENTS_ID, appointmentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
