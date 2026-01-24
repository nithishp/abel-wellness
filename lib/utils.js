import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const parseStringify = (value) => JSON.parse(JSON.stringify(value));

// ============================================================================
// IST (Indian Standard Time) Date/Time Utilities
// ============================================================================

/**
 * IST Timezone constant - Asia/Kolkata (UTC+5:30)
 */
export const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Default locale for date formatting (Indian English)
 */
export const DEFAULT_LOCALE = "en-IN";

/**
 * Get current date/time in IST
 * @returns {Date} - Current date adjusted to IST
 */
export function getCurrentIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: IST_TIMEZONE })
  );
}

/**
 * Get current date string in IST (YYYY-MM-DD format)
 * @returns {string} - Current date in IST as YYYY-MM-DD
 */
export function getTodayIST() {
  const now = getCurrentIST();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Get current ISO string adjusted for IST
 * @returns {string} - ISO string representing current time in IST context
 */
export function getISTISOString() {
  return new Date().toISOString();
}

/**
 * Convert any date to IST Date object
 * @param {Date|string|number} date - Date to convert
 * @returns {Date} - Date object in IST
 */
export function toIST(date) {
  if (!date) return null;
  const d = new Date(date);
  return new Date(d.toLocaleString("en-US", { timeZone: IST_TIMEZONE }));
}

/**
 * Format date for display in IST - Full date with weekday
 * Example: "Sat, 25 Jan 2026"
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDateIST(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: IST_TIMEZONE,
    });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format date for display in IST - Short format
 * Example: "25 Jan 2026"
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDateShortIST(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: IST_TIMEZONE,
    });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format date for display in IST - Long format
 * Example: "Saturday, 25 January 2026"
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDateLongIST(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: IST_TIMEZONE,
    });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format date in numeric format (DD/MM/YYYY - Indian format)
 * Example: "25/01/2026"
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export function formatDateNumericIST(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString(DEFAULT_LOCALE, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: IST_TIMEZONE,
    });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format time for display in IST
 * Example: "10:30 AM"
 * @param {Date|string} date - Date/time to format
 * @returns {string} - Formatted time string
 */
export function formatTimeIST(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleTimeString(DEFAULT_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: IST_TIMEZONE,
    });
  } catch {
    return "Invalid Time";
  }
}

/**
 * Format time in 24-hour format
 * Example: "14:30"
 * @param {Date|string} date - Date/time to format
 * @returns {string} - Formatted time string
 */
export function formatTime24IST(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleTimeString(DEFAULT_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: IST_TIMEZONE,
    });
  } catch {
    return "Invalid Time";
  }
}

/**
 * Format date and time together
 * Example: "25 Jan 2026, 10:30 AM"
 * @param {Date|string} date - Date/time to format
 * @returns {string} - Formatted date-time string
 */
export function formatDateTimeIST(date) {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleString(DEFAULT_LOCALE, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: IST_TIMEZONE,
    });
  } catch {
    return "Invalid Date/Time";
  }
}

/**
 * Format date and time - Full format
 * Example: "Saturday, 25 January 2026 at 10:30 AM"
 * @param {Date|string} date - Date/time to format
 * @returns {string} - Formatted date-time string
 */
export function formatDateTimeLongIST(date) {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    const datePart = d.toLocaleDateString(DEFAULT_LOCALE, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: IST_TIMEZONE,
    });
    const timePart = d.toLocaleTimeString(DEFAULT_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: IST_TIMEZONE,
    });
    return `${datePart} at ${timePart}`;
  } catch {
    return "Invalid Date/Time";
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string} date - Date to compare
 * @returns {string} - Relative time string
 */
export function formatRelativeTimeIST(date) {
  if (!date) return "N/A";
  try {
    const now = getCurrentIST();
    const target = toIST(date);
    const diffMs = target - now;
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSecs) < 60) return "Just now";
    if (Math.abs(diffMins) < 60) {
      return diffMins > 0 ? `in ${diffMins}m` : `${Math.abs(diffMins)}m ago`;
    }
    if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
    }
    if (Math.abs(diffDays) < 7) {
      return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
    }
    return formatDateShortIST(date);
  } catch {
    return "Invalid Date";
  }
}

/**
 * Get start of day in IST
 * @param {Date|string} date - Date to process
 * @returns {Date} - Start of day in IST
 */
export function getStartOfDayIST(date) {
  const d = toIST(date || new Date());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day in IST
 * @param {Date|string} date - Date to process
 * @returns {Date} - End of day in IST
 */
export function getEndOfDayIST(date) {
  const d = toIST(date || new Date());
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of month in IST
 * @param {Date|string} date - Date to process
 * @returns {Date} - Start of month in IST
 */
export function getStartOfMonthIST(date) {
  const d = toIST(date || new Date());
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Get end of month in IST
 * @param {Date|string} date - Date to process
 * @returns {Date} - End of month in IST
 */
export function getEndOfMonthIST(date) {
  const d = toIST(date || new Date());
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Check if a date is today in IST
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isTodayIST(date) {
  if (!date) return false;
  const today = getTodayIST();
  const target = toIST(date);
  const targetStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
  return today === targetStr;
}

/**
 * Check if a date is in the past (IST)
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isPastIST(date) {
  if (!date) return false;
  return toIST(date) < getCurrentIST();
}

/**
 * Check if a date is in the future (IST)
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export function isFutureIST(date) {
  if (!date) return false;
  return toIST(date) > getCurrentIST();
}

/**
 * Add days to a date
 * @param {Date|string} date - Starting date
 * @param {number} days - Number of days to add
 * @returns {Date} - New date
 */
export function addDaysIST(date, days) {
  const d = toIST(date || new Date());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {Date|string} date - Date to format
 * @returns {string} - Date in YYYY-MM-DD format
 */
export function formatDateForInput(date) {
  if (!date) return "";
  try {
    const d = toIST(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

/**
 * Format date for database storage (ISO string)
 * @param {Date|string} date - Date to format
 * @returns {string} - ISO string
 */
export function formatDateForDB(date) {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
}

/**
 * Parse a date string and return IST Date
 * @param {string} dateStr - Date string in various formats
 * @returns {Date|null} - Parsed date or null
 */
export function parseDateIST(dateStr) {
  if (!dateStr) return null;
  try {
    return toIST(new Date(dateStr));
  } catch {
    return null;
  }
}

/**
 * Format currency in INR
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export function formatCurrencyINR(amount) {
  if (amount === null || amount === undefined) return "₹0.00";
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with Indian numbering system
 * @param {number} num - Number to format
 * @returns {string} - Formatted number
 */
export function formatNumberINR(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(num);
}

// ============================================================================
// Legacy/Compatibility Functions (keeping for backward compatibility)
// ============================================================================

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
  timezone = IST_TIMEZONE
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

    const formattedDate = dateObj.toLocaleDateString(DEFAULT_LOCALE, dateOptions);
    const formattedTime = dateObj.toLocaleTimeString(DEFAULT_LOCALE, timeOptions);

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
  timezone = IST_TIMEZONE
) {
  return formatAppointmentDateTime(date, time, timezone).time;
}

/**
 * Get just the date string from an appointment
 * @param {string} date - Date string
 * @param {string} timezone - Timezone
 * @returns {string} - Formatted date string
 */
export function formatAppointmentDate(date, timezone = IST_TIMEZONE) {
  return formatAppointmentDateTime(date, null, timezone).date;
}
