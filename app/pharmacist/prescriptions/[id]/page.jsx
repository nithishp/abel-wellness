"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
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
import { motion } from "framer-motion";
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-4 py-2 text-sm font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Pending Dispensing
          </span>
        );
      case "dispensed":
        return (
          <span className="px-4 py-2 text-sm font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-2">
            <FiCheck className="w-4 h-4" />
            Dispensed
          </span>
        );
      default:
        return (
          <span className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
            {status}
          </span>
        );
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prescription...</p>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Prescription Not Found
          </h3>
          <button
            onClick={() => router.push("/pharmacist/prescriptions")}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to Prescriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/pharmacist/prescriptions")}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Prescription Details
                </h1>
                <p className="text-sm text-gray-500">
                  ID: {prescription.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            {getStatusBadge(prescription.status)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Patient & Doctor Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Patient Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                Patient Information
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <FiUser className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {prescription.patient_name}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {prescription.patient_email && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <FiMail className="w-4 h-4 text-gray-400" />
                    {prescription.patient_email}
                  </p>
                )}
                {prescription.patient_phone && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <FiPhone className="w-4 h-4 text-gray-400" />
                    {prescription.patient_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Doctor & Date Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">
                Prescription Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prescribed by</p>
                    <p className="font-medium text-gray-900">
                      Dr. {prescription.doctor_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FiCalendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created on</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(prescription.created_at)}
                    </p>
                  </div>
                </div>
                {prescription.dispensed_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FiCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dispensed on</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(prescription.dispensed_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Medications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiPackage className="w-5 h-5 text-emerald-600" />
              Medications ({prescription.items?.length || 0})
            </h3>

            {prescription.items?.length > 0 ? (
              <div className="space-y-4">
                {prescription.items.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {item.medication_name}
                        </h4>
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          {item.dosage && (
                            <div>
                              <span className="text-gray-500">Dosage:</span>
                              <p className="font-medium">{item.dosage}</p>
                            </div>
                          )}
                          {item.frequency && (
                            <div>
                              <span className="text-gray-500">Frequency:</span>
                              <p className="font-medium">{item.frequency}</p>
                            </div>
                          )}
                          {item.duration && (
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <p className="font-medium">{item.duration}</p>
                            </div>
                          )}
                          {item.quantity && (
                            <div>
                              <span className="text-gray-500">Quantity:</span>
                              <p className="font-medium">{item.quantity}</p>
                            </div>
                          )}
                        </div>
                        {item.instructions && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Instructions:</strong> {item.instructions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No medications listed
              </p>
            )}
          </motion.div>

          {/* Notes */}
          {prescription.notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiFileText className="w-5 h-5 text-gray-600" />
                Notes
              </h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                {prescription.notes}
              </p>
            </motion.div>
          )}

          {/* Actions */}
          {prescription.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Ready to dispense?
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Mark this prescription as dispensed once the patient has
                    received the medications.
                  </p>
                </div>
                <button
                  onClick={handleDispense}
                  disabled={dispensing}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PrescriptionDetailsPage;
