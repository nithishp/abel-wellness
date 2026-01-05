"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import {
  FiFileText,
  FiCalendar,
  FiPlus,
  FiEye,
  FiEdit,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowUpRight,
  FiArrowRight,
  FiActivity,
  FiRefreshCw,
} from "react-icons/fi";
import { toast } from "sonner";

const AdminDashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedAppointments: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "admin") {
      toast.error("Access denied. Admin account required.");
      router.push("/");
      return;
    }

    fetchStats();
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const blogsResponse = await fetch("/api/admin/blogs?limit=100");
      const blogsData = await blogsResponse.json();

      if (blogsData.documents && Array.isArray(blogsData.documents)) {
        const publishedCount = blogsData.documents.filter(
          (blog) => blog.published
        ).length;
        setStats((prev) => ({
          ...prev,
          totalBlogs: blogsData.documents.length || 0,
          publishedBlogs: publishedCount || 0,
        }));
      }

      const appointmentsResponse = await fetch(
        "/api/admin/appointments?limit=100"
      );
      const appointmentsData = await appointmentsResponse.json();

      if (
        appointmentsData.success &&
        Array.isArray(appointmentsData.appointments)
      ) {
        const appointments = appointmentsData.appointments;
        setStats((prev) => ({
          ...prev,
          totalAppointments: appointments.length || 0,
          pendingAppointments: appointments.filter(
            (a) => a.status === "pending"
          ).length,
          confirmedAppointments: appointments.filter(
            (a) => a.status === "confirmed"
          ).length,
          completedAppointments: appointments.filter(
            (a) => a.status === "completed"
          ).length,
        }));
      }

      await fetchRecentActivity(
        blogsData.documents || [],
        appointmentsData.appointments || []
      );
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  const fetchRecentActivity = async (blogs, appointments) => {
    try {
      const recentBlogs = blogs
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 3)
        .map((blog) => ({
          id: blog.$id,
          type: "blog",
          title: `Blog "${blog.title}" ${
            blog.published ? "published" : "created"
          }`,
          description: blog.description?.substring(0, 100) + "...",
          timestamp: blog.$createdAt,
          status: blog.published ? "published" : "draft",
          href: `/admin/blogs/edit/${blog.$id}`,
        }));

      const recentAppointments = appointments
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 3)
        .map((appointment) => {
          const appointmentDate = appointment.date
            ? new Date(appointment.date).toLocaleDateString()
            : "No date";
          const doctorName =
            appointment.doctor?.user?.full_name || "Not assigned";
          return {
            id: appointment.$id,
            type: "appointment",
            title: `Appointment from ${appointment.name || "Unknown"}`,
            description: `${
              appointment.service || "General Consultation"
            } - ${appointmentDate} (Dr. ${doctorName})`,
            timestamp: appointment.$createdAt,
            status: appointment.status || "pending",
            href: "/admin/appointments",
          };
        });

      const allActivities = [...recentBlogs, ...recentAppointments]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 6);

      setRecentActivity(allActivities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

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

  // Content loading skeleton
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
      <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
    </div>
  );

  const statCards = [
    {
      title: "Total Blogs",
      value: stats.totalBlogs,
      subtitle: `${stats.publishedBlogs} published`,
      icon: FiFileText,
      gradient: "from-blue-500 to-indigo-600",
      bgGlow: "bg-blue-500/10",
      iconBg: "bg-blue-500/20",
      trend: stats.publishedBlogs > 0 ? "+12%" : null,
      trendUp: true,
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      subtitle: `${stats.pendingAppointments} pending`,
      icon: FiCalendar,
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/20",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Confirmed",
      value: stats.confirmedAppointments,
      subtitle: "Ready for consultation",
      icon: FiCheckCircle,
      gradient: "from-violet-500 to-purple-600",
      bgGlow: "bg-violet-500/10",
      iconBg: "bg-violet-500/20",
      trend: null,
    },
    {
      title: "Pending Review",
      value: stats.pendingAppointments,
      subtitle: "Awaiting action",
      icon: FiClock,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
      iconBg: "bg-amber-500/20",
      alert: stats.pendingAppointments > 5,
    },
  ];

  const quickActions = [
    {
      title: "Create Blog Post",
      description: "Write and publish new content",
      icon: FiPlus,
      href: "/admin/blogs/create",
      gradient: "from-blue-500 to-indigo-600",
      hoverGlow: "hover:shadow-blue-500/25",
    },
    {
      title: "Manage Blogs",
      description: "Edit or delete blog posts",
      icon: FiEdit,
      href: "/admin/blogs",
      gradient: "from-emerald-500 to-teal-600",
      hoverGlow: "hover:shadow-emerald-500/25",
    },
    {
      title: "View Appointments",
      description: "Review patient bookings",
      icon: FiCalendar,
      href: "/admin/appointments",
      gradient: "from-violet-500 to-purple-600",
      hoverGlow: "hover:shadow-violet-500/25",
    },
    {
      title: "Manage Staff",
      description: "Add doctors & pharmacists",
      icon: FiUsers,
      href: "/admin/users",
      gradient: "from-amber-500 to-orange-600",
      hoverGlow: "hover:shadow-amber-500/25",
    },
  ];

  const getStatusConfig = (status) => {
    const configs = {
      published: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
      },
      draft: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
      },
      pending: {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        dot: "bg-orange-400",
      },
      confirmed: {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        dot: "bg-blue-400",
      },
      completed: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
      },
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Dashboard
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Welcome back, {user?.name || user?.email?.split("@")[0]}
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
          {statsLoading ? (
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
                          {statsLoading ? (
                            <span className="inline-block w-12 h-8 bg-slate-700 rounded animate-pulse"></span>
                          ) : (
                            stat.value
                          )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Recent Activity */}
              <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Recent Activity
                    </h2>
                    <p className="text-slate-400 text-sm mt-0.5">
                      Latest updates from your platform
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/admin/appointments")}
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    View all
                    <FiArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-6">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                        <FiActivity className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-400 font-medium">
                        No recent activity
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        Recent blog posts and appointments will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity) => {
                        const statusConfig = getStatusConfig(activity.status);
                        return (
                          <div
                            key={`${activity.type}-${activity.id}`}
                            onClick={() => router.push(activity.href)}
                            className="group flex items-start gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-600/50"
                          >
                            <div
                              className={`p-3 rounded-xl flex-shrink-0 ${
                                activity.type === "blog"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-emerald-500/20 text-emerald-400"
                              }`}
                            >
                              {activity.type === "blog" ? (
                                <FiFileText className="w-5 h-5" />
                              ) : (
                                <FiCalendar className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                                {activity.title}
                              </p>
                              <p className="text-slate-400 text-sm truncate mt-0.5">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                  ></span>
                                  {activity.status}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(activity.timestamp).toLocaleString(
                                    [],
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                            <FiArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
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

export default AdminDashboard;
