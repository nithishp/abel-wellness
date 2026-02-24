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
  FiXCircle,
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
  const [expandedReasons, setExpandedReasons] = useState({});

  const toggleReasonExpanded = (appointmentId, type) => {
    const key = `${appointmentId}-${type}`;
    setExpandedReasons((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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
    // Check consultation status for completed appointments
    if (consultationStatus === "completed") {
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
        label: "Completed",
      };
    }

    // Check appointment status (pending, approved, rejected, cancelled)
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
      cancelled: {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        dot: "bg-slate-400",
        label: "Cancelled",
      },
    };
    return configs[status] || configs.pending;
  };

  const handleAppointmentSuccess = () => {
    reset();
  };

  const [cancellingId, setCancellingId] = useState(null);

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    setCancellingId(appointmentId);
    try {
      const res = await fetch("/api/patient/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to cancel appointment");
        return;
      }
      toast.success("Appointment cancelled successfully");
      reset();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (status) => {
    return ["pending", "approved", "rescheduled"].includes(status);
  };

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
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
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  My Appointments
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Manage your healthcare appointments
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
                >
                  <FiRefreshCw
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${
                      refreshing ? "animate-spin" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-medium text-sm sm:text-base"
                >
                  <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden xs:inline sm:inline">Book</span>
                  <span className="hidden sm:inline">Appointment</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : (
            <>
              {/* Filters */}
              <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
                {/* Status Filter - Horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <div className="inline-flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-slate-800/50 rounded-xl border border-slate-700/50 min-w-max">
                    <FiFilter className="text-slate-400 ml-1.5 sm:ml-2 w-4 h-4" />
                    {filterOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                          statusFilter === option.value
                            ? "bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Sort Controls */}
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50 self-start">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer text-xs sm:text-sm"
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
                      <FiArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    ) : (
                      <FiArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Appointments Grid */}
              {sortedAppointments.length === 0 ? (
                <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <FiCalendar className="w-8 h-8 sm:w-10 sm:h-10 text-slate-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    No appointments found
                  </h3>
                  <p className="text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base">
                    {statusFilter !== "all"
                      ? "Try changing the filter to see more appointments"
                      : "You haven't booked any appointments yet. Get started by booking your first appointment."}
                  </p>
                  <button
                    onClick={() => setShowAppointmentModal(true)}
                    className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-medium text-sm sm:text-base"
                  >
                    <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Book an Appointment
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {sortedAppointments.map((appointment) => {
                    const statusConfig = getStatusConfig(
                      appointment.status,
                      appointment.consultation_status,
                    );
                    const formattedDateTime = formatAppointmentDateTime(
                      appointment.date,
                      appointment.time,
                    );

                    return (
                      <div
                        key={appointment.id}
                        className="group rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6 hover:border-slate-600/50 transition-all duration-200"
                      >
                        <div className="flex flex-col gap-3 sm:gap-4">
                          {/* Main Info Row */}
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                              <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                  <h3 className="text-base sm:text-lg font-semibold text-white">
                                    {formattedDateTime.date}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                                    <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1">
                                      <FiClock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      {formattedDateTime.time}
                                    </span>
                                    {appointment.doctor_name && (
                                      <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1">
                                        <FiUser className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        Dr. {appointment.doctor_name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span
                                  className={`self-start sm:self-center inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusConfig.dot}`}
                                  ></span>
                                  {statusConfig.label}
                                </span>
                              </div>

                              {appointment.reason_for_visit && (
                                <div
                                  className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-lg bg-slate-700/30 border border-slate-600/30 cursor-pointer hover:bg-slate-700/40 transition-colors"
                                  onClick={() =>
                                    toggleReasonExpanded(
                                      appointment.id,
                                      "visit",
                                    )
                                  }
                                >
                                  <p
                                    className={`text-xs sm:text-sm text-slate-300 ${
                                      !expandedReasons[
                                        `${appointment.id}-visit`
                                      ]
                                        ? "line-clamp-2"
                                        : ""
                                    }`}
                                  >
                                    <span className="text-slate-500">
                                      Reason:{" "}
                                    </span>
                                    {appointment.reason_for_visit}
                                  </p>
                                  {appointment.reason_for_visit.length >
                                    100 && (
                                    <span className="text-[10px] sm:text-xs text-slate-500 mt-1 block">
                                      {expandedReasons[
                                        `${appointment.id}-visit`
                                      ]
                                        ? "Click to collapse"
                                        : "Click to expand"}
                                    </span>
                                  )}
                                </div>
                              )}
                              {appointment.rejection_reason && (
                                <div
                                  className="mt-2 sm:mt-3 p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 cursor-pointer hover:bg-red-500/15 transition-colors"
                                  onClick={() =>
                                    toggleReasonExpanded(
                                      appointment.id,
                                      "rejection",
                                    )
                                  }
                                >
                                  <p
                                    className={`text-xs sm:text-sm text-red-400 ${
                                      !expandedReasons[
                                        `${appointment.id}-rejection`
                                      ]
                                        ? "line-clamp-2"
                                        : ""
                                    }`}
                                  >
                                    <span className="font-medium">
                                      Rejection Reason:{" "}
                                    </span>
                                    {appointment.rejection_reason}
                                  </p>
                                  {appointment.rejection_reason.length > 80 && (
                                    <span className="text-[10px] sm:text-xs text-red-400/70 mt-1 block">
                                      {expandedReasons[
                                        `${appointment.id}-rejection`
                                      ]
                                        ? "Click to collapse"
                                        : "Click to expand"}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2">
                            {canCancel(appointment.status) && (
                              <button
                                onClick={() =>
                                  handleCancelAppointment(appointment.id)
                                }
                                disabled={cancellingId === appointment.id}
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
                              >
                                <FiXCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {cancellingId === appointment.id
                                  ? "Cancelling..."
                                  : "Cancel"}
                              </button>
                            )}
                            {appointment.consultation_status ===
                              "completed" && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/patient/records/${appointment.id}`,
                                  )
                                }
                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"
                              >
                                <FiEye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
