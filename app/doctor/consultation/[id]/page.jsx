"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import DoctorSidebar from "../../components/DoctorSidebar";
import {
  FiUser,
  FiCalendar,
  FiPhone,
  FiMail,
  FiSave,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiClock,
  FiFileText,
  FiPackage,
  FiMapPin,
  FiBriefcase,
  FiX,
  FiFolder,
} from "react-icons/fi";
import { toast } from "sonner";

const ConsultationPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const appointmentId = params.id;
  const { user, loading: authLoading, isDoctor } = useRoleAuth();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "patient_info"
  );

  // Medical Record Form State
  const [medicalRecord, setMedicalRecord] = useState({
    // Chief Complaints
    chief_complaints: "",
    onset: "",
    duration: "",
    location: "",
    sensation: "",
    modalities: "",
    associated_symptoms: "",
    progression: "",

    // History
    history_present_illness: "",
    past_history: "",
    family_history: "",

    // Physical Generals
    physical_generals: "",
    physical_particulars: "",

    // Mental & Emotional
    mental_emotional_state: "",

    // Examination
    vital_signs: {
      temperature: "",
      blood_pressure: "",
      pulse: "",
      respiratory_rate: "",
      weight: "",
      height: "",
    },
    general_exam_findings: "",
    tongue_pulse: "",
    lab_results: "",
    imaging_results: "",

    // Diagnosis
    provisional_diagnosis: "",
    totality_analysis: "",
    final_diagnosis: "",

    // Treatment
    treatment_plan: "",
    follow_up_instructions: "",
    additional_notes: "",
  });

  // Prescription State
  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      medication_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: "",
      instructions: "",
    },
  ]);
  const [prescriptionNotes, setPrescriptionNotes] = useState("");

  // Patient History State
  const [patientHistory, setPatientHistory] = useState({
    medicalRecords: [],
    prescriptions: [],
  });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Patient Demographics State (for doctor to update)
  const [patientDemographics, setPatientDemographics] = useState({
    sex: "",
    occupation: "",
    address: "",
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If no user after loading completes, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has doctor role
    if (user.role !== "doctor") {
      toast.error("Access denied. Doctor account required.");
      router.push("/");
      return;
    }

    fetchAppointment();
  }, [user, authLoading, router, appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`/api/doctor/appointments/${appointmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data.appointment);

        // Load existing medical record if present
        if (data.medicalRecord) {
          setMedicalRecord(data.medicalRecord);
        }

        // Load existing prescription if present
        if (data.prescription?.items?.length > 0) {
          setPrescriptionItems(data.prescription.items);
          setPrescriptionNotes(data.prescription.notes || "");
        }

        // Set patient demographics
        if (data.appointment?.patient) {
          setPatientDemographics({
            sex: data.appointment.patient.sex || "",
            occupation: data.appointment.patient.occupation || "",
            address: data.appointment.patient.address || "",
          });
        }

        // Fetch patient history
        fetchPatientHistory();
      } else {
        toast.error("Failed to load appointment");
        router.push("/doctor/appointments");
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      toast.error("Failed to load appointment");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch(
        `/api/doctor/appointments/${appointmentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_patient_history" }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPatientHistory({
          medicalRecords: data.medicalRecords || [],
          prescriptions: data.prescriptions || [],
        });
      }
    } catch (error) {
      console.error("Error fetching patient history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMedicalRecordChange = (field, value) => {
    setMedicalRecord((prev) => ({ ...prev, [field]: value }));
  };

  const handleVitalSignChange = (field, value) => {
    setMedicalRecord((prev) => ({
      ...prev,
      vital_signs: { ...prev.vital_signs, [field]: value },
    }));
  };

  const handlePrescriptionItemChange = (index, field, value) => {
    const newItems = [...prescriptionItems];
    newItems[index][field] = value;
    setPrescriptionItems(newItems);
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        medication_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: "",
        instructions: "",
      },
    ]);
  };

  const removePrescriptionItem = (index) => {
    if (prescriptionItems.length > 1) {
      setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    }
  };

  const handleSave = async (complete = false) => {
    setSaving(true);

    try {
      const response = await fetch(
        `/api/doctor/consultation/${appointmentId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicalRecord,
            prescription: {
              items: prescriptionItems.filter((item) => item.medication_name),
              notes: prescriptionNotes,
            },
            patientDemographics,
            complete,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save consultation");
      }

      toast.success(
        complete
          ? "Consultation completed successfully!"
          : "Progress saved successfully!"
      );

      if (complete) {
        router.push("/doctor/appointments");
      }
    } catch (error) {
      console.error("Error saving consultation:", error);
      toast.error(error.message || "Failed to save consultation");
    } finally {
      setSaving(false);
    }
  };

  // Only show full-page loading for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Content loading skeleton
  const ContentSkeleton = () => (
    <main className="lg:ml-72 min-h-screen">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="px-6 lg:px-8 py-4">
          <div className="h-8 w-48 bg-slate-700/50 rounded animate-pulse"></div>
        </div>
      </header>
      <div className="p-6 lg:p-8 animate-pulse">
        <div className="h-12 bg-slate-800/50 rounded-xl mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-800/50 rounded-2xl"></div>
          <div className="h-96 bg-slate-800/50 rounded-2xl"></div>
        </div>
      </div>
    </main>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <DoctorSidebar />
        <ContentSkeleton />
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const tabs = [
    { id: "patient_info", label: "Patient Info" },
    { id: "complaints", label: "Chief Complaints" },
    { id: "history", label: "History" },
    { id: "physical", label: "Physical Exam" },
    { id: "mental", label: "Mental State" },
    { id: "examination", label: "Investigations" },
    { id: "diagnosis", label: "Diagnosis" },
    { id: "prescription", label: "Prescription" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DoctorSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Consultation
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5 truncate max-w-[200px] sm:max-w-none">
                  Patient: {appointment.name}
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 ml-12 lg:ml-0">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none"
                >
                  <FiSave className="w-4 h-4" />
                  <span className="hidden xs:inline">Save</span> Draft
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-none"
                >
                  <FiCheck className="w-4 h-4" />
                  Complete
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Patient Info Card */}
          <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Patient Information
              </h2>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-violet-500/20 text-violet-400 rounded-xl hover:bg-violet-500/30 transition-colors border border-violet-500/30 text-sm sm:text-base w-full sm:w-auto"
              >
                <FiFolder className="w-4 h-4" />
                View Past Records
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-2 sm:p-0 bg-slate-700/30 sm:bg-transparent rounded-lg">
                <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                  <FiUser className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400">Name</p>
                  <p className="font-medium text-white text-sm sm:text-base truncate">
                    {appointment.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 sm:p-0 bg-slate-700/30 sm:bg-transparent rounded-lg">
                <div className="p-2 rounded-lg bg-violet-500/20 shrink-0">
                  <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400">Age / Sex</p>
                  <p className="font-medium text-white text-sm sm:text-base">
                    {appointment.patient?.age || "N/A"} /{" "}
                    {appointment.patient?.sex || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 sm:p-0 bg-slate-700/30 sm:bg-transparent rounded-lg">
                <div className="p-2 rounded-lg bg-emerald-500/20 shrink-0">
                  <FiPhone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400">Phone</p>
                  <p className="font-medium text-white text-sm sm:text-base truncate">
                    {appointment.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 sm:p-0 bg-slate-700/30 sm:bg-transparent rounded-lg">
                <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                  <FiMail className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-400">Email</p>
                  <p className="font-medium text-white text-sm sm:text-base truncate">
                    {appointment.email}
                  </p>
                </div>
              </div>
            </div>
            {appointment.reason_for_visit && (
              <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <p className="text-sm text-blue-400">
                  <strong>Reason for Visit:</strong>{" "}
                  {appointment.reason_for_visit}
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
            <div className="border-b border-slate-700/50">
              <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                      activeTab === tab.id
                        ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Patient Info Tab - Doctor can update demographics */}
              {activeTab === "patient_info" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info (Read-only) */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">
                        Basic Information
                      </h3>
                      <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-400">Name</p>
                            <p className="font-medium text-white">
                              {appointment.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Age</p>
                            <p className="font-medium text-white">
                              {appointment.patient?.age || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Phone</p>
                            <p className="font-medium text-white">
                              {appointment.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Email</p>
                            <p className="font-medium text-white truncate">
                              {appointment.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Editable Demographics */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-white">
                        Demographics (Editable)
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Sex
                          </label>
                          <select
                            value={patientDemographics.sex}
                            onChange={(e) =>
                              setPatientDemographics((prev) => ({
                                ...prev,
                                sex: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Occupation
                          </label>
                          <input
                            type="text"
                            value={patientDemographics.occupation}
                            onChange={(e) =>
                              setPatientDemographics((prev) => ({
                                ...prev,
                                occupation: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Software Engineer, Teacher, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Address
                          </label>
                          <textarea
                            value={patientDemographics.address}
                            onChange={(e) =>
                              setPatientDemographics((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Patient's full address"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {appointment.reason_for_visit && (
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <p className="text-sm text-blue-400">
                        <strong>Reason for Visit:</strong>{" "}
                        {appointment.reason_for_visit}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Chief Complaints Tab */}
              {activeTab === "complaints" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Chief Complaints
                    </label>
                    <textarea
                      value={medicalRecord.chief_complaints}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "chief_complaints",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Main complaints presented by the patient..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Onset
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.onset}
                        onChange={(e) =>
                          handleMedicalRecordChange("onset", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="When did symptoms start?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.duration}
                        onChange={(e) =>
                          handleMedicalRecordChange("duration", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="How long have symptoms persisted?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.location}
                        onChange={(e) =>
                          handleMedicalRecordChange("location", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Where is the problem located?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Sensation
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.sensation}
                        onChange={(e) =>
                          handleMedicalRecordChange("sensation", e.target.value)
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type of pain/sensation"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Modalities (Aggravating/Ameliorating factors)
                    </label>
                    <textarea
                      value={medicalRecord.modalities}
                      onChange={(e) =>
                        handleMedicalRecordChange("modalities", e.target.value)
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="What makes it better or worse?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Associated Symptoms
                    </label>
                    <textarea
                      value={medicalRecord.associated_symptoms}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "associated_symptoms",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Other symptoms accompanying the main complaint..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Progression
                    </label>
                    <textarea
                      value={medicalRecord.progression}
                      onChange={(e) =>
                        handleMedicalRecordChange("progression", e.target.value)
                      }
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How has the condition progressed over time?"
                    />
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      History of Present Illness
                    </label>
                    <textarea
                      value={medicalRecord.history_present_illness}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "history_present_illness",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Detailed history of the current illness..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Past Medical History
                    </label>
                    <textarea
                      value={medicalRecord.past_history}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "past_history",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Previous illnesses, surgeries, hospitalizations..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Family History
                    </label>
                    <textarea
                      value={medicalRecord.family_history}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "family_history",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Relevant family medical history..."
                    />
                  </div>
                </div>
              )}

              {/* Physical Tab */}
              {activeTab === "physical" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Physical Generals
                    </label>
                    <textarea
                      value={medicalRecord.physical_generals}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "physical_generals",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Appetite, thirst, sleep, thermal reactions, perspiration, stool, urine..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Physical Particulars
                    </label>
                    <textarea
                      value={medicalRecord.physical_particulars}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "physical_particulars",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Specific physical findings related to the complaint..."
                    />
                  </div>
                </div>
              )}

              {/* Mental State Tab */}
              {activeTab === "mental" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Mental and Emotional State
                    </label>
                    <textarea
                      value={medicalRecord.mental_emotional_state}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "mental_emotional_state",
                          e.target.value
                        )
                      }
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Emotional state, fears, anxieties, mood, behavior patterns, reactions to stress..."
                    />
                  </div>
                </div>
              )}

              {/* Examination Tab */}
              {activeTab === "examination" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">
                      Vital Signs
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Temperature
                        </label>
                        <input
                          type="text"
                          value={medicalRecord.vital_signs.temperature}
                          onChange={(e) =>
                            handleVitalSignChange("temperature", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="°F / °C"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Blood Pressure
                        </label>
                        <input
                          type="text"
                          value={medicalRecord.vital_signs.blood_pressure}
                          onChange={(e) =>
                            handleVitalSignChange(
                              "blood_pressure",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="mmHg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Pulse
                        </label>
                        <input
                          type="text"
                          value={medicalRecord.vital_signs.pulse}
                          onChange={(e) =>
                            handleVitalSignChange("pulse", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="bpm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Respiratory Rate
                        </label>
                        <input
                          type="text"
                          value={medicalRecord.vital_signs.respiratory_rate}
                          onChange={(e) =>
                            handleVitalSignChange(
                              "respiratory_rate",
                              e.target.value
                            )
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="/min"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Weight
                        </label>
                        <input
                          type="text"
                          value={medicalRecord.vital_signs.weight}
                          onChange={(e) =>
                            handleVitalSignChange("weight", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="kg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Height
                        </label>
                        <input
                          type="text"
                          value={medicalRecord.vital_signs.height}
                          onChange={(e) =>
                            handleVitalSignChange("height", e.target.value)
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="cm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      General Examination Findings
                    </label>
                    <textarea
                      value={medicalRecord.general_exam_findings}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "general_exam_findings",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="General appearance, pallor, icterus, cyanosis, edema..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tongue / Pulse (For Homeopathy)
                    </label>
                    <textarea
                      value={medicalRecord.tongue_pulse}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "tongue_pulse",
                          e.target.value
                        )
                      }
                      rows={2}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tongue coating, color, marks; Pulse characteristics..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Lab Results
                    </label>
                    <textarea
                      value={medicalRecord.lab_results}
                      onChange={(e) =>
                        handleMedicalRecordChange("lab_results", e.target.value)
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Blood work, urine analysis, other lab findings..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Imaging Results
                    </label>
                    <textarea
                      value={medicalRecord.imaging_results}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "imaging_results",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="X-ray, ultrasound, MRI, CT findings..."
                    />
                  </div>
                </div>
              )}

              {/* Diagnosis Tab */}
              {activeTab === "diagnosis" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Provisional Diagnosis
                    </label>
                    <textarea
                      value={medicalRecord.provisional_diagnosis}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "provisional_diagnosis",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Initial diagnosis based on presentation..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Totality Analysis (For Homeopathy)
                    </label>
                    <textarea
                      value={medicalRecord.totality_analysis}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "totality_analysis",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Totality of symptoms, characteristic symptoms, rubric analysis..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Final Diagnosis
                    </label>
                    <textarea
                      value={medicalRecord.final_diagnosis}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "final_diagnosis",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirmed diagnosis..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Treatment Plan
                    </label>
                    <textarea
                      value={medicalRecord.treatment_plan}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "treatment_plan",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Treatment approach, rationale, expected outcomes..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Follow-up Instructions
                    </label>
                    <textarea
                      value={medicalRecord.follow_up_instructions}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "follow_up_instructions",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="When to follow up, warning signs, lifestyle advice..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      value={medicalRecord.additional_notes}
                      onChange={(e) =>
                        handleMedicalRecordChange(
                          "additional_notes",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any other relevant notes..."
                    />
                  </div>
                </div>
              )}

              {/* Prescription Tab */}
              {activeTab === "prescription" && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-base sm:text-lg font-medium text-white">
                      Prescription Items
                    </h3>
                    <button
                      onClick={addPrescriptionItem}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                    >
                      <FiPlus className="w-4 h-4" />
                      Add Medication
                    </button>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {prescriptionItems.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 sm:p-4 border border-slate-600/30 rounded-xl bg-slate-700/30"
                      >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <span className="font-medium text-slate-300 text-sm sm:text-base">
                            Medication {index + 1}
                          </span>
                          {prescriptionItems.length > 1 && (
                            <button
                              onClick={() => removePrescriptionItem(index)}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-sm text-slate-400 mb-1">
                              Medication Name *
                            </label>
                            <input
                              type="text"
                              value={item.medication_name}
                              onChange={(e) =>
                                handlePrescriptionItemChange(
                                  index,
                                  "medication_name",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Arnica Montana 200C"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">
                              Dosage
                            </label>
                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) =>
                                handlePrescriptionItemChange(
                                  index,
                                  "dosage",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 4 globules"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">
                              Frequency
                            </label>
                            <input
                              type="text"
                              value={item.frequency}
                              onChange={(e) =>
                                handlePrescriptionItemChange(
                                  index,
                                  "frequency",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Twice daily"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={item.duration}
                              onChange={(e) =>
                                handlePrescriptionItemChange(
                                  index,
                                  "duration",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 7 days"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">
                              Quantity
                            </label>
                            <input
                              type="text"
                              value={item.quantity}
                              onChange={(e) =>
                                handlePrescriptionItemChange(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., 1 bottle"
                            />
                          </div>
                          <div className="sm:col-span-2 md:col-span-3">
                            <label className="block text-sm text-slate-400 mb-1">
                              Special Instructions
                            </label>
                            <input
                              type="text"
                              value={item.instructions}
                              onChange={(e) =>
                                handlePrescriptionItemChange(
                                  index,
                                  "instructions",
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="e.g., Take on empty stomach, avoid coffee..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Prescription Notes
                    </label>
                    <textarea
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="General instructions, dietary restrictions, lifestyle advice..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Past Records Modal */}
        {showHistoryModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowHistoryModal(false)}
          >
            <div
              className="bg-slate-800 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-4xl lg:max-w-6xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl sm:m-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700/50 bg-gradient-to-r from-blue-600/20 to-indigo-600/20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/20 shrink-0">
                    <FiFolder className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-2xl font-semibold text-white">
                      Past Records
                    </h2>
                    <p className="text-sm sm:text-base text-slate-400 truncate">
                      {appointment?.patient?.full_name || "Patient"}'s history
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white shrink-0"
                >
                  <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(90vh-80px)] sm:max-h-[calc(85vh-100px)]">
                {loadingHistory ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base">
                      Loading patient history...
                    </p>
                  </div>
                ) : patientHistory.medicalRecords.length === 0 &&
                  patientHistory.prescriptions.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FiFileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                      No Previous Records
                    </h3>
                    <p className="text-slate-400 text-sm sm:text-base px-4">
                      This patient has no previous medical records or
                      prescriptions.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Previous Medical Records */}
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
                        <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        <span className="truncate">
                          Medical Records (
                          {patientHistory.medicalRecords.length})
                        </span>
                      </h3>
                      <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                        {patientHistory.medicalRecords.map((record) => (
                          <div
                            key={record.id}
                            className="p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-blue-500/30 transition-colors"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                                <FiCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {new Date(
                                  record.appointment?.date || record.created_at
                                ).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-blue-400 truncate max-w-[120px]">
                                Dr.{" "}
                                {record.doctor?.user?.full_name || "Unknown"}
                              </span>
                            </div>
                            {record.chief_complaints && (
                              <div className="mb-2">
                                <p className="text-xs text-slate-500">
                                  Chief Complaints:
                                </p>
                                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                                  {record.chief_complaints}
                                </p>
                              </div>
                            )}
                            {record.final_diagnosis && (
                              <div className="mb-2">
                                <p className="text-xs text-slate-500">
                                  Diagnosis:
                                </p>
                                <p className="text-xs sm:text-sm font-medium text-white line-clamp-2">
                                  {record.final_diagnosis}
                                </p>
                              </div>
                            )}
                            {record.treatment_plan && (
                              <div>
                                <p className="text-xs text-slate-500">
                                  Treatment:
                                </p>
                                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                                  {record.treatment_plan}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Previous Prescriptions */}
                    <div>
                      <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 flex items-center gap-2">
                        <FiPackage className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        <span className="truncate">
                          Prescriptions ({patientHistory.prescriptions.length})
                        </span>
                      </h3>
                      <div className="space-y-3 sm:space-y-4 max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                        {patientHistory.prescriptions.map((prescription) => (
                          <div
                            key={prescription.id}
                            className="p-3 sm:p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:border-emerald-500/30 transition-colors"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <span className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                                <FiCalendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {new Date(
                                  prescription.appointment?.date ||
                                    prescription.created_at
                                ).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-emerald-400 truncate max-w-[120px]">
                                Dr.{" "}
                                {prescription.doctor?.user?.full_name ||
                                  "Unknown"}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {prescription.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 bg-slate-800/50 rounded-lg border border-slate-600/20"
                                >
                                  <p className="font-medium text-white text-xs sm:text-sm truncate">
                                    {item.medication_name}
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1 text-xs text-slate-400">
                                    {item.dosage && (
                                      <span className="truncate">
                                        {item.dosage}
                                      </span>
                                    )}
                                    {item.frequency && (
                                      <span className="truncate">
                                        • {item.frequency}
                                      </span>
                                    )}
                                    {item.duration && (
                                      <span className="truncate">
                                        • {item.duration}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {prescription.notes && (
                              <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">
                                {prescription.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConsultationPage;
