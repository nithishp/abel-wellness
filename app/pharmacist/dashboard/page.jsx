"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PharmacistSidebar from "../components/PharmacistSidebar";
import {
  FiPackage,
  FiClock,
  FiCheck,
  FiRefreshCw,
  FiUser,
  FiArrowRight,
  FiArrowUpRight,
  FiTrendingUp,
} from "react-icons/fi";
import { toast } from "sonner";

const PharmacistDashboardPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading, isPharmacist } = useRoleAuth();

  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    dispensedToday: 0,
    totalDispensed: 0,
  });
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "pharmacist") {
      toast.error("Access denied. Pharmacist account required.");
      router.push("/");
      return;
    }

    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/pharmacist/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setPrescriptions(data.pendingPrescriptions || []);
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

  const handleDispense = async (prescriptionId) => {
    try {
      const response = await fetch(
        `/api/pharmacist/prescriptions/${prescriptionId}/dispense`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Prescription marked as dispensed");
        fetchDashboardData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to dispense prescription");
      }
    } catch (error) {
      console.error("Error dispensing prescription:", error);
      toast.error("Failed to dispense prescription");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Only show full-page loading for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
        ))}
      </div>
      <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
    </div>
  );

  const statCards = [
    {
      title: "Pending Prescriptions",
      value: stats.pendingPrescriptions,
      subtitle: "Awaiting dispensing",
      icon: FiClock,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
      iconBg: "bg-amber-500/20",
      alert: stats.pendingPrescriptions > 5,
    },
    {
      title: "Dispensed Today",
      value: stats.dispensedToday,
      subtitle: "Completed today",
      icon: FiCheck,
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
    },
    {
      title: "Total Dispensed",
      value: stats.totalDispensed,
      subtitle: "All time",
      icon: FiPackage,
      gradient: "from-purple-500 to-violet-600",
      bgGlow: "bg-purple-500/10",
      iconBg: "bg-purple-500/20",
    },
  ];

  const quickActions = [
    {
      title: "All Prescriptions",
      description: "View and manage all prescriptions",
      icon: FiPackage,
      href: "/pharmacist/prescriptions",
      gradient: "from-purple-500 to-violet-600",
      hoverGlow: "hover:shadow-purple-500/25",
    },
  ];

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
      },
      dispensed: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
      },
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PharmacistSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Welcome back, {user?.full_name || "Pharmacist"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </span>
                      </div>
                    )}

                    <div className="relative">
                      <div
                        className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center mb-4`}
                      >
                        <stat.icon
                          className={`w-6 h-6 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
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
                        {stat.trend && (
                          <span
                            className={`text-sm font-medium flex items-center ${
                              stat.trendUp ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            <FiTrendingUp
                              className={`w-3 h-3 mr-0.5 ${
                                !stat.trendUp && "rotate-180"
                              }`}
                            />
                            {stat.trend}
                          </span>
                        )}
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
                      Frequently used tasks
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => router.push(action.href)}
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

              {/* Pending Prescriptions */}
              <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Pending Prescriptions
                    </h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Prescriptions awaiting dispensing
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/pharmacist/prescriptions")}
                    className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    View all
                    <FiArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6">
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                        <FiPackage className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-400 font-medium">
                        No pending prescriptions
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        All prescriptions have been dispensed
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.slice(0, 5).map((prescription) => {
                        const statusConfig = getStatusConfig(
                          prescription.status || "pending"
                        );
                        return (
                          <div
                            key={prescription.id}
                            onClick={() =>
                              router.push(
                                `/pharmacist/prescriptions/${prescription.id}`
                              )
                            }
                            className="group flex items-start gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-600/50"
                          >
                            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 flex-shrink-0">
                              <FiUser className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate group-hover:text-purple-400 transition-colors">
                                {prescription.patient_name}
                              </p>
                              <p className="text-slate-400 text-sm truncate mt-0.5">
                                Dr. {prescription.doctor_name}
                              </p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                  ></span>
                                  {prescription.status || "pending"}
                                </span>
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <FiClock className="w-3 h-3" />
                                  {formatDate(prescription.created_at)}
                                </span>
                                {prescription.items && (
                                  <span className="text-xs text-slate-500">
                                    {prescription.items.length} medication(s)
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDispense(prescription.id);
                              }}
                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <FiCheck className="w-4 h-4" />
                              Dispense
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PharmacistDashboardPage;
