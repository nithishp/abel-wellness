// GST Calculation Utilities - Pure functions, no server actions needed

import { GST_RATES, TAX_TYPES } from "@/lib/billing.constants";

// =============================================
// GST CALCULATION UTILITIES
// =============================================

/**
 * Calculate GST breakdown for an amount
 * @param {number} amount - Taxable amount
 * @param {number} gstRate - GST rate percentage (e.g., 18 for 18%)
 * @param {boolean} isIgst - Whether to calculate IGST (inter-state) or CGST+SGST (intra-state)
 * @returns {Object} - GST breakdown
 */
export function calculateGST(amount, gstRate = 0, isIgst = false) {
  const taxableAmount = parseFloat(amount) || 0;
  const rate = parseFloat(gstRate) || 0;

  if (isIgst) {
    // Inter-state: Full IGST
    const igstAmount = (taxableAmount * rate) / 100;
    return {
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: rate,
      igstAmount: roundToTwo(igstAmount),
      totalTax: roundToTwo(igstAmount),
      taxType: TAX_TYPES.IGST,
    };
  } else {
    // Intra-state: Split equally between CGST and SGST
    const halfRate = rate / 2;
    const cgstAmount = (taxableAmount * halfRate) / 100;
    const sgstAmount = (taxableAmount * halfRate) / 100;
    return {
      cgstRate: halfRate,
      cgstAmount: roundToTwo(cgstAmount),
      sgstRate: halfRate,
      sgstAmount: roundToTwo(sgstAmount),
      igstRate: 0,
      igstAmount: 0,
      totalTax: roundToTwo(cgstAmount + sgstAmount),
      taxType: `${TAX_TYPES.CGST}+${TAX_TYPES.SGST}`,
    };
  }
}

/**
 * Calculate invoice item with GST
 * @param {Object} item - Invoice item data
 * @param {boolean} isIgst - Whether to use IGST
 * @returns {Object} - Item with calculated values
 */
export function calculateInvoiceItemWithGST(item, isIgst = false) {
  const quantity = parseFloat(item.quantity) || 1;
  const unitPrice = parseFloat(item.unit_price) || 0;
  const discountPercent = parseFloat(item.discount_percent) || 0;
  const gstRate = parseFloat(item.tax_rate) || 0;

  // Calculate subtotal
  const subtotal = quantity * unitPrice;

  // Calculate discount
  const discountAmount = (subtotal * discountPercent) / 100;

  // Taxable amount after discount
  const taxableAmount = subtotal - discountAmount;

  // Calculate GST
  const gst = calculateGST(taxableAmount, gstRate, isIgst);

  // Total
  const total = taxableAmount + gst.totalTax;

  return {
    quantity,
    unit_price: unitPrice,
    discount_percent: discountPercent,
    discount_amount: roundToTwo(discountAmount),
    tax_rate: gstRate,
    tax_amount: gst.totalTax,
    cgst_rate: gst.cgstRate,
    cgst_amount: gst.cgstAmount,
    sgst_rate: gst.sgstRate,
    sgst_amount: gst.sgstAmount,
    igst_rate: gst.igstRate,
    igst_amount: gst.igstAmount,
    total: roundToTwo(total),
    subtotal: roundToTwo(subtotal),
    taxable_amount: roundToTwo(taxableAmount),
  };
}

/**
 * Calculate invoice totals from items
 * @param {Array} items - Array of invoice items
 * @returns {Object} - Invoice totals
 */
export function calculateInvoiceTotals(items) {
  const totals = items.reduce(
    (acc, item) => {
      acc.subtotal +=
        parseFloat(item.unit_price) * parseFloat(item.quantity) || 0;
      acc.discountAmount += parseFloat(item.discount_amount) || 0;
      acc.cgstAmount += parseFloat(item.cgst_amount) || 0;
      acc.sgstAmount += parseFloat(item.sgst_amount) || 0;
      acc.igstAmount += parseFloat(item.igst_amount) || 0;
      acc.taxAmount += parseFloat(item.tax_amount) || 0;
      acc.totalAmount += parseFloat(item.total) || 0;
      return acc;
    },
    {
      subtotal: 0,
      discountAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
    }
  );

  return {
    subtotal: roundToTwo(totals.subtotal),
    discount_amount: roundToTwo(totals.discountAmount),
    cgst_amount: roundToTwo(totals.cgstAmount),
    sgst_amount: roundToTwo(totals.sgstAmount),
    igst_amount: roundToTwo(totals.igstAmount),
    tax_amount: roundToTwo(totals.taxAmount),
    total_amount: roundToTwo(totals.totalAmount),
  };
}

