"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import DoctorSidebar from "../components/DoctorSidebar";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiPhone,
  FiMail,
  FiSearch,
  FiFilter,
  FiPlay,
  FiEye,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatAppointmentDateTime } from "@/lib/utils";

const DoctorAppointmentsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, isDoctor } = useRoleAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "doctor") {
      toast.error("Access denied. Doctor account required.");
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  const fetchAppointments = useCallback(
    async (page, limit) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      const response = await fetch(`/api/doctor/appointments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      return {
        items: data.appointments || [],
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [debouncedSearch]
  );

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
    enabled: !!user && user.role === "doctor" && !authLoading,
    dependencies: [debouncedSearch],
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await reset();
    setRefreshing(false);
    toast.success("Appointments refreshed!");
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
    if (consultationStatus === "in_progress") {
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-400",
        label: "In Progress",
      };
    }
    if (status === "approved") {
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
        label: "Pending Consultation",
      };
    }
    return {
      bg: "bg-slate-500/10",
      text: "text-slate-400",
      dot: "bg-slate-400",
      label: status,
    };
  };

  const formatDate = (dateString, timeString) => {
    return formatAppointmentDateTime(dateString, timeString).date;
  };

  const sortedAppointments = useMemo(() => {
    return appointments
      .filter((apt) => {
        // Status filter
        if (statusFilter !== "all") {
          if (statusFilter === "completed") {
            if (apt.consultation_status !== "completed") return false;
          } else if (statusFilter === "pending") {
            if (apt.consultation_status !== "pending") return false;
          } else if (statusFilter === "in_progress") {
            if (apt.consultation_status !== "in_progress") return false;
          }
        }

        // Date filter
        if (dateFilter !== "all") {
          const aptDate = new Date(apt.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (dateFilter === "today") {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (aptDate < today || aptDate >= tomorrow) return false;
          } else if (dateFilter === "upcoming") {
            if (aptDate < today) return false;
          } else if (dateFilter === "past") {
            if (aptDate >= today) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "date":
            comparison = new Date(a.date) - new Date(b.date);
            break;
          case "name":
            comparison = (a.name || "").localeCompare(b.name || "");
            break;
          case "status":
            comparison = (a.consultation_status || "").localeCompare(
              b.consultation_status || ""
            );
            break;
          default:
            comparison = 0;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [appointments, statusFilter, dateFilter, sortBy, sortOrder]);

  // Calculate appointment counts
  const appointmentCounts = {
    total: appointments.length,
    pending: appointments.filter((apt) => apt.consultation_status === "pending")
      .length,
    inProgress: appointments.filter(
      (apt) => apt.consultation_status === "in_progress"
    ).length,
    completed: appointments.filter(
      (apt) => apt.consultation_status === "completed"
    ).length,
    today: appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return aptDate >= today && aptDate < tomorrow;
    }).length,
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
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-slate-800/50 rounded-xl"></div>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <DoctorSidebar />

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
                  Manage your patient consultations{" "}
                  {totalCount > 0 && (
                    <span className="text-slate-500">
                      ({sortedAppointments.length} of {totalCount} loaded)
                    </span>
                  )}
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
          ) : (
            <>
              {/* Filters */}
              <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <FiFilter className="text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="past">Past</option>
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="name">Sort by Name</option>
                      <option value="status">Sort by Status</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-600/50 transition-colors"
                      title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortOrder === "asc" ? (
                        <FiArrowUp className="w-5 h-5 text-blue-400" />
                      ) : (
                        <FiArrowDown className="w-5 h-5 text-blue-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Appointment Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                      <FiCalendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {appointmentCounts.total}
                      </p>
                      <p className="text-xs text-slate-400">Total</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 hover:border-slate-600/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <FiClock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {appointmentCounts.today}
                      </p>
                      <p className="text-xs text-slate-400">Today</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                      <FiClock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {appointmentCounts.pending}
                      </p>
                      <p className="text-xs text-slate-400">Pending</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 hover:border-blue-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                      <FiPlay className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {appointmentCounts.inProgress}
                      </p>
                      <p className="text-xs text-slate-400">In Progress</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                      <FiCalendar className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {appointmentCounts.completed}
                      </p>
                      <p className="text-xs text-slate-400">Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointments List */}
              {sortedAppointments.length === 0 && !loading ? (
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                    <FiCalendar className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    No appointments found
                  </h3>
                  <p className="text-slate-400">
                    {debouncedSearch ||
                    statusFilter !== "all" ||
                    dateFilter !== "all"
                      ? "Try adjusting your filters"
                      : "You have no assigned appointments yet"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {sortedAppointments.map((appointment, index) => {
                      const statusConfig = getStatusConfig(
                        appointment.status,
                        appointment.consultation_status
                      );
                      return (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="group rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                                  <FiUser className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">
                                  {appointment.name}
                                </h3>
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                  ></span>
                                  {statusConfig.label}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <FiCalendar className="w-4 h-4" />
                                  <span>
                                    {formatDate(
                                      appointment.date,
                                      appointment.time
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <FiClock className="w-4 h-4" />
                                  <span>
                                    {
                                      formatAppointmentDateTime(
                                        appointment.date,
                                        appointment.time
                                      ).time
                                    }
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <FiPhone className="w-4 h-4" />
                                  <span>{appointment.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <FiMail className="w-4 h-4" />
                                  <span className="truncate">
                                    {appointment.email}
                                  </span>
                                </div>
                              </div>

                              {appointment.reason_for_visit && (
                                <p className="mt-3 text-sm text-slate-400 bg-slate-700/30 px-4 py-2 rounded-lg border border-slate-600/30">
                                  <strong className="text-slate-300">
                                    Reason:
                                  </strong>{" "}
                                  {appointment.reason_for_visit}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {appointment.consultation_status ===
                              "completed" ? (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/doctor/consultation/${appointment.id}`
                                    )
                                  }
                                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                                >
                                  <FiEye className="w-4 h-4" />
                                  View Record
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/doctor/consultation/${appointment.id}`
                                    )
                                  }
                                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
                                >
                                  <FiPlay className="w-4 h-4" />
                                  {appointment.consultation_status ===
                                  "in_progress"
                                    ? "Continue"
                                    : "Start Consultation"}
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <InfiniteScrollLoader
                    sentinelRef={sentinelRef}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    error={error}
                    onRetry={reset}
                    itemsLoaded={sortedAppointments.length}
                    totalItems={totalCount}
                  />
                </>
              )}

              {/* Stats Summary */}
              <div className="mt-8 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                    <p className="text-2xl font-bold text-white">
                      {appointments.length}
                    </p>
                    <p className="text-sm text-slate-400">Total Assigned</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-2xl font-bold text-amber-400">
                      {
                        appointments.filter(
                          (a) => a.consultation_status === "pending"
                        ).length
                      }
                    </p>
                    <p className="text-sm text-slate-400">Pending</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-400">
                      {
                        appointments.filter(
                          (a) => a.consultation_status === "in_progress"
                        ).length
                      }
                    </p>
                    <p className="text-sm text-slate-400">In Progress</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-2xl font-bold text-emerald-400">
                      {
                        appointments.filter(
                          (a) => a.consultation_status === "completed"
                        ).length
                      }
                    </p>
                    <p className="text-sm text-slate-400">Completed</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DoctorAppointmentsPage;
