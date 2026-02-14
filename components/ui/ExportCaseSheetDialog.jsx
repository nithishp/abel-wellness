"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { pdf } from "@react-pdf/renderer";
import {
  FiDownload,
  FiX,
  FiCheckSquare,
  FiSquare,
  FiLoader,
  FiUser,
  FiClipboard,
  FiActivity,
  FiHeart,
  FiFileText,
  FiThermometer,
  FiBookOpen,
  FiEdit3,
  FiPackage,
  FiSearch,
  FiMessageSquare,
} from "react-icons/fi";
import CaseSheetPDF from "@/components/ui/CaseSheetPDF";

const EXPORT_SECTIONS = [
  {
    key: "patientInfo",
    label: "Patient Information",
    description: "Name, age, sex, contact details",
    icon: FiUser,
  },
  {
    key: "doctorInfo",
    label: "Consulting Doctor",
    description: "Doctor name and service",
    icon: FiBookOpen,
  },
  {
    key: "chiefComplaints",
    label: "Chief Complaints",
    description: "Complaints, onset, duration, location",
    icon: FiClipboard,
  },
  {
    key: "history",
    label: "History",
    description: "Present illness, past & family history",
    icon: FiFileText,
  },
  {
    key: "physicalGenerals",
    label: "Physical & Mental Assessment",
    description: "Physical generals, particulars, mental state",
    icon: FiThermometer,
  },
  {
    key: "vitalSigns",
    label: "Vital Signs",
    description: "BP, pulse, temperature, weight, height",
    icon: FiHeart,
  },
  {
    key: "examination",
    label: "Examination & Findings",
    description: "General exam, tongue & pulse, lab results",
    icon: FiSearch,
  },
  {
    key: "diagnosis",
    label: "Diagnosis",
    description: "Provisional, final diagnosis, totality analysis",
    icon: FiActivity,
  },
  {
    key: "treatmentPlan",
    label: "Treatment & Follow-up",
    description: "Treatment plan and follow-up instructions",
    icon: FiEdit3,
  },
  {
    key: "additionalNotes",
    label: "Doctor's Notes",
    description: "Additional notes from the doctor",
    icon: FiMessageSquare,
  },
  {
    key: "prescription",
    label: "Prescription",
    description: "Medications, dosage, frequency, instructions",
    icon: FiPackage,
  },
];

/**
 * Shared Export Case Sheet Dialog
 *
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - record: the medical record object (must have chief_complaints, vital_signs, etc.)
 * - patientInfo: { full_name|name, age, sex, phone, email, occupation, address }
 * - prescriptionData: optional already-loaded prescription { items, notes }
 * - fetchPrescriptionUrl: optional URL to fetch prescription if not already loaded
 */
