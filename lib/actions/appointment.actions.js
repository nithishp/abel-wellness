// Client-side appointment actions
// These actions call the API routes which handle the Supabase operations

export const createAppointment = async (data) => {
  try {
    // Sanitize phone number - remove spaces, dashes, and parentheses
    const sanitizedData = {
      ...data,
      phoneNumber: data.phoneNumber?.replace(/[\s\-()]/g, ""),
      // Ensure schedule is an ISO string
      schedule: data.schedule instanceof Date 
        ? data.schedule.toISOString() 
        : data.schedule,
    };

    console.log("Creating appointment with data:", sanitizedData);

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sanitizedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Include validation details in the error message if available
      let errorMessage = errorData.message || errorData.error || "Failed to create appointment";
      if (errorData.details && Array.isArray(errorData.details)) {
        const fieldErrors = errorData.details.map(d => `${d.field}: ${d.message}`).join(", ");
        errorMessage = `${errorMessage} (${fieldErrors})`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    return result.appointment;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw new Error(`Failed to create appointment: ${error.message}`);
  }
};
