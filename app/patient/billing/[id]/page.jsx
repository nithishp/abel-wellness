"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PatientSidebar from "../../components/PatientSidebar";
import {
  FiArrowLeft,
  FiDownload,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiRefreshCw,
  FiCalendar,
  FiCreditCard,
} from "react-icons/fi";
import { toast } from "sonner";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    icon: FiFileText,
    bgBanner: "bg-slate-800/50 border-slate-600/50",
  },
  pending: {
    label: "Pending Payment",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: FiClock,
    bgBanner: "bg-amber-900/20 border-amber-500/30",
  },
  partial: {
    label: "Partially Paid",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    icon: FiAlertCircle,
    bgBanner: "bg-orange-900/20 border-orange-500/30",
  },
  paid: {
    label: "Paid",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: FiCheckCircle,
    bgBanner: "bg-emerald-900/20 border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: FiAlertCircle,
    bgBanner: "bg-red-900/20 border-red-500/30",
  },
  refunded: {
    label: "Refunded",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    icon: FiRefreshCw,
    bgBanner: "bg-violet-900/20 border-violet-500/30",
  },
};

const PAYMENT_METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  online: "Online Payment",
  cheque: "Cheque",
  other: "Other",
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-slate-800/50 rounded-xl border border-slate-700/50" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-32 bg-slate-800/50 rounded-xl border border-slate-700/50" />
          <div className="h-64 bg-slate-800/50 rounded-xl border border-slate-700/50" />
        </div>
        <div className="h-48 bg-slate-800/50 rounded-xl border border-slate-700/50" />
      </div>
    </div>
  );
}

export default function PatientInvoiceDetailPage({ params }) {
  const router = useRouter();
  const { user } = useRoleAuth();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/patient/billing/${id}`);
      const data = await res.json();

      if (data.success) {
        setInvoice(data.invoice);
      } else {
        toast.error(data.error || "Failed to load invoice");
        router.push("/patient/billing");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Failed to load invoice");
      router.push("/patient/billing");
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/billing/invoices/${id}/pdf`);

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Invoice downloaded");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  const status = invoice
    ? STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending
    : STATUS_CONFIG.pending;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PatientSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/patient/billing")}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="ml-8 lg:ml-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {loading
                      ? "Loading..."
                      : `Invoice ${invoice?.invoice_number || ""}`}
                  </h1>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {loading
                      ? "Please wait..."
                      : `Issued on ${formatDate(invoice?.invoice_date)}`}
                  </p>
                </div>
              </div>
              {invoice && (
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  <FiDownload
                    className={`w-5 h-5 ${downloading ? "animate-bounce" : ""}`}
                  />
                  <span className="hidden sm:inline">Download PDF</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <LoadingSkeleton />
          ) : !invoice ? null : (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border ${status.bgBanner}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${status.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {status.label}
                      </h3>
                      {(invoice.status === "pending" ||
                        invoice.status === "partial") && (
                        <p className="text-sm text-slate-400">
                          Amount Due:{" "}
                          <span className="text-amber-400 font-medium">
                            {formatCurrency(invoice.amount_due)}
                          </span>
                          {" • "}Due by {formatDate(invoice.due_date)}
                        </p>
                      )}
                      {invoice.status === "paid" && (
                        <p className="text-sm text-emerald-400">
                          Thank you for your payment!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Clinic Info */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-xl">
                        <span className="text-2xl font-bold text-emerald-400">
                          A
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          Abel Wellness Healthcare
                        </h2>
                        <p className="text-slate-400 mt-1">
                          123 Medical Center Drive, Healthcare City
                        </p>
                        <p className="text-slate-400">Phone: +91 1234567890</p>
                        <p className="text-slate-400">
                          Email: billing@abelwellness.com
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-700/50">
                      <h3 className="text-lg font-semibold text-white">
                        Invoice Items
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-900/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                              Description
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold text-slate-400 uppercase">
                              Qty
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                              Unit Price
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                              Tax
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {(invoice.items || []).map((item, index) => (
                            <tr key={item.id || index}>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-white">
                                    {item.description}
                                  </p>
                                  <p className="text-sm text-slate-500 capitalize">
                                    {item.item_type?.replace("_", " ")}
                                  </p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center text-slate-400">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-400">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-400">
                                {item.tax_rate > 0 ? `${item.tax_rate}%` : "-"}
                              </td>
                              <td className="px-6 py-4 text-right text-white font-medium">
                                {formatCurrency(item.line_total)}
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
                      <div className="px-6 py-4 border-b border-slate-700/50">
                        <h3 className="text-lg font-semibold text-white">
                          Payment History
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-700/50">
                        {invoice.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="px-6 py-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-emerald-500/10">
                                <FiCreditCard className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">
                                  {PAYMENT_METHOD_LABELS[
                                    payment.payment_method
                                  ] || payment.payment_method}
                                </p>
                                <p className="text-sm text-slate-400">
                                  {formatDateTime(payment.payment_date)}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-emerald-400">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment Instructions - For pending invoices */}
                  {(invoice.status === "pending" ||
                    invoice.status === "partial") && (
                    <div className="bg-emerald-900/20 rounded-xl border border-emerald-500/30 p-6">
                      <h3 className="text-lg font-semibold text-emerald-400 mb-3">
                        Payment Instructions
                      </h3>
                      <div className="text-emerald-300/80 text-sm space-y-2">
                        <p>
                          Please contact our billing desk or visit the clinic to
                          complete your payment.
                        </p>
                        <p>
                          <strong>Payment Methods Accepted:</strong> Cash, Card,
                          UPI, Bank Transfer
                        </p>
                        <p>
                          <strong>Phone:</strong> +91 1234567890
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Sidebar */}
                <div className="space-y-6">
                  {/* Amount Summary */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span className="text-white">
                          {formatCurrency(invoice.subtotal)}
                        </span>
                      </div>
                      {invoice.discount_amount > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>Discount</span>
                          <span className="text-emerald-400">
                            -{formatCurrency(invoice.discount_amount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Tax</span>
                        <span className="text-white">
                          {formatCurrency(invoice.tax_amount)}
                        </span>
                      </div>
                      <div className="border-t border-slate-700/50 pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-white">
                            Total
                          </span>
                          <span className="font-bold text-xl text-white">
                            {formatCurrency(invoice.total_amount)}
                          </span>
                        </div>
                      </div>
                      {invoice.amount_paid > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>Paid</span>
                          <span className="text-emerald-400">
                            -{formatCurrency(invoice.amount_paid)}
                          </span>
                        </div>
                      )}
                      {invoice.amount_due > 0 && (
                        <div className="flex justify-between pt-2 border-t border-slate-700/50">
                          <span className="font-semibold text-white">
                            Balance Due
                          </span>
                          <span className="font-bold text-amber-400">
                            {formatCurrency(invoice.amount_due)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Invoice Details
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <FiFileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Invoice Number
                          </p>
                          <p className="text-white font-medium">
                            {invoice.invoice_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <FiCalendar className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Invoice Date</p>
                          <p className="text-white font-medium">
                            {formatDate(invoice.invoice_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-700/50">
                          <FiClock className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Due Date</p>
                          <p className="text-white font-medium">
                            {formatDate(invoice.due_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                      <h3 className="text-lg font-semibold text-white mb-3">
                        Notes
                      </h3>
                      <p className="text-slate-400 text-sm">{invoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
