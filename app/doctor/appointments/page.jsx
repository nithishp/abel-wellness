"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUser,
  FiPhone,
  FiMail,
  FiSearch,
  FiFilter,
  FiCheck,
  FiPlay,
  FiEye,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";

const DoctorAppointmentsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, isDoctor } = useRoleAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

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

    fetchAppointments();
  }, [user, authLoading, router]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/doctor/appointments");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      } else {
        toast.error("Failed to load appointments");
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, consultationStatus) => {
    if (consultationStatus === "completed") {
      return (
        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          Completed
        </span>
      );
    }
    if (consultationStatus === "in_progress") {
      return (
        <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
          In Progress
        </span>
      );
    }
    if (status === "approved") {
      return (
        <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
          Pending Consultation
        </span>
      );
    }
    return (
      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredAppointments = appointments.filter((apt) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = apt.name?.toLowerCase().includes(query);
      const matchesEmail = apt.email?.toLowerCase().includes(query);
      const matchesPhone = apt.phone?.includes(query);
      if (!matchesName && !matchesEmail && !matchesPhone) {
        return false;
      }
    }

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
  });

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
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
              <button
                onClick={() => router.push("/doctor/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  My Appointments
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your patient consultations
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters"
                : "You have no assigned appointments yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.name}
                      </h3>
                      {getStatusBadge(
                        appointment.status,
                        appointment.consultation_status
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar className="w-4 h-4" />
                        <span>{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiClock className="w-4 h-4" />
                        <span>{appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiPhone className="w-4 h-4" />
                        <span>{appointment.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMail className="w-4 h-4" />
                        <span className="truncate">{appointment.email}</span>
                      </div>
                    </div>

                    {appointment.reason_for_visit && (
                      <p className="mt-3 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        <strong>Reason:</strong> {appointment.reason_for_visit}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {appointment.consultation_status === "completed" ? (
                      <button
                        onClick={() =>
                          router.push(`/doctor/consultation/${appointment.id}`)
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        View Record
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          router.push(`/doctor/consultation/${appointment.id}`)
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {appointment.consultation_status === "in_progress" ? (
                          <>
                            <FiPlay className="w-4 h-4" />
                            Continue
                          </>
                        ) : (
                          <>
                            <FiPlay className="w-4 h-4" />
                            Start Consultation
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {appointments.length}
              </p>
              <p className="text-sm text-gray-500">Total Assigned</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {
                  appointments.filter(
                    (a) => a.consultation_status === "pending"
                  ).length
                }
              </p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {
                  appointments.filter(
                    (a) => a.consultation_status === "in_progress"
                  ).length
                }
              </p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {
                  appointments.filter(
                    (a) => a.consultation_status === "completed"
                  ).length
                }
              </p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorAppointmentsPage;
