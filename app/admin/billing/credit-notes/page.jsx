"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "sonner";
import Link from "next/link";
import {
  FiClipboard,
  FiPlus,
  FiSearch,
  FiChevronRight,
  FiCalendar,
  FiUser,
  FiFileText,
  FiDollarSign,
} from "react-icons/fi";

export default function CreditNotesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [creditNotes, setCreditNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchCreditNotes();
  }, [user, authLoading, router, statusFilter, page]);

  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/billing/credit-notes?${params}`);
      const data = await res.json();

      if (data.success) {
        setCreditNotes(data.creditNotes || []);
        setTotalPages(Math.ceil((data.total || 0) / 20));
      }
    } catch (error) {
      console.error("Error fetching credit notes:", error);
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "issued":
        return { bg: "bg-blue-500/10", text: "text-blue-400", label: "Issued" };
      case "applied":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          label: "Applied",
        };
      case "draft":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-400",
          label: "Draft",
        };
      case "cancelled":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          label: "Cancelled",
        };
      default:
        return { bg: "bg-slate-500/10", text: "text-slate-400", label: status };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const filteredNotes = creditNotes.filter((cn) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      cn.credit_note_number?.toLowerCase().includes(query) ||
      cn.patient?.full_name?.toLowerCase().includes(query) ||
      cn.invoice?.invoice_number?.toLowerCase().includes(query)
    );
  });

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
            { label: "Credit Notes" },
          ]}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FiClipboard className="text-orange-500" />
                Credit Notes
              </h1>
              <p className="text-slate-400 mt-1">
                Manage credit notes for refunds and adjustments
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by credit note number, patient, or invoice..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="applied">Applied</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Credit Notes List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-20">
              <FiClipboard className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No credit notes found
              </h3>
              <p className="text-slate-400">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filters"
                  : "Credit notes are created when refunding invoices"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotes.map((creditNote) => {
                const statusConfig = getStatusConfig(creditNote.status);
                return (
                  <Link
                    key={creditNote.id}
                    href={`/admin/billing/credit-notes/${creditNote.id}`}
                    className="block bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-semibold">
                            {creditNote.credit_note_number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <FiUser className="w-4 h-4" />
                            {creditNote.patient?.full_name || "Unknown Patient"}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiFileText className="w-4 h-4" />
                            Invoice: {creditNote.invoice?.invoice_number || "-"}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            {formatDate(creditNote.credit_note_date)}
                          </span>
                        </div>
                        {creditNote.reason && (
                          <p className="text-slate-500 text-sm mt-2 line-clamp-1">
                            Reason: {creditNote.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-orange-400 font-semibold text-lg">
                          {formatCurrency(creditNote.total_amount)}
                        </p>
                      </div>
                      <FiChevronRight className="w-5 h-5 text-slate-500 ml-4 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                );
              })}
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
