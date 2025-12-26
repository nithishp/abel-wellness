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
  FiX,
  FiEye,
  FiPlus,
  FiUserCheck,
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
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <div className="flex items-center">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Manage Appointments
                </h1>
                <p className="text-gray-600">
                  {appointments.length} total appointments
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              New Appointment
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No appointments found
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter"
                : "No appointments have been scheduled yet"}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              <FiPlus className="w-4 h-4" />
              Create First Appointment
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.$id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center">
                            <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.name}
                            </div>
                          </div>
                          <div className="flex items-center mt-1">
                            <FiMail className="w-4 h-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-500">
                              {appointment.email}
                            </div>
                          </div>
                          {appointment.phone && (
                            <div className="flex items-center mt-1">
                              <FiPhone className="w-4 h-4 text-gray-400 mr-2" />
                              <div className="text-sm text-gray-500">
                                {appointment.phone}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {new Date(appointment.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <FiClock className="w-3 h-3 mr-1" />
                              {new Date(appointment.date).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getDoctorName(appointment)}
                        </div>
                        {appointment.doctor?.specialization && (
                          <div className="text-xs text-gray-500">
                            {appointment.doctor.specialization}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            appointment.status
                          )}`}
                        >
                          {appointment.status?.charAt(0).toUpperCase() +
                            appointment.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appointment.service || "General Consultation"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedAppointment(appointment)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          {appointment.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApproveWithDoctor(appointment)
                                }
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Approve & Assign Doctor"
                              >
                                <FiUserCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    appointment.$id,
                                    "cancelled"
                                  )
                                }
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Cancel"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Appointment Details</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Patient Name
                </label>
                <p className="text-gray-900">{selectedAppointment.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-gray-900">{selectedAppointment.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Phone
                </label>
                <p className="text-gray-900">
                  {selectedAppointment.phone || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Date & Time
                </label>
                <p className="text-gray-900">
                  {new Date(selectedAppointment.date).toLocaleDateString()} at{" "}
                  {new Date(selectedAppointment.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Service
                </label>
                <p className="text-gray-900">
                  {selectedAppointment.service || "General Consultation"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Assigned Doctor
                </label>
                <p className="text-gray-900">
                  {getDoctorName(selectedAppointment)}
                </p>
              </div>

              {selectedAppointment.message && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Message
                  </label>
                  <p className="text-gray-900">{selectedAppointment.message}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    selectedAppointment.status
                  )}`}
                >
                  {selectedAppointment.status?.charAt(0).toUpperCase() +
                    selectedAppointment.status?.slice(1)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              {selectedAppointment.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      setSelectedAppointment(null);
                      handleApproveWithDoctor(selectedAppointment);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiUserCheck className="w-4 h-4" />
                    Approve & Assign
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedAppointment.$id, "cancelled");
                      setSelectedAppointment(null);
                    }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Doctor Modal */}
      {showAssignModal && assigningAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assign Doctor & Approve</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningAppointment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Patient:</strong> {assigningAppointment.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Date:</strong>{" "}
                {new Date(assigningAppointment.date).toLocaleDateString()} at{" "}
                {new Date(assigningAppointment.date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Service:</strong>{" "}
                {assigningAppointment.service || "General Consultation"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningAppointment(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignDoctor}
                disabled={!selectedDoctorId || processing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Assign & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Appointment</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.date}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={createForm.time}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, time: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <select
                  value={createForm.service}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, service: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Doctor (Optional)
                </label>
                <select
                  value={createForm.doctorId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, doctorId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Leave Pending --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name || "Unknown"} -{" "}
                      {doctor.specialization || "General"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If a doctor is assigned, the appointment will be automatically
                  approved
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Reason for Visit
                </label>
                <textarea
                  value={createForm.message}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, message: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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
