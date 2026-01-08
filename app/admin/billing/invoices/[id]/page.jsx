"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../components/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  FiArrowLeft,
  FiDownload,
  FiPrinter,
  FiDollarSign,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiClock,
  FiUser,
  FiCalendar,
  FiFileText,
  FiCreditCard,
  FiCheck,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

export default function InvoiceDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { user, loading: authLoading } = useRoleAuth();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
    transaction_reference: "",
    notes: "",
  });
  const [processingPayment, setProcessingPayment] = useState(false);

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
  }, [id, user, authLoading, router]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${id}`);
      const data = await res.json();

      if (data.success) {
        setInvoice(data.invoice);
        const amountDue =
          parseFloat(data.invoice.total_amount) -
          parseFloat(data.invoice.amount_paid);
        setPaymentData((prev) => ({
          ...prev,
          amount: amountDue > 0 ? amountDue.toString() : "",
        }));
      } else {
        toast.error(data.error || "Failed to fetch invoice");
        router.push("/admin/billing/invoices");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Failed to fetch invoice");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "paid":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/20",
        };
      case "partial":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-400",
          border: "border-yellow-500/20",
        };
      case "pending":
        return {
          bg: "bg-orange-500/10",
          text: "text-orange-400",
          border: "border-orange-500/20",
        };
      case "cancelled":
        return {
          bg: "bg-slate-500/10",
          text: "text-slate-400",
          border: "border-slate-500/20",
        };
      case "draft":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          border: "border-blue-500/20",
        };
      default:
        return {
          bg: "bg-slate-500/10",
          text: "text-slate-400",
          border: "border-slate-500/20",
        };
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/billing/invoices/${id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${invoice.invoice_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Invoice downloaded");
      } else {
        toast.error("Failed to download invoice");
      }
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setProcessingPayment(true);
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: id,
          patient_id: invoice.patient_id,
          amount: parseFloat(paymentData.amount),
          payment_method: paymentData.payment_method,
          transaction_reference: paymentData.transaction_reference || null,
          notes: paymentData.notes || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Payment recorded successfully");
        setShowPaymentModal(false);
        fetchInvoice();
      } else {
        toast.error(data.error || "Failed to record payment");
      }
    } catch (error) {
      toast.error("Failed to record payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelInvoice = async () => {
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          status: "cancelled",
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Invoice cancelled");
        setShowCancelModal(false);
        fetchInvoice();
      } else {
        toast.error(data.error || "Failed to cancel invoice");
      }
    } catch (error) {
      toast.error("Failed to cancel invoice");
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

  const statusConfig = getStatusConfig(invoice.status);
  const amountDue =
    parseFloat(invoice.total_amount) - parseFloat(invoice.amount_paid);

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 ml-12 lg:ml-0">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/billing/invoices"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {invoice.invoice_number}
                </h1>
                <span
                  className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-slate-400 mt-1">
                Created on {formatDateTime(invoice.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              <FiDownload className="w-4 h-4" />
              Download PDF
            </button>
            {invoice.status !== "paid" && invoice.status !== "cancelled" && (
              <>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <FiDollarSign className="w-4 h-4" />
                  Record Payment
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient & Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FiUser className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Patient</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">
                    {invoice.patient?.full_name || "Unknown"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {invoice.patient?.email || "-"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {invoice.patient?.phone || "-"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FiCalendar className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice Date</span>
                    <span className="text-white">
                      {formatDate(invoice.invoice_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Due Date</span>
                    <span className="text-white">
                      {formatDate(invoice.due_date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-white">Items</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                        Description
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                        Unit Price
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                        Tax
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index} className="border-b border-slate-700/50">
                        <td className="py-3 px-4">
                          <p className="text-white">{item.description}</p>
                          <p className="text-sm text-slate-400 capitalize">
                            {item.item_type}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {item.tax_rate}%
                        </td>
                        <td className="py-3 px-4 text-right text-white font-medium">
                          {formatCurrency(item.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-white">
                    Payment History
                  </h3>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {invoice.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-slate-400">
                          {payment.payment_method} •{" "}
                          {formatDateTime(payment.payment_date)}
                        </p>
                        {payment.transaction_reference && (
                          <p className="text-xs text-slate-500">
                            Ref: {payment.transaction_reference}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400">
                          <FiCheck className="w-3 h-3" />
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-white">
                    {formatCurrency(invoice.tax_amount)}
                  </span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Discount</span>
                    <span className="text-red-400">
                      -{formatCurrency(invoice.discount_amount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Total</span>
                    <span className="text-white font-semibold text-lg">
                      {formatCurrency(invoice.total_amount)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paid</span>
                  <span className="text-emerald-400">
                    {formatCurrency(invoice.amount_paid)}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Amount Due</span>
                    <span
                      className={`font-bold text-lg ${
                        amountDue > 0 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {formatCurrency(amountDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                <p className="text-slate-400 text-sm whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Record Payment
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter amount"
                  required
                />
                <p className="text-sm text-slate-400 mt-1">
                  Amount due: {formatCurrency(amountDue)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      payment_method: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Transaction Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentData.transaction_reference}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      transaction_reference: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., UPI transaction ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  placeholder="Payment notes..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {processingPayment ? "Processing..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelInvoice}
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? This action cannot be undone."
        confirmText="Cancel Invoice"
        confirmVariant="danger"
      />
    </div>
  );
}
