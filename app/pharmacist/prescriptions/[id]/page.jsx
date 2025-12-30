"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PharmacistSidebar from "../../components/PharmacistSidebar";
import {
  FiArrowLeft,
  FiPackage,
  FiCalendar,
  FiUser,
  FiCheck,
  FiClock,
  FiPhone,
  FiMail,
  FiFileText,
} from "react-icons/fi";
import { toast } from "sonner";

const PrescriptionDetailsPage = ({ params }) => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const { id } = use(params);

  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);

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

    fetchPrescription();
  }, [user, authLoading, router, id]);

  const fetchPrescription = async () => {
    try {
      const response = await fetch(`/api/pharmacist/prescriptions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPrescription(data.prescription);
      } else if (response.status === 404) {
        toast.error("Prescription not found");
        router.push("/pharmacist/prescriptions");
      } else {
        toast.error("Failed to load prescription");
      }
    } catch (error) {
      console.error("Error fetching prescription:", error);
      toast.error("Failed to load prescription");
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    setDispensing(true);
    try {
      const response = await fetch(
        `/api/pharmacist/prescriptions/${id}/dispense`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Prescription marked as dispensed");
        fetchPrescription();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to dispense prescription");
      }
    } catch (error) {
      console.error("Error dispensing prescription:", error);
      toast.error("Failed to dispense prescription");
    } finally {
      setDispensing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        icon: FiClock,
        label: "Pending Dispensing",
      },
      dispensed: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        icon: FiCheck,
        label: "Dispensed",
      },
    };
    return configs[status] || configs.pending;
  };

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
    <main className="lg:ml-72 min-h-screen">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="px-6 lg:px-8 py-4">
          <div className="h-8 w-48 bg-slate-700/50 rounded animate-pulse"></div>
        </div>
      </header>
      <div className="p-6 lg:p-8 animate-pulse">
        <div className="h-48 bg-slate-800/50 rounded-2xl mb-6"></div>
        <div className="h-64 bg-slate-800/50 rounded-2xl"></div>
      </div>
    </main>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <PharmacistSidebar />
        <ContentSkeleton />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <FiPackage className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium text-lg mb-2">
            Prescription Not Found
          </p>
          <button
            onClick={() => router.push("/pharmacist/prescriptions")}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 transition-all"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(prescription.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PharmacistSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 ml-12 lg:ml-0">
                <button
                  onClick={() => router.push("/pharmacist/prescriptions")}
                  className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Prescription Details
                  </h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    ID: {prescription.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <span
                className={`px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2 ${statusConfig.bg} ${statusConfig.text}`}
              >
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Patient & Doctor Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Patient Card */}
              <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Patient Information
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <FiUser className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">
                      {prescription.patient_name}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {prescription.patient_email && (
                    <p className="text-slate-400 flex items-center gap-3">
                      <FiMail className="w-4 h-4 text-slate-500" />
                      {prescription.patient_email}
                    </p>
                  )}
                  {prescription.patient_phone && (
                    <p className="text-slate-400 flex items-center gap-3">
                      <FiPhone className="w-4 h-4 text-slate-500" />
                      {prescription.patient_phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Doctor & Date Card */}
              <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                  Prescription Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <FiUser className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Prescribed by</p>
                      <p className="font-medium text-white">
                        Dr. {prescription.doctor_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                      <FiCalendar className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Created on</p>
                      <p className="font-medium text-white">
                        {formatDate(prescription.created_at)}
                      </p>
                    </div>
                  </div>
                  {prescription.dispensed_at && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <FiCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Dispensed on</p>
                        <p className="font-medium text-white">
                          {formatDate(prescription.dispensed_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiPackage className="w-5 h-5 text-purple-400" />
                Medications ({prescription.items?.length || 0})
              </h3>

              {prescription.items?.length > 0 ? (
                <div className="space-y-4">
                  {prescription.items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-xl bg-slate-700/30 border border-slate-600/30 p-4 hover:bg-slate-700/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-lg">
                            {item.medication_name}
                          </h4>
                          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            {item.dosage && (
                              <div>
                                <span className="text-slate-500">Dosage</span>
                                <p className="font-medium text-slate-300">
                                  {item.dosage}
                                </p>
                              </div>
                            )}
                            {item.frequency && (
                              <div>
                                <span className="text-slate-500">
                                  Frequency
                                </span>
                                <p className="font-medium text-slate-300">
                                  {item.frequency}
                                </p>
                              </div>
                            )}
                            {item.duration && (
                              <div>
                                <span className="text-slate-500">Duration</span>
                                <p className="font-medium text-slate-300">
                                  {item.duration}
                                </p>
                              </div>
                            )}
                            {item.quantity && (
                              <div>
                                <span className="text-slate-500">Quantity</span>
                                <p className="font-medium text-slate-300">
                                  {item.quantity}
                                </p>
                              </div>
                            )}
                          </div>
                          {item.instructions && (
                            <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                              <p className="text-sm text-blue-400">
                                <strong>Instructions:</strong>{" "}
                                {item.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">No medications listed</p>
                </div>
              )}
            </div>

            {/* Notes */}
            {prescription.notes && (
              <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FiFileText className="w-5 h-5 text-slate-400" />
                  Notes
                </h3>
                <p className="text-slate-400 bg-slate-700/30 p-4 rounded-xl border border-slate-600/30">
                  {prescription.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            {prescription.status === "pending" && (
              <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      Ready to dispense?
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Mark this prescription as dispensed once the patient has
                      received the medications.
                    </p>
                  </div>
                  <button
                    onClick={handleDispense}
                    disabled={dispensing}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                  >
                    {dispensing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-5 h-5" />
                        Mark as Dispensed
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrescriptionDetailsPage;
