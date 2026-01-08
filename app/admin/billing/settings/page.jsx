"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiSave,
  FiRefreshCw,
  FiSettings,
  FiHome,
  FiPercent,
  FiCreditCard,
  FiFileText,
  FiDollarSign,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function BillingSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});

  const [formData, setFormData] = useState({
    clinic_name: "Abel Wellness Healthcare Center",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    clinic_gstin: "",
    invoice_prefix: "INV",
    default_tax_rate: "18",
    tax_name: "GST",
    tax_enabled: true,
    payment_due_days: "7",
    enabled_payment_methods: ["cash", "card", "upi", "bank_transfer"],
    invoice_notes: "",
    invoice_terms: "",
    auto_add_consultation_fee: true,
  });

  const PAYMENT_METHODS = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Credit/Debit Card" },
    { value: "upi", label: "UPI" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "online", label: "Online Payment Gateway" },
  ];

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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/settings");
      const data = await res.json();

      if (data.success) {
        const settingsObj = data.settings || {};
        setSettings(settingsObj);

        let paymentMethods = settingsObj.enabled_payment_methods;
        if (typeof paymentMethods === "string") {
          try {
            paymentMethods = JSON.parse(paymentMethods);
          } catch {
            paymentMethods = ["cash", "card", "upi", "bank_transfer"];
          }
        }

        setFormData({
          clinic_name:
            settingsObj.clinic_name || "Abel Wellness Healthcare Center",
          clinic_address: settingsObj.clinic_address || "",
          clinic_phone: settingsObj.clinic_phone || "",
          clinic_email: settingsObj.clinic_email || "",
          clinic_gstin: settingsObj.clinic_gstin || "",
          invoice_prefix: settingsObj.invoice_prefix || "INV",
          default_tax_rate: settingsObj.default_tax_rate || "18",
          tax_name: settingsObj.tax_name || "GST",
          tax_enabled: settingsObj.tax_enabled !== false,
          payment_due_days: settingsObj.payment_due_days || "7",
          enabled_payment_methods: paymentMethods || [
            "cash",
            "card",
            "upi",
            "bank_transfer",
          ],
          invoice_notes: settingsObj.invoice_notes || "",
          invoice_terms: settingsObj.invoice_terms || "",
          auto_add_consultation_fee:
            settingsObj.auto_add_consultation_fee !== false,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentMethodToggle = (method) => {
    setFormData((prev) => {
      const methods = [...prev.enabled_payment_methods];
      const index = methods.indexOf(method);
      if (index > -1) {
        methods.splice(index, 1);
      } else {
        methods.push(method);
      }
      return { ...prev, enabled_payment_methods: methods };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const res = await fetch("/api/billing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            clinic_name: formData.clinic_name,
            clinic_address: formData.clinic_address,
            clinic_phone: formData.clinic_phone,
            clinic_email: formData.clinic_email,
            clinic_gstin: formData.clinic_gstin,
            invoice_prefix: formData.invoice_prefix,
            default_tax_rate: formData.default_tax_rate,
            tax_name: formData.tax_name,
            tax_enabled: formData.tax_enabled,
            payment_due_days: formData.payment_due_days,
            enabled_payment_methods: JSON.stringify(
              formData.enabled_payment_methods
            ),
            invoice_notes: formData.invoice_notes,
            invoice_terms: formData.invoice_terms,
            auto_add_consultation_fee: formData.auto_add_consultation_fee,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Settings saved successfully");
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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

      <main className="lg:ml-72 min-h-screen p-4 sm:p-6 overflow-auto">
        {/* Breadcrumb */}
        <div className="mb-4 ml-12 lg:ml-0">
          <Breadcrumb
            items={[
              {
                label: "Billing",
                href: "/admin/billing",
                icon: <FiDollarSign className="w-4 h-4" />,
              },
              { label: "Settings", icon: <FiSettings className="w-4 h-4" /> },
            ]}
            backHref="/admin/billing"
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 ml-12 lg:ml-0">
          <div>
            <h1 className="text-2xl font-bold text-white">Billing Settings</h1>
            <p className="text-slate-400">
              Configure invoice and payment settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Clinic Information */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FiHome className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Clinic Information
                </h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                This information will appear on invoices
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.clinic_name}
                    onChange={(e) =>
                      handleInputChange("clinic_name", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.clinic_address}
                    onChange={(e) =>
                      handleInputChange("clinic_address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="Full clinic address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.clinic_phone}
                      onChange={(e) =>
                        handleInputChange("clinic_phone", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.clinic_email}
                      onChange={(e) =>
                        handleInputChange("clinic_email", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="clinic@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.clinic_gstin}
                    onChange={(e) =>
                      handleInputChange("clinic_gstin", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="GST Identification Number"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Settings */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <FiFileText className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Invoice Settings
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Invoice Number Prefix
                  </label>
                  <input
                    type="text"
                    value={formData.invoice_prefix}
                    onChange={(e) =>
                      handleInputChange("invoice_prefix", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="INV"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Example: INV-2024-0001
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Payment Due Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.payment_due_days}
                    onChange={(e) =>
                      handleInputChange("payment_due_days", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Default due date is invoice date + this many days
                  </p>
                </div>

                {/* Auto Consultation Fee Toggle */}
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-slate-300">
                        Auto-add Consultation Fee
                      </label>
                      <p className="text-xs text-slate-500 mt-1">
                        Automatically add doctor's consultation fee when
                        creating invoices from appointments
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange(
                          "auto_add_consultation_fee",
                          !formData.auto_add_consultation_fee
                        )
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.auto_add_consultation_fee
                          ? "bg-emerald-600"
                          : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.auto_add_consultation_fee
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Settings */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <FiPercent className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Tax Settings
                </h3>
              </div>

              <div className="space-y-4">
                {/* Enable Tax Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">Enable Tax</p>
                    <p className="text-sm text-slate-400">
                      Apply tax to invoices and billing items
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange("tax_enabled", !formData.tax_enabled)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.tax_enabled ? "bg-emerald-600" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.tax_enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div
                  className={
                    formData.tax_enabled ? "" : "opacity-50 pointer-events-none"
                  }
                >
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Tax Name
                  </label>
                  <input
                    type="text"
                    value={formData.tax_name}
                    onChange={(e) =>
                      handleInputChange("tax_name", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="GST"
                    disabled={!formData.tax_enabled}
                  />
                </div>
                <div
                  className={
                    formData.tax_enabled ? "" : "opacity-50 pointer-events-none"
                  }
                >
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Default Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.default_tax_rate}
                    onChange={(e) =>
                      handleInputChange("default_tax_rate", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    disabled={!formData.tax_enabled}
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <FiCreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Payment Methods
                </h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Enable payment methods accepted by your clinic
              </p>

              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.value}
                    className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.enabled_payment_methods.includes(
                        method.value
                      )}
                      onChange={() => handlePaymentMethodToggle(method.value)}
                      className="w-4 h-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-slate-300 text-sm">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Invoice Notes & Terms */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-500/10 rounded-lg">
                  <FiSettings className="w-5 h-5 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Default Notes & Terms
                </h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                These will be auto-filled on new invoices
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Invoice Notes
                  </label>
                  <textarea
                    value={formData.invoice_notes}
                    onChange={(e) =>
                      handleInputChange("invoice_notes", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="Thank you for your business!"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.invoice_terms}
                    onChange={(e) =>
                      handleInputChange("invoice_terms", e.target.value)
                    }
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="Payment terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end gap-4">
            <Link
              href="/admin/billing"
              className="px-6 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
