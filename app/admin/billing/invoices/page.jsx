"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import {
  FiPlus,
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiDollarSign,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

function InvoicesListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useRoleAuth();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);

      const res = await fetch(`/api/billing/invoices?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setInvoices(data.invoices);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      } else {
        toast.error(data.error || "Failed to fetch invoices");
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

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
    fetchInvoices();
  }, [user, authLoading, fetchInvoices, router]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
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

  const handleDownloadPDF = async (e, invoiceId, invoiceNumber) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/billing/invoices/${invoiceId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${invoiceNumber}.pdf`;
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

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchInvoices();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

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
              { label: "Invoices" },
            ]}
            backHref="/admin/billing"
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ml-12 lg:ml-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Invoices
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Manage and track all patient invoices
            </p>
          </div>
          <Link
            href="/admin/billing/invoices/create"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by invoice # or patient name..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              Filters
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FiSearch className="w-4 h-4" />
              Search
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invoices Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FiRefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-16">
              <FiFileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No invoices found
              </h3>
              <p className="text-slate-400 mb-4">
                Create your first invoice to get started
              </p>
              <Link
                href="/admin/billing/invoices/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                Create Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-slate-600">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">
                      Invoice #
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">
                      Patient
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-slate-300">
                      Due Date
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-slate-300">
                      Paid
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-slate-300">
                      Status
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    return (
                      <tr
                        key={invoice.id}
                        className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/admin/billing/invoices/${invoice.id}`)
                        }
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-emerald-400">
                            {invoice.invoice_number}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-white">
                              {invoice.patient?.full_name || "Unknown"}
                            </p>
                            <p className="text-sm text-slate-400">
                              {invoice.patient?.phone || ""}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {formatDate(invoice.invoice_date)}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-white">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {formatCurrency(invoice.amount_paid)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div
                            className="flex items-center justify-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/admin/billing/invoices/${invoice.id}`
                                );
                              }}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) =>
                                handleDownloadPDF(
                                  e,
                                  invoice.id,
                                  invoice.invoice_number
                                )
                              }
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                            >
                              <FiDownload className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} invoices
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm text-slate-300">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function InvoicesListPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      }
    >
      <InvoicesListContent />
    </Suspense>
  );
}