const ExportCaseSheetDialog = ({
  isOpen,
  onClose,
  record,
  patientInfo,
  prescriptionData,
  fetchPrescriptionUrl,
}) => {
  const allKeys = EXPORT_SECTIONS.map((s) => s.key);
  const [selectedSections, setSelectedSections] = useState(
    Object.fromEntries(allKeys.map((k) => [k, true])),
  );
  const [exporting, setExporting] = useState(false);
  const [clinicLogo, setClinicLogo] = useState(null);
  const [themeColor, setThemeColor] = useState("#059669");
  const [clinicName, setClinicName] = useState("Abel Wellness");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const brandingFetched = useRef(false);

  // Fetch clinic branding (logo + theme color) once when dialog opens
  useEffect(() => {
    if (!isOpen || brandingFetched.current) return;
    (async () => {
      try {
        const res = await fetch("/api/clinic/branding");
        if (res.ok) {
          const data = await res.json();
          if (data.clinicLogo) setClinicLogo(data.clinicLogo);
          if (data.themeColor) setThemeColor(data.themeColor);
          if (data.clinicName) setClinicName(data.clinicName);
          if (data.clinicAddress) setClinicAddress(data.clinicAddress);
          if (data.clinicPhone) setClinicPhone(data.clinicPhone);
          if (data.clinicEmail) setClinicEmail(data.clinicEmail);
        }
      } catch {
        // Continue with defaults
      }
      brandingFetched.current = true;
    })();
  }, [isOpen]);

  const allSelected = allKeys.every((k) => selectedSections[k]);
  const noneSelected = allKeys.every((k) => !selectedSections[k]);
  const someSelected = !allSelected && !noneSelected;

  const toggleSelectAll = () => {
    const newValue = !allSelected;
    setSelectedSections(Object.fromEntries(allKeys.map((k) => [k, newValue])));
  };

  const toggleSection = (key) => {
    setSelectedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCount = allKeys.filter((k) => selectedSections[k]).length;

  const handleExport = useCallback(async () => {
    if (noneSelected) return;
    setExporting(true);

    try {
      let enrichedRecord = { ...record };

      // Use provided prescription data or fetch it
      if (prescriptionData) {
        enrichedRecord.prescription = prescriptionData;
      } else if (!enrichedRecord.prescription && fetchPrescriptionUrl) {
        try {
          const res = await fetch(fetchPrescriptionUrl);
          if (res.ok) {
            const data = await res.json();
            enrichedRecord.prescription = data.prescription;
          }
        } catch {
          // Continue without prescription data
        }
      }

      const blob = await pdf(
        <CaseSheetPDF
          record={enrichedRecord}
          selectedSections={selectedSections}
          patientInfo={patientInfo}
          clinicLogo={clinicLogo}
          themeColor={themeColor}
          clinicName={clinicName}
          clinicAddress={clinicAddress}
          clinicPhone={clinicPhone}
          clinicEmail={clinicEmail}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const patientName =
        patientInfo?.full_name || patientInfo?.name || "Patient";
      const date = record.created_at
        ? new Date(record.created_at).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `CaseSheet_${patientName.replace(/\s+/g, "_")}_${date}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setExporting(false);
    }
  }, [
    record,
    selectedSections,
    patientInfo,
    noneSelected,
    onClose,
    prescriptionData,
    fetchPrescriptionUrl,
    clinicLogo,
    themeColor,
    clinicName,
    clinicAddress,
    clinicPhone,
    clinicEmail,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div>
            <h3 className="text-lg font-bold text-white">Export Case Sheet</h3>
            <p className="text-sm text-slate-400 mt-0.5">
              Select sections to include in the PDF
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Select All */}
        <div className="px-6 py-3 border-b border-slate-700/30 bg-slate-800/50">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-3 w-full group"
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                allSelected
                  ? "bg-emerald-500 text-white"
                  : someSelected
                    ? "bg-emerald-500/50 text-white"
                    : "border-2 border-slate-500 text-transparent group-hover:border-slate-400"
              }`}
            >
              {allSelected || someSelected ? (
                <FiCheckSquare className="w-4 h-4" />
              ) : (
                <FiSquare className="w-4 h-4" />
              )}
            </div>
            <span className="text-sm font-semibold text-white">Select All</span>
            <span className="ml-auto text-xs text-slate-500">
              {selectedCount} of {allKeys.length} selected
            </span>
          </button>
        </div>

        {/* Sections List */}
        <div className="px-6 py-3 max-h-[50vh] overflow-y-auto space-y-1 custom-scrollbar">
          {EXPORT_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isSelected = selectedSections[section.key];

            return (
              <button
                key={section.key}
                onClick={() => toggleSection(section.key)}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${
                  isSelected
                    ? "bg-emerald-500/10 border border-emerald-500/30"
                    : "bg-slate-700/20 border border-transparent hover:bg-slate-700/40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected
                      ? "bg-emerald-500 text-white"
                      : "border-2 border-slate-500"
                  }`}
                >
                  {isSelected && <FiCheckSquare className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={`p-1.5 rounded-lg flex-shrink-0 ${
                    isSelected
                      ? "text-emerald-400 bg-emerald-500/20"
                      : "text-slate-500 bg-slate-700/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-slate-400"
                    }`}
                  >
                    {section.label}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {section.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-700/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={noneSelected || exporting}
            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FiDownload className="w-4 h-4" />
                Export PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportCaseSheetDialog;
