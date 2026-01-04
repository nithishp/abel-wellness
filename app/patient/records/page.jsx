"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import PatientSidebar from "../components/PatientSidebar";
import {
  FiFileText,
  FiCalendar,
  FiUser,
  FiActivity,
  FiClipboard,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiHeart,
  FiThermometer,
} from "react-icons/fi";
import { toast } from "sonner";
import { formatAppointmentDateTime } from "@/lib/utils";

const PatientRecordsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [refreshing, setRefreshing] = useState(false);
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
  }, [user, authLoading, router]);

  const fetchRecords = useCallback(async (page, limit) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`/api/patient/records?${params}`);
    if (!response.ok) throw new Error("Failed to fetch records");
    const data = await response.json();
    return {
      items: data.records || [],
      total: data.pagination?.total || 0,
      hasMore: data.pagination?.hasMore || false,
    };
  }, []);

  const {
    items: records,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchRecords, {
    limit: 10,
    enabled: !!user && user.role === "patient" && !authLoading,
  });

  const filteredRecords = useMemo(() => {
    return records;
  }, [records]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reset();
    setRefreshing(false);
    toast.success("Records refreshed!");
  };

  const formatDate = (dateString) => {
    return formatAppointmentDateTime(dateString).date;
  };

  const toggleExpand = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
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
                  Medical Records
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  View your consultation history
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
          ) : records.length === 0 ? (
            <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
                <FiFileText className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Medical Records Yet
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Your medical records will appear here after consultations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record) => {
                const isExpanded = expandedRecord === record.id;

                return (
                  <div
                    key={record.id}
                    className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden transition-all duration-200 hover:border-slate-600/50"
                  >
                    {/* Record Header */}
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => toggleExpand(record.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                            <FiFileText className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {record.final_diagnosis ||
                                record.provisional_diagnosis ||
                                "Consultation Record"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <FiCalendar className="w-4 h-4" />
                                {formatDate(record.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiUser className="w-4 h-4" />
                                Dr.{" "}
                                {record.doctor?.user?.full_name || "Unknown"}
                              </span>
                            </div>
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
                      <div className="px-6 pb-6 border-t border-slate-700/50 pt-4 space-y-6">
                        {/* Chief Complaints */}
                        {record.chief_complaints && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                              <FiClipboard className="w-4 h-4 text-blue-400" />
                              Chief Complaints
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                              <p className="text-slate-300">
                                {record.chief_complaints}
                              </p>
                              {(record.onset || record.duration) && (
                                <div className="mt-3 flex gap-4 text-sm">
                                  {record.onset && (
                                    <span className="text-slate-400">
                                      <span className="text-slate-500">
                                        Onset:
                                      </span>{" "}
                                      {record.onset}
                                    </span>
                                  )}
                                  {record.duration && (
                                    <span className="text-slate-400">
                                      <span className="text-slate-500">
                                        Duration:
                                      </span>{" "}
                                      {record.duration}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Diagnosis */}
                        {(record.provisional_diagnosis ||
                          record.final_diagnosis) && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                              <FiActivity className="w-4 h-4 text-purple-400" />
                              Diagnosis
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 space-y-3">
                              {record.provisional_diagnosis && (
                                <div>
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    Provisional
                                  </span>
                                  <p className="text-slate-300 mt-1">
                                    {record.provisional_diagnosis}
                                  </p>
                                </div>
                              )}
                              {record.final_diagnosis && (
                                <div>
                                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                                    Final
                                  </span>
                                  <p className="text-white font-medium mt-1">
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
                              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
                                <FiHeart className="w-4 h-4 text-red-400" />
                                Vital Signs
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                {record.vital_signs.blood_pressure && (
                                  <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Blood Pressure
                                    </p>
                                    <p className="font-semibold text-white">
                                      {record.vital_signs.blood_pressure}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.pulse && (
                                  <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Pulse
                                    </p>
                                    <p className="font-semibold text-white">
                                      {record.vital_signs.pulse}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.temperature && (
                                  <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Temperature
                                    </p>
                                    <p className="font-semibold text-white">
                                      {record.vital_signs.temperature}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.weight && (
                                  <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Weight
                                    </p>
                                    <p className="font-semibold text-white">
                                      {record.vital_signs.weight}
                                    </p>
                                  </div>
                                )}
                                {record.vital_signs.height && (
                                  <div className="p-3 rounded-xl bg-slate-700/30 border border-slate-600/30 text-center">
                                    <p className="text-xs text-slate-500 mb-1">
                                      Height
                                    </p>
                                    <p className="font-semibold text-white">
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
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">
                              Treatment Plan
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                              <p className="text-slate-300">
                                {record.treatment_plan}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Follow Up */}
                        {record.follow_up_instructions && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">
                              Follow-up Instructions
                            </h4>
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                              <p className="text-blue-300">
                                {record.follow_up_instructions}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Doctor's Notes */}
                        {record.additional_notes && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">
                              Doctor's Notes
                            </h4>
                            <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                              <p className="text-slate-300">
                                {record.additional_notes}
                              </p>
                            </div>
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
                itemsCount={filteredRecords.length}
                totalCount={totalCount}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientRecordsPage;
