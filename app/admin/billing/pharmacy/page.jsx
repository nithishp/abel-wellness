"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "sonner";
import {
  FiShoppingBag,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiUser,
  FiPackage,
} from "react-icons/fi";

export default function PharmacyBillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [user, authLoading, router]);

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

  const searchInventory = async (query) => {
    if (!query || query.length < 2) {
      setInventoryItems([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/inventory/items?search=${encodeURIComponent(query)}&limit=10`
      );
      const data = await res.json();
      if (data.items) {
        setInventoryItems(data.items);
      }
    } catch (error) {
      console.error("Error searching inventory:", error);
    }
  };

  const handlePatientSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchPatients(query);
  };

  const handleItemSearch = (e) => {
    const query = e.target.value;
    setItemSearchQuery(query);
    searchInventory(query);
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.full_name);
    setShowPatientSearch(false);
    setPatients([]);
  };

  const addInventoryItem = (item) => {
    // Check if already added
    if (items.some((i) => i.inventory_item_id === item.id)) {
      toast.error("Item already added");
      return;
    }

    setItems([
      ...items,
      {
        inventory_item_id: item.id,
        description: item.name,
        quantity: 1,
        unit_price: parseFloat(item.selling_price) || 0,
        item_type: "medication",
        available_stock: item.current_stock,
      },
    ]);
    setItemSearchQuery("");
    setInventoryItems([]);
    setShowItemSearch(false);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
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

    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    // Check stock availability
    for (const item of items) {
      if (item.quantity > item.available_stock) {
        toast.error(`Insufficient stock for ${item.description}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/billing/pharmacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          items: items.map((item) => ({
            inventory_item_id: item.inventory_item_id,
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            unit_price: parseFloat(item.unit_price) || 0,
            item_type: "medication",
          })),
          payment_method: paymentMethod,
          notes,
          created_by: user?.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Pharmacy bill created successfully!");
        router.push(`/admin/billing/invoices/${data.invoice.id}`);
      } else {
        toast.error(data.error || "Failed to create pharmacy bill");
      }
    } catch (error) {
      console.error("Error creating pharmacy bill:", error);
      toast.error("Failed to create pharmacy bill");
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
            { label: "Pharmacy Billing" },
          ]}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FiShoppingBag className="text-teal-500" />
                Pharmacy Billing
              </h1>
              <p className="text-slate-400 mt-1">
                Create pharmacy bills with automatic stock deduction
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
            </div>

            {/* Add Medications */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FiPackage className="text-teal-500" />
                Add Medications
              </h2>

              <div className="relative mb-4">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={handleItemSearch}
                    onFocus={() => setShowItemSearch(true)}
                    placeholder="Search medications by name or SKU..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>

                {showItemSearch && inventoryItems.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {inventoryItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addInventoryItem(item)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-slate-700 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">
                              {item.name}
                            </p>
                            <p className="text-sm text-slate-400">
                              {item.sku} • Stock: {item.current_stock}
                            </p>
                          </div>
                          <p className="text-emerald-400 font-semibold">
                            ₹{item.selling_price}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Items */}
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          {item.description}
                        </p>
                        <p className="text-sm text-slate-400">
                          Stock: {item.available_stock}
                        </p>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          max={item.available_stock}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", e.target.value)
                          }
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                        />
                      </div>
                      <div className="w-28 text-right">
                        <p className="text-emerald-400 font-semibold">
                          ₹
                          {(item.quantity * item.unit_price).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          @₹{item.unit_price}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <FiPackage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Search and add medications above</p>
                </div>
              )}

              {items.length > 0 && (
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
              )}
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
                        ? "bg-teal-500/20 border-teal-500 text-teal-400"
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting || !selectedPatient || items.length === 0}
                className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiCheck /> Create Pharmacy Bill
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
