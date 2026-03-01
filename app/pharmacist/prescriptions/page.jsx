"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import PharmacistSidebar from "../components/PharmacistSidebar";
import {
  FiPackage,
  FiCalendar,
  FiUser,
  FiCheck,
  FiClock,
  FiSearch,
  FiFilter,
  FiEye,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { toast } from "sonner";

const PharmacistPrescriptionsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch prescriptions callback for infinite scroll
  const fetchPrescriptions = useCallback(
    async (page, limit) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await fetch(`/api/pharmacist/prescriptions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch prescriptions");
      const data = await response.json();
      return {
        items: data.prescriptions || [],
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [debouncedSearch]
  );

  // Use infinite scroll hook
  const {
    items: prescriptions,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchPrescriptions, {
    limit: 10,
    enabled: !!user && user.role === "pharmacist" && !authLoading,
    dependencies: [debouncedSearch],
  });

  // Handle authentication and authorization redirects
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "pharmacist") {
      toast.error("Access denied. Pharmacist account required.");
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await reset();
    setRefreshing(false);
    toast.success("Prescriptions refreshed!");
  };

  const handleDispense = async (prescriptionId, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `/api/pharmacist/prescriptions/${prescriptionId}/dispense`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Prescription marked as dispensed");
        reset();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to dispense prescription");
      }
    } catch (error) {
      console.error("Error dispensing prescription:", error);
      toast.error("Failed to dispense prescription");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        dot: "bg-amber-400",
        label: "Pending",
      },
      dispensed: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        dot: "bg-emerald-400",
        label: "Dispensed",
      },
    };
    return configs[status] || configs.pending;
  };

  // Client-side filtering and sorting (search is handled server-side)
  const sortedPrescriptions = useMemo(() => {
    return prescriptions
      .filter((prescription) => {
        const matchesStatus =
          statusFilter === "all" || prescription.status === statusFilter;
        return matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case "date":
            comparison = new Date(a.created_at) - new Date(b.created_at);
            break;
          case "patient":
            comparison = (a.patient_name || "").localeCompare(
              b.patient_name || ""
            );
            break;
          case "status":
            comparison = (a.status || "").localeCompare(b.status || "");
            break;
          default:
            comparison = 0;
        }
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [prescriptions, statusFilter, sortBy, sortOrder]);

  // Only show full-page loading for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
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
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-800/50 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PharmacistSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="ml-12 lg:ml-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                  Prescriptions
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-0.5 hidden xs:block">
                  Manage and dispense prescriptions
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50 shrink-0"
              >
                <FiRefreshCw
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : (
            <>
              {/* Filters */}
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                {/* Search Bar */}
                <div className="relative">
                  <FiSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search patient or doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>

                {/* Filters and Sorting */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FiFilter className="text-slate-500 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="dispensed">Dispensed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                    >
                      <option value="date">Sort by Date</option>
                      <option value="patient">Sort by Patient</option>
                      <option value="status">Sort by Status</option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="p-2.5 sm:p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-all shrink-0"
                      title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortOrder === "asc" ? (
                        <FiArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      ) : (
                        <FiArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Prescriptions List */}
              {error && sortedPrescriptions.length === 0 ? (
                <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 sm:p-12">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FiPackage className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                    </div>
                    <p className="text-red-400 font-medium text-base sm:text-lg">
                      Failed to load prescriptions
                    </p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 mb-4">
                      Something went wrong. Please try again.
                    </p>
                    <button
                      onClick={reset}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : sortedPrescriptions.length === 0 ? (
                <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-8 sm:p-12">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <FiPackage className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400 font-medium text-base sm:text-lg">
                      No Prescriptions Found
                    </p>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "No prescriptions available"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl sm:rounded-2xl lg:bg-slate-800/50 backdrop-blur-sm lg:border border-slate-700/50 overflow-hidden">
                  {/* Table Header - Desktop Only */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-700/50 bg-slate-800/30">
                    <div className="col-span-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Patient
                    </div>
                    <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Doctor
                    </div>
                    <div className="col-span-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Medications
                    </div>
                    <div className="col-span-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Date
                    </div>
                    <div className="col-span-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Status
                    </div>
                    <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                      Actions
                    </div>
                  </div>

                  {/* Table Body / Card List */}
                  <div className="lg:divide-y lg:divide-slate-700/30">
                    {sortedPrescriptions.map((prescription) => {
                      const statusConfig = getStatusConfig(prescription.status);
                      return (
                        <div
                          key={prescription.id}
                          onClick={() =>
                            router.push(
                              `/pharmacist/prescriptions/${prescription.id}`
                            )
                          }
                          className="group p-3 sm:p-4 lg:p-0 lg:px-6 lg:py-4 mb-3 lg:mb-0 rounded-xl lg:rounded-none bg-slate-800/30 lg:bg-transparent border border-slate-700/50 lg:border-0 hover:bg-slate-700/30 cursor-pointer transition-all duration-200"
                        >
                          {/* Mobile Card Layout */}
                          <div className="lg:hidden space-y-3">
                            {/* Top row: Patient + Status */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                  <FiUser className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-white text-sm truncate group-hover:text-purple-400 transition-colors">
                                    {prescription.patient_name}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">
                                    Dr. {prescription.doctor_name}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${statusConfig.bg} ${statusConfig.text}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                ></span>
                                {statusConfig.label}
                              </span>
                            </div>

                            {/* Medications */}
                            <div className="text-xs text-slate-400 pl-11">
                              {prescription.items
                                ?.slice(0, 2)
                                .map((item, i) => (
                                  <p key={i} className="truncate">
                                    • {item.medication_name}
                                    {item.dosage && ` - ${item.dosage}`}
                                  </p>
                                ))}
                              {prescription.items?.length > 2 && (
                                <p className="text-slate-500">
                                  +{prescription.items.length - 2} more
                                </p>
                              )}
                            </div>

                            {/* Bottom row: Date + Actions */}
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/30">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {formatDate(prescription.created_at)}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/pharmacist/prescriptions/${prescription.id}`
                                    );
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all"
                                  title="View Details"
                                >
                                  <FiEye className="w-3.5 h-3.5" />
                                </button>
                                {prescription.status === "pending" && (
                                  <button
                                    onClick={(e) =>
                                      handleDispense(prescription.id, e)
                                    }
                                    className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-1"
                                  >
                                    <FiCheck className="w-3 h-3" />
                                    Dispense
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Desktop Table Row Layout */}
                          <div className="hidden lg:grid lg:col-span-12 lg:grid-cols-12 lg:gap-4">
                            {/* Patient */}
                            <div className="lg:col-span-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                <FiUser className="w-5 h-5 text-purple-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-white truncate group-hover:text-purple-400 transition-colors">
                                  {prescription.patient_name}
                                </p>
                                {prescription.patient_phone && (
                                  <p className="text-sm text-slate-500 truncate">
                                    {prescription.patient_phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Doctor */}
                            <div className="hidden lg:flex lg:col-span-2 items-center">
                              <p className="text-slate-300 truncate">
                                Dr. {prescription.doctor_name}
                              </p>
                            </div>

                            {/* Medications */}
                            <div className="hidden lg:block lg:col-span-3">
                              <div className="space-y-1">
                                {prescription.items
                                  ?.slice(0, 2)
                                  .map((item, i) => (
                                    <p
                                      key={i}
                                      className="text-sm text-slate-400 truncate"
                                    >
                                      • {item.medication_name}
                                      {item.dosage && ` - ${item.dosage}`}
                                    </p>
                                  ))}
                                {prescription.items?.length > 2 && (
                                  <p className="text-sm text-slate-500">
                                    +{prescription.items.length - 2} more
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Date */}
                            <div className="hidden lg:flex lg:col-span-1 items-center">
                              <span className="text-sm text-slate-500">
                                {formatDate(prescription.created_at)}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="hidden lg:flex lg:col-span-1 items-center">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                                ></span>
                                {statusConfig.label}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="lg:col-span-2 flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/pharmacist/prescriptions/${prescription.id}`
                                  );
                                }}
                                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all"
                                title="View Details"
                              >
                                <FiEye className="w-4 h-4" />
                              </button>
                              {prescription.status === "pending" && (
                                <button
                                  onClick={(e) =>
                                    handleDispense(prescription.id, e)
                                  }
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2"
                                >
                                  <FiCheck className="w-4 h-4" />
                                  Dispense
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Infinite Scroll Loader */}
                  <InfiniteScrollLoader
                    sentinelRef={sentinelRef}
                    loading={loadingMore}
                    hasMore={hasMore}
                    error={error}
                    onRetry={reset}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default PharmacistPrescriptionsPage;
