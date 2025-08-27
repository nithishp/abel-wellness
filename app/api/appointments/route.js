import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { databases, DATABASE_ID } from "@/lib/appwrite.config";

const APPOINTMENTS_ID = process.env.APPOINTMENTS_ID || "appointments";

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
      phone: data.phoneNumber, // Map phoneNumber to phone
      date: data.schedule, // Map schedule to date
      message: data.message || "",
      status: "pending", // Default status
    };

    const newAppointment = await databases.createDocument(
      DATABASE_ID,
      APPOINTMENTS_ID,
      ID.unique(),
      appointmentData
    );

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
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
