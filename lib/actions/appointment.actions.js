// Client-side appointment actions

const APPOINTMENTS_ID =
  process.env.APPOINTMENTS_ID ||
  process.env.NEXT_PUBLIC_APPOINTMENTS_ID ||
  "appointments";

export const createAppointment = async (data) => {
  try {
    console.log("Creating appointment with data:", data);

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Failed to create appointment");
    }

    const result = await response.json();
    return result.appointment;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw new Error(`Failed to create appointment: ${error.message}`);
  }
};
