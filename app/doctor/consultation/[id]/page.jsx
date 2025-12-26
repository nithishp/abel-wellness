"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiPhone,
  FiMail,
  FiSave,
  FiPlus,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";
import { toast } from "sonner";

const ConsultationPage = () => {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id;
  const { user, loading: authLoading, isDoctor } = useRoleAuth();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("complaints");

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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading consultation...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const tabs = [
    { id: "complaints", label: "Chief Complaints" },
    { id: "history", label: "History" },
    { id: "physical", label: "Physical Exam" },
    { id: "mental", label: "Mental State" },
    { id: "examination", label: "Investigations" },
    { id: "diagnosis", label: "Diagnosis" },
    { id: "prescription", label: "Prescription" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/doctor/appointments")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Consultation
                </h1>
                <p className="text-sm text-gray-500">
                  Patient: {appointment.name}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <FiCheck className="w-4 h-4" />
                Complete
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Patient Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Patient Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <FiUser className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{appointment.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiCalendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Age / Sex</p>
                <p className="font-medium">
                  {appointment.patient?.age || "N/A"} /{" "}
                  {appointment.patient?.sex || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiPhone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{appointment.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FiMail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium truncate">{appointment.email}</p>
              </div>
            </div>
          </div>
          {appointment.reason_for_visit && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Reason for Visit:</strong>{" "}
                {appointment.reason_for_visit}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="border-b overflow-x-auto">
            <div className="flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Chief Complaints Tab */}
            {activeTab === "complaints" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Main complaints presented by the patient..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Onset
                    </label>
                    <input
                      type="text"
                      value={medicalRecord.onset}
                      onChange={(e) =>
                        handleMedicalRecordChange("onset", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="When did symptoms start?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={medicalRecord.duration}
                      onChange={(e) =>
                        handleMedicalRecordChange("duration", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How long have symptoms persisted?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={medicalRecord.location}
                      onChange={(e) =>
                        handleMedicalRecordChange("location", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Where is the problem located?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sensation
                    </label>
                    <input
                      type="text"
                      value={medicalRecord.sensation}
                      onChange={(e) =>
                        handleMedicalRecordChange("sensation", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Type of pain/sensation"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modalities (Aggravating/Ameliorating factors)
                  </label>
                  <textarea
                    value={medicalRecord.modalities}
                    onChange={(e) =>
                      handleMedicalRecordChange("modalities", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What makes it better or worse?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Other symptoms accompanying the main complaint..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progression
                  </label>
                  <textarea
                    value={medicalRecord.progression}
                    onChange={(e) =>
                      handleMedicalRecordChange("progression", e.target.value)
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="How has the condition progressed over time?"
                  />
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed history of the current illness..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Past Medical History
                  </label>
                  <textarea
                    value={medicalRecord.past_history}
                    onChange={(e) =>
                      handleMedicalRecordChange("past_history", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Previous illnesses, surgeries, hospitalizations..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Relevant family medical history..."
                  />
                </div>
              </div>
            )}

            {/* Physical Tab */}
            {activeTab === "physical" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Appetite, thirst, sleep, thermal reactions, perspiration, stool, urine..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Specific physical findings related to the complaint..."
                  />
                </div>
              </div>
            )}

            {/* Mental State Tab */}
            {activeTab === "mental" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Emotional state, fears, anxieties, mood, behavior patterns, reactions to stress..."
                  />
                </div>
              </div>
            )}

            {/* Examination Tab */}
            {activeTab === "examination" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Vital Signs
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.vital_signs.temperature}
                        onChange={(e) =>
                          handleVitalSignChange("temperature", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="°F / °C"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="mmHg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pulse
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.vital_signs.pulse}
                        onChange={(e) =>
                          handleVitalSignChange("pulse", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="bpm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/min"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.vital_signs.weight}
                        onChange={(e) =>
                          handleVitalSignChange("weight", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="kg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height
                      </label>
                      <input
                        type="text"
                        value={medicalRecord.vital_signs.height}
                        onChange={(e) =>
                          handleVitalSignChange("height", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="cm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="General appearance, pallor, icterus, cyanosis, edema..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tongue / Pulse (For Homeopathy)
                  </label>
                  <textarea
                    value={medicalRecord.tongue_pulse}
                    onChange={(e) =>
                      handleMedicalRecordChange("tongue_pulse", e.target.value)
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tongue coating, color, marks; Pulse characteristics..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lab Results
                  </label>
                  <textarea
                    value={medicalRecord.lab_results}
                    onChange={(e) =>
                      handleMedicalRecordChange("lab_results", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Blood work, urine analysis, other lab findings..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="X-ray, ultrasound, MRI, CT findings..."
                  />
                </div>
              </div>
            )}

            {/* Diagnosis Tab */}
            {activeTab === "diagnosis" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Initial diagnosis based on presentation..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Totality of symptoms, characteristic symptoms, rubric analysis..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirmed diagnosis..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Treatment approach, rationale, expected outcomes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="When to follow up, warning signs, lifestyle advice..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any other relevant notes..."
                  />
                </div>
              </div>
            )}

            {/* Prescription Tab */}
            {activeTab === "prescription" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Prescription Items
                  </h3>
                  <button
                    onClick={addPrescriptionItem}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Medication
                  </button>
                </div>

                <div className="space-y-4">
                  {prescriptionItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium text-gray-700">
                          Medication {index + 1}
                        </span>
                        {prescriptionItems.length > 1 && (
                          <button
                            onClick={() => removePrescriptionItem(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-600 mb-1">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Arnica Montana 200C"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 4 globules"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 7 days"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., 1 bottle"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-sm text-gray-600 mb-1">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Take on empty stomach, avoid coffee..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prescription Notes
                  </label>
                  <textarea
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="General instructions, dietary restrictions, lifestyle advice..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPage;
