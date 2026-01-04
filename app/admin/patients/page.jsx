"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUser,
  FiMail,
  FiPhone,
  FiX,
  FiCalendar,
  FiFileText,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiClipboard,
  FiActivity,
  FiHeart,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { toast } from "sonner";
import { formatAppointmentDateTime } from "@/lib/utils";

const PatientManagement = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("active");
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    patientId: null,
    patientName: "",
    action: "deactivate",
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Medical records state
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [recordsPatient, setRecordsPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    is_active: true,
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch function for infinite scroll
  const fetchPatients = useCallback(
    async (page, limit) => {
      const includeInactive =
        filterStatus === "all" || filterStatus === "inactive";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeInactive: includeInactive.toString(),
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      const response = await fetch(`/api/admin/patients?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }
      const data = await response.json();
      return {
        items: data.patients || [],
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [filterStatus, debouncedSearch]
  );

  // Use infinite scroll hook
  const {
    items: patients,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchPatients, {
    limit: 12,
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
  }, [user, authLoading, router]);

  // Client-side sorting of loaded items
  const sortedPatients = useMemo(() => {
    return [...patients]
      .filter((p) => {
        const matchesFilter =
          filterStatus === "all" ||
          (filterStatus === "active" && p.is_active) ||
          (filterStatus === "inactive" && !p.is_active);
        return matchesFilter;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "name":
            comparison = (a.full_name || "").localeCompare(b.full_name || "");
            break;
          case "email":
            comparison = (a.email || "").localeCompare(b.email || "");
            break;
          case "appointments":
            comparison = (a.appointmentCount || 0) - (b.appointmentCount || 0);
            break;
          case "created":
            comparison = new Date(a.created_at) - new Date(b.created_at);
            break;
          default:
            comparison = 0;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [patients, sortBy, sortOrder, filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loadingToast = toast.loading("Updating patient...");

    try {
      const response = await fetch(
        `/api/admin/patients?id=${editingPatient.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update patient");
      }

      toast.dismiss(loadingToast);
      toast.success("Patient updated successfully!");

      setShowModal(false);
      resetForm();
      reset();
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to update patient");
    }
  };

  const handleDeactivate = (patientId, patientName) => {
    setConfirmModal({
      open: true,
      patientId,
      patientName,
      action: "deactivate",
    });
  };

  const handleReactivate = (patientId, patientName) => {
    setConfirmModal({
      open: true,
      patientId,
      patientName,
      action: "reactivate",
    });
  };

  const confirmAction = async () => {
    const { patientId, action } = confirmModal;
    setActionLoading(true);

    try {
      if (action === "deactivate") {
        const response = await fetch(`/api/admin/patients?id=${patientId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to deactivate patient");
        }

        toast.success("Patient deactivated successfully!");
      } else {
        const response = await fetch(`/api/admin/patients?id=${patientId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: true }),
        });

        if (!response.ok) {
          throw new Error("Failed to reactivate patient");
        }

        toast.success("Patient reactivated successfully!");
      }

      reset();
      setConfirmModal({
        open: false,
        patientId: null,
        patientName: "",
        action: "deactivate",
      });
    } catch (error) {
      console.error(`Error ${confirmModal.action}ing patient:`, error);
      toast.error(`Failed to ${confirmModal.action} patient`);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.full_name || "",
      phone: patient.phone || "",
      is_active: patient.is_active,
    });
    setShowModal(true);
  };

  const fetchPatientRecords = async (patient) => {
    setRecordsPatient(patient);
    setShowRecordsModal(true);
    setRecordsLoading(true);
    setExpandedRecord(null);

    try {
      const response = await fetch(
        `/api/admin/patients/records?patientId=${patient.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setPatientRecords(data.records || []);
      } else {
        toast.error("Failed to fetch medical records");
        setPatientRecords([]);
      }
    } catch (error) {
      console.error("Error fetching patient records:", error);
      toast.error("Failed to fetch medical records");
      setPatientRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const toggleRecordExpand = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const formatDate = (dateString) => {
    return formatAppointmentDateTime(dateString).date;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      is_active: true,
    });
    setEditingPatient(null);
  };

  // Content loading skeleton
  const ContentSkeleton = () => (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 h-12 bg-slate-800/50 rounded-xl"></div>
        <div className="h-12 w-40 bg-slate-800/50 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-2xl"></div>
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
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-white">
                  Manage Patients
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {totalCount} total patients • {sortedPatients.length} loaded
                </p>
              </div>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-all"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : (
            <>
              {/* Filters */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <FiUser className="text-slate-400 w-5 h-5" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="active" className="bg-slate-800">
                      Active Only
                    </option>
                    <option value="inactive" className="bg-slate-800">
                      Inactive Only
                    </option>
                    <option value="all" className="bg-slate-800">
                      All Patients
                    </option>
                  </select>
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
                  >
                    <option value="created" className="bg-slate-800">
                      Sort by Joined
                    </option>
                    <option value="name" className="bg-slate-800">
                      Sort by Name
                    </option>
                    <option value="email" className="bg-slate-800">
                      Sort by Email
                    </option>
                    <option value="appointments" className="bg-slate-800">
                      Sort by Appointments
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

              {/* Patients Grid */}
              {sortedPatients.length === 0 && !loading ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                    <FiUser className="w-10 h-10 text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    No patients found
                  </h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    {searchTerm || filterStatus !== "active"
                      ? "Try adjusting your search or filter to find what you're looking for"
                      : "No patients have registered yet"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 hover:shadow-xl transition-all duration-300"
                      >
                        {/* Header with gradient */}
                        <div className="relative h-20 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                          <div className="absolute -bottom-10 left-6">
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center border-4 border-slate-800 bg-gradient-to-br from-purple-500 to-pink-600">
                              <span className="text-2xl font-bold text-white">
                                {patient.full_name?.charAt(0) ||
                                  patient.email?.charAt(0) ||
                                  "P"}
                              </span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(patient)}
                              className="p-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-white hover:bg-emerald-500 transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            {patient.is_active ? (
                              <button
                                onClick={() =>
                                  handleDeactivate(
                                    patient.id,
                                    patient.full_name
                                  )
                                }
                                className="p-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                title="Deactivate"
                              >
                                <FiXCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleReactivate(
                                    patient.id,
                                    patient.full_name
                                  )
                                }
                                className="p-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                title="Reactivate"
                              >
                                <FiCheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="pt-14 px-6 pb-6">
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-semibold text-white truncate">
                                {patient.full_name || "No name"}
                              </h3>
                              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                Patient
                              </span>
                            </div>
                            <span
                              className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${
                                patient.is_active
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-red-500/10 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {patient.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-slate-400">
                              <FiMail className="w-4 h-4 text-slate-500" />
                              <span className="truncate">{patient.email}</span>
                            </div>
                            {patient.phone && (
                              <div className="flex items-center gap-3 text-slate-400">
                                <FiPhone className="w-4 h-4 text-slate-500" />
                                <span>{patient.phone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-slate-400">
                              <FiCalendar className="w-4 h-4 text-slate-500" />
                              <span>
                                {patient.appointmentCount} appointments
                              </span>
                            </div>
                            <button
                              onClick={() => fetchPatientRecords(patient)}
                              className="flex items-center gap-3 text-slate-400 hover:text-emerald-400 transition-colors group/records"
                            >
                              <FiFileText className="w-4 h-4 text-slate-500 group-hover/records:text-emerald-400" />
                              <span>
                                {patient.recordsCount} medical records
                              </span>
                              <FiEye className="w-4 h-4 ml-auto opacity-0 group-hover/records:opacity-100 transition-opacity" />
                            </button>
                          </div>

                          <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Registered{" "}
                              {new Date(patient.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                            {patient.recordsCount > 0 && (
                              <button
                                onClick={() => fetchPatientRecords(patient)}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                                View Records
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Infinite Scroll Loader */}
                  <InfiniteScrollLoader
                    ref={sentinelRef}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    error={error}
                    itemCount={sortedPatients.length}
                    totalCount={totalCount}
                    emptyMessage="No patients found"
                    endMessage="You've seen all patients"
                    onRetry={reset}
                    loaderColor="emerald"
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {showModal && editingPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Edit Patient</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editingPatient.email}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-400 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-slate-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/50"
                />
                <label
                  htmlFor="is_active"
                  className="text-sm font-medium text-slate-300"
                >
                  Account is active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() =>
          setConfirmModal({
            open: false,
            patientId: null,
            patientName: "",
            action: "deactivate",
          })
        }
        onConfirm={confirmAction}
        title={
          confirmModal.action === "deactivate"
            ? "Deactivate Patient"
            : "Reactivate Patient"
        }
        message={
          confirmModal.action === "deactivate"
            ? `Are you sure you want to deactivate ${confirmModal.patientName}? They will no longer be able to log in.`
            : `Are you sure you want to reactivate ${confirmModal.patientName}?`
        }
        confirmText={
          confirmModal.action === "deactivate" ? "Deactivate" : "Reactivate"
        }
        cancelText="Cancel"
        variant={confirmModal.action === "deactivate" ? "danger" : "success"}
        loading={actionLoading}
      />

      {/* Medical Records Modal */}
      {showRecordsModal && recordsPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Medical Records
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {recordsPatient.full_name || recordsPatient.email} •{" "}
                    {patientRecords.length} records
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRecordsModal(false);
                    setRecordsPatient(null);
                    setPatientRecords([]);
                    setExpandedRecord(null);
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {recordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
                    </div>
                    <p className="text-slate-400">Loading records...</p>
                  </div>
                </div>
              ) : patientRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                    <FiFileText className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No Medical Records
                  </h3>
                  <p className="text-slate-400">
                    This patient doesn't have any medical records yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientRecords.map((record) => {
                    const isExpanded = expandedRecord === record.id;

                    return (
                      <div
                        key={record.id}
                        className="rounded-xl bg-slate-700/30 border border-slate-600/30 overflow-hidden transition-all duration-200 hover:border-slate-500/50"
                      >
                        {/* Record Header */}
                        <div
                          className="p-4 cursor-pointer"
                          onClick={() => toggleRecordExpand(record.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                                <FiFileText className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-white">
                                  {record.final_diagnosis ||
                                    record.provisional_diagnosis ||
                                    "Consultation Record"}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <FiCalendar className="w-3.5 h-3.5" />
                                    {formatDate(record.created_at)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FiUser className="w-3.5 h-3.5" />
                                    Dr.{" "}
                                    {record.doctor?.user?.full_name ||
                                      "Unknown"}
                                  </span>
                                  {record.appointment?.service && (
                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">
                                      {record.appointment.service}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button className="text-slate-400 hover:text-white transition-colors p-1">
                              {isExpanded ? (
                                <FiChevronUp className="w-5 h-5" />
                              ) : (
                                <FiChevronDown className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-slate-600/30 pt-4 space-y-4">
                            {/* Chief Complaints */}
                            {record.chief_complaints && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
                                  <FiClipboard className="w-4 h-4 text-blue-400" />
                                  Chief Complaints
                                </h4>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30">
                                  <p className="text-slate-300 text-sm">
                                    {record.chief_complaints}
                                  </p>
                                  {(record.onset || record.duration) && (
                                    <div className="mt-2 flex gap-4 text-xs">
                                      {record.onset && (
                                        <span className="text-slate-400">
                                          <span className="text-slate-500">
                                            Onset:
                                          </span>{" "}
                                          {record.onset}
                                        </span>
                                      )}
                                      {record.duration && (
                                        <span className="text-slate-400">
                                          <span className="text-slate-500">
                                            Duration:
                                          </span>{" "}
                                          {record.duration}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Diagnosis */}
                            {(record.provisional_diagnosis ||
                              record.final_diagnosis) && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
                                  <FiActivity className="w-4 h-4 text-purple-400" />
                                  Diagnosis
                                </h4>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30 space-y-2">
                                  {record.provisional_diagnosis && (
                                    <div>
                                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                        Provisional
                                      </span>
                                      <p className="text-slate-300 text-sm mt-0.5">
                                        {record.provisional_diagnosis}
                                      </p>
                                    </div>
                                  )}
                                  {record.final_diagnosis && (
                                    <div>
                                      <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
                                        Final
                                      </span>
                                      <p className="text-white font-medium text-sm mt-0.5">
                                        {record.final_diagnosis}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Vital Signs */}
                            {record.vital_signs &&
                              Object.values(record.vital_signs).some(
                                (v) => v
                              ) && (
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
                                    <FiHeart className="w-4 h-4 text-red-400" />
                                    Vital Signs
                                  </h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                                    {record.vital_signs.blood_pressure && (
                                      <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-center">
                                        <p className="text-xs text-slate-500 mb-0.5">
                                          Blood Pressure
                                        </p>
                                        <p className="font-semibold text-white text-sm">
                                          {record.vital_signs.blood_pressure}
                                        </p>
                                      </div>
                                    )}
                                    {record.vital_signs.pulse && (
                                      <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-center">
                                        <p className="text-xs text-slate-500 mb-0.5">
                                          Pulse
                                        </p>
                                        <p className="font-semibold text-white text-sm">
                                          {record.vital_signs.pulse}
                                        </p>
                                      </div>
                                    )}
                                    {record.vital_signs.temperature && (
                                      <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-center">
                                        <p className="text-xs text-slate-500 mb-0.5">
                                          Temperature
                                        </p>
                                        <p className="font-semibold text-white text-sm">
                                          {record.vital_signs.temperature}
                                        </p>
                                      </div>
                                    )}
                                    {record.vital_signs.weight && (
                                      <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-center">
                                        <p className="text-xs text-slate-500 mb-0.5">
                                          Weight
                                        </p>
                                        <p className="font-semibold text-white text-sm">
                                          {record.vital_signs.weight}
                                        </p>
                                      </div>
                                    )}
                                    {record.vital_signs.height && (
                                      <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-600/30 text-center">
                                        <p className="text-xs text-slate-500 mb-0.5">
                                          Height
                                        </p>
                                        <p className="font-semibold text-white text-sm">
                                          {record.vital_signs.height}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* History Present Illness */}
                            {record.history_present_illness && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                  History of Present Illness
                                </h4>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30">
                                  <p className="text-slate-300 text-sm">
                                    {record.history_present_illness}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Past History */}
                            {record.past_history && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                  Past History
                                </h4>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30">
                                  <p className="text-slate-300 text-sm">
                                    {record.past_history}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Family History */}
                            {record.family_history && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                  Family History
                                </h4>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30">
                                  <p className="text-slate-300 text-sm">
                                    {record.family_history}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Treatment Plan */}
                            {record.treatment_plan && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                  Treatment Plan
                                </h4>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30">
                                  <p className="text-slate-300 text-sm">
                                    {record.treatment_plan}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Follow Up */}
                            {record.follow_up_instructions && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                  Follow-up Instructions
                                </h4>
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                  <p className="text-blue-300 text-sm">
                                    {record.follow_up_instructions}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Doctor's Notes */}
                            {record.additional_notes && (
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">
                                  Doctor's Notes
                                </h4>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30">
                                  <p className="text-slate-300 text-sm">
                                    {record.additional_notes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800">
              <button
                onClick={() => {
                  setShowRecordsModal(false);
                  setRecordsPatient(null);
                  setPatientRecords([]);
                  setExpandedRecord(null);
                }}
                className="w-full px-4 py-2.5 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
