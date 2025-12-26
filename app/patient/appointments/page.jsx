"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUser,
  FiMapPin,
  FiSearch,
  FiFilter,
  FiPlus,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";
import AppointmentModal from "@/app/components/ui/AppointmentModal";

const PatientAppointmentsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, isPatient } = useRoleAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
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

    fetchAppointments();
  }, [user, authLoading, router]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/patient/appointments");
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status, consultationStatus) => {
    if (consultationStatus === "completed") {
      return (
        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
          Completed
        </span>
      );
    }

    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-blue-100 text-blue-700",
      rejected: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-medium rounded-full ${
          styles[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "completed")
      return apt.consultation_status === "completed";
    return apt.status === statusFilter;
  });

  const handleAppointmentSuccess = (newAppointment) => {
    // Refresh the appointments list
    fetchAppointments();
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push("/patient/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                My Appointments
              </h1>
              <p className="text-sm text-gray-500">
                View all your appointments
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Book Appointment Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Your Appointments
            </h2>
            <p className="text-sm text-gray-500">
              Manage your healthcare appointments
            </p>
          </div>
          <button
            onClick={() => setShowAppointmentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Book Appointment
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            <FiFilter className="text-gray-400 flex-shrink-0" />
            {["all", "pending", "approved", "completed", "rejected"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <FiCalendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-500 mb-4">
              {statusFilter !== "all"
                ? "Try changing the filter"
                : "You haven't booked any appointments yet"}
            </p>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Book an Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <FiCalendar className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {formatDate(appointment.date)}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {appointment.time}
                        </p>
                      </div>
                      {getStatusBadge(
                        appointment.status,
                        appointment.consultation_status
                      )}
                    </div>

                    {appointment.doctor_name && (
                      <p className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <FiUser className="w-4 h-4" />
                        Dr. {appointment.doctor_name}
                      </p>
                    )}

                    {appointment.reason_for_visit && (
                      <div className="bg-gray-50 p-3 rounded-lg mt-3">
                        <p className="text-sm text-gray-600">
                          <strong>Reason:</strong>{" "}
                          {appointment.reason_for_visit}
                        </p>
                      </div>
                    )}

                    {appointment.rejection_reason && (
                      <div className="bg-red-50 p-3 rounded-lg mt-3">
                        <p className="text-sm text-red-700">
                          <strong>Rejection Reason:</strong>{" "}
                          {appointment.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {appointment.consultation_status === "completed" && (
                    <button
                      onClick={() =>
                        router.push(`/patient/records/${appointment.id}`)
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      View Record
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
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

export default PatientAppointmentsPage;
