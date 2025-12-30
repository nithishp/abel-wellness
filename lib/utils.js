import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const parseStringify = (value) => JSON.parse(JSON.stringify(value));

/**
 * Format appointment date and time for display
 * Handles both separate date/time fields and combined datetime
 * @param {string} date - Date string (can be ISO datetime or date only)
 * @param {string} time - Optional separate time string (HH:mm format)
 * @param {string} timezone - Timezone to display in (default: Asia/Kolkata for India)
 * @returns {object} - { date: formatted date, time: formatted time, datetime: formatted both }
 */
export function formatAppointmentDateTime(
  date,
  time = null,
  timezone = "Asia/Kolkata"
) {
  if (!date) return { date: "N/A", time: "N/A", datetime: "N/A" };

  try {
    let dateObj;

    // If we have a separate time field, combine date and time
    if (time) {
      // date is just YYYY-MM-DD, time is HH:mm
      const [hours, minutes] = time.split(":").map(Number);
      dateObj = new Date(date);
      dateObj.setHours(hours, minutes, 0, 0);
    } else {
      // date contains full datetime
      dateObj = new Date(date);
    }

    // Format options
    const dateOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timezone,
    };

    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    };

    const formattedDate = dateObj.toLocaleDateString("en-US", dateOptions);
    const formattedTime = dateObj.toLocaleTimeString("en-US", timeOptions);

    return {
      date: formattedDate,
      time: formattedTime,
      datetime: `${formattedDate} at ${formattedTime}`,
    };
  } catch (error) {
    console.error("Error formatting date/time:", error);
    return { date: "Invalid", time: "Invalid", datetime: "Invalid" };
  }
}

/**
 * Get just the time string from an appointment
 * @param {string} date - Date string
 * @param {string} time - Optional separate time string
 * @param {string} timezone - Timezone
 * @returns {string} - Formatted time string
 */
export function formatAppointmentTime(
  date,
  time = null,
  timezone = "Asia/Kolkata"
) {
  return formatAppointmentDateTime(date, time, timezone).time;
}

/**
 * Get just the date string from an appointment
 * @param {string} date - Date string
 * @param {string} timezone - Timezone
 * @returns {string} - Formatted date string
 */
export function formatAppointmentDate(date, timezone = "Asia/Kolkata") {
  return formatAppointmentDateTime(date, null, timezone).date;
}
