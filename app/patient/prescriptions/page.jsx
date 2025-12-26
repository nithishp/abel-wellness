"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiArrowLeft,
  FiPackage,
  FiCalendar,
  FiUser,
  FiCheck,
  FiClock,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";

const PatientPrescriptionsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, isPatient } = useRoleAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

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

    fetchPrescriptions();
  }, [user, authLoading, router]);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/patient/prescriptions");
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prescriptions...</p>
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
                My Prescriptions
              </h1>
              <p className="text-sm text-gray-500">
                View all your prescriptions
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No prescriptions yet
            </h3>
            <p className="text-gray-500">
              You'll see prescriptions here after your consultations
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {prescriptions.map((prescription, index) => (
              <motion.div
                key={prescription.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border overflow-hidden"
              >
                {/* Prescription Header */}
                <div className="p-6 border-b bg-gray-50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <FiCalendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatDate(prescription.created_at)}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            prescription.status === "dispensed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {prescription.status === "dispensed" ? (
                            <span className="flex items-center gap-1">
                              <FiCheck className="w-3 h-3" />
                              Dispensed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <FiUser className="w-4 h-4" />
                        Prescribed by Dr. {prescription.doctor_name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medications List */}
                <div className="p-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Medications
                  </h4>
                  <div className="space-y-4">
                    {prescription.items?.map((item, itemIndex) => (
                      <div
                        key={itemIndex}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {item.medication_name}
                            </h5>
                            <div className="mt-2 space-y-1">
                              {item.dosage && (
                                <p className="text-sm text-gray-600">
                                  <strong>Dosage:</strong> {item.dosage}
                                </p>
                              )}
                              {item.frequency && (
                                <p className="text-sm text-gray-600">
                                  <strong>Frequency:</strong> {item.frequency}
                                </p>
                              )}
                              {item.duration && (
                                <p className="text-sm text-gray-600">
                                  <strong>Duration:</strong> {item.duration}
                                </p>
                              )}
                              {item.quantity && (
                                <p className="text-sm text-gray-600">
                                  <strong>Quantity:</strong> {item.quantity}
                                </p>
                              )}
                              {item.instructions && (
                                <p className="text-sm text-gray-500 mt-2 italic">
                                  {item.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {prescription.notes && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Notes:</strong> {prescription.notes}
                      </p>
                    </div>
                  )}

                  {prescription.dispensed_at && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>Dispensed on:</strong>{" "}
                        {formatDate(prescription.dispensed_at)}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPrescriptionsPage;
