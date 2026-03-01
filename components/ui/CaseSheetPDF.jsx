"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

/*  Default colour tokens (matching Invoice theme)  */
const defaultColors = {
  primary: "#059669",
  secondary: "#065f46",
  text: "#1f2937",
  textLight: "#6b7280",
  textMid: "#374151",
  border: "#e5e7eb",
  background: "#f9fafb",
  white: "#ffffff",
  success: "#10b981",
  dark: "#111827",
  muted: "#9ca3af",
  blue: "#1e40af",
  blueBg: "#eff6ff",
};

/*  Helper: darken hex (same as InvoicePDF)  */
const darkenColor = (hex, percent = 20) => {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
};

/*  Helper: lighten hex for soft tints  */
const lightenColor = (hex, percent = 90) => {
  const num = parseInt(hex.replace("#", ""), 16);
  const R = Math.min(
    255,
    (num >> 16) + Math.round((255 - (num >> 16)) * (percent / 100)),
  );
  const G = Math.min(
    255,
    ((num >> 8) & 0xff) +
      Math.round((255 - ((num >> 8) & 0xff)) * (percent / 100)),
  );
  const B = Math.min(
    255,
    (num & 0xff) + Math.round((255 - (num & 0xff)) * (percent / 100)),
  );
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
};

/*  Style factory (mirrors Invoice createStyles pattern)  */
const createStyles = (themeColor = "#059669") => {
  const C = {
    ...defaultColors,
    primary: themeColor,
    secondary: darkenColor(themeColor, 20),
    primaryLight: lightenColor(themeColor, 92),
    primaryMid: lightenColor(themeColor, 70),
  };

  return {
    C,
    s: StyleSheet.create({
      /* page */
      page: {
        paddingTop: 40,
        paddingBottom: 60,
        paddingHorizontal: 40,
        fontSize: 10,
        fontFamily: "Helvetica",
        color: C.text,
        backgroundColor: C.white,
      },

      /*  header  */
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderBottomColor: C.primary,
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
        color: C.primary,
        marginBottom: 4,
      },
      clinicTagline: {
        fontSize: 10,
        color: C.textLight,
      },
      clinicContact: {
        fontSize: 8,
        color: C.textLight,
        marginTop: 2,
      },
      headerRight: {
        alignItems: "flex-end",
        justifyContent: "center",
      },
      headerTitle: {
        fontSize: 22,
        fontFamily: "Helvetica-Bold",
        color: C.text,
        letterSpacing: 0.4,
        marginBottom: 4,
      },
      headerDateRow: {
        flexDirection: "row",
        gap: 16,
        marginTop: 2,
      },
      headerDate: {
        fontSize: 8.5,
        color: C.muted,
      },

      /*  generic section  */
      section: {
        marginBottom: 14,
      },
      sectionHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
      },
      sectionDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: C.primary,
        marginRight: 7,
      },
      sectionTitle: {
        fontSize: 12,
        fontFamily: "Helvetica-Bold",
        color: C.primary,
        textTransform: "uppercase",
        letterSpacing: 0.6,
      },
      sectionLine: {
        height: 1,
        backgroundColor: C.border,
        marginTop: 2,
        marginBottom: 2,
      },
      sectionBody: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: C.background,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: C.primary,
      },

      /*  key-value rows  */
      kvRow: {
        flexDirection: "row",
        marginBottom: 5,
      },
      kvLabel: {
        width: 135,
        fontSize: 9,
        fontFamily: "Helvetica-Bold",
        color: C.textLight,
      },
      kvValue: {
        flex: 1,
        fontSize: 10,
        color: C.text,
        lineHeight: 1.45,
      },

      /*  sub-heading  */
      subHeading: {
        fontSize: 10,
        fontFamily: "Helvetica-Bold",
        color: C.textMid,
        marginBottom: 4,
        marginTop: 8,
        paddingBottom: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
      },

      /*  paragraph  */
      para: {
        fontSize: 10,
        color: C.text,
        lineHeight: 1.55,
        marginBottom: 2,
      },

      /*  patient info grid  */
      patientGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
      },
      patientCell: {
        width: "50%",
        paddingRight: 10,
        marginBottom: 6,
      },

      /*  vital signs  */
      vitalsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
      },
      vitalCard: {
        width: "31%",
        paddingVertical: 8,
        paddingHorizontal: 6,
        backgroundColor: C.primaryLight,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: C.primaryMid,
        alignItems: "center",
      },
      vitalLabel: {
        fontSize: 7.5,
        fontFamily: "Helvetica-Bold",
        color: C.textLight,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 3,
      },
      vitalValue: {
        fontSize: 13,
        fontFamily: "Helvetica-Bold",
        color: C.primary,
      },

      /*  prescription table  */
      rxTable: {
        marginTop: 4,
      },
      rxHeader: {
        flexDirection: "row",
        backgroundColor: C.primary,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
      },
      rxHeaderText: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: C.white,
        textTransform: "uppercase",
        letterSpacing: 0.3,
      },
      rxRow: {
        flexDirection: "row",
        borderBottomWidth: 0.5,
        borderBottomColor: C.border,
        paddingVertical: 7,
        paddingHorizontal: 10,
        backgroundColor: C.white,
      },
      rxRowAlt: {
        backgroundColor: C.background,
      },
      rxCell: {
        fontSize: 9,
        color: C.text,
      },
      rxCellBold: {
        fontSize: 9.5,
        fontFamily: "Helvetica-Bold",
        color: C.dark,
      },
      rxNotes: {
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: C.blueBg,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: C.blue,
      },
      rxNotesLabel: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: C.blue,
        marginBottom: 3,
        textTransform: "uppercase",
        letterSpacing: 0.3,
      },

      /*  footer  */
      footer: {
        position: "absolute",
        bottom: 28,
        left: 40,
        right: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: C.border,
        paddingTop: 8,
      },
      footerText: {
        fontSize: 7.5,
        color: C.muted,
      },
    }),
  };
};

