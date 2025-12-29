"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiPhone,
  FiMail,
  FiSearch,
  FiFilter,
  FiCheck,
  FiX,
  FiEye,
  FiPlus,
  FiUserCheck,
  FiMessageSquare,
} from "react-icons/fi";
import { toast } from "sonner";

const AppointmentsManagement = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningAppointment, setAssigningAppointment] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [processing, setProcessing] = useState(false);

  // Create appointment form state
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    service: "General Consultation",
    message: "",
    doctorId: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchAppointments();
    fetchDoctors();
  }, [user, authLoading, router]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/appointments?limit=100");
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleApproveWithDoctor = (appointment) => {
    setAssigningAppointment(appointment);
    setSelectedDoctorId("");
    setShowAssignModal(true);
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctorId) {
      toast.error("Please select a doctor");
      return;
    }

    setProcessing(true);
    const loadingToast = toast.loading("Assigning doctor and approving...");

    try {
      const response = await fetch(
        `/api/admin/appointments?id=${assigningAppointment.$id}&action=assign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctorId: selectedDoctorId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to assign doctor");
      }

      await fetchAppointments();
      toast.dismiss(loadingToast);
      toast.success("Doctor assigned and appointment approved!");
      setShowAssignModal(false);
      setAssigningAppointment(null);
    } catch (error) {
      console.error("Error assigning doctor:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to assign doctor");
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    const loadingToast = toast.loading(`Updating appointment status...`);

    try {
      const response = await fetch(
        `/api/admin/appointments?id=${appointmentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update appointment status");
      }

      await fetchAppointments();
      toast.dismiss(loadingToast);
      toast.success(`Appointment ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to update appointment status");
    }
  };

  const handleDelete = async (appointmentId) => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    const loadingToast = toast.loading("Deleting appointment...");

    try {
      const response = await fetch(
        `/api/admin/appointments?id=${appointmentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }

      await fetchAppointments();
      toast.dismiss(loadingToast);
      toast.success("Appointment deleted successfully!");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to delete appointment");
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();

    if (
      !createForm.name ||
      !createForm.email ||
      !createForm.date ||
      !createForm.time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setProcessing(true);
    const loadingToast = toast.loading("Creating appointment...");

    try {
      // Combine date and time
      const dateTime = new Date(`${createForm.date}T${createForm.time}`);

      const response = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          email: createForm.email,
          phone: createForm.phone,
          date: dateTime.toISOString(),
          service: createForm.service,
          message: createForm.message,
          doctorId: createForm.doctorId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create appointment");
      }

      await fetchAppointments();
      toast.dismiss(loadingToast);
      toast.success("Appointment created successfully!");
      setShowCreateModal(false);
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        date: "",
        time: "",
        service: "General Consultation",
        message: "",
        doctorId: "",
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to create appointment");
    } finally {
      setProcessing(false);
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.phone?.includes(searchTerm);

    const matchesFilter =
      filterStatus === "all" || appointment.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          dot: "bg-emerald-400",
          border: "border-emerald-500/30",
        };
      case "pending":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          dot: "bg-amber-400",
          border: "border-amber-500/30",
        };
      case "cancelled":
      case "rejected":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          dot: "bg-red-400",
          border: "border-red-500/30",
        };
      case "completed":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          dot: "bg-blue-400",
          border: "border-blue-500/30",
        };
      default:
        return {
          bg: "bg-slate-500/10",
          text: "text-slate-400",
          dot: "bg-slate-400",
          border: "border-slate-500/30",
        };
    }
  };

  const getDoctorName = (appointment) => {
    if (appointment.doctor?.user?.full_name) {
      return appointment.doctor.user.full_name;
    }
    return "Not assigned";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-white">Appointments</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {appointments.length} total • {filteredAppointments.length}{" "}
                  shown
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
              >
                <FiPlus className="w-5 h-5" />
                <span className="hidden sm:inline">New Appointment</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <FiFilter className="text-slate-400 w-5 h-5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="all" className="bg-slate-800">
                  All Status
                </option>
                <option value="pending" className="bg-slate-800">
                  Pending
                </option>
                <option value="approved" className="bg-slate-800">
                  Approved
                </option>
                <option value="completed" className="bg-slate-800">
                  Completed
                </option>
                <option value="cancelled" className="bg-slate-800">
                  Cancelled
                </option>
                <option value="rejected" className="bg-slate-800">
                  Rejected
                </option>
              </select>
            </div>
          </div>

          {/* Appointments Grid */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                <FiCalendar className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                No appointments found
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter to find what you're looking for"
                  : "No appointments have been scheduled yet"}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                <FiPlus className="w-5 h-5" />
                Create First Appointment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAppointments.map((appointment) => {
                const statusConfig = getStatusColor(appointment.status);
                return (
                  <div
                    key={appointment.$id}
                    className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-slate-700/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {appointment.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">
                              {appointment.name}
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {appointment.service || "General Consultation"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                          ></span>
                          {appointment.status?.charAt(0).toUpperCase() +
                            appointment.status?.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <FiCalendar className="w-4 h-4 text-slate-500" />
                        <span>
                          {new Date(appointment.date).toLocaleDateString(
                            "en-US",
                            { weekday: "short", month: "short", day: "numeric" }
                          )}
                        </span>
                        <span className="text-slate-600">•</span>
                        <FiClock className="w-4 h-4 text-slate-500" />
                        <span>
                          {new Date(appointment.date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <FiMail className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{appointment.email}</span>
                      </div>

                      {appointment.phone && (
                        <div className="flex items-center gap-3 text-slate-400 text-sm">
                          <FiPhone className="w-4 h-4 text-slate-500" />
                          <span>{appointment.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <FiUserCheck className="w-4 h-4 text-slate-500" />
                        <span>Dr. {getDoctorName(appointment)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-5 py-4 border-t border-slate-700/50 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                      >
                        <FiEye className="w-4 h-4" />
                        View Details
                      </button>

                      {appointment.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveWithDoctor(appointment)}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                            title="Approve & Assign"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(appointment.$id, "cancelled")
                            }
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                            title="Cancel"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Appointment Details
              </h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-700/30 rounded-xl">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Patient Name
                </label>
                <p className="text-white font-medium mt-1">
                  {selectedAppointment.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Email
                  </label>
                  <p className="text-white text-sm mt-1 truncate">
                    {selectedAppointment.email}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Phone
                  </label>
                  <p className="text-white text-sm mt-1">
                    {selectedAppointment.phone || "N/A"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-700/30 rounded-xl">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date & Time
                </label>
                <p className="text-white mt-1">
                  {new Date(selectedAppointment.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}{" "}
                  at{" "}
                  {new Date(selectedAppointment.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Service
                  </label>
                  <p className="text-white text-sm mt-1">
                    {selectedAppointment.service || "General Consultation"}
                  </p>
                </div>
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Doctor
                  </label>
                  <p className="text-white text-sm mt-1">
                    {getDoctorName(selectedAppointment)}
                  </p>
                </div>
              </div>

              {selectedAppointment.message && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Message
                  </label>
                  <p className="text-slate-300 text-sm mt-1">
                    {selectedAppointment.message}
                  </p>
                </div>
              )}

              <div className="p-4 bg-slate-700/30 rounded-xl">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </label>
                <div className="mt-2">
                  {(() => {
                    const statusConfig = getStatusColor(
                      selectedAppointment.status
                    );
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${statusConfig.dot}`}
                        ></span>
                        {selectedAppointment.status?.charAt(0).toUpperCase() +
                          selectedAppointment.status?.slice(1)}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {selectedAppointment.status === "pending" && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setSelectedAppointment(null);
                    handleApproveWithDoctor(selectedAppointment);
                  }}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <FiUserCheck className="w-4 h-4" />
                  Approve & Assign
                </button>
                <button
                  onClick={() => {
                    handleStatusUpdate(selectedAppointment.$id, "cancelled");
                    setSelectedAppointment(null);
                  }}
                  className="flex-1 py-3 px-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium hover:bg-red-500 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Doctor Modal */}
      {showAssignModal && assigningAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Assign Doctor & Approve
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningAppointment(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-700/30 rounded-xl space-y-2">
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Patient:</span>{" "}
                <span className="text-white font-medium">
                  {assigningAppointment.name}
                </span>
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Date:</span>{" "}
                {new Date(assigningAppointment.date).toLocaleDateString()} at{" "}
                {new Date(assigningAppointment.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Service:</span>{" "}
                {assigningAppointment.service || "General Consultation"}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Doctor <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              >
                <option value="">-- Select a Doctor --</option>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.user?.full_name || "Unknown"} -{" "}
                    {doctor.specialization || "General"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningAppointment(null);
                }}
                className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDoctor}
                disabled={!selectedDoctorId || processing}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Assign & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Create New Appointment
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Patient Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={createForm.time}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, time: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Service
                </label>
                <select
                  value={createForm.service}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, service: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                >
                  <option value="General Consultation">
                    General Consultation
                  </option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Homeopathy Consultation">
                    Homeopathy Consultation
                  </option>
                  <option value="Wellness Check">Wellness Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Assign Doctor (Optional)
                </label>
                <select
                  value={createForm.doctorId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, doctorId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                >
                  <option value="">-- Leave Pending --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name || "Unknown"} -{" "}
                      {doctor.specialization || "General"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  If a doctor is assigned, the appointment will be automatically
                  approved
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes / Reason for Visit
                </label>
                <textarea
                  value={createForm.message}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, message: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {processing ? "Creating..." : "Create Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsManagement;
