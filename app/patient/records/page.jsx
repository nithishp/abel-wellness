"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiArrowLeft,
  FiFileText,
  FiCalendar,
  FiUser,
  FiActivity,
  FiClipboard,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const PatientRecordsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "patient") {
      toast.error("Access denied. Patient account required.");
      router.push("/");
      return;
    }

    fetchRecords();
  }, [user, authLoading, router]);

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/patient/records");
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      } else {
        toast.error("Failed to load medical records");
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      toast.error("Failed to load medical records");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleExpand = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push("/patient/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Medical Records
              </h1>
              <p className="text-sm text-gray-500">
                View your consultation history
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {records.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Medical Records Yet
            </h3>
            <p className="text-gray-500">
              Your medical records will appear here after consultations
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Record Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpand(record.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <FiFileText className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {record.final_diagnosis ||
                            record.provisional_diagnosis ||
                            "Consultation Record"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            {formatDate(record.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiUser className="w-4 h-4" />
                            Dr. {record.doctor?.user?.full_name || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expandedRecord === record.id ? (
                      <FiChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedRecord === record.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t"
                    >
                      <div className="p-4 space-y-6">
                        {/* Chief Complaints */}
                        {record.chief_complaints && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                              <FiClipboard className="w-4 h-4" />
                              Chief Complaints
                            </h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {record.chief_complaints}
                            </p>
                            {(record.onset || record.duration) && (
                              <div className="mt-2 flex gap-4 text-sm text-gray-500">
                                {record.onset && (
                                  <span>Onset: {record.onset}</span>
                                )}
                                {record.duration && (
                                  <span>Duration: {record.duration}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Diagnosis */}
                        {(record.provisional_diagnosis ||
                          record.final_diagnosis) && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                              <FiActivity className="w-4 h-4" />
                              Diagnosis
                            </h4>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                              {record.provisional_diagnosis && (
                                <div>
                                  <span className="text-xs font-medium text-gray-500">
                                    Provisional:
                                  </span>
                                  <p className="text-gray-600">
                                    {record.provisional_diagnosis}
                                  </p>
                                </div>
                              )}
                              {record.final_diagnosis && (
                                <div>
                                  <span className="text-xs font-medium text-emerald-600">
                                    Final:
                                  </span>
                                  <p className="text-gray-900 font-medium">
                                    {record.final_diagnosis}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Vital Signs */}
                        {record.vital_signs &&
                          Object.values(record.vital_signs).some((v) => v) && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Vital Signs
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {record.vital_signs.blood_pressure && (
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">
                                      Blood Pressure
                                    </p>
                                    <p className="font-medium">
                                      {record.vital_signs.blood_pressure}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.pulse && (
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">
                                      Pulse
                                    </p>
                                    <p className="font-medium">
                                      {record.vital_signs.pulse}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.temperature && (
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">
                                      Temperature
                                    </p>
                                    <p className="font-medium">
                                      {record.vital_signs.temperature}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.weight && (
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">
                                      Weight
                                    </p>
                                    <p className="font-medium">
                                      {record.vital_signs.weight}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.height && (
                                  <div className="bg-gray-50 p-2 rounded-lg text-center">
                                    <p className="text-xs text-gray-500">
                                      Height
                                    </p>
                                    <p className="font-medium">
                                      {record.vital_signs.height}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {/* Treatment Plan */}
                        {record.treatment_plan && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Treatment Plan
                            </h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {record.treatment_plan}
                            </p>
                          </div>
                        )}

                        {/* Follow Up */}
                        {record.follow_up_instructions && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Follow-up Instructions
                            </h4>
                            <p className="text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                              {record.follow_up_instructions}
                            </p>
                          </div>
                        )}

                        {/* Doctor's Notes */}
                        {record.notes && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Doctor's Notes
                            </h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientRecordsPage;
