import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

// Register custom fonts (optional - using default fonts for now)
// Font.register({
//   family: 'Inter',
//   src: '/fonts/Inter-Regular.ttf',
// });

// Default color palette
const defaultColors = {
  primary: "#059669", // Emerald green
  secondary: "#065f46",
  text: "#1f2937",
  textLight: "#6b7280",
  border: "#e5e7eb",
  background: "#f9fafb",
  white: "#ffffff",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

// Helper function to darken a color for secondary shade
const darkenColor = (hex, percent = 20) => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
};

// Generate styles based on theme color
const createStyles = (themeColor = "#059669") => {
  const colors = {
    ...defaultColors,
    primary: themeColor,
    secondary: darkenColor(themeColor, 20),
  };

  return StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: colors.text,
      backgroundColor: colors.white,
    },
    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    logoSection: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    clinicLogo: {
      width: 50,
      height: 50,
      objectFit: "contain",
    },
    clinicInfo: {
      flex: 1,
    },
    clinicName: {
      fontSize: 24,
      fontFamily: "Helvetica-Bold",
      color: colors.primary,
      marginBottom: 4,
    },
    clinicTagline: {
      fontSize: 10,
      color: colors.textLight,
    },
    clinicContact: {
      fontSize: 8,
      color: colors.textLight,
      marginTop: 2,
    },
    invoiceTitle: {
      textAlign: "right",
    },
    invoiceLabel: {
      fontSize: 28,
      fontFamily: "Helvetica-Bold",
      color: colors.text,
      marginBottom: 4,
    },
    invoiceNumber: {
      fontSize: 12,
      color: colors.textLight,
    },
    // Status badge
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: "flex-end",
      marginTop: 8,
    },
    statusText: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
    },
    // Info sections
    infoSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    infoBlock: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 9,
      color: colors.textLight,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    infoText: {
      fontSize: 11,
      color: colors.text,
      marginBottom: 2,
    },
    infoTextBold: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: colors.text,
      marginBottom: 2,
    },
    // Table
    table: {
      marginBottom: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
    },
    tableHeaderText: {
      color: colors.white,
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableRowAlt: {
      backgroundColor: colors.background,
    },
    col1: { flex: 0.5, textAlign: "center" },
    col2: { flex: 3 },
    col3: { flex: 1, textAlign: "center" },
    col4: { flex: 1.2, textAlign: "right" },
    col5: { flex: 1.2, textAlign: "right" },
    col6: { flex: 1.2, textAlign: "right" },
    tableText: {
      fontSize: 10,
      color: colors.text,
    },
    tableTextLight: {
      fontSize: 9,
      color: colors.textLight,
    },
    // Totals section
    totalsSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 30,
    },
    totalsBox: {
      width: 250,
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 4,
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    totalLabel: {
      fontSize: 10,
      color: colors.textLight,
    },
    totalValue: {
      fontSize: 10,
      color: colors.text,
    },
    totalRowFinal: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingTop: 12,
      marginTop: 8,
      borderTopWidth: 2,
      borderTopColor: colors.primary,
    },
    totalLabelFinal: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: colors.text,
    },
    totalValueFinal: {
      fontSize: 14,
      fontFamily: "Helvetica-Bold",
      color: colors.primary,
    },
    amountDue: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    amountDueLabel: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: colors.danger,
    },
    amountDueValue: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: colors.danger,
    },
    // Payments section
    paymentsSection: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: "Helvetica-Bold",
      color: colors.text,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    paymentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 4,
      marginBottom: 4,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentMethod: {
      fontSize: 10,
      fontFamily: "Helvetica-Bold",
      color: colors.text,
      textTransform: "capitalize",
    },
    paymentDate: {
      fontSize: 9,
      color: colors.textLight,
    },
    paymentAmount: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: colors.success,
    },
    // Notes section
    notesSection: {
      marginBottom: 30,
    },
    notesText: {
      fontSize: 10,
      color: colors.textLight,
      lineHeight: 1.6,
    },
    // Footer
    footer: {
      position: "absolute",
      bottom: 40,
      left: 40,
      right: 40,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 20,
    },
    footerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    footerSection: {
      flex: 1,
    },
    footerTitle: {
      fontSize: 9,
      fontFamily: "Helvetica-Bold",
      color: colors.text,
      marginBottom: 4,
    },
    footerText: {
      fontSize: 8,
      color: colors.textLight,
      marginBottom: 2,
    },
    footerCenter: {
      textAlign: "center",
    },
    thankYou: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: colors.primary,
      textAlign: "center",
      marginTop: 10,
    },
  });
};