/**
 * Get default GST rate for an item type
 * @param {string} itemType - Type of invoice item
 * @returns {number} - Default GST rate
 */
export function getDefaultGSTRate(itemType) {
  switch (itemType) {
    case "consultation":
      return GST_RATES.EIGHTEEN; // Healthcare services - 18%
    case "medication":
      return GST_RATES.TWELVE; // Medicines - typically 12% or 5%
    case "supply":
      return GST_RATES.EIGHTEEN;
    case "procedure":
      return GST_RATES.EIGHTEEN;
    case "lab_test":
      return GST_RATES.EIGHTEEN;
    case "service":
      return GST_RATES.EIGHTEEN;
    default:
      return GST_RATES.EIGHTEEN;
  }
}

/**
 * Get default HSN code for an item type
 * @param {string} itemType - Type of invoice item
 * @returns {string} - HSN code
 */
export function getDefaultHSNCode(itemType) {
  switch (itemType) {
    case "consultation":
      return "9983"; // Healthcare services
    case "medication":
      return "3004"; // Medicaments
    case "supply":
      return "3006"; // Medical supplies
    case "procedure":
      return "9983";
    case "lab_test":
      return "9983";
    case "service":
      return "9983";
    default:
      return "9983";
  }
}

/**
 * Determine if IGST should be used based on place of supply
 * @param {string} clinicState - State where clinic is located
 * @param {string} customerState - State where customer is located
 * @returns {boolean} - True if IGST should be used
 */
export function shouldUseIGST(clinicState, customerState) {
  if (!clinicState || !customerState) {
    return false; // Default to intra-state (CGST+SGST)
  }
  return clinicState.toLowerCase() !== customerState.toLowerCase();
}

/**
 * Format GST for display
 * @param {Object} gstData - GST breakdown data
 * @returns {string} - Formatted GST string
 */
export function formatGSTDisplay(gstData) {
  if (gstData.igst_amount > 0) {
    return `IGST @${gstData.igst_rate}%: ₹${gstData.igst_amount.toFixed(2)}`;
  } else if (gstData.cgst_amount > 0 || gstData.sgst_amount > 0) {
    return `CGST @${gstData.cgst_rate}%: ₹${gstData.cgst_amount.toFixed(
      2
    )} + SGST @${gstData.sgst_rate}%: ₹${gstData.sgst_amount.toFixed(2)}`;
  }
  return "No GST";
}

/**
 * Round to two decimal places
 * @param {number} num - Number to round
 * @returns {number} - Rounded number
 */
function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Validate GSTIN format
 * @param {string} gstin - GSTIN to validate
 * @returns {boolean} - True if valid
 */
export function validateGSTIN(gstin) {
  if (!gstin) return false;
  // GSTIN format: 2 digit state code + 10 char PAN + 1 digit entity number + Z + 1 check digit
  const gstinRegex =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
}

/**
 * Get state code from GSTIN
 * @param {string} gstin - GSTIN
 * @returns {string} - State code (2 digits)
 */
export function getStateCodeFromGSTIN(gstin) {
  if (!gstin || gstin.length < 2) return null;
  return gstin.substring(0, 2);
}

/**
 * Indian state codes for GST
 */
export const GST_STATE_CODES = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  10: "Bihar",
  11: "Sikkim",
  12: "Arunachal Pradesh",
  13: "Nagaland",
  14: "Manipur",
  15: "Mizoram",
  16: "Tripura",
  17: "Meghalaya",
  18: "Assam",
  19: "West Bengal",
  20: "Jharkhand",
  21: "Odisha",
  22: "Chhattisgarh",
  23: "Madhya Pradesh",
  24: "Gujarat",
  25: "Daman and Diu",
  26: "Dadra and Nagar Haveli",
  27: "Maharashtra",
  28: "Andhra Pradesh (Old)",
  29: "Karnataka",
  30: "Goa",
  31: "Lakshadweep",
  32: "Kerala",
  33: "Tamil Nadu",
  34: "Puducherry",
  35: "Andaman and Nicobar Islands",
  36: "Telangana",
  37: "Andhra Pradesh (New)",
  38: "Ladakh",
};
