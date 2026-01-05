"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
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
  }, [user, authLoading, router]);

  const fetchPrescriptions = useCallback(async (page, limit) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`/api/patient/prescriptions?${params}`);
    if (!response.ok) throw new Error("Failed to fetch prescriptions");
    const data = await response.json();
    return {
      items: data.prescriptions || [],
      total: data.pagination?.total || 0,
      hasMore: data.pagination?.hasMore || false,
    };
  }, []);

  const {
    items: prescriptions,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchPrescriptions, {
    limit: 10,
    enabled: !!user && user.role === "patient" && !authLoading,
  });

  const filteredPrescriptions = useMemo(() => {
    return prescriptions;
  }, [prescriptions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reset();
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
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
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

        <div className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : filteredPrescriptions.length === 0 ? (
            <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FiPackage className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No prescriptions yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm sm:text-base">
                You'll see prescriptions here after your consultations with
                doctors
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredPrescriptions.map((prescription) => {
                const isDispensed = prescription.status === "dispensed";
                const isExpanded = expandedPrescription === prescription.id;

                return (
                  <div
                    key={prescription.id}
                    className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden transition-all duration-200 hover:border-slate-600/50"
                  >
                    {/* Prescription Header */}
                    <div
                      className="p-4 sm:p-6 cursor-pointer"
                      onClick={() => toggleExpand(prescription.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                          <div
                            className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${
                              isDispensed
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            } flex-shrink-0`}
                          >
                            <FiPackage className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                              <h3 className="text-base sm:text-lg font-semibold text-white">
                                {formatDate(prescription.created_at)}
                              </h3>
                              <span
                                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                                  isDispensed
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-amber-500/10 text-amber-400"
                                }`}
                              >
                                {isDispensed ? (
                                  <>
                                    <FiCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    Dispensed
                                  </>
                                ) : (
                                  <>
                                    <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    Pending
                                  </>
                                )}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                              <FiUser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="truncate">
                                Dr. {prescription.doctor_name}
                              </span>
                            </p>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">
                              {prescription.items?.length || 0} medications
                            </p>
                          </div>
                        </div>
                        <button className="text-slate-400 hover:text-white transition-colors flex-shrink-0">
                          {isExpanded ? (
                            <FiChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <FiChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-slate-700/50 pt-3 sm:pt-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-300 mb-3 sm:mb-4">
                          Medications
                        </h4>
                        <div className="space-y-2 sm:space-y-3">
                          {prescription.items?.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-slate-700/30 border border-slate-600/30"
                            >
                              <h5 className="font-medium text-white mb-2 text-sm sm:text-base">
                                {getMedicationDisplayName(itemIndex)}
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
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
                                <p className="text-slate-400 text-xs sm:text-sm mt-2 sm:mt-3 italic">
                                  {item.instructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {prescription.notes && (
                          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs sm:text-sm text-blue-400">
                              <span className="font-medium">Notes: </span>
                              {prescription.notes}
                            </p>
                          </div>
                        )}

                        {prescription.dispensed_at && (
                          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-xs sm:text-sm text-emerald-400">
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
              <InfiniteScrollLoader
                sentinelRef={sentinelRef}
                loadingMore={loadingMore}
                hasMore={hasMore}
                itemsCount={filteredPrescriptions.length}
                totalCount={totalCount}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientPrescriptionsPage;