// Status badge colors
const getStatusStyles = (status) => {
  switch (status) {
    case "paid":
      return { backgroundColor: "#d1fae5", color: "#065f46" };
    case "partial":
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    case "pending":
      return { backgroundColor: "#fee2e2", color: "#991b1b" };
    case "cancelled":
      return { backgroundColor: "#f3f4f6", color: "#6b7280" };
    default:
      return { backgroundColor: "#e0e7ff", color: "#3730a3" };
  }
};

// Format currency
// Note: Using "Rs." instead of "₹" symbol because Helvetica font in @react-pdf/renderer
// doesn't support the Indian Rupee symbol (U+20B9), causing display issues
const formatCurrency = (amount, symbol = "Rs.") => {
  const num = parseFloat(amount) || 0;
  // Convert ₹ symbol to Rs. for PDF compatibility
  const pdfSafeSymbol = symbol === "₹" ? "Rs." : symbol;
  return `${pdfSafeSymbol} ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Format date in IST
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const IST_TIMEZONE = "Asia/Kolkata";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: IST_TIMEZONE,
  });
};

// Invoice PDF Component
const InvoicePDF = ({ invoice, settings = {}, clinicLogo = null }) => {
  // Get theme color from settings (remove quotes if present)
  const themeColor =
    settings.invoice_theme_color?.replace(/"/g, "") || "#059669";

  // Generate styles with the theme color
  const styles = createStyles(themeColor);

  const statusStyles = getStatusStyles(invoice.status);
  const currencySymbol = settings.currency_symbol?.replace(/"/g, "") || "₹";
  const clinicName =
    settings.clinic_name?.replace(/"/g, "") || "Abel Wellness Clinic";
  const clinicAddress = settings.clinic_address?.replace(/"/g, "") || "";
  const clinicPhone = settings.clinic_phone?.replace(/"/g, "") || "";
  const clinicEmail = settings.clinic_email?.replace(/"/g, "") || "";
  const clinicGstin = settings.clinic_gstin?.replace(/"/g, "") || "";

  const items = invoice.items || [];
  const payments = invoice.payments || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {clinicLogo && <Image src={clinicLogo} style={styles.clinicLogo} />}
            <View style={styles.clinicInfo}>
              <Text style={styles.clinicName}>{clinicName}</Text>
              <Text style={styles.clinicTagline}>
                Your Health, Our Priority
              </Text>
              {(clinicAddress || clinicPhone || clinicEmail) && (
                <Text style={styles.clinicContact}>
                  {[clinicAddress, clinicPhone, clinicEmail]
                    .filter(Boolean)
                    .join("  |  ")}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyles.backgroundColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusStyles.color }]}>
                {invoice.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Bill To & Invoice Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoTextBold}>
              {invoice.patient?.name || "Patient"}
            </Text>
            <Text style={styles.infoText}>{invoice.patient?.email || ""}</Text>
            <Text style={styles.infoText}>{invoice.patient?.phone || ""}</Text>
            {invoice.patient?.address && (
              <Text style={styles.infoText}>{invoice.patient.address}</Text>
            )}
          </View>
          <View style={[styles.infoBlock, { alignItems: "flex-end" }]}>
            <Text style={styles.infoLabel}>Invoice Details</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>Date: </Text>
              {formatDate(invoice.invoice_date)}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>Due Date: </Text>
              {formatDate(invoice.due_date)}
            </Text>
            {invoice.appointment?.date && (
              <Text style={styles.infoText}>
                <Text style={styles.infoTextBold}>Appointment: </Text>
                {formatDate(invoice.appointment.date)}
              </Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>#</Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>Price</Text>
            <Text style={[styles.tableHeaderText, styles.col5]}>Tax</Text>
            <Text style={[styles.tableHeaderText, styles.col6]}>Total</Text>
          </View>
          {items.map((item, index) => (
            <View
              key={item.id || index}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableText, styles.col1]}>{index + 1}</Text>
              <View style={styles.col2}>
                <Text style={styles.tableText}>{item.description}</Text>
                <Text style={styles.tableTextLight}>
                  {item.item_type?.charAt(0).toUpperCase() +
                    item.item_type?.slice(1)}
                  {item.hsn_code && ` • HSN: ${item.hsn_code}`}
                </Text>
              </View>
              <Text style={[styles.tableText, styles.col3]}>
                {item.quantity} {item.unit}
              </Text>
              <Text style={[styles.tableText, styles.col4]}>
                {formatCurrency(item.unit_price, currencySymbol)}
              </Text>
              <View style={styles.col5}>
                {item.cgst_amount > 0 || item.sgst_amount > 0 ? (
                  <>
                    <Text style={styles.tableTextLight}>
                      C: {item.cgst_rate || item.tax_rate / 2}%
                    </Text>
                    <Text style={styles.tableTextLight}>
                      S: {item.sgst_rate || item.tax_rate / 2}%
                    </Text>
                  </>
                ) : item.igst_amount > 0 ? (
                  <Text style={styles.tableText}>
                    I: {item.igst_rate || item.tax_rate}%
                  </Text>
                ) : (
                  <Text style={styles.tableText}>
                    {item.tax_rate > 0 ? `${item.tax_rate}%` : "-"}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableText, styles.col6]}>
                {formatCurrency(item.total, currencySymbol)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.subtotal, currencySymbol)}
              </Text>
            </View>
            {invoice.discount_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  -{formatCurrency(invoice.discount_amount, currencySymbol)}
                </Text>
              </View>
            )}
            {/* GST Breakdown - Show CGST/SGST for intra-state or IGST for inter-state */}
            {(invoice.cgst_amount > 0 || invoice.sgst_amount > 0) && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    CGST ({invoice.cgst_rate || invoice.tax_rate / 2}%)
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.cgst_amount, currencySymbol)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    SGST ({invoice.sgst_rate || invoice.tax_rate / 2}%)
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.sgst_amount, currencySymbol)}
                  </Text>
                </View>
              </>
            )}
            {invoice.igst_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  IGST ({invoice.igst_rate || invoice.tax_rate}%)
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoice.igst_amount, currencySymbol)}
                </Text>
              </View>
            )}
            {/* Fallback: Show combined tax if GST breakdown not available */}
            {invoice.tax_amount > 0 &&
              !invoice.cgst_amount &&
              !invoice.sgst_amount &&
              !invoice.igst_amount && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Tax ({invoice.tax_rate}% GST)
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.tax_amount, currencySymbol)}
                  </Text>
                </View>
              )}
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalLabelFinal}>Total Amount</Text>
              <Text style={styles.totalValueFinal}>
                {formatCurrency(invoice.total_amount, currencySymbol)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.amount_paid, currencySymbol)}
              </Text>
            </View>
            {parseFloat(invoice.amount_due) > 0 && (
              <View style={styles.amountDue}>
                <Text style={styles.amountDueLabel}>Amount Due</Text>
                <Text style={styles.amountDueValue}>
                  {formatCurrency(invoice.amount_due, currencySymbol)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payments */}
        {payments.length > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            {payments.map((payment, index) => (
              <View key={payment.id || index} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentMethod}>
                    {payment.payment_method.replace("_", " ")}
                    {payment.transaction_reference &&
                      ` (Ref: ${payment.transaction_reference})`}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.payment_date)}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>
                  {formatCurrency(payment.amount, currencySymbol)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerSection}>
              <Text style={styles.footerTitle}>Contact Information</Text>
              {clinicPhone && (
                <Text style={styles.footerText}>{clinicPhone}</Text>
              )}
              {clinicEmail && (
                <Text style={styles.footerText}>{clinicEmail}</Text>
              )}
            </View>
            <View style={[styles.footerSection, styles.footerCenter]}>
              <Text style={styles.footerTitle}>Clinic Address</Text>
              <Text style={styles.footerText}>{clinicAddress}</Text>
              {clinicGstin && clinicGstin !== "null" && (
                <Text style={styles.footerText}>GSTIN: {clinicGstin}</Text>
              )}
            </View>
            <View style={[styles.footerSection, { alignItems: "flex-end" }]}>
              <Text style={styles.footerTitle}>Payment Methods</Text>
              <Text style={styles.footerText}>Cash | Card | UPI</Text>
              <Text style={styles.footerText}>Bank Transfer</Text>
            </View>
          </View>
          <Text style={styles.thankYou}>
            Thank you for choosing {clinicName}!
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
