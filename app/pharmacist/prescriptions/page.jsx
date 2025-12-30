"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
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
} from "react-icons/fi";
import { toast } from "sonner";

const PharmacistPrescriptionsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

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

    fetchPrescriptions();
  }, [user, authLoading, router]);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/pharmacist/prescriptions");
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } else {
        toast.error("Failed to load prescriptions");
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrescriptions();
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
        fetchPrescriptions();
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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.patient_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      prescription.doctor_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || prescription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-white">Prescriptions</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Manage and dispense prescriptions
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
              >
                <FiRefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
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
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by patient or doctor name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <FiFilter className="text-slate-500 w-5 h-5" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="dispensed">Dispensed</option>
                  </select>
                </div>
              </div>

              {/* Prescriptions List */}
              {filteredPrescriptions.length === 0 ? (
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-12">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                      <FiPackage className="w-8 h-8 text-slate-500" />
                    </div>
                    <p className="text-slate-400 font-medium text-lg">
                      No Prescriptions Found
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {searchQuery || statusFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "No prescriptions available"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 overflow-hidden">
                  {/* Table Header */}
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

                  {/* Table Body */}
                  <div className="divide-y divide-slate-700/30">
                    {filteredPrescriptions.map((prescription) => {
                      const statusConfig = getStatusConfig(prescription.status);
                      return (
                        <div
                          key={prescription.id}
                          onClick={() =>
                            router.push(
                              `/pharmacist/prescriptions/${prescription.id}`
                            )
                          }
                          className="group grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-700/30 cursor-pointer transition-all duration-200"
                        >
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
                          <div className="lg:col-span-2 flex items-center">
                            <p className="text-slate-300 truncate">
                              Dr. {prescription.doctor_name}
                            </p>
                          </div>

                          {/* Medications */}
                          <div className="lg:col-span-3">
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
                          <div className="lg:col-span-1 flex items-center">
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <FiCalendar className="w-3 h-3 lg:hidden" />
                              {formatDate(prescription.created_at)}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="lg:col-span-1 flex items-center">
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
                                <span className="hidden sm:inline">
                                  Dispense
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
