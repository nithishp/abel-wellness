"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiSave,
  FiDollarSign,
  FiFileText,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

const ITEM_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "medication", label: "Medication" },
  { value: "supply", label: "Supply" },
  { value: "procedure", label: "Procedure" },
  { value: "lab_test", label: "Lab Test" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

export default function EditInvoicePage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, loading: authLoading } = useRoleAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});

  const [formData, setFormData] = useState({
    invoice_date: "",
    due_date: "",
    discount_amount: 0,
    discount_reason: "",
    notes: "",
  });

  const [items, setItems] = useState([]);

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
    fetchInvoice();
    fetchSettings();
  }, [id, user, authLoading, router]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${id}`);
      const data = await res.json();

      if (data.success) {
        const inv = data.invoice;

        // Check if invoice is editable (only drafts can be edited)
        if (inv.status !== "draft") {
          toast.error("Only draft invoices can be edited");
          router.push(`/admin/billing/invoices/${id}`);
          return;
        }

        setInvoice(inv);
        setFormData({
          invoice_date:
            inv.invoice_date || new Date().toISOString().split("T")[0],
          due_date: inv.due_date || "",
          discount_amount: inv.discount_amount || 0,
          discount_reason: inv.discount_reason || "",
          notes: inv.notes || "",
        });

        // Load existing items
        if (inv.items && inv.items.length > 0) {
          setItems(
            inv.items.map((item, index) => ({
              id: item.id || Date.now() + index,
              item_type: item.item_type || "service",
              description: item.description || "",
              quantity: item.quantity || 1,
              unit: item.unit || "unit",
              unit_price: item.unit_price || 0,
              tax_rate: item.tax_rate || 0,
            }))
          );
        } else {
          // Add empty item if no items exist
          setItems([
            {
              id: Date.now(),
              item_type: "service",
              description: "",
              quantity: 1,
              unit: "unit",
              unit_price: 0,
              tax_rate: 0,
            },
          ]);
        }
      } else {
        toast.error(data.error || "Failed to fetch invoice");
        router.push("/admin/billing/invoices");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Failed to fetch invoice");
      router.push("/admin/billing/invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/billing/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const addItem = () => {
    const taxEnabled = settings.tax_enabled !== false;
    const taxRate = taxEnabled ? parseFloat(settings.default_tax_rate) || 0 : 0;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        item_type: "service",
        description: "",
        quantity: 1,
        unit: "unit",
        unit_price: 0,
        tax_rate: taxRate,
      },
    ]);
  };

  const removeItem = (itemId) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const calculateItemTotal = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const taxRate = Number(item.tax_rate) || 0;
    const subtotal = quantity * unitPrice;
    const taxAmount = subtotal * (taxRate / 100);
    return subtotal + taxAmount;
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      0
    );
    const taxAmount = items.reduce(
      (sum, item) =>
        sum +
        (Number(item.quantity) || 0) *
          (Number(item.unit_price) || 0) *
          ((Number(item.tax_rate) || 0) / 100),
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

  const handleSubmit = async (e, saveAsDraft = true) => {
    e.preventDefault();

    const validItems = items.filter(
      (item) => item.description && item.unit_price > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid item");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_date: formData.invoice_date,
          due_date: formData.due_date,
          discount_amount: parseFloat(formData.discount_amount) || 0,
          discount_reason: formData.discount_reason,
          notes: formData.notes,
          status: saveAsDraft ? "draft" : "pending",
          items: validItems.map((item) => ({
            item_type: item.item_type,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unit_price: Number(item.unit_price),
            tax_rate: Number(item.tax_rate),
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          saveAsDraft
            ? "Invoice saved as draft"
            : "Invoice updated and finalized"
        );
        router.push(`/admin/billing/invoices/${id}`);
      } else {
        toast.error(data.error || "Failed to update invoice");
      }
    } catch (error) {
      toast.error("Failed to update invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const totals = calculateTotals();

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

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AdminSidebar />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <FiFileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Invoice not found
            </h3>
            <Link
              href="/admin/billing/invoices"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Go back to invoices
            </Link>
          </div>
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
              {
                label: "Invoices",
                href: "/admin/billing/invoices",
                icon: <FiFileText className="w-4 h-4" />,
              },
              {
                label: invoice.invoice_number,
                href: `/admin/billing/invoices/${id}`,
              },
              { label: "Edit" },
            ]}
            backHref={`/admin/billing/invoices/${id}`}
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ml-12 lg:ml-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Edit Invoice - {invoice.invoice_number}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Patient: {invoice.patient?.full_name || "Unknown"}
            </p>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, true)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ml-12 lg:ml-0">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Invoice Details */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Invoice Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      required
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
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Invoice Items
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-1">
                          <label className="block text-xs font-medium text-slate-400 mb-1">
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
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500"
                            placeholder="Item description"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Qty
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
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Price
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
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-slate-400 mb-1">
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
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-sm text-slate-400">Total: </span>
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(calculateItemTotal(item))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Discount */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Discount
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Discount Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount_amount: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Discount Reason
                    </label>
                    <input
                      type="text"
                      value={formData.discount_reason}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount_reason: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="Reason for discount"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tax</span>
                    <span className="text-white">
                      {formatCurrency(totals.taxAmount)}
                    </span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Discount</span>
                      <span className="text-red-400">
                        -{formatCurrency(totals.discount)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">Total</span>
                      <span className="text-white font-bold text-lg">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50"
                >
                  <FiSave className="w-5 h-5" />
                  {submitting ? "Saving..." : "Save Draft"}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <FiFileText className="w-5 h-5" />
                  {submitting ? "Processing..." : "Save & Finalize"}
                </button>
                <Link
                  href={`/admin/billing/invoices/${id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
