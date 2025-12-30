"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PatientSidebar from "../components/PatientSidebar";
import {
  FiPackage,
  FiCalendar,
  FiUser,
  FiCheck,
  FiClock,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { toast } from "sonner";
import { formatAppointmentDateTime } from "@/lib/utils";

const PatientPrescriptionsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPrescription, setExpandedPrescription] = useState(null);

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

    fetchPrescriptions();
  }, [user, authLoading, router]);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/patient/prescriptions");
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } else {
        toast.error("Failed to load prescriptions");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
    setRefreshing(false);
    toast.success("Prescriptions refreshed!");
  };

  const formatDate = (dateString) => {
    return formatAppointmentDateTime(dateString).date;
  };

  const getMedicationDisplayName = (index) => {
    return `Medication ${index + 1}`;
  };

  const toggleExpand = (id) => {
    setExpandedPrescription(expandedPrescription === id ? null : id);
  };

  // Only show full-page loading for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Content loading skeleton component
  const ContentSkeleton = () => (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-slate-800/50 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PatientSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-white">
                  My Prescriptions
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  View all your prescriptions and medications
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : prescriptions.length === 0 ? (
            <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
                <FiPackage className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No prescriptions yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                You'll see prescriptions here after your consultations with
                doctors
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => {
                const isDispensed = prescription.status === "dispensed";
                const isExpanded = expandedPrescription === prescription.id;

                return (
                  <div
                    key={prescription.id}
                    className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden transition-all duration-200 hover:border-slate-600/50"
                  >
                    {/* Prescription Header */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => toggleExpand(prescription.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-xl ${
                              isDispensed
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            } flex-shrink-0`}
                          >
                            <FiPackage className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-semibold text-white">
                                {formatDate(prescription.created_at)}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                                  isDispensed
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {isDispensed ? (
                                  <>
                                    <FiCheck className="w-3 h-3" />
                                    Dispensed
                                  </>
                                ) : (
                                  <>
                                    <FiClock className="w-3 h-3" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm flex items-center gap-2">
                              <FiUser className="w-4 h-4" />
                              Prescribed by Dr. {prescription.doctor_name}
                            </p>
                            <p className="text-slate-500 text-sm mt-1">
                              {prescription.items?.length || 0} medications
                            </p>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-white transition-colors">
                          {isExpanded ? (
                            <FiChevronUp className="w-5 h-5" />
                          ) : (
                            <FiChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-slate-700/50 pt-4">
                        <h4 className="text-sm font-semibold text-slate-300 mb-4">
                          Medications
                        </h4>
                        <div className="space-y-3">
                          {prescription.items?.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30"
                            >
                              <h5 className="font-medium text-white mb-2">
                                {getMedicationDisplayName(itemIndex)}
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                {item.dosage && (
                                  <div>
                                    <p className="text-slate-500">Dosage</p>
                                    <p className="text-slate-300">
                                      {item.dosage}
                                    </p>
                                  </div>
                                )}
                                {item.frequency && (
                                  <div>
                                    <p className="text-slate-500">Frequency</p>
                                    <p className="text-slate-300">
                                      {item.frequency}
                                    </p>
                                  </div>
                                )}
                                {item.duration && (
                                  <div>
                                    <p className="text-slate-500">Duration</p>
                                    <p className="text-slate-300">
                                      {item.duration}
                                    </p>
                                  </div>
                                )}
                                {item.quantity && (
                                  <div>
                                    <p className="text-slate-500">Quantity</p>
                                    <p className="text-slate-300">
                                      {item.quantity}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {item.instructions && (
                                <p className="text-slate-400 text-sm mt-3 italic">
                                  {item.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {prescription.notes && (
                          <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-sm text-blue-400">
                              <span className="font-medium">Notes: </span>
                              {prescription.notes}
                            </p>
                          </div>
                        )}

                        {prescription.dispensed_at && (
                          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-sm text-emerald-400">
                              <span className="font-medium">
                                Dispensed on:{" "}
                              </span>
                              {formatDate(prescription.dispensed_at)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientPrescriptionsPage;
