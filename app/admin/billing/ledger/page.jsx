"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "sonner";
import {
  FiBook,
  FiSearch,
  FiFilter,
  FiArrowUpRight,
  FiArrowDownRight,
  FiCalendar,
  FiUser,
  FiDownload,
} from "react-icons/fi";

export default function LedgerPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchLedgerData();
  }, [user, authLoading, router, entryTypeFilter, startDate, endDate, page]);

  const fetchLedgerData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entryTypeFilter) params.append("entry_type", entryTypeFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("page", page.toString());
      params.append("limit", "30");

      const [entriesRes, summaryRes] = await Promise.all([
        fetch(`/api/billing/ledger?${params}`),
        fetch(
          `/api/billing/ledger?summary=true&start_date=${startDate}&end_date=${endDate}`
        ),
      ]);

      const entriesData = await entriesRes.json();
      const summaryData = await summaryRes.json();

      if (entriesData.success) {
        setEntries(entriesData.entries || []);
        setTotalPages(Math.ceil((entriesData.total || 0) / 30));
      }

      if (summaryData.success) {
        setSummary(summaryData.summary);
      }
    } catch (error) {
      console.error("Error fetching ledger data:", error);
      toast.error("Failed to load ledger data");
    } finally {
      setLoading(false);
    }
  };

  const getEntryTypeConfig = (type) => {
    switch (type) {
      case "invoice":
        return {
          icon: FiArrowUpRight,
          color: "text-red-400",
          label: "Invoice",
        };
      case "payment":
        return {
          icon: FiArrowDownRight,
          color: "text-emerald-400",
          label: "Payment",
        };
      case "credit_note":
        return {
          icon: FiArrowDownRight,
          color: "text-orange-400",
          label: "Credit Note",
        };
      case "refund":
        return {
          icon: FiArrowUpRight,
          color: "text-yellow-400",
          label: "Refund",
        };
      case "adjustment":
        return {
          icon: FiArrowUpRight,
          color: "text-purple-400",
          label: "Adjustment",
        };
      default:
        return { icon: FiArrowUpRight, color: "text-slate-400", label: type };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
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
            { label: "Ledger" },
          ]}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FiBook className="text-cyan-500" />
                Accounting Ledger
              </h1>
              <p className="text-slate-400 mt-1">
                Immutable record of all financial transactions
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Total Debits</p>
                <p className="text-red-400 text-xl font-bold mt-1">
                  {formatCurrency(summary.totalDebits)}
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Total Credits</p>
                <p className="text-emerald-400 text-xl font-bold mt-1">
                  {formatCurrency(summary.totalCredits)}
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Net Balance</p>
                <p className="text-white text-xl font-bold mt-1">
                  {formatCurrency(summary.netBalance)}
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <p className="text-slate-400 text-sm">Total Entries</p>
                <p className="text-white text-xl font-bold mt-1">
                  {summary.entryCount || 0}
                </p>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              <option value="">All Types</option>
              <option value="invoice">Invoices</option>
              <option value="payment">Payments</option>
              <option value="credit_note">Credit Notes</option>
              <option value="refund">Refunds</option>
              <option value="adjustment">Adjustments</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              placeholder="End Date"
            />
          </div>

          {/* Ledger Entries Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20">
              <FiBook className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No ledger entries found
              </h3>
              <p className="text-slate-400">
                Ledger entries are created automatically when billing operations
                occur
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                        Entry #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                        Reference
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                        Credit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {entries.map((entry) => {
                      const config = getEntryTypeConfig(entry.entry_type);
                      const Icon = config.icon;
                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-white font-mono">
                            {entry.entry_number}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400">
                            {formatDate(entry.entry_date)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 text-sm ${config.color}`}
                            >
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-300 font-mono">
                            {entry.reference_number || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate">
                            {entry.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-red-400">
                            {entry.debit_amount > 0
                              ? formatCurrency(entry.debit_amount)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-emerald-400">
                            {entry.credit_amount > 0
                              ? formatCurrency(entry.credit_amount)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-white font-medium">
                            {formatCurrency(entry.running_balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
