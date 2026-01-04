"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import PatientSidebar from "../components/PatientSidebar";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiEye,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { toast } from "sonner";
import AppointmentModal from "@/app/components/ui/AppointmentModal";
import { formatAppointmentDateTime } from "@/lib/utils";

const PatientAppointmentsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const fetchAppointments = useCallback(async (page, limit) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`/api/patient/appointments?${params}`);
    if (!response.ok) throw new Error("Failed to fetch appointments");
    const data = await response.json();
    return {
      items: data.appointments || [],
      total: data.pagination?.total || 0,
      hasMore: data.pagination?.hasMore || false,
    };
  }, []);

  const {
    items: appointments,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchAppointments, {
    limit: 10,
    enabled: !!user && user.role === "patient" && !authLoading,
  });

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

  const sortedAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "completed")
          return apt.consultation_status === "completed";
        return apt.status === statusFilter;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "date":
            comparison = new Date(a.date) - new Date(b.date);
            break;
          case "status":
            comparison = (a.status || "").localeCompare(b.status || "");
            break;
          default:
            comparison = 0;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [appointments, statusFilter, sortBy, sortOrder]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reset();
    setRefreshing(false);
    toast.success("Appointments refreshed!");
  };

  const formatDate = (dateString, timeString) => {
    return formatAppointmentDateTime(dateString, timeString).date;
  };

  const getStatusConfig = (status, consultationStatus) => {
    if (consultationStatus === "completed") {
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
        label: "Completed",
      };
    }
    const configs = {
      pending: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
        label: "Pending",
      },
      approved: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-400",
        label: "Approved",
      },
      rejected: {
        bg: "bg-red-500/10",
        text: "text-red-400",
        dot: "bg-red-400",
        label: "Rejected",
      },
    };
    return configs[status] || configs.pending;
  };

  const handleAppointmentSuccess = () => {
    reset();
  };

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
  ];

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
          <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
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
                  My Appointments
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Manage your healthcare appointments
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
                >
                  <FiRefreshCw
                    className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
                >
                  <FiPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Book Appointment</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : (
            <>
              {/* Filters */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="inline-flex items-center gap-3 p-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <FiFilter className="text-slate-400 ml-2" />
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === option.value
                          ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer text-sm"
                  >
                    <option value="date" className="bg-slate-800">
                      Sort by Date
                    </option>
                    <option value="status" className="bg-slate-800">
                      Sort by Status
                    </option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                    title={sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortOrder === "asc" ? (
                      <FiArrowUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FiArrowDown className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Appointments Grid */}
              {sortedAppointments.length === 0 ? (
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
                    <FiCalendar className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No appointments found
                  </h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">
                    {statusFilter !== "all"
                      ? "Try changing the filter to see more appointments"
                      : "You haven't booked any appointments yet. Get started by booking your first appointment."}
                  </p>
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
                  >
                    <FiPlus className="w-5 h-5" />
                    Book an Appointment
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {sortedAppointments.map((appointment) => {
                    const statusConfig = getStatusConfig(
                      appointment.status,
                      appointment.consultation_status
                    );
                    const formattedDateTime = formatAppointmentDateTime(
                      appointment.date,
                      appointment.time
                    );

                    return (
                      <div
                        key={appointment.id}
                        className="group rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-200"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                              <FiCalendar className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">
                                {formattedDateTime.date}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-slate-400 text-sm flex items-center gap-1">
                                  <FiClock className="w-4 h-4" />
                                  {formattedDateTime.time}
                                </span>
                                {appointment.doctor_name && (
                                  <span className="text-slate-400 text-sm flex items-center gap-1">
                                    <FiUser className="w-4 h-4" />
                                    Dr. {appointment.doctor_name}
                                  </span>
                                )}
                              </div>
                              {appointment.reason_for_visit && (
                                <div className="mt-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                                  <p className="text-sm text-slate-300">
                                    <span className="text-slate-500">
                                      Reason:{" "}
                                    </span>
                                    {appointment.reason_for_visit}
                                  </p>
                                </div>
                              )}
                              {appointment.rejection_reason && (
                                <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                  <p className="text-sm text-red-400">
                                    <span className="font-medium">
                                      Rejection Reason:{" "}
                                    </span>
                                    {appointment.rejection_reason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 lg:flex-shrink-0">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${statusConfig.dot}`}
                              ></span>
                              {statusConfig.label}
                            </span>

                            {appointment.consultation_status ===
                              "completed" && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/patient/records/${appointment.id}`
                                  )
                                }
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                              >
                                <FiEye className="w-4 h-4" />
                                View Record
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Infinite Scroll Loader */}
                  <InfiniteScrollLoader
                    sentinelRef={sentinelRef}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSuccess={handleAppointmentSuccess}
      />
    </div>
  );
};

export default PatientAppointmentsPage;
