"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiUser,
  FiCalendar,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const ITEM_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "medication", label: "Medication" },
  { value: "supply", label: "Supply" },
  { value: "procedure", label: "Procedure" },
  { value: "lab_test", label: "Lab Test" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

export default function CreateInvoicePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [searchPatient, setSearchPatient] = useState("");
  const [settings, setSettings] = useState({});
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  const [formData, setFormData] = useState({
    patient_id: "",
    appointment_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    discount_amount: 0,
    discount_reason: "",
    notes: "",
    status: "pending",
  });

  const [items, setItems] = useState([
    {
      id: Date.now(),
      item_type: "consultation",
      description: "",
      quantity: 1,
      unit: "unit",
      unit_price: 0,
      tax_rate: 0,
    },
  ]);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      toast.error("Access denied. Admin account required.");
      router.push("/");
      return;
    }
    fetchSettings();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchPatient.length >= 2) {
      searchPatients(searchPatient);
    } else {
      setPatients([]);
    }
  }, [searchPatient]);

  useEffect(() => {
    if (formData.patient_id) {
      fetchPatientAppointments(formData.patient_id);
    }
  }, [formData.patient_id]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/billing/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);

        const paymentDueDays = parseInt(data.settings.payment_due_days) || 7;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + paymentDueDays);
        setFormData((prev) => ({
          ...prev,
          due_date: dueDate.toISOString().split("T")[0],
        }));

        const defaultTaxRate = parseFloat(data.settings.default_tax_rate) || 0;
        setItems((prev) =>
          prev.map((item) => ({ ...item, tax_rate: defaultTaxRate }))
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const searchPatients = async (query) => {
    try {
      const res = await fetch(
        `/api/admin/patients?search=${encodeURIComponent(query)}&limit=10`
      );
      const data = await res.json();
      if (res.ok && data.patients) {
        setPatients(data.patients || []);
        setShowPatientDropdown(true);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
    }
  };

  const fetchPatientAppointments = async (patientId) => {
    try {
      const res = await fetch(
        `/api/admin/appointments?patientId=${patientId}&status=completed&limit=10`
      );
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData((prev) => ({
      ...prev,
      patient_id: patient.id,
      appointment_id: "",
    }));
    setSelectedAppointment(null);
    setSearchPatient("");
    setPatients([]);
    setShowPatientDropdown(false);
  };

  const handleAppointmentSelect = (appointmentId) => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    setSelectedAppointment(appointment);
    setFormData((prev) => ({ ...prev, appointment_id: appointmentId }));

    if (appointment?.doctor) {
      const consultationFee = appointment.doctor.consultation_fee || 0;
      const doctorName = appointment.doctor.user?.full_name || "Doctor";
      const specialization = appointment.doctor.specialization || "General";

      const hasConsultation = items.some(
        (item) =>
          item.item_type === "consultation" &&
          item.description.includes("Consultation")
      );

      if (!hasConsultation && consultationFee > 0) {
        setItems((prev) => [
          {
            id: Date.now(),
            item_type: "consultation",
            description: `Consultation - Dr. ${doctorName} (${specialization})`,
            quantity: 1,
            unit: "session",
            unit_price: consultationFee,
            tax_rate: parseFloat(settings.default_tax_rate) || 0,
          },
          ...prev.filter((item) => item.description),
        ]);
      }
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        item_type: "service",
        description: "",
        quantity: 1,
        unit: "unit",
        unit_price: 0,
        tax_rate: parseFloat(settings.default_tax_rate) || 0,
      },
    ]);
  };

  const removeItem = (id) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unit_price;
    const taxAmount = subtotal * (item.tax_rate / 100);
    return subtotal + taxAmount;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxAmount = items.reduce(
      (sum, item) =>
        sum + item.quantity * item.unit_price * (item.tax_rate / 100),
      0
    );
    const discount = parseFloat(formData.discount_amount) || 0;
    const total = subtotal + taxAmount - discount;

    return { subtotal, taxAmount, discount, total };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    if (!formData.patient_id) {
      toast.error("Please select a patient");
      return;
    }

    const validItems = items.filter(
      (item) => item.description && item.unit_price > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? "draft" : "pending",
          items: validItems.map((item) => ({
            item_type: item.item_type,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          isDraft ? "Invoice saved as draft" : "Invoice created successfully"
        );
        router.push(`/admin/billing/invoices/${data.invoice.id}`);
      } else {
        toast.error(data.error || "Failed to create invoice");
      }
    } catch (error) {
      toast.error("Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AdminSidebar />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 ml-12 lg:ml-0">
          <Link
            href="/admin/billing/invoices"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create Invoice</h1>
            <p className="text-slate-400">Create a new invoice for a patient</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Selection */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FiUser className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Patient</h3>
                </div>

                {selectedPatient ? (
                  <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="text-white font-medium">
                        {selectedPatient.full_name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {selectedPatient.email} • {selectedPatient.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setFormData((prev) => ({
                          ...prev,
                          patient_id: "",
                          appointment_id: "",
                        }));
                        setAppointments([]);
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patients by name, email, or phone..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
                    />
                    {showPatientDropdown && patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                        {patients.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => handlePatientSelect(patient)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
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
                )}

                {selectedPatient && appointments.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Link to Appointment (Optional)
                    </label>
                    <select
                      value={formData.appointment_id}
                      onChange={(e) => handleAppointmentSelect(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select an appointment</option>
                      {appointments.map((apt) => (
                        <option key={apt.id} value={apt.id}>
                          {new Date(apt.date).toLocaleDateString()} -{" "}
                          {apt.doctor?.user?.full_name || "Unknown Doctor"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Invoice Items */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-colors text-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-slate-400">
                          Item {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Type
                          </label>
                          <select
                            value={item.item_type}
                            onChange={(e) =>
                              updateItem(item.id, "item_type", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                          >
                            {ITEM_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter description"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "unit_price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Tax %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.tax_rate}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "tax_rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">
                            Total
                          </label>
                          <div className="px-3 py-2 bg-slate-600/30 rounded-lg text-white text-sm font-medium">
                            {formatCurrency(calculateItemTotal(item))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dates & Notes */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Details & Notes
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          invoice_date: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          due_date: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="Additional notes for the invoice..."
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Summary
                </h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax</span>
                    <span className="text-white">
                      {formatCurrency(totals.taxAmount)}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-400">Discount</span>
                      <span className="text-red-400">
                        -{formatCurrency(totals.discount)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount_amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="Discount amount"
                    />
                  </div>

                  <div className="border-t border-slate-700 pt-3">
                    <div className="flex justify-between">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-white font-bold text-xl">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Creating..." : "Create Invoice"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
