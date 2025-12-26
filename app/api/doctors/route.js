import { NextResponse } from "next/server";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

// GET - List all doctors with their availability
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const available = searchParams.get("available");

    // Get all active doctors with their user info
    let query = supabaseAdmin.from(TABLES.DOCTORS).select(`
        *,
        user:users (
          id,
          email,
          full_name,
          phone,
          avatar_url,
          is_active
        )
      `);

    if (available === "true") {
      query = query.eq("is_available", true);
    }

    const { data: doctors, error } = await query;

    if (error) {
      console.error("Error fetching doctors:", error);
      return NextResponse.json(
        { error: "Failed to fetch doctors" },
        { status: 500 }
      );
    }

    // Filter out inactive users
    const activeDoctors = doctors.filter(
      (doctor) => doctor.user && doctor.user.is_active
    );

    // If a date is provided, check appointments for that date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all appointments for that day
      const { data: appointments } = await supabaseAdmin
        .from(TABLES.APPOINTMENTS)
        .select("doctor_id, date")
        .gte("date", startOfDay.toISOString())
        .lte("date", endOfDay.toISOString())
        .in("status", ["pending", "approved"]);

      // Count appointments per doctor
      const doctorAppointmentCount = {};
      appointments?.forEach((apt) => {
        if (apt.doctor_id) {
          doctorAppointmentCount[apt.doctor_id] =
            (doctorAppointmentCount[apt.doctor_id] || 0) + 1;
        }
      });

      // Add appointment count to doctors
      return NextResponse.json({
        doctors: activeDoctors.map((doctor) => ({
          ...doctor,
          appointmentsOnDate: doctorAppointmentCount[doctor.id] || 0,
        })),
      });
    }

    return NextResponse.json({ doctors: activeDoctors });
  } catch (error) {
    console.error("Error in GET doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET single doctor availability for a specific date
export async function POST(request) {
  try {
    const { doctorId, date } = await request.json();

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "Doctor ID and date are required" },
        { status: 400 }
      );
    }

    // Get doctor info
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from(TABLES.DOCTORS)
      .select(
        `
        *,
        user:users (
          id,
          email,
          full_name,
          phone,
          avatar_url
        )
      `
      )
      .eq("id", doctorId)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Get appointments for that day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointments } = await supabaseAdmin
      .from(TABLES.APPOINTMENTS)
      .select("date")
      .eq("doctor_id", doctorId)
      .gte("date", startOfDay.toISOString())
      .lte("date", endOfDay.toISOString())
      .in("status", ["pending", "approved"]);

    // Get day of week for working hours
    const dayOfWeek = new Date(date)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const workingHours = doctor.working_hours?.[dayOfWeek];

    // Calculate available slots
    const bookedSlots =
      appointments?.map((apt) => {
        const aptDate = new Date(apt.date);
        return `${aptDate.getHours().toString().padStart(2, "0")}:${aptDate
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      }) || [];

    return NextResponse.json({
      doctor,
      workingHours,
      bookedSlots,
      appointmentCount: appointments?.length || 0,
    });
  } catch (error) {
    console.error("Error in POST doctor availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
