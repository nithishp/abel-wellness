"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "sonner";
import Link from "next/link";
import {
  FiLayers,
  FiPlus,
  FiSearch,
  FiFilter,
  FiChevronRight,
  FiCalendar,
  FiUser,
  FiFileText,
} from "react-icons/fi";

export default function TreatmentCasesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
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
    fetchCases();
  }, [user, authLoading, router, statusFilter, page]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const res = await fetch(`/api/billing/treatment-cases?${params}`);
      const data = await res.json();

      if (data.success) {
        setCases(data.cases || []);
        setTotalPages(Math.ceil((data.total || 0) / 20));
      }
    } catch (error) {
      console.error("Error fetching treatment cases:", error);
      toast.error("Failed to load treatment cases");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "active":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          label: "Active",
        };
      case "completed":
        return {
          bg: "bg-blue-500/10",
          text: "text-blue-400",
          label: "Completed",
        };
      case "cancelled":
        return {
          bg: "bg-red-500/10",
          text: "text-red-400",
          label: "Cancelled",
        };
      case "on_hold":
        return {
          bg: "bg-yellow-500/10",
          text: "text-yellow-400",
          label: "On Hold",
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

  const filteredCases = cases.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.case_number?.toLowerCase().includes(query) ||
      c.patient?.full_name?.toLowerCase().includes(query) ||
      c.diagnosis?.toLowerCase().includes(query)
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
            { label: "Treatment Cases" },
          ]}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FiLayers className="text-indigo-500" />
                Treatment Cases
              </h1>
              <p className="text-slate-400 mt-1">
                Manage multi-visit treatment cases with linked invoices
              </p>
            </div>
            <Link
              href="/admin/billing/treatment-cases/create"
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
            >
              <FiPlus /> New Treatment Case
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by case number, patient, or diagnosis..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Cases List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-20">
              <FiLayers className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No treatment cases found
              </h3>
              <p className="text-slate-400 mb-6">
                {searchQuery || statusFilter
                  ? "Try adjusting your search or filters"
                  : "Create your first treatment case to get started"}
              </p>
              <Link
                href="/admin/billing/treatment-cases/create"
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <FiPlus /> Create Treatment Case
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((treatmentCase) => {
                const statusConfig = getStatusConfig(treatmentCase.status);
                return (
                  <Link
                    key={treatmentCase.id}
                    href={`/admin/billing/treatment-cases/${treatmentCase.id}`}
                    className="block bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-white font-semibold">
                            {treatmentCase.case_number}
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
                            {treatmentCase.patient?.full_name ||
                              "Unknown Patient"}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-4 h-4" />
                            Started: {formatDate(treatmentCase.start_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FiFileText className="w-4 h-4" />
                            {treatmentCase.invoices?.length || 0} Invoices
                          </span>
                        </div>
                        {treatmentCase.diagnosis && (
                          <p className="text-slate-500 text-sm mt-2 line-clamp-1">
                            {treatmentCase.diagnosis}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-white font-semibold">
                          {formatCurrency(treatmentCase.total_estimated_cost)}
                        </p>
                        <p className="text-xs text-slate-400">Estimated Cost</p>
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
