"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import {
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiLayers,
  FiFileText,
  FiArrowRight,
  FiRefreshCw,
  FiPlus,
  FiBarChart2,
  FiPieChart,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

const InventoryDashboardPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiringItems: 0,
    expiredStock: 0,
    unresolvedAlerts: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

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
    fetchAnalytics();
  }, [user, authLoading, router]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/inventory/analytics");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch multiple data sources in parallel
      const [itemsRes, alertsRes, valuationRes, lowStockRes, expiryRes] =
        await Promise.all([
          fetch("/api/inventory/items?limit=1"),
          fetch("/api/inventory/alerts?limit=5"),
          fetch("/api/inventory/reports?type=valuation"),
          fetch("/api/inventory/reports?type=low-stock"),
          fetch("/api/inventory/reports?type=expiry&daysAhead=30"),
        ]);

      const [itemsData, alertsData, valuationData, lowStockData, expiryData] =
        await Promise.all([
          itemsRes.json(),
          alertsRes.json(),
          valuationRes.json(),
          lowStockRes.json(),
          expiryRes.json(),
        ]);

      // Fetch analytics to get expired count
      const analyticsRes = await fetch("/api/inventory/analytics");
      const analyticsData = await analyticsRes.json();

      setStats({
        totalItems: itemsData.pagination?.total || 0,
        lowStockItems: lowStockData.summary?.total_low_stock || 0,
        outOfStockItems: lowStockData.summary?.total_out_of_stock || 0,
        expiringItems:
          (expiryData.summary?.expiring_7_days || 0) +
          (expiryData.summary?.expiring_30_days || 0),
        expiredStock: analyticsData.expiryDistribution?.[0]?.value || 0,
        unresolvedAlerts: alertsData.pagination?.total || 0,
      });

      setRecentAlerts(alertsData.alerts || []);
      setLowStockItems((lowStockData.lowStockItems || []).slice(0, 5));

      // Also refresh analytics
      fetchAnalytics();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: "Add New Item",
      icon: FiPlus,
      href: "/admin/inventory/items/new",
      color: "bg-emerald-500",
    },
    {
      name: "View All Items",
      icon: FiPackage,
      href: "/admin/inventory/items",
      color: "bg-blue-500",
    },
    {
      name: "Purchase Orders",
      icon: FiShoppingCart,
      href: "/admin/inventory/purchase-orders",
      color: "bg-purple-500",
    },
    {
      name: "View Reports",
      icon: FiFileText,
      href: "/admin/inventory/reports",
      color: "bg-orange-500",
    },
  ];

  const statCards = [
    {
      name: "Total Items",
      value: stats.totalItems,
      icon: FiPackage,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "Low Stock Items",
      value: stats.lowStockItems,
      icon: FiTrendingDown,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      alert: stats.lowStockItems > 0,
    },
    {
      name: "Out of Stock",
      value: stats.outOfStockItems,
      icon: FiAlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      alert: stats.outOfStockItems > 0,
    },
    {
      name: "Expiring Soon",
      value: stats.expiringItems,
      icon: FiAlertTriangle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      alert: stats.expiringItems > 0,
    },
    {
      name: "Expired Stock",
      value: stats.expiredStock,
      icon: FiAlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-600/10",
      alert: stats.expiredStock > 0,
    },
    {
      name: "Active Alerts",
      value: stats.unresolvedAlerts,
      icon: FiAlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      alert: stats.unresolvedAlerts > 0,
    },
  ];

  // Chart configurations
  const stockStatusChartConfig = {
    healthy: { label: "Healthy", color: "#10b981" },
    lowStock: { label: "Low Stock", color: "#f59e0b" },
    reorderNeeded: { label: "Reorder", color: "#8b5cf6" },
    outOfStock: { label: "Out of Stock", color: "#ef4444" },
  };

  const movementChartConfig = {
    stock_in: { label: "Stock In", color: "#10b981" },
    stock_out: { label: "Stock Out", color: "#ef4444" },
    adjustments: { label: "Adjustments", color: "#8b5cf6" },
  };

  const categoryChartConfig = {
    items: { label: "Items", color: "#3b82f6" },
    value: { label: "Value (₹)", color: "#10b981" },
  };

  const expiryChartConfig = {
    expired: { label: "Expired", color: "#ef4444" },
    expiring7: { label: "7 Days", color: "#f59e0b" },
    expiring30: { label: "30 Days", color: "#eab308" },
    expiring90: { label: "90 Days", color: "#8b5cf6" },
    safe: { label: "Safe", color: "#10b981" },
  };

  const EXPIRY_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#8b5cf6", "#10b981"];
  const STOCK_STATUS_COLORS = ["#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AdminSidebar />
        <main className="lg:ml-72 min-h-screen p-4 sm:p-6 overflow-auto">
          {/* Breadcrumb Skeleton */}
          <div className="mb-4 ml-12 lg:ml-0">
            <div className="h-5 w-32 bg-slate-700/50 rounded animate-pulse"></div>
          </div>

          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ml-12 lg:ml-0">
            <div>
              <div className="h-7 w-48 bg-slate-700/50 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-slate-700/30 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-slate-700/50 rounded-lg animate-pulse"></div>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border bg-slate-800/50 border-slate-700/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-slate-700/50 rounded-lg animate-pulse"></div>
                </div>
                <div className="h-8 w-16 bg-slate-700/50 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-20 bg-slate-700/30 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Analytics Section Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-5 w-40 bg-slate-700/50 rounded animate-pulse"></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 h-72"
                >
                  <div className="h-5 w-36 bg-slate-700/50 rounded animate-pulse mb-4"></div>
                  <div className="h-52 bg-slate-700/30 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Skeleton */}
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-slate-700/30 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="p-3 bg-slate-700/30 rounded-lg">
                      <div className="h-4 w-full bg-slate-700/50 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-24 bg-slate-700/30 rounded animate-pulse"></div>
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
              { label: "Inventory", icon: <FiPackage className="w-4 h-4" /> },
            ]}
            backHref="/admin/dashboard"
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 ml-12 lg:ml-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Inventory Dashboard
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Overview of your inventory management
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors w-full sm:w-auto"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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

        {/* Analytics Charts Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <FiBarChart2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">
              Analytics Overview
            </h2>
          </div>

          {analyticsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 h-64 animate-pulse"
                >
                  <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
                  <div className="h-40 bg-slate-700/50 rounded"></div>
                </div>
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* First Row: Stock Status & Movement Trends */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Stock Status Distribution */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <FiPieChart className="w-4 h-4 text-emerald-400" />
                    Stock Health Status
                  </h3>
                  <ChartContainer
                    config={stockStatusChartConfig}
                    className="h-64 w-full"
                  >
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Healthy",
                            value: analytics.stockStatus.healthy,
                          },
                          {
                            name: "Low Stock",
                            value: analytics.stockStatus.lowStock,
                          },
                          {
                            name: "Reorder",
                            value: analytics.stockStatus.reorderNeeded,
                          },
                          {
                            name: "Out of Stock",
                            value: analytics.stockStatus.outOfStock,
                          },
                        ].filter((item) => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {[
                          {
                            name: "Healthy",
                            value: analytics.stockStatus.healthy,
                          },
                          {
                            name: "Low Stock",
                            value: analytics.stockStatus.lowStock,
                          },
                          {
                            name: "Reorder",
                            value: analytics.stockStatus.reorderNeeded,
                          },
                          {
                            name: "Out of Stock",
                            value: analytics.stockStatus.outOfStock,
                          },
                        ]
                          .filter((item) => item.value > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                STOCK_STATUS_COLORS[
                                  index % STOCK_STATUS_COLORS.length
                                ]
                              }
                            />
                          ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-slate-400">
                        Healthy ({analytics.stockStatus.healthy})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-xs text-slate-400">
                        Low ({analytics.stockStatus.lowStock})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                      <span className="text-xs text-slate-400">
                        Reorder ({analytics.stockStatus.reorderNeeded})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-slate-400">
                        Out ({analytics.stockStatus.outOfStock})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Movement Trends */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <FiTrendingUp className="w-4 h-4 text-emerald-400" />
                    Stock Movement (Last 14 Days)
                  </h3>
                  <ChartContainer
                    config={movementChartConfig}
                    className="h-64 w-full"
                  >
                    <AreaChart data={analytics.stockMovements}>
                      <defs>
                        <linearGradient
                          id="stockInGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="stockOutGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(value) =>
                          new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="stock_in"
                        stroke="#10b981"
                        fill="url(#stockInGradient)"
                        strokeWidth={2}
                        name="Stock In"
                      />
                      <Area
                        type="monotone"
                        dataKey="stock_out"
                        stroke="#ef4444"
                        fill="url(#stockOutGradient)"
                        strokeWidth={2}
                        name="Stock Out"
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>

              {/* Second Row: Category Distribution & Expiry Status */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <FiLayers className="w-4 h-4 text-blue-400" />
                    Items by Category
                  </h3>
                  <ChartContainer
                    config={categoryChartConfig}
                    className="h-64 w-full"
                  >
                    <BarChart
                      data={analytics.categoryDistribution}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#64748b" fontSize={10} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#64748b"
                        fontSize={10}
                        width={80}
                        tickFormatter={(value) =>
                          value.length > 10 ? value.slice(0, 10) + "..." : value
                        }
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="items"
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                        name="Items"
                      />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Expiry Distribution */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <FiAlertTriangle className="w-4 h-4 text-amber-400" />
                    Expiry Status
                  </h3>
                  <ChartContainer
                    config={expiryChartConfig}
                    className="h-64 w-full"
                  >
                    <PieChart>
                      <Pie
                        data={analytics.expiryDistribution.filter(
                          (item) => item.value > 0
                        )}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {analytics.expiryDistribution
                          .filter((item) => item.value > 0)
                          .map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={EXPIRY_COLORS[index % EXPIRY_COLORS.length]}
                            />
                          ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {analytics.expiryDistribution
                      .filter((item) => item.value > 0)
                      .map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: EXPIRY_COLORS[index] }}
                          ></div>
                          <span className="text-xs text-slate-400">
                            {item.name} ({item.value})
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Third Row: Item Type Distribution & Value by Category */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                {/* Item Type Distribution */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <FiPackage className="w-4 h-4 text-purple-400" />
                    Items by Type
                  </h3>
                  <ChartContainer
                    config={categoryChartConfig}
                    className="h-64 w-full"
                  >
                    <BarChart data={analytics.typeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="items"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Items"
                      />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Value by Category */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <FiDollarSign className="w-4 h-4 text-emerald-400" />
                    Inventory Value by Category
                  </h3>
                  <ChartContainer
                    config={categoryChartConfig}
                    className="h-64 w-full"
                  >
                    <BarChart
                      data={analytics.categoryDistribution}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(value) =>
                          `₹${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#64748b"
                        fontSize={10}
                        width={80}
                        tickFormatter={(value) =>
                          value.length > 10 ? value.slice(0, 10) + "..." : value
                        }
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value) => [
                          `₹${value.toLocaleString()}`,
                          "Value",
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                        name="Value (₹)"
                      />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-12 text-center">
              <FiBarChart2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No analytics data available</p>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Recent Alerts
              </h2>
              <Link
                href="/admin/inventory/alerts"
                className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1"
              >
                View all <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentAlerts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No active alerts
              </p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getAlertSeverityColor(
                      alert.severity
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs uppercase font-semibold px-2 py-1 rounded bg-black/20">
                        {alert.alert_type.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Items */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Low Stock Items
              </h2>
              <Link
                href="/admin/inventory/items?lowStock=true"
                className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-1"
              >
                View all <FiArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {lowStockItems.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                All items are well stocked
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white text-sm">
                        {item.name}
                      </p>
                      <p className="text-slate-400 text-xs">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          item.current_stock === 0
                            ? "text-red-500"
                            : "text-orange-500"
                        }`}
                      >
                        {item.current_stock} / {item.minimum_stock}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {item.unit_of_measure}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-4 gap-4 mt-8">
          <Link
            href="/admin/inventory/items"
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
          >
            <FiPackage className="w-8 h-8 text-emerald-500 mb-3" />
            <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-400">
              Items
            </h3>
            <p className="text-slate-400 text-sm">
              Manage all inventory items, stock levels, and pricing
            </p>
          </Link>

          <Link
            href="/admin/inventory/categories"
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
          >
            <FiLayers className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-400">
              Categories
            </h3>
            <p className="text-slate-400 text-sm">
              Organize items into categories for easier management
            </p>
          </Link>

          <Link
            href="/admin/inventory/suppliers"
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
          >
            <FiUsers className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-400">
              Suppliers
            </h3>
            <p className="text-slate-400 text-sm">
              Manage supplier information and contacts
            </p>
          </Link>

          <Link
            href="/admin/inventory/batches"
            className="p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
          >
            <FiBox className="w-8 h-8 text-orange-500 mb-3" />
            <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-400">
              Batches
            </h3>
            <p className="text-slate-400 text-sm">
              Track batch numbers, expiry dates, and lot information
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default InventoryDashboardPage;
