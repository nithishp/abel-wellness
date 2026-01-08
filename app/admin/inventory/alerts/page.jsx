"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiAlertTriangle,
  FiAlertCircle,
  FiClock,
  FiCheck,
  FiFilter,
  FiRefreshCw,
  FiPackage,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

const InventoryAlertsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [checkingExpiry, setCheckingExpiry] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!["admin", "pharmacist"].includes(user.role)) {
      toast.error("Access denied.");
      router.push("/");
      return;
    }

    fetchAlerts();
  }, [user, authLoading, router]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/alerts");
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      const res = await fetch(`/api/inventory/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Alert resolved");
        fetchAlerts();
      } else {
        toast.error(data.error || "Failed to resolve alert");
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast.error("Failed to resolve alert");
    }
  };

  const runExpiryCheck = async () => {
    setCheckingExpiry(true);
    try {
      const res = await fetch("/api/inventory/check-expiry", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Expiry check complete. ${data.alertsCreated} new alerts created.`
        );
        fetchAlerts();
      } else {
        toast.error(data.error || "Failed to run expiry check");
      }
    } catch (error) {
      console.error("Error running expiry check:", error);
      toast.error("Failed to run expiry check");
    } finally {
      setCheckingExpiry(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "low_stock":
        return <FiAlertTriangle className="w-5 h-5" />;
      case "out_of_stock":
        return <FiAlertCircle className="w-5 h-5" />;
      case "expiring_soon":
        return <FiClock className="w-5 h-5" />;
      case "expired":
        return <FiClock className="w-5 h-5" />;
      default:
        return <FiAlertTriangle className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type, resolved) => {
    if (resolved) {
      return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
    switch (type) {
      case "low_stock":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "out_of_stock":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      case "expiring_soon":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "expired":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    }
  };

  const getAlertLabel = (type) => {
    switch (type) {
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      case "expiring_soon":
        return "Expiring Soon";
      case "expired":
        return "Expired";
      default:
        return type;
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    if (filter === "unresolved") return !alert.resolved;
    if (filter === "resolved") return alert.resolved;
    return alert.alert_type === filter;
  });

  const alertCounts = {
    all: alerts.length,
    unresolved: alerts.filter((a) => !a.resolved).length,
    low_stock: alerts.filter((a) => a.alert_type === "low_stock" && !a.resolved)
      .length,
    out_of_stock: alerts.filter(
      (a) => a.alert_type === "out_of_stock" && !a.resolved
    ).length,
    expiring_soon: alerts.filter(
      (a) => a.alert_type === "expiring_soon" && !a.resolved
    ).length,
    expired: alerts.filter((a) => a.alert_type === "expired" && !a.resolved)
      .length,
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

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen p-4 sm:p-6 overflow-auto">
        {/* Breadcrumb */}
        <div className="mb-4 ml-12 lg:ml-0">
          <Breadcrumb
            items={[
              {
                label: "Inventory",
                href: "/admin/inventory",
                icon: <FiPackage className="w-4 h-4" />,
              },
              {
                label: "Alerts",
                icon: <FiAlertTriangle className="w-4 h-4" />,
              },
            ]}
            backHref="/admin/inventory"
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ml-12 lg:ml-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Inventory Alerts
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Monitor stock levels and expiry dates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={runExpiryCheck}
              disabled={checkingExpiry}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {checkingExpiry ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FiClock className="w-4 h-4" />
              )}
              Check Expiry
            </button>
            <button
              onClick={fetchAlerts}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All ({alertCounts.all})
          </button>
          <button
            onClick={() => setFilter("unresolved")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "unresolved"
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Unresolved ({alertCounts.unresolved})
          </button>
          <button
            onClick={() => setFilter("out_of_stock")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "out_of_stock"
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Out of Stock ({alertCounts.out_of_stock})
          </button>
          <button
            onClick={() => setFilter("low_stock")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "low_stock"
                ? "bg-yellow-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Low Stock ({alertCounts.low_stock})
          </button>
          <button
            onClick={() => setFilter("expiring_soon")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "expiring_soon"
                ? "bg-orange-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Expiring Soon ({alertCounts.expiring_soon})
          </button>
          <button
            onClick={() => setFilter("expired")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "expired"
                ? "bg-red-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Expired ({alertCounts.expired})
          </button>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-slate-800/50 rounded-xl border p-5 transition-colors ${
                alert.resolved
                  ? "border-slate-700/50 opacity-60"
                  : "border-slate-700/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg border ${getAlertColor(
                      alert.alert_type,
                      alert.resolved
                    )}`}
                  >
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`/admin/inventory/items/${alert.item_id}`}
                        className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors"
                      >
                        {alert.item?.name}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getAlertColor(
                          alert.alert_type,
                          alert.resolved
                        )}`}
                      >
                        {getAlertLabel(alert.alert_type)}
                      </span>
                      {alert.resolved && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-400">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{alert.message}</p>
                    <p className="text-slate-500 text-xs mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {alert.item && (
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Current Stock</p>
                      <p
                        className={`text-lg font-bold ${
                          alert.item.current_stock === 0
                            ? "text-red-400"
                            : alert.item.current_stock <=
                              alert.item.minimum_stock
                            ? "text-yellow-400"
                            : "text-white"
                        }`}
                      >
                        {alert.item.current_stock} {alert.item.unit_of_measure}
                      </p>
                    </div>
                  )}

                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-colors"
                    >
                      <FiCheck className="w-4 h-4" />
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <FiPackage className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No alerts found</p>
              {filter !== "all" && (
                <button
                  onClick={() => setFilter("all")}
                  className="mt-4 text-emerald-500 hover:text-emerald-400"
                >
                  View all alerts
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default InventoryAlertsPage;
