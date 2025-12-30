"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PatientSidebar from "../components/PatientSidebar";
import {
  FiCalendar,
  FiClock,
  FiPackage,
  FiFileText,
  FiPlus,
  FiArrowRight,
  FiArrowUpRight,
  FiRefreshCw,
} from "react-icons/fi";
import { toast } from "sonner";
import AppointmentModal from "@/app/components/ui/AppointmentModal";
import { formatAppointmentDateTime } from "@/lib/utils";

const PatientDashboardPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedConsultations: 0,
    activePrescriptions: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

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

    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/patient/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUpcomingAppointments(data.upcomingAppointments || []);
        setRecentPrescriptions(data.recentPrescriptions || []);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  const formatDate = (dateString, timeString) => {
    return formatAppointmentDateTime(dateString, timeString).date;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
      },
      approved: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-400",
      },
      completed: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
      },
      rejected: {
        bg: "bg-red-500/10",
        text: "text-red-400",
        dot: "bg-red-400",
      },
    };
    return configs[status] || configs.pending;
  };

  const handleAppointmentSuccess = () => {
    fetchDashboardData();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-800/50 rounded-xl"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
        <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
      </div>
    </div>
  );

  const statCards = [
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      subtitle: "All time bookings",
      icon: FiCalendar,
      gradient: "from-blue-500 to-indigo-600",
      bgGlow: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
    },
    {
      title: "Upcoming",
      value: stats.upcomingAppointments,
      subtitle: "Scheduled visits",
      icon: FiClock,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
      iconBg: "bg-amber-500/20",
      alert: stats.upcomingAppointments > 0,
    },
    {
      title: "Consultations",
      value: stats.completedConsultations,
      subtitle: "Completed visits",
      icon: FiFileText,
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: "Prescriptions",
      value: stats.activePrescriptions,
      subtitle: "Active medications",
      icon: FiPackage,
      gradient: "from-violet-500 to-purple-600",
      bgGlow: "bg-violet-500/10",
      iconBg: "bg-violet-500/20",
    },
  ];

  const quickActions = [
    {
      title: "Book Appointment",
      description: "Schedule a new visit",
      icon: FiPlus,
      action: () => setShowAppointmentModal(true),
      gradient: "from-emerald-500 to-teal-600",
      hoverGlow: "hover:shadow-emerald-500/25",
    },
    {
      title: "My Appointments",
      description: "View all appointments",
      icon: FiCalendar,
      href: "/patient/appointments",
      gradient: "from-blue-500 to-indigo-600",
      hoverGlow: "hover:shadow-blue-500/25",
    },
    {
      title: "My Prescriptions",
      description: "View medications",
      icon: FiPackage,
      href: "/patient/prescriptions",
      gradient: "from-violet-500 to-purple-600",
      hoverGlow: "hover:shadow-violet-500/25",
    },
    {
      title: "Medical Records",
      description: "Consultation history",
      icon: FiFileText,
      href: "/patient/records",
      gradient: "from-pink-500 to-rose-600",
      hoverGlow: "hover:shadow-pink-500/25",
    },
  ];

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
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Welcome back, {user?.full_name || "Patient"}
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
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                  <div
                    key={index}
                    className={`relative group rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6 overflow-hidden transition-all duration-300 hover:border-slate-600/50 hover:shadow-xl ${stat.bgGlow}`}
                  >
                    {/* Background Glow Effect */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />

                    {/* Alert Indicator */}
                    {stat.alert && (
                      <div className="absolute top-4 right-4">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      </div>
                    )}

                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4`}
                      >
                        <stat.icon
                          className={`w-6 h-6 bg-gradient-to-r ${stat.gradient} bg-clip-text`}
                          style={{ color: `var(--tw-gradient-from)` }}
                        />
                      </div>
                      <p className="text-slate-400 text-sm font-medium mb-1">
                        {stat.title}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-white">
                          {stat.value}
                        </span>
                      </div>
                      <p className="text-slate-500 text-sm mt-1">
                        {stat.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Quick Actions
                    </h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Frequently used features
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        action.action
                          ? action.action()
                          : router.push(action.href)
                      }
                      className={`group relative rounded-2xl bg-gradient-to-br ${action.gradient} p-6 text-left transition-all duration-300 hover:shadow-2xl ${action.hoverGlow} hover:-translate-y-1`}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {action.title}
                        </h3>
                        <p className="text-white/70 text-sm">
                          {action.description}
                        </p>
                        <div className="mt-4 flex items-center text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                          <span>Get started</span>
                          <FiArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Appointments */}
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
                  <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Upcoming Appointments
                      </h2>
                      <p className="text-slate-400 text-sm mt-0.5">
                        Your scheduled visits
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/patient/appointments")}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      View all
                      <FiArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6">
                    {upcomingAppointments.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                          <FiCalendar className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-medium">
                          No upcoming appointments
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                          Book an appointment to get started
                        </p>
                        <button
                          onClick={() => setShowAppointmentModal(true)}
                          className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Book Now
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingAppointments.slice(0, 4).map((appointment) => {
                          const statusConfig = getStatusConfig(
                            appointment.status
                          );
                          const formattedDateTime = formatAppointmentDateTime(
                            appointment.date,
                            appointment.time
                          );
                          return (
                            <div
                              key={appointment.id}
                              className="group flex items-start gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-600/50"
                            >
                              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                                <FiCalendar className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                  {formattedDateTime.date}
                                </p>
                                <p className="text-slate-400 text-sm truncate mt-0.5">
                                  {appointment.doctor_name
                                    ? `Dr. ${appointment.doctor_name}`
                                    : "Doctor to be assigned"}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                    ></span>
                                    {appointment.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      appointment.status.slice(1)}
                                  </span>
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <FiClock className="w-3 h-3" />
                                    {formattedDateTime.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Prescriptions */}
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
                  <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Recent Prescriptions
                      </h2>
                      <p className="text-slate-400 text-sm mt-0.5">
                        Your medications
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/patient/prescriptions")}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      View all
                      <FiArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-6">
                    {recentPrescriptions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                          <FiPackage className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-slate-400 font-medium">
                          No prescriptions yet
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                          Prescriptions will appear after consultations
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentPrescriptions.slice(0, 4).map((prescription) => {
                          const isDispensed =
                            prescription.status === "dispensed";
                          return (
                            <div
                              key={prescription.id}
                              onClick={() =>
                                router.push("/patient/prescriptions")
                              }
                              className="group flex items-start gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-600/50"
                            >
                              <div
                                className={`p-3 rounded-xl ${
                                  isDispensed
                                    ? "bg-emerald-500/20 text-emerald-400"
                                    : "bg-amber-500/20 text-amber-400"
                                } flex-shrink-0`}
                              >
                                <FiPackage className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">
                                  {formatDate(prescription.created_at)}
                                </p>
                                <p className="text-slate-400 text-sm truncate mt-0.5">
                                  Dr. {prescription.doctor_name}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                                      isDispensed
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : "bg-amber-500/10 text-amber-400"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isDispensed
                                          ? "bg-emerald-400"
                                          : "bg-amber-400"
                                      }`}
                                    ></span>
                                    {isDispensed ? "Dispensed" : "Pending"}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {prescription.items?.length || 0} items
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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

export default PatientDashboardPage;
