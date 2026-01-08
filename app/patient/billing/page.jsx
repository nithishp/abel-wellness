"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PatientSidebar from "../components/PatientSidebar";
import {
  FiDollarSign,
  FiFileText,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiEye,
  FiSearch,
} from "react-icons/fi";
import { toast } from "sonner";

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    icon: FiFileText,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: FiClock,
  },
  partial: {
    label: "Partial",
    color: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    icon: FiAlertCircle,
  },
  paid: {
    label: "Paid",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: FiCheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: FiAlertCircle,
  },
  refunded: {
    label: "Refunded",
    color: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    icon: FiRefreshCw,
  },
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-slate-800/50 rounded-xl border border-slate-700/50"
          />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 h-96" />
    </div>
  );
}

export default function PatientBillingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && user) {
      fetchBillingData();
    }
  }, [user, authLoading]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/patient/billing");
      const data = await res.json();

      if (data.success) {
        setInvoices(data.invoices || []);
        setStats(data.stats || stats);
      } else {
        toast.error(data.error || "Failed to load billing data");
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      toast.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBillingData();
    setRefreshing(false);
    toast.success("Billing data refreshed");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      searchQuery === "" ||
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statCards = [
    {
      title: "Total Invoices",
      value: stats.total,
      icon: FiFileText,
      gradient: "from-blue-500 to-indigo-600",
      bgGlow: "bg-blue-500/10",
    },
    {
      title: "Pending",
      value: stats.pending,
      subtitle: formatCurrency(stats.pendingAmount),
      icon: FiClock,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
    },
    {
      title: "Paid",
      value: stats.paid,
      subtitle: formatCurrency(stats.paidAmount),
      icon: FiCheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/10",
    },
    {
      title: "Total Billed",
      value: formatCurrency(stats.totalAmount),
      icon: FiDollarSign,
      gradient: "from-violet-500 to-purple-600",
      bgGlow: "bg-violet-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <PatientSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  My Bills & Invoices
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  View and manage your billing history
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
                >
                  <FiRefreshCw
                    className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {statCards.map((stat, index) => (
                  <div
                    key={index}
                    className={`relative group rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-3 sm:p-6 overflow-hidden transition-all duration-300 hover:border-slate-600/50 hover:shadow-xl ${stat.bgGlow}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />

                    <div className="relative">
                      <div
                        className={`inline-flex p-2 sm:p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-2 sm:mb-4`}
                      >
                        <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium">
                        {stat.title}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-white mt-0.5 sm:mt-1">
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-slate-500 mt-1">
                          {stat.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by invoice number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Due
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-slate-400"
                          >
                            <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No invoices found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => {
                          const status =
                            STATUS_CONFIG[invoice.status] ||
                            STATUS_CONFIG.pending;
                          const StatusIcon = status.icon;
                          return (
                            <tr
                              key={invoice.id}
                              className="hover:bg-slate-700/30 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className="font-semibold text-white">
                                  {invoice.invoice_number}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {formatDate(invoice.invoice_date)}
                              </td>
                              <td className="px-6 py-4 text-slate-400">
                                {formatDate(invoice.due_date)}
                              </td>
                              <td className="px-6 py-4 text-right text-white font-medium">
                                {formatCurrency(invoice.total_amount)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span
                                  className={`font-medium ${
                                    invoice.amount_due > 0
                                      ? "text-amber-400"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {formatCurrency(invoice.amount_due)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}
                                >
                                  <StatusIcon className="w-3.5 h-3.5" />
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/patient/billing/${invoice.id}`
                                      )
                                    }
                                    className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
                                    title="View Invoice"
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-700/50">
                  {filteredInvoices.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400">
                      <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No invoices found</p>
                    </div>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const status =
                        STATUS_CONFIG[invoice.status] || STATUS_CONFIG.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div
                          key={invoice.id}
                          className="p-4 hover:bg-slate-700/30 transition-colors"
                          onClick={() =>
                            router.push(`/patient/billing/${invoice.id}`)
                          }
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-semibold text-white">
                                {invoice.invoice_number}
                              </span>
                              <p className="text-sm text-slate-400">
                                {formatDate(invoice.invoice_date)}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <p className="text-xs text-slate-500">Total</p>
                              <p className="font-semibold text-white">
                                {formatCurrency(invoice.total_amount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Due</p>
                              <p
                                className={`font-medium ${
                                  invoice.amount_due > 0
                                    ? "text-amber-400"
                                    : "text-slate-400"
                                }`}
                              >
                                {formatCurrency(invoice.amount_due)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
