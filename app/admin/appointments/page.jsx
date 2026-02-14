"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ExportCaseSheetDialog from "@/components/ui/ExportCaseSheetDialog";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
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
  FiFileText,
  FiMapPin,
  FiBriefcase,
  FiArrowUp,
  FiArrowDown,
  FiDownload,
} from "react-icons/fi";
import { toast } from "sonner";
import { formatAppointmentDateTime } from "@/lib/utils";

const AppointmentsManagement = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assigningAppointment, setAssigningAppointment] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showCaseSheetModal, setShowCaseSheetModal] = useState(false);
  const [selectedCaseSheet, setSelectedCaseSheet] = useState(null);
  const [loadingCaseSheet, setLoadingCaseSheet] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    appointmentId: null,
  });
  const [deleting, setDeleting] = useState(false);

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch function for infinite scroll
  const fetchAppointments = useCallback(
    async (page, limit) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const response = await fetch(`/api/admin/appointments?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }
      const data = await response.json();
      return {
        items: data.appointments || [],
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [filterStatus, debouncedSearch],
  );

  // Use infinite scroll hook
  const {
    items: appointments,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchAppointments, {
    limit: 10,
    enabled: !!user && user.role === "admin" && !authLoading,
    dependencies: [filterStatus, debouncedSearch],
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

    fetchDoctors();
  }, [user, authLoading, router]);

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

  // Client-side sorting of loaded items
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "");
          break;
        case "created":
          comparison =
            new Date(a.$createdAt || a.created_at) -
            new Date(b.$createdAt || b.created_at);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [appointments, sortBy, sortOrder]);

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
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to assign doctor");
      }

      reset();
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

  const handleStatusUpdate = async (
    appointmentId,
    newStatus,
    reason = null,
  ) => {
    const loadingToast = toast.loading(`Updating appointment status...`);

    try {
      const body = { status: newStatus };
      if (reason) {
        body.cancellation_reason = reason;
      }

      const response = await fetch(
        `/api/admin/appointments?id=${appointmentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update appointment status");
      }

      reset();
      toast.dismiss(loadingToast);
      toast.success(`Appointment ${newStatus} successfully!`);
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to update appointment status");
    }
  };

  const handleCancelWithReason = (appointment) => {
    setCancellingAppointment(appointment);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    setProcessing(true);
    await handleStatusUpdate(
      cancellingAppointment.$id,
      "cancelled",
      cancellationReason,
    );
    setProcessing(false);
    setShowCancelModal(false);
    setCancellingAppointment(null);
    setCancellationReason("");
  };

  const fetchCaseSheet = async (appointmentId) => {
    setLoadingCaseSheet(true);
    try {
      const response = await fetch(
        `/api/admin/appointments/${appointmentId}/casesheet`,
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedCaseSheet(data);
        setShowCaseSheetModal(true);
      } else {
        toast.error("Failed to load case sheet");
      }
    } catch (error) {
      console.error("Error fetching case sheet:", error);
      toast.error("Failed to load case sheet");
    } finally {
      setLoadingCaseSheet(false);
    }
  };

  const handleDelete = (appointmentId) => {
    setDeleteModal({ open: true, appointmentId });
  };

  const confirmDelete = async () => {
    const { appointmentId } = deleteModal;
    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/appointments?id=${appointmentId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }

      reset();
      toast.success("Appointment deleted successfully!");
      setDeleteModal({ open: false, appointmentId: null });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
    } finally {
      setDeleting(false);
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

      reset();
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

  // Content loading skeleton
  const ContentSkeleton = () => (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 h-12 bg-slate-800/50 rounded-xl"></div>
        <div className="h-12 w-40 bg-slate-800/50 rounded-xl"></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Appointments
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {totalCount} total • {sortedAppointments.length} loaded
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
          {loading ? (
            <ContentSkeleton />
          ) : (
            <>
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
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="date" className="bg-slate-800">
                      Sort by Date
                    </option>
                    <option value="name" className="bg-slate-800">
                      Sort by Name
                    </option>
                    <option value="status" className="bg-slate-800">
                      Sort by Status
                    </option>
                    <option value="created" className="bg-slate-800">
                      Sort by Created
                    </option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                    title={sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    {sortOrder === "asc" ? (
                      <FiArrowUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FiArrowDown className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Appointments Grid */}
              {sortedAppointments.length === 0 && !loading ? (
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
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedAppointments.map((appointment) => {
                      const statusConfig = getStatusColor(appointment.status);
                      return (
                        <div
                          key={appointment.$id}
                          className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 hover:shadow-xl transition-all duration-300"
                        >
                          {/* Header */}
                          <div className="p-5 border-b border-slate-700/50">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold text-lg">
                                    {appointment.name?.charAt(0) || "?"}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <h3 className="text-white font-semibold truncate">
                                    {appointment.name}
                                  </h3>
                                  <p className="text-slate-400 text-sm truncate">
                                    {appointment.service ||
                                      "General Consultation"}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
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
                                {
                                  formatAppointmentDateTime(
                                    appointment.date,
                                    appointment.time,
                                  ).date
                                }
                              </span>
                              <span className="text-slate-600">•</span>
                              <FiClock className="w-4 h-4 text-slate-500" />
                              <span>
                                {
                                  formatAppointmentDateTime(
                                    appointment.date,
                                    appointment.time,
                                  ).time
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-slate-400 text-sm">
                              <FiMail className="w-4 h-4 text-slate-500" />
                              <span className="truncate">
                                {appointment.email}
                              </span>
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
                              onClick={() =>
                                setSelectedAppointment(appointment)
                              }
                              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                            >
                              <FiEye className="w-4 h-4" />
                              View Details
                            </button>

                            {appointment.status === "pending" && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleApproveWithDoctor(appointment)
                                  }
                                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                                  title="Approve & Assign"
                                >
                                  <FiCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleCancelWithReason(appointment)
                                  }
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                  title="Cancel"
                                >
                                  <FiX className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {appointment.status === "completed" && (
                              <button
                                onClick={() => fetchCaseSheet(appointment.$id)}
                                disabled={loadingCaseSheet}
                                className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                                title="View Case Sheet"
                              >
                                <FiFileText className="w-4 h-4" />
                                Case Sheet
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Infinite Scroll Loader */}
                  <InfiniteScrollLoader
                    ref={sentinelRef}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    error={error}
                    itemCount={sortedAppointments.length}
                    totalCount={totalCount}
                    emptyMessage="No appointments found"
                    endMessage="You've seen all appointments"
                    onRetry={reset}
                    loaderColor="emerald"
                  />
                </>
              )}
            </>
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
                  {
                    formatAppointmentDateTime(
                      selectedAppointment.date,
                      selectedAppointment.time,
                    ).datetime
                  }
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
                      selectedAppointment.status,
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
                    const apt = selectedAppointment;
                    setSelectedAppointment(null);
                    handleCancelWithReason(apt);
                  }}
                  className="flex-1 py-3 px-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium hover:bg-red-500 hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            )}

            {selectedAppointment.status === "completed" && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    fetchCaseSheet(selectedAppointment.$id);
                  }}
                  disabled={loadingCaseSheet}
                  className="w-full py-3 px-4 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl font-medium hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <FiFileText className="w-4 h-4" />
                  {loadingCaseSheet ? "Loading..." : "View Case Sheet"}
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
                {
                  formatAppointmentDateTime(
                    assigningAppointment.date,
                    assigningAppointment.time,
                  ).datetime
                }
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

      {/* Cancellation Reason Modal */}
      {showCancelModal && cancellingAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Cancel Appointment
              </h3>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingAppointment(null);
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
                  {cancellingAppointment.name}
                </span>
              </p>
              <p className="text-sm text-slate-300">
                <span className="text-slate-500">Date:</span>{" "}
                {
                  formatAppointmentDateTime(
                    cancellingAppointment.date,
                    cancellingAppointment.time,
                  ).datetime
                }
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cancellation Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none"
                placeholder="Please provide a reason for cancelling this appointment..."
              />
              <p className="text-xs text-slate-500 mt-2">
                This reason will be sent to the patient via email.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingAppointment(null);
                }}
                className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
                disabled={processing}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancellationReason.trim() || processing}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Sheet Modal */}
      {showCaseSheetModal && selectedCaseSheet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Case Sheet - {selectedCaseSheet.appointment?.name}
              </h3>
              <button
                onClick={() => {
                  setShowCaseSheetModal(false);
                  setSelectedCaseSheet(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Info */}
            <div className="mb-6 p-4 bg-slate-700/30 rounded-xl">
              <h4 className="text-sm font-semibold text-emerald-400 mb-3">
                Patient Information
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Name:</span>
                  <p className="text-white font-medium">
                    {selectedCaseSheet.appointment?.name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Age / Sex:</span>
                  <p className="text-white font-medium">
                    {selectedCaseSheet.patient?.age || "N/A"} /{" "}
                    {selectedCaseSheet.patient?.sex || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span>
                  <p className="text-white font-medium">
                    {selectedCaseSheet.appointment?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="text-white font-medium truncate">
                    {selectedCaseSheet.appointment?.email || "N/A"}
                  </p>
                </div>
                {selectedCaseSheet.patient?.occupation && (
                  <div>
                    <span className="text-slate-500">Occupation:</span>
                    <p className="text-white font-medium">
                      {selectedCaseSheet.patient.occupation}
                    </p>
                  </div>
                )}
                {selectedCaseSheet.patient?.address && (
                  <div className="md:col-span-2">
                    <span className="text-slate-500">Address:</span>
                    <p className="text-white font-medium">
                      {selectedCaseSheet.patient.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedCaseSheet.medicalRecord ? (
              <div className="space-y-6">
                {/* Chief Complaints */}
                {selectedCaseSheet.medicalRecord.chief_complaints && (
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                      Chief Complaints
                    </h4>
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {selectedCaseSheet.medicalRecord.chief_complaints}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                      {selectedCaseSheet.medicalRecord.onset && (
                        <div>
                          <span className="text-slate-500">Onset:</span>{" "}
                          <span className="text-slate-300">
                            {selectedCaseSheet.medicalRecord.onset}
                          </span>
                        </div>
                      )}
                      {selectedCaseSheet.medicalRecord.duration && (
                        <div>
                          <span className="text-slate-500">Duration:</span>{" "}
                          <span className="text-slate-300">
                            {selectedCaseSheet.medicalRecord.duration}
                          </span>
                        </div>
                      )}
                      {selectedCaseSheet.medicalRecord.location && (
                        <div>
                          <span className="text-slate-500">Location:</span>{" "}
                          <span className="text-slate-300">
                            {selectedCaseSheet.medicalRecord.location}
                          </span>
                        </div>
                      )}
                      {selectedCaseSheet.medicalRecord.sensation && (
                        <div>
                          <span className="text-slate-500">Sensation:</span>{" "}
                          <span className="text-slate-300">
                            {selectedCaseSheet.medicalRecord.sensation}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* History */}
                {(selectedCaseSheet.medicalRecord.history_present_illness ||
                  selectedCaseSheet.medicalRecord.past_history ||
                  selectedCaseSheet.medicalRecord.family_history) && (
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                      History
                    </h4>
                    {selectedCaseSheet.medicalRecord
                      .history_present_illness && (
                      <div className="mb-3">
                        <span className="text-slate-500 text-xs">
                          History of Present Illness:
                        </span>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                          {
                            selectedCaseSheet.medicalRecord
                              .history_present_illness
                          }
                        </p>
                      </div>
                    )}
                    {selectedCaseSheet.medicalRecord.past_history && (
                      <div className="mb-3">
                        <span className="text-slate-500 text-xs">
                          Past Medical History:
                        </span>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                          {selectedCaseSheet.medicalRecord.past_history}
                        </p>
                      </div>
                    )}
                    {selectedCaseSheet.medicalRecord.family_history && (
                      <div>
                        <span className="text-slate-500 text-xs">
                          Family History:
                        </span>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                          {selectedCaseSheet.medicalRecord.family_history}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Vital Signs */}
                {selectedCaseSheet.medicalRecord.vital_signs &&
                  Object.values(
                    selectedCaseSheet.medicalRecord.vital_signs,
                  ).some((v) => v) && (
                    <div className="p-4 bg-slate-700/30 rounded-xl">
                      <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                        Vital Signs
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                        {selectedCaseSheet.medicalRecord.vital_signs
                          .temperature && (
                          <div>
                            <span className="text-slate-500">Temp:</span>{" "}
                            <span className="text-slate-300">
                              {
                                selectedCaseSheet.medicalRecord.vital_signs
                                  .temperature
                              }
                            </span>
                          </div>
                        )}
                        {selectedCaseSheet.medicalRecord.vital_signs
                          .blood_pressure && (
                          <div>
                            <span className="text-slate-500">BP:</span>{" "}
                            <span className="text-slate-300">
                              {
                                selectedCaseSheet.medicalRecord.vital_signs
                                  .blood_pressure
                              }
                            </span>
                          </div>
                        )}
                        {selectedCaseSheet.medicalRecord.vital_signs.pulse && (
                          <div>
                            <span className="text-slate-500">Pulse:</span>{" "}
                            <span className="text-slate-300">
                              {
                                selectedCaseSheet.medicalRecord.vital_signs
                                  .pulse
                              }
                            </span>
                          </div>
                        )}
                        {selectedCaseSheet.medicalRecord.vital_signs
                          .respiratory_rate && (
                          <div>
                            <span className="text-slate-500">RR:</span>{" "}
                            <span className="text-slate-300">
                              {
                                selectedCaseSheet.medicalRecord.vital_signs
                                  .respiratory_rate
                              }
                            </span>
                          </div>
                        )}
                        {selectedCaseSheet.medicalRecord.vital_signs.weight && (
                          <div>
                            <span className="text-slate-500">Weight:</span>{" "}
                            <span className="text-slate-300">
                              {
                                selectedCaseSheet.medicalRecord.vital_signs
                                  .weight
                              }
                            </span>
                          </div>
                        )}
                        {selectedCaseSheet.medicalRecord.vital_signs.height && (
                          <div>
                            <span className="text-slate-500">Height:</span>{" "}
                            <span className="text-slate-300">
                              {
                                selectedCaseSheet.medicalRecord.vital_signs
                                  .height
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Diagnosis */}
                {(selectedCaseSheet.medicalRecord.provisional_diagnosis ||
                  selectedCaseSheet.medicalRecord.final_diagnosis) && (
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                      Diagnosis
                    </h4>
                    {selectedCaseSheet.medicalRecord.provisional_diagnosis && (
                      <div className="mb-3">
                        <span className="text-slate-500 text-xs">
                          Provisional Diagnosis:
                        </span>
                        <p className="text-slate-300 text-sm">
                          {
                            selectedCaseSheet.medicalRecord
                              .provisional_diagnosis
                          }
                        </p>
                      </div>
                    )}
                    {selectedCaseSheet.medicalRecord.final_diagnosis && (
                      <div>
                        <span className="text-slate-500 text-xs">
                          Final Diagnosis:
                        </span>
                        <p className="text-white font-medium text-sm">
                          {selectedCaseSheet.medicalRecord.final_diagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Treatment & Follow-up */}
                {(selectedCaseSheet.medicalRecord.treatment_plan ||
                  selectedCaseSheet.medicalRecord.follow_up_instructions) && (
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-2">
                      Treatment & Follow-up
                    </h4>
                    {selectedCaseSheet.medicalRecord.treatment_plan && (
                      <div className="mb-3">
                        <span className="text-slate-500 text-xs">
                          Treatment Plan:
                        </span>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                          {selectedCaseSheet.medicalRecord.treatment_plan}
                        </p>
                      </div>
                    )}
                    {selectedCaseSheet.medicalRecord.follow_up_instructions && (
                      <div>
                        <span className="text-slate-500 text-xs">
                          Follow-up Instructions:
                        </span>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap">
                          {
                            selectedCaseSheet.medicalRecord
                              .follow_up_instructions
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Prescription */}
                {selectedCaseSheet.prescription?.items?.length > 0 && (
                  <div className="p-4 bg-slate-700/30 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-400 mb-3">
                      Prescription
                    </h4>
                    <div className="space-y-3">
                      {selectedCaseSheet.prescription.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/50"
                        >
                          <p className="text-white font-medium">
                            {item.medication_name}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                            {item.dosage && (
                              <div>
                                <span className="text-slate-500">Dosage:</span>{" "}
                                <span className="text-slate-300">
                                  {item.dosage}
                                </span>
                              </div>
                            )}
                            {item.frequency && (
                              <div>
                                <span className="text-slate-500">
                                  Frequency:
                                </span>{" "}
                                <span className="text-slate-300">
                                  {item.frequency}
                                </span>
                              </div>
                            )}
                            {item.duration && (
                              <div>
                                <span className="text-slate-500">
                                  Duration:
                                </span>{" "}
                                <span className="text-slate-300">
                                  {item.duration}
                                </span>
                              </div>
                            )}
                            {item.quantity && (
                              <div>
                                <span className="text-slate-500">
                                  Quantity:
                                </span>{" "}
                                <span className="text-slate-300">
                                  {item.quantity}
                                </span>
                              </div>
                            )}
                          </div>
                          {item.instructions && (
                            <p className="text-slate-400 text-xs mt-2 italic">
                              {item.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {selectedCaseSheet.prescription.notes && (
                      <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                        <span className="text-blue-400 text-xs">Notes:</span>
                        <p className="text-slate-300 text-sm">
                          {selectedCaseSheet.prescription.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiFileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">
                  No case sheet data available for this appointment.
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCaseSheetModal(false);
                  setSelectedCaseSheet(null);
                }}
                className="flex-1 py-3 px-4 border border-slate-600 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              {selectedCaseSheet.medicalRecord && (
                <button
                  onClick={() => setShowExportDialog(true)}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FiDownload className="w-4 h-4" />
                  Export PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Case Sheet Dialog */}
      {selectedCaseSheet && (
        <ExportCaseSheetDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          record={{
            ...selectedCaseSheet.medicalRecord,
            prescription: selectedCaseSheet.prescription,
            doctorName: selectedCaseSheet.doctor?.user?.full_name,
          }}
          patientInfo={{
            full_name: selectedCaseSheet.appointment?.name,
            age: selectedCaseSheet.patient?.age,
            sex: selectedCaseSheet.patient?.sex,
            phone: selectedCaseSheet.appointment?.phone,
            email: selectedCaseSheet.appointment?.email,
            occupation: selectedCaseSheet.patient?.occupation,
            address: selectedCaseSheet.patient?.address,
          }}
          prescriptionData={selectedCaseSheet.prescription}
        />
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, appointmentId: null })}
        onConfirm={confirmDelete}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default AppointmentsManagement;
