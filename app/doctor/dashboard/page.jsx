"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiLogOut,
  FiUser,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const DoctorDashboard = () => {
  const router = useRouter();
  const { user, loading: authLoading, logout, isDoctor } = useRoleAuth();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingConsultations: 0,
    completedToday: 0,
    totalPatients: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If no user after loading completes, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has doctor role
    if (user.role !== "doctor") {
      toast.error("Access denied. Doctor account required.");
      router.push("/");
      return;
    }

    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/doctor/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUpcomingAppointments(data.upcomingAppointments || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Welcome, Dr. {user?.name || "Doctor"}
                </h1>
                <p className="text-sm text-gray-500">
                  {user?.roleData?.specialization || "General Practice"}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Appointments</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.todayAppointments}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiCalendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Consultations</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pendingConsultations}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiAlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.completedToday}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalPatients}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/doctor/appointments"
                className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border hover:border-blue-300 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiCalendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">My Appointments</p>
                  <p className="text-sm text-gray-500">
                    View assigned appointments
                  </p>
                </div>
              </Link>

              <Link
                href="/doctor/patients"
                className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border hover:border-blue-300 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">My Patients</p>
                  <p className="text-sm text-gray-500">View patient records</p>
                </div>
              </Link>

              <Link
                href="/doctor/prescriptions"
                className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border hover:border-blue-300 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Prescriptions</p>
                  <p className="text-sm text-gray-500">
                    View issued prescriptions
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Upcoming Appointments
              </h2>
              <Link
                href="/doctor/appointments"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white rounded-xl shadow-sm border p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <FiUser className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {appointment.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiCalendar className="w-4 h-4" />
                              {new Date(appointment.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiClock className="w-4 h-4" />
                              {new Date(appointment.date).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                          {appointment.reason_for_visit && (
                            <p className="text-sm text-gray-600 mt-1">
                              {appointment.reason_for_visit}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/doctor/consultation/${appointment.id}`}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Consultation
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
