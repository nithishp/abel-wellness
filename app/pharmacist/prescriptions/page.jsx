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
  FiSearch,
  FiFilter,
  FiEye,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { toast } from "sonner";

const PharmacistPrescriptionsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
            <FiClock className="w-3 h-3" />
            Pending
          </span>
        );
      case "dispensed":
        return (
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
            <FiCheck className="w-3 h-3" />
            Dispensed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
            {status}
          </span>
        );
    }
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-4">
            <button
              onClick={() => router.push("/pharmacist/dashboard")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                All Prescriptions
              </h1>
              <p className="text-sm text-gray-500">
                Manage and dispense prescriptions
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient or doctor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="dispensed">Dispensed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {filteredPrescriptions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Prescriptions Found
            </h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No prescriptions available"}
            </p>
          </motion.div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription, index) => (
                    <motion.tr
                      key={prescription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/pharmacist/prescriptions/${prescription.id}`
                        )
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <FiUser className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {prescription.patient_name}
                            </p>
                            {prescription.patient_phone && (
                              <p className="text-sm text-gray-500">
                                {prescription.patient_phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-gray-900">
                          Dr. {prescription.doctor_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          {prescription.items?.slice(0, 2).map((item, i) => (
                            <p
                              key={i}
                              className="text-sm text-gray-600 truncate"
                            >
                              • {item.medication_name}
                              {item.dosage && ` - ${item.dosage}`}
                            </p>
                          ))}
                          {prescription.items?.length > 2 && (
                            <p className="text-sm text-gray-400">
                              +{prescription.items.length - 2} more
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(prescription.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(prescription.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/pharmacist/prescriptions/${prescription.id}`
                              );
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          {prescription.status === "pending" && (
                            <button
                              onClick={(e) =>
                                handleDispense(prescription.id, e)
                              }
                              className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
                            >
                              Dispense
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PharmacistPrescriptionsPage;
