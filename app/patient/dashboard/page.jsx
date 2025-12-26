"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiCalendar,
  FiClock,
  FiPackage,
  FiFileText,
  FiLogOut,
  FiUser,
  FiBell,
  FiPlus,
  FiChevronRight,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppointmentModal from "@/app/components/ui/AppointmentModal";

const PatientDashboardPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading, isPatient } = useRoleAuth();

  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedConsultations: 0,
    activePrescriptions: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If no user after loading completes, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has patient role
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

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleAppointmentSuccess = () => {
    // Refresh dashboard data to show new appointment
    fetchDashboardData();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <FiUser className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  My Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalAppointments}
                </p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <FiCalendar className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.upcomingAppointments}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FiClock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Consultations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.completedConsultations}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.activePrescriptions}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FiPackage className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors text-left"
            >
              <FiPlus className="w-8 h-8 text-emerald-600 mb-2" />
              <p className="font-medium text-gray-900">Book Appointment</p>
              <p className="text-sm text-gray-500">Schedule a new visit</p>
            </button>
            <button
              onClick={() => router.push("/patient/appointments")}
              className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <FiCalendar className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">My Appointments</p>
              <p className="text-sm text-gray-500">View all appointments</p>
            </button>
            <button
              onClick={() => router.push("/patient/prescriptions")}
              className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <FiPackage className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">My Prescriptions</p>
              <p className="text-sm text-gray-500">View all prescriptions</p>
            </button>
            <button
              onClick={() => router.push("/patient/records")}
              className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <FiFileText className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-gray-900">Medical Records</p>
              <p className="text-sm text-gray-500">View consultation history</p>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Appointments
                </h2>
                <p className="text-sm text-gray-500">Your scheduled visits</p>
              </div>
              <button
                onClick={() => router.push("/patient/appointments")}
                className="text-emerald-600 text-sm hover:underline flex items-center gap-1"
              >
                View All
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming appointments</p>
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="mt-4 text-emerald-600 hover:underline text-sm"
                >
                  Book an appointment
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {formatDate(appointment.date)}
                          </span>
                          <FiClock className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="text-gray-600">
                            {appointment.time}
                          </span>
                        </div>
                        {appointment.doctor_name && (
                          <p className="text-sm text-gray-500">
                            with Dr. {appointment.doctor_name}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Prescriptions */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Prescriptions
                </h2>
                <p className="text-sm text-gray-500">Your medications</p>
              </div>
              <button
                onClick={() => router.push("/patient/prescriptions")}
                className="text-emerald-600 text-sm hover:underline flex items-center gap-1"
              >
                View All
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>

            {recentPrescriptions.length === 0 ? (
              <div className="p-8 text-center">
                <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No prescriptions yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(prescription.created_at)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          prescription.status === "dispensed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {prescription.status === "dispensed"
                          ? "Dispensed"
                          : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {prescription.items
                        ?.slice(0, 2)
                        .map((item) => item.medication_name)
                        .join(", ")}
                      {prescription.items?.length > 2 &&
                        ` +${prescription.items.length - 2} more`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      by Dr. {prescription.doctor_name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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