/*  helper: key-value row  */
const KV = ({ label, value, styles }) => {
  if (!value) return null;
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
};

/*  helper: section wrapper  */
const Section = ({ title, children, styles }) => (
  <View style={styles.section} wrap={false}>
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionLine} />
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

/*  helper: sub-heading  */
const SubHeading = ({ children, styles }) => (
  <Text style={styles.subHeading}>{children}</Text>
);

/*  helper: paragraph  */
const Para = ({ children, styles }) => (
  <Text style={styles.para}>{children}</Text>
);

/*  column widths for prescription table  */
const RX_COL = {
  num: "6%",
  name: "28%",
  dosage: "16%",
  freq: "16%",
  dur: "14%",
  qty: "10%",
  inst: "10%",
};

/*  */
const CaseSheetPDF = ({
  record,
  selectedSections,
  patientInfo,
  clinicLogo = null,
  themeColor,
  clinicName = "Abel Wellness",
  clinicAddress = "",
  clinicPhone = "",
  clinicEmail = "",
}) => {
  const { C, s } = createStyles(themeColor);

  const fmt = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const vitals = record.vital_signs || {};
  const hasVitals = Object.values(vitals).some((v) => v);
  const rxItems = record.prescription?.items || [];
  const hasRx = rxItems.length > 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/*  HEADER (matches Invoice layout)  */}
        <View style={s.header} fixed>
          <View style={s.logoSection}>
            {clinicLogo && <Image src={clinicLogo} style={s.clinicLogo} />}
            <View style={s.clinicInfo}>
              <Text style={s.clinicName}>{clinicName}</Text>
              <Text style={s.clinicTagline}>Your Health, Our Priority</Text>
              {(clinicAddress || clinicPhone || clinicEmail) && (
                <Text style={s.clinicContact}>
                  {[clinicAddress, clinicPhone, clinicEmail]
                    .filter(Boolean)
                    .join("  |  ")}
                </Text>
              )}
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>CASE SHEET</Text>
            <View style={s.headerDateRow}>
              <Text style={s.headerDate}>
                Consultation:{" "}
                {fmt(record.appointment?.date || record.created_at)}
              </Text>
              <Text style={s.headerDate}>
                Printed: {fmt(new Date().toISOString())}
              </Text>
            </View>
          </View>
        </View>

        {/*  PATIENT INFO  */}
        {selectedSections.patientInfo && patientInfo && (
          <Section title="Patient Information" styles={s}>
            <View style={s.patientGrid}>
              <View style={s.patientCell}>
                <KV
                  label="Name:"
                  value={patientInfo.full_name || patientInfo.name}
                  styles={s}
                />
              </View>
              <View style={s.patientCell}>
                <KV
                  label="Age / Sex:"
                  value={
                    patientInfo.age || patientInfo.sex
                      ? `${patientInfo.age || "N/A"} / ${patientInfo.sex || "N/A"}`
                      : null
                  }
                  styles={s}
                />
              </View>
              <View style={s.patientCell}>
                <KV label="Phone:" value={patientInfo.phone} styles={s} />
              </View>
              <View style={s.patientCell}>
                <KV label="Email:" value={patientInfo.email} styles={s} />
              </View>
              {patientInfo.occupation && (
                <View style={s.patientCell}>
                  <KV
                    label="Occupation:"
                    value={patientInfo.occupation}
                    styles={s}
                  />
                </View>
              )}
              {patientInfo.address && (
                <View style={s.patientCell}>
                  <KV label="Address:" value={patientInfo.address} styles={s} />
                </View>
              )}
            </View>
          </Section>
        )}

        {/*  DOCTOR INFO  */}
        {selectedSections.doctorInfo &&
          (record.doctor?.user?.full_name || record.doctorName) && (
            <Section title="Consulting Doctor" styles={s}>
              <KV
                label="Doctor:"
                value={`Dr. ${record.doctor?.user?.full_name || record.doctorName}`}
                styles={s}
              />
              <KV
                label="Service:"
                value={record.appointment?.service || record.service}
                styles={s}
              />
            </Section>
          )}

        {/*  CHIEF COMPLAINTS  */}
        {selectedSections.chiefComplaints && record.chief_complaints && (
          <Section title="Chief Complaints" styles={s}>
            <Para styles={s}>{record.chief_complaints}</Para>
            {(record.onset ||
              record.duration ||
              record.location ||
              record.sensation ||
              record.modalities ||
              record.associated_symptoms ||
              record.progression) && (
              <View style={{ marginTop: 8 }}>
                <KV label="Onset:" value={record.onset} styles={s} />
                <KV label="Duration:" value={record.duration} styles={s} />
                <KV label="Location:" value={record.location} styles={s} />
                <KV label="Sensation:" value={record.sensation} styles={s} />
                <KV label="Modalities:" value={record.modalities} styles={s} />
                <KV
                  label="Associated Symptoms:"
                  value={record.associated_symptoms}
                  styles={s}
                />
                <KV
                  label="Progression:"
                  value={record.progression}
                  styles={s}
                />
              </View>
            )}
          </Section>
        )}

        {/*  HISTORY  */}
        {selectedSections.history &&
          (record.history_present_illness ||
            record.past_history ||
            record.family_history) && (
            <Section title="History" styles={s}>
              {record.history_present_illness && (
                <View>
                  <SubHeading styles={s}>History of Present Illness</SubHeading>
                  <Para styles={s}>{record.history_present_illness}</Para>
                </View>
              )}
              {record.past_history && (
                <View>
                  <SubHeading styles={s}>Past Medical History</SubHeading>
                  <Para styles={s}>{record.past_history}</Para>
                </View>
              )}
              {record.family_history && (
                <View>
                  <SubHeading styles={s}>Family History</SubHeading>
                  <Para styles={s}>{record.family_history}</Para>
                </View>
              )}
            </Section>
          )}

        {/*  PHYSICAL & MENTAL  */}
        {selectedSections.physicalGenerals &&
          (record.physical_generals ||
            record.physical_particulars ||
            record.mental_emotional_state) && (
            <Section title="Physical &amp; Mental Assessment" styles={s}>
              {record.physical_generals && (
                <View>
                  <SubHeading styles={s}>Physical Generals</SubHeading>
                  <Para styles={s}>{record.physical_generals}</Para>
                </View>
              )}
              {record.physical_particulars && (
                <View>
                  <SubHeading styles={s}>Physical Particulars</SubHeading>
                  <Para styles={s}>{record.physical_particulars}</Para>
                </View>
              )}
              {record.mental_emotional_state && (
                <View>
                  <SubHeading styles={s}>
                    Mental &amp; Emotional State
                  </SubHeading>
                  <Para styles={s}>{record.mental_emotional_state}</Para>
                </View>
              )}
            </Section>
          )}

        {/*  VITAL SIGNS  */}
        {selectedSections.vitalSigns && hasVitals && (
          <Section title="Vital Signs" styles={s}>
            <View style={s.vitalsRow}>
              {vitals.blood_pressure && (
                <View style={s.vitalCard}>
                  <Text style={s.vitalLabel}>Blood Pressure</Text>
                  <Text style={s.vitalValue}>{vitals.blood_pressure}</Text>
                </View>
              )}
              {vitals.pulse && (
                <View style={s.vitalCard}>
                  <Text style={s.vitalLabel}>Pulse</Text>
                  <Text style={s.vitalValue}>{vitals.pulse}</Text>
                </View>
              )}
              {vitals.temperature && (
                <View style={s.vitalCard}>
                  <Text style={s.vitalLabel}>Temperature</Text>
                  <Text style={s.vitalValue}>{vitals.temperature}</Text>
                </View>
              )}
              {vitals.respiratory_rate && (
                <View style={s.vitalCard}>
                  <Text style={s.vitalLabel}>Resp. Rate</Text>
                  <Text style={s.vitalValue}>{vitals.respiratory_rate}</Text>
                </View>
              )}
              {vitals.weight && (
                <View style={s.vitalCard}>
                  <Text style={s.vitalLabel}>Weight</Text>
                  <Text style={s.vitalValue}>{vitals.weight}</Text>
                </View>
              )}
              {vitals.height && (
                <View style={s.vitalCard}>
                  <Text style={s.vitalLabel}>Height</Text>
                  <Text style={s.vitalValue}>{vitals.height}</Text>
                </View>
              )}
            </View>
          </Section>
        )}

        {/*  EXAMINATION  */}
        {selectedSections.examination &&
          (record.general_exam_findings ||
            record.tongue_pulse ||
            record.lab_results ||
            record.imaging_results) && (
            <Section title="Examination &amp; Findings" styles={s}>
              {record.general_exam_findings && (
                <View>
                  <SubHeading styles={s}>General Exam Findings</SubHeading>
                  <Para styles={s}>{record.general_exam_findings}</Para>
                </View>
              )}
              {record.tongue_pulse && (
                <View>
                  <SubHeading styles={s}>Tongue &amp; Pulse</SubHeading>
                  <Para styles={s}>{record.tongue_pulse}</Para>
                </View>
              )}
              {record.lab_results && (
                <View>
                  <SubHeading styles={s}>Lab Results</SubHeading>
                  <Para styles={s}>{record.lab_results}</Para>
                </View>
              )}
              {record.imaging_results && (
                <View>
                  <SubHeading styles={s}>Imaging Results</SubHeading>
                  <Para styles={s}>{record.imaging_results}</Para>
                </View>
              )}
            </Section>
          )}

        {/*  DIAGNOSIS  */}
        {selectedSections.diagnosis &&
          (record.provisional_diagnosis ||
            record.totality_analysis ||
            record.final_diagnosis) && (
            <Section title="Diagnosis" styles={s}>
              <KV
                label="Provisional:"
                value={record.provisional_diagnosis}
                styles={s}
              />
              {record.totality_analysis && (
                <View>
                  <SubHeading styles={s}>Totality Analysis</SubHeading>
                  <Para styles={s}>{record.totality_analysis}</Para>
                </View>
              )}
              <KV
                label="Final Diagnosis:"
                value={record.final_diagnosis}
                styles={s}
              />
            </Section>
          )}

        {/*  TREATMENT & FOLLOW-UP  */}
        {selectedSections.treatmentPlan &&
          (record.treatment_plan || record.follow_up_instructions) && (
            <Section title="Treatment &amp; Follow-up" styles={s}>
              {record.treatment_plan && (
                <View>
                  <SubHeading styles={s}>Treatment Plan</SubHeading>
                  <Para styles={s}>{record.treatment_plan}</Para>
                </View>
              )}
              {record.follow_up_instructions && (
                <View>
                  <SubHeading styles={s}>Follow-up Instructions</SubHeading>
                  <Para styles={s}>{record.follow_up_instructions}</Para>
                </View>
              )}
            </Section>
          )}

        {/*  ADDITIONAL NOTES  */}
        {selectedSections.additionalNotes && record.additional_notes && (
          <Section title="Doctor's Notes" styles={s}>
            <Para styles={s}>{record.additional_notes}</Para>
          </Section>
        )}

        {/*  PRESCRIPTION  */}
        {selectedSections.prescription && hasRx && (
          <View style={s.section} wrap={false}>
            <View style={s.sectionHeaderRow}>
              <View style={s.sectionDot} />
              <Text style={s.sectionTitle}>Prescription</Text>
            </View>
            <View style={s.sectionLine} />

            <View style={s.rxTable}>
              {/* table header */}
              <View style={s.rxHeader}>
                <Text style={[s.rxHeaderText, { width: RX_COL.num }]}>#</Text>
                <Text style={[s.rxHeaderText, { width: RX_COL.name }]}>
                  Medication
                </Text>
                <Text style={[s.rxHeaderText, { width: RX_COL.dosage }]}>
                  Dosage
                </Text>
                <Text style={[s.rxHeaderText, { width: RX_COL.freq }]}>
                  Frequency
                </Text>
                <Text style={[s.rxHeaderText, { width: RX_COL.dur }]}>
                  Duration
                </Text>
                <Text style={[s.rxHeaderText, { width: RX_COL.qty }]}>Qty</Text>
              </View>

              {/* table rows */}
              {rxItems.map((item, idx) => (
                <View key={idx}>
                  <View style={[s.rxRow, idx % 2 !== 0 && s.rxRowAlt]}>
                    <Text style={[s.rxCell, { width: RX_COL.num }]}>
                      {idx + 1}
                    </Text>
                    <Text style={[s.rxCellBold, { width: RX_COL.name }]}>
                      {item.medication_name}
                    </Text>
                    <Text style={[s.rxCell, { width: RX_COL.dosage }]}>
                      {item.dosage || "-"}
                    </Text>
                    <Text style={[s.rxCell, { width: RX_COL.freq }]}>
                      {item.frequency || "-"}
                    </Text>
                    <Text style={[s.rxCell, { width: RX_COL.dur }]}>
                      {item.duration || "-"}
                    </Text>
                    <Text style={[s.rxCell, { width: RX_COL.qty }]}>
                      {item.quantity || "-"}
                    </Text>
                  </View>
                  {item.instructions && (
                    <View
                      style={{
                        paddingLeft: 24,
                        paddingRight: 10,
                        paddingBottom: 6,
                        backgroundColor: idx % 2 !== 0 ? C.background : C.white,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 8,
                          color: C.textLight,
                          fontStyle: "italic",
                        }}
                      >
                        Instructions: {item.instructions}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {record.prescription?.notes && (
              <View style={s.rxNotes}>
                <Text style={s.rxNotesLabel}>Prescription Notes</Text>
                <Para styles={s}>{record.prescription.notes}</Para>
              </View>
            )}
          </View>
        )}

        {/*  FOOTER  */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {clinicName} - Confidential Patient Record
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

export default CaseSheetPDF;
