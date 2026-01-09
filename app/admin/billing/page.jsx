"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import {
  FiDollarSign,
  FiFileText,
  FiTrendingUp,
  FiClock,
  FiAlertTriangle,
  FiPlus,
  FiArrowRight,
  FiRefreshCw,
  FiSettings,
  FiZap,
  FiShoppingBag,
  FiBook,
  FiLayers,
  FiClipboard,
  FiActivity,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function BillingDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);

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

    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsRes = await fetch("/api/billing/reports?type=dashboard");
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Fetch recent invoices
      const invoicesRes = await fetch(
        "/api/billing/invoices?limit=5&sortBy=created_at&sortOrder=desc"
      );
      const invoicesData = await invoicesRes.json();
      if (invoicesData.success) {
        setRecentInvoices(invoicesData.invoices);
      }

      // Fetch outstanding invoices
      const outstandingRes = await fetch(
        "/api/billing/reports?type=outstanding&limit=5"
      );
      const outstandingData = await outstandingRes.json();
      if (outstandingData.success) {
        setOutstandingInvoices(outstandingData.invoices);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

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

  const quickActions = [
    {
      name: "Quick Bill",
      icon: FiZap,
      href: "/admin/billing/quick-bill",
      color: "bg-amber-500",
    },
    {
      name: "Pharmacy",
      icon: FiShoppingBag,
      href: "/admin/billing/pharmacy",
      color: "bg-teal-500",
    },
    {
      name: "New Invoice",
      icon: FiPlus,
      href: "/admin/billing/invoices/create",
      color: "bg-emerald-500",
    },
    {
      name: "All Invoices",
      icon: FiFileText,
      href: "/admin/billing/invoices",
      color: "bg-blue-500",
    },
    {
      name: "Treatment Cases",
      icon: FiLayers,
      href: "/admin/billing/treatment-cases",
      color: "bg-indigo-500",
    },
    {
      name: "Credit Notes",
      icon: FiClipboard,
      href: "/admin/billing/credit-notes",
      color: "bg-orange-500",
    },
    {
      name: "Ledger",
      icon: FiBook,
      href: "/admin/billing/ledger",
      color: "bg-cyan-500",
    },
    {
      name: "Audit Logs",
      icon: FiActivity,
      href: "/admin/billing/audit-logs",
      color: "bg-rose-500",
    },
    {
      name: "Reports",
      icon: FiTrendingUp,
      href: "/admin/billing/reports",
      color: "bg-purple-500",
    },
    {
      name: "Settings",
      icon: FiSettings,
      href: "/admin/billing/settings",
      color: "bg-slate-500",
    },
  ];

  const statCards = [
    {
      name: "Today's Revenue",
      value: formatCurrency(stats?.todayRevenue),
      icon: FiDollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      name: "This Month",
      value: formatCurrency(stats?.monthRevenue),
      icon: FiTrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "Outstanding",
      value: formatCurrency(stats?.totalOutstanding),
      icon: FiAlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      alert: stats?.totalOutstanding > 0,
    },
    {
      name: "Total Invoices",
      value: stats?.totalInvoices || 0,
      icon: FiFileText,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AdminSidebar />
        <main className="lg:ml-72 min-h-screen p-4 sm:p-6 overflow-auto">
          {/* Breadcrumb Skeleton */}
          <div className="mb-4 ml-12 lg:ml-0">
            <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse"></div>
          </div>

          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ml-12 lg:ml-0">
            <div>
              <div className="h-7 w-44 bg-slate-700/50 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-56 bg-slate-700/30 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 bg-slate-700/50 rounded-lg animate-pulse"></div>
              <div className="h-10 w-32 bg-emerald-600/30 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
              >
                <div className="w-11 h-11 bg-slate-700/50 rounded-lg animate-pulse"></div>
                <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border bg-slate-800/50 border-slate-700/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-slate-700/50 rounded-lg animate-pulse"></div>
                </div>
                <div className="h-8 w-24 bg-slate-700/50 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-20 bg-slate-700/30 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Two Column Skeleton */}
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-36 bg-slate-700/50 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-slate-700/30 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div>
                        <div className="h-4 w-28 bg-slate-700/50 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-20 bg-slate-700/30 rounded animate-pulse"></div>
                      </div>
                      <div className="h-6 w-20 bg-slate-700/50 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
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
              { label: "Billing", icon: <FiDollarSign className="w-4 h-4" /> },
            ]}
            backHref="/admin/dashboard"
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ml-12 lg:ml-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Billing Dashboard
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Overview of invoices, payments, and revenue
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm sm:text-base"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/admin/billing/invoices/create"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create Invoice</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all group"
            >
              <div className={`p-3 rounded-lg ${action.color}`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                {action.name}
              </span>
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <div
              key={stat.name}
              className={`p-4 rounded-xl border ${
                stat.alert
                  ? "bg-slate-800/50 border-red-500/30"
                  : "bg-slate-800/50 border-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-slate-400 text-sm">{stat.name}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Recent Invoices
              </h2>
              <Link
                href="/admin/billing/invoices"
                className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
              >
                View All
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {recentInvoices.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  return (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                      onClick={() =>
                        router.push(`/admin/billing/invoices/${invoice.id}`)
                      }
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-sm text-slate-400">
                          {invoice.patient?.full_name || "Unknown Patient"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formatCurrency(invoice.total_amount)}
                        </p>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outstanding Invoices */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-red-400">
                Outstanding Invoices
              </h2>
              <Link
                href="/admin/billing/invoices?status=pending,partial"
                className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center gap-1"
              >
                View All
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {outstandingInvoices.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No outstanding invoices
              </p>
            ) : (
              <div className="space-y-3">
                {outstandingInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg hover:bg-red-500/20 cursor-pointer transition-colors border border-red-500/20"
                    onClick={() =>
                      router.push(`/admin/billing/invoices/${invoice.id}`)
                    }
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-sm text-slate-400">
                        {invoice.patient?.full_name || "Unknown"}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <FiClock className="w-3 h-3" />
                        Due: {formatDate(invoice.due_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">
                        {formatCurrency(
                          parseFloat(invoice.total_amount) -
                            parseFloat(invoice.amount_paid)
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        of {formatCurrency(invoice.total_amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
