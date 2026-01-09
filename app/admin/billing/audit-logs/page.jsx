"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { toast } from "sonner";
import {
  FiActivity,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUser,
  FiFileText,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
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
    fetchAuditLogs();
  }, [
    user,
    authLoading,
    router,
    entityTypeFilter,
    actionFilter,
    startDate,
    endDate,
    page,
  ]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (entityTypeFilter) params.append("entity_type", entityTypeFilter);
      if (actionFilter) params.append("action", actionFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("page", page.toString());
      params.append("limit", "30");

      const res = await fetch(`/api/billing/audit-logs?${params}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(Math.ceil((data.total || 0) / 30));
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action) => {
    switch (action) {
      case "create":
        return {
          icon: FiPlus,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
          label: "Created",
        };
      case "update":
        return {
          icon: FiEdit,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
          label: "Updated",
        };
      case "delete":
        return {
          icon: FiTrash2,
          color: "text-red-400",
          bg: "bg-red-500/10",
          label: "Deleted",
        };
      case "status_change":
        return {
          icon: FiRefreshCw,
          color: "text-yellow-400",
          bg: "bg-yellow-500/10",
          label: "Status Changed",
        };
      case "payment":
        return {
          icon: FiDollarSign,
          color: "text-green-400",
          bg: "bg-green-500/10",
          label: "Payment",
        };
      case "refund":
        return {
          icon: FiDollarSign,
          color: "text-orange-400",
          bg: "bg-orange-500/10",
          label: "Refund",
        };
      case "cancel":
        return {
          icon: FiTrash2,
          color: "text-red-400",
          bg: "bg-red-500/10",
          label: "Cancelled",
        };
      default:
        return {
          icon: FiActivity,
          color: "text-slate-400",
          bg: "bg-slate-500/10",
          label: action,
        };
    }
  };

  const getEntityIcon = (entityType) => {
    switch (entityType) {
      case "invoice":
        return FiFileText;
      case "payment":
        return FiDollarSign;
      case "credit_note":
        return FiFileText;
      case "treatment_case":
        return FiActivity;
      default:
        return FiFileText;
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
            { label: "Audit Logs" },
          ]}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <FiActivity className="text-rose-500" />
                Audit Logs
              </h1>
              <p className="text-slate-400 mt-1">
                Complete history of all billing operations
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              <option value="">All Entities</option>
              <option value="invoice">Invoices</option>
              <option value="payment">Payments</option>
              <option value="credit_note">Credit Notes</option>
              <option value="treatment_case">Treatment Cases</option>
              <option value="settings">Settings</option>
            </select>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              <option value="">All Actions</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
              <option value="status_change">Status Changed</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          {/* Audit Logs List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20">
              <FiActivity className="w-16 h-16 mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No audit logs found
              </h3>
              <p className="text-slate-400">
                Audit logs are created automatically when billing operations
                occur
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const actionConfig = getActionConfig(log.action);
                const ActionIcon = actionConfig.icon;
                const EntityIcon = getEntityIcon(log.entity_type);

                return (
                  <div
                    key={log.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${actionConfig.bg}`}>
                        <ActionIcon
                          className={`w-5 h-5 ${actionConfig.color}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-sm font-medium ${actionConfig.color}`}
                          >
                            {actionConfig.label}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 text-sm flex items-center gap-1">
                            <EntityIcon className="w-3 h-3" />
                            {log.entity_type?.replace("_", " ")}
                          </span>
                          {log.entity_identifier && (
                            <>
                              <span className="text-slate-500">•</span>
                              <span className="text-white text-sm font-mono">
                                {log.entity_identifier}
                              </span>
                            </>
                          )}
                        </div>

                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="text-sm text-slate-400 mb-2">
                            Changed: {Object.keys(log.changes).join(", ")}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <FiCalendar className="w-3 h-3" />
                            {formatDate(log.performed_at)}
                          </span>
                          {log.performed_by_user && (
                            <span className="flex items-center gap-1">
                              <FiUser className="w-3 h-3" />
                              {log.performed_by_user.full_name ||
                                log.performed_by_user.email}
                            </span>
                          )}
                          {log.ip_address && (
                            <span className="font-mono">{log.ip_address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
