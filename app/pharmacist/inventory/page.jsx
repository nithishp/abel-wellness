"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PharmacistSidebar from "../components/PharmacistSidebar";
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiClock,
  FiBox,
  FiTag,
  FiTruck,
  FiShoppingCart,
  FiFileText,
  FiAlertCircle,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const PharmacistInventoryPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.role !== "pharmacist") {
      toast.error("Access denied.");
      router.push("/");
      return;
    }

    fetchDashboardData();
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      const [itemsRes, alertsRes, lowStockRes] = await Promise.all([
        fetch("/api/inventory/items?limit=1"),
        fetch("/api/inventory/alerts?resolved=false&limit=5"),
        fetch("/api/inventory/reports?type=low-stock"),
      ]);

      const itemsData = await itemsRes.json();
      const alertsData = await alertsRes.json();
      const lowStockData = await lowStockRes.json();

      if (itemsData.success) {
        setStats({
          totalItems: itemsData.total || 0,
        });
      }

      if (alertsData.success) {
        setAlerts(alertsData.alerts || []);
      }

      if (lowStockData.success) {
        setLowStockItems(lowStockData.lowStockItems?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: "View Items",
      icon: FiBox,
      href: "/pharmacist/inventory/items",
      color: "emerald",
      description: "Browse all inventory items",
    },
    {
      name: "Add New Item",
      icon: FiPackage,
      href: "/pharmacist/inventory/items/new",
      color: "blue",
      description: "Add new inventory item",
    },
    {
      name: "Alerts",
      icon: FiAlertTriangle,
      href: "/pharmacist/inventory/alerts",
      color: "yellow",
      description: "View stock alerts",
    },
    {
      name: "Reports",
      icon: FiFileText,
      href: "/pharmacist/inventory/reports",
      color: "purple",
      description: "Stock reports",
    },
  ];

  const navCards = [
    {
      name: "Items",
      icon: FiBox,
      href: "/pharmacist/inventory/items",
      description: "Manage all inventory items",
    },
    {
      name: "Categories",
      icon: FiTag,
      href: "/pharmacist/inventory/categories",
      description: "Organize items by category",
    },
    {
      name: "Suppliers",
      icon: FiTruck,
      href: "/pharmacist/inventory/suppliers",
      description: "Manage supplier information",
    },
    {
      name: "Purchase Orders",
      icon: FiShoppingCart,
      href: "/pharmacist/inventory/purchase-orders",
      description: "Create and track orders",
    },
    {
      name: "Alerts",
      icon: FiAlertTriangle,
      href: "/pharmacist/inventory/alerts",
      description: "Low stock & expiry alerts",
    },
    {
      name: "Reports",
      icon: FiFileText,
      href: "/pharmacist/inventory/reports",
      description: "Stock reports & analytics",
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex">
        <PharmacistSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <PharmacistSidebar />

      <main className="flex-1 p-6 lg:ml-72 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Inventory Management
          </h1>
          <p className="text-slate-400 mt-2">
            Manage medications, supplies, and equipment
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                action.color === "emerald"
                  ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500"
                  : action.color === "blue"
                  ? "bg-blue-500/10 border-blue-500/30 hover:border-blue-500"
                  : action.color === "yellow"
                  ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500"
                  : "bg-purple-500/10 border-purple-500/30 hover:border-purple-500"
              }`}
            >
              <action.icon
                className={`w-8 h-8 mb-2 ${
                  action.color === "emerald"
                    ? "text-emerald-500"
                    : action.color === "blue"
                    ? "text-blue-500"
                    : action.color === "yellow"
                    ? "text-yellow-500"
                    : "text-purple-500"
                }`}
              />
              <h3 className="text-white font-semibold">{action.name}</h3>
              <p className="text-slate-400 text-sm">{action.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Alerts */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiAlertTriangle className="text-yellow-500" />
                Recent Alerts
              </h2>
              <Link
                href="/pharmacist/inventory/alerts"
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                View all
              </Link>
            </div>

            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      alert.alert_type === "out_of_stock"
                        ? "bg-red-500/10 border-red-500/30"
                        : alert.alert_type === "expired"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-yellow-500/10 border-yellow-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FiAlertCircle
                        className={
                          alert.alert_type === "out_of_stock" ||
                          alert.alert_type === "expired"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }
                      />
                      <div>
                        <p className="text-white font-medium text-sm">
                          {alert.item?.name}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <FiPackage className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>No active alerts</p>
              </div>
            )}
          </div>

          {/* Low Stock Items */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FiTrendingUp className="text-red-500" />
                Low Stock
              </h2>
              <Link
                href="/pharmacist/inventory/reports?type=low-stock"
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                View all
              </Link>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/pharmacist/inventory/items/${item.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">
                        {item.name}
                      </p>
                      <p className="text-slate-400 text-xs">
                        Min: {item.minimum_stock}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        item.current_stock === 0
                          ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {item.current_stock}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <FiBox className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <p>All items well stocked</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            Inventory Sections
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {navCards.map((card) => (
              <Link
                key={card.name}
                href={card.href}
                className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-purple-500/50 transition-all group"
              >
                <card.icon className="w-8 h-8 text-slate-400 group-hover:text-purple-400 mb-3 transition-colors" />
                <h3 className="text-white font-medium text-sm">{card.name}</h3>
                <p className="text-slate-500 text-xs mt-1">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PharmacistInventoryPage;
