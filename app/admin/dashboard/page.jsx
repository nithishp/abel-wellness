"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  adminLogout,
  getCurrentAdmin,
  checkExistingSession,
} from "@/lib/actions/admin.actions";
import {
  FiUser,
  FiFileText,
  FiCalendar,
  FiLogOut,
  FiSettings,
  FiPlus,
  FiEye,
  FiEdit,
} from "react-icons/fi";
import { toast } from "sonner";

const AdminDashboard = () => {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
  });

  useEffect(() => {
    checkAuthentication();
    fetchStats();
  }, []);

  const checkAuthentication = async () => {
    try {
      const currentAdmin = await checkExistingSession();
      if (currentAdmin) {
        setAdmin(currentAdmin);
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch blog stats
      console.log("Fetching blog stats...");
      const blogsResponse = await fetch("/api/admin/blogs?limit=100");
      console.log("Blogs response status:", blogsResponse.status);
      const blogsData = await blogsResponse.json();
      console.log("Blogs data:", blogsData);

      if (blogsData.documents) {
        const publishedCount = blogsData.documents.filter(
          (blog) => blog.published
        ).length;
        console.log(
          "Total blogs:",
          blogsData.documents.length,
          "Published:",
          publishedCount
        );
        setStats((prev) => ({
          ...prev,
          totalBlogs: blogsData.documents.length,
          publishedBlogs: publishedCount,
        }));
      } else {
        console.log("No documents found in blogs response");
      }

      // Fetch appointment stats
      console.log("Fetching appointment stats...");
      const appointmentsResponse = await fetch(
        "/api/admin/appointments?limit=100"
      );
      console.log("Appointments response status:", appointmentsResponse.status);
      const appointmentsData = await appointmentsResponse.json();
      console.log("Appointments data:", appointmentsData);

      if (appointmentsData.success) {
        const pendingCount = appointmentsData.appointments.filter(
          (apt) => apt.status === "pending"
        ).length;
        console.log(
          "Total appointments:",
          appointmentsData.appointments.length,
          "Pending:",
          pendingCount
        );
        setStats((prev) => ({
          ...prev,
          totalAppointments: appointmentsData.appointments.length,
          pendingAppointments: pendingCount,
        }));
      } else {
        console.log("Appointments response not successful");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      toast.success("Logged out successfully");
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Create New Blog",
      description: "Write and publish a new blog post",
      icon: FiPlus,
      href: "/admin/blogs/create",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Manage Blogs",
      description: "Edit, delete, and manage blog posts",
      icon: FiEdit,
      href: "/admin/blogs",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "View Appointments",
      description: "Manage patient appointments",
      icon: FiCalendar,
      href: "/admin/appointments",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Settings",
      description: "Configure admin settings",
      icon: FiSettings,
      href: "/admin/settings",
      color: "bg-gray-500 hover:bg-gray-600",
    },
  ];

  const statCards = [
    {
      title: "Total Blogs",
      value: stats.totalBlogs,
      subtitle: `${stats.publishedBlogs} published`,
      icon: FiFileText,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Total Appointments",
      value: stats.totalAppointments,
      subtitle: `${stats.pendingAppointments} pending`,
      icon: FiCalendar,
      color: "text-green-600 bg-green-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {admin?.name || admin?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => router.push(action.href)}
                className={`${action.color} text-white rounded-lg p-6 text-left transition-colors hover:shadow-lg`}
              >
                <action.icon className="w-8 h-8 mb-3" />
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <FiEye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Recent activity will appear here</p>
              <p className="text-sm text-gray-400 mt-1">
                Blog posts, appointments, and other admin actions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
