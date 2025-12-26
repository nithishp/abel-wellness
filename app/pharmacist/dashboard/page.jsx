"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiPackage,
  FiClock,
  FiCheck,
  FiLogOut,
  FiRefreshCw,
  FiUser,
  FiBell,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";

const PharmacistDashboardPage = () => {
  const router = useRouter();
  const { user, logout, loading: authLoading, isPharmacist } = useRoleAuth();

  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    dispensedToday: 0,
    totalDispensed: 0,
  });
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

    // Check if user has pharmacist role
    if (user.role !== "pharmacist") {
      toast.error("Access denied. Pharmacist account required.");
      router.push("/");
      return;
    }

    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/pharmacist/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setPrescriptions(data.pendingPrescriptions || []);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleDispense = async (prescriptionId) => {
    try {
      const response = await fetch(
        `/api/pharmacist/prescriptions/${prescriptionId}/dispense`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        toast.success("Prescription marked as dispensed");
        fetchDashboardData();
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
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
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <FiPackage className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Pharmacy Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome, {user?.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/pharmacist/notifications")}
                className="p-2 hover:bg-gray-100 rounded-lg relative"
              >
                <FiBell className="w-5 h-5 text-gray-600" />
                {stats.pendingPrescriptions > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiLogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Prescriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.pendingPrescriptions}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dispensed Today</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.dispensedToday}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Dispensed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalDispensed}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push("/pharmacist/prescriptions")}
              className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <FiPackage className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-gray-900">All Prescriptions</p>
              <p className="text-sm text-gray-500">View full list</p>
            </button>
            <button
              onClick={fetchDashboardData}
              className="p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <FiRefreshCw className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Refresh</p>
              <p className="text-sm text-gray-500">Update data</p>
            </button>
          </div>
        </div>

        {/* Pending Prescriptions */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Prescriptions
            </h2>
            <p className="text-sm text-gray-500">
              Prescriptions awaiting dispensing
            </p>
          </div>

          {prescriptions.length === 0 ? (
            <div className="p-12 text-center">
              <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending prescriptions
              </h3>
              <p className="text-gray-500">
                All prescriptions have been dispensed
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {prescriptions.map((prescription) => (
                <motion.div
                  key={prescription.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FiUser className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">
                          {prescription.patient_name}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        Prescribed by Dr. {prescription.doctor_name} on{" "}
                        {formatDate(prescription.created_at)}
                      </p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Medications:
                        </p>
                        <ul className="space-y-1">
                          {prescription.items?.map((item, index) => (
                            <li key={index} className="text-sm text-gray-600">
                              • {item.medication_name} - {item.dosage}{" "}
                              {item.frequency && `(${item.frequency})`}
                              {item.duration && ` for ${item.duration}`}
                            </li>
                          ))}
                        </ul>
                        {prescription.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            Notes: {prescription.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/pharmacist/prescriptions/${prescription.id}`
                          )
                        }
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDispense(prescription.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FiCheck className="w-4 h-4" />
                        Dispense
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboardPage;
