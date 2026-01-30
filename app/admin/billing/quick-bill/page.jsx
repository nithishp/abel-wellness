"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "sonner";
import {
  FiZap,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiPrinter,
  FiCheck,
  FiUser,
} from "react-icons/fi";

export default function QuickBillPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [items, setItems] = useState([
    { description: "", quantity: 1, unit_price: 0, item_type: "consultation" },
  ]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchDoctors();
  }, [user, authLoading, router]);

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/billing/quick-bill?type=doctors");
      const data = await res.json();
      if (data.doctors) {
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const searchPatients = async (query) => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/billing/quick-bill?type=patients&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data.patients) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  };

  const handlePatientSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchPatients(query);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.full_name);
    setShowPatientSearch(false);
    setPatients([]);
  };

  const addItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unit_price: 0, item_type: "service" },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      return (
        sum +
        (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
      );
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }

    if (items.some((item) => !item.description || !item.unit_price)) {
      toast.error("Please fill in all item details");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/billing/quick-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          doctor_id: selectedDoctor || null,
          items: items.map((item) => ({
            ...item,
            quantity: parseFloat(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price) || 0,
          })),
          payment_method: paymentMethod,
          notes,
          created_by: user?.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Quick bill created successfully!");
        router.push(`/admin/billing/invoices/${data.invoice.id}`);
      } else {
        toast.error(data.error || "Failed to create quick bill");
      }
    } catch (error) {
      console.error("Error creating quick bill:", error);
      toast.error("Failed to create quick bill");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-72">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/admin/dashboard" },
            { label: "Billing", href: "/admin/billing" },
            { label: "Quick Bill" },
          ]}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FiZap className="text-amber-500" />
                Quick Bill
              </h1>
              <p className="text-slate-400 mt-1">
                Create a quick bill for walk-in patients
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl">
            {/* Patient Selection */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiUser className="text-emerald-500" />
                Patient Information
              </h2>

              <div className="relative">
                <label className="block text-sm text-slate-400 mb-2">
                  Search Patient
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handlePatientSearch}
                    onFocus={() => setShowPatientSearch(true)}
                    placeholder="Search by name, email, or phone..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                {showPatientSearch && patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700 last:border-0"
                      >
                        <p className="text-white font-medium">
                          {patient.full_name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {patient.email} • {patient.phone}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FiCheck className="text-emerald-500" />
                    <div>
                      <p className="text-white font-medium">
                        {selectedPatient.full_name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {selectedPatient.email} • {selectedPatient.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Doctor (Optional)
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user?.full_name || doctor.name} -{" "}
                      {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bill Items */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Bill Items
              </h2>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-end"
                  >
                    <div className="col-span-5">
                      <label className="block text-xs text-slate-400 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">
                        Type
                      </label>
                      <select
                        value={item.item_type}
                        onChange={(e) =>
                          updateItem(index, "item_type", e.target.value)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        <option value="consultation">Consultation</option>
                        <option value="medication">Medication</option>
                        <option value="service">Service</option>
                        <option value="procedure">Procedure</option>
                        <option value="lab_test">Lab Test</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", e.target.value)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, "unit_price", e.target.value)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addItem}
                className="mt-4 flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
              >
                <FiPlus /> Add Item
              </button>

              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-slate-300">Total Amount</span>
                  <span className="text-white font-bold text-2xl">
                    ₹
                    {calculateTotal().toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Payment</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["cash", "card", "upi", "bank_transfer"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-lg border text-center capitalize transition-all ${
                      paymentMethod === method
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    {method.replace("_", " ")}
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm text-slate-400 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !selectedPatient}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck /> Create Bill & Collect Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
