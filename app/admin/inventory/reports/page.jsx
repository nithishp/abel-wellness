"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiFileText,
  FiDollarSign,
  FiAlertTriangle,
  FiClock,
  FiTrendingUp,
  FiDownload,
  FiRefreshCw,
  FiCalendar,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const InventoryReportsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [activeTab, setActiveTab] = useState("valuation");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

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
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && ["admin", "pharmacist"].includes(user.role)) {
      fetchReport(activeTab);
    }
  }, [activeTab, user]);

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      let url = `/api/inventory/reports?type=${type}`;
      if (type === "movements") {
        url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setReportData(data);
      } else {
        toast.error("Failed to load report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "valuation", name: "Stock Valuation", icon: FiDollarSign },
    { id: "low-stock", name: "Low Stock", icon: FiAlertTriangle },
    { id: "expiry", name: "Expiry Tracking", icon: FiClock },
    { id: "movements", name: "Stock Movements", icon: FiTrendingUp },
  ];

  const exportToCsv = () => {
    if (!reportData) return;

    let csvContent = "";
    let filename = `inventory-${activeTab}-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    switch (activeTab) {
      case "valuation":
        csvContent =
          "Name,SKU,Type,Category,Stock,Unit,Cost Price,Selling Price,Total Cost Value,Total Selling Value\n";
        reportData.report?.forEach((item) => {
          csvContent += `"${item.name}","${item.sku || ""}","${
            item.item_type
          }","${item.category?.name || ""}",${item.current_stock},"${
            item.unit_of_measure
          }",${item.cost_price},${item.selling_price},${
            item.total_cost_value
          },${item.total_selling_value}\n`;
        });
        break;
      case "low-stock":
        csvContent =
          "Name,SKU,Type,Current Stock,Minimum Stock,Reorder Level,Supplier\n";
        reportData.lowStockItems?.forEach((item) => {
          csvContent += `"${item.name}","${item.sku || ""}","${
            item.item_type
          }",${item.current_stock},${item.minimum_stock},${
            item.reorder_level
          },"${item.supplier?.name || ""}"\n`;
        });
        break;
      case "expiry":
        csvContent =
          "Item,Batch Number,Quantity,Expiry Date,Days Until Expiry,Status\n";
        Object.entries(reportData.batches || {}).forEach(
          ([category, batches]) => {
            batches.forEach((batch) => {
              csvContent += `"${batch.item?.name}","${batch.batch_number}",${batch.available_quantity},"${batch.expiry_date}",${batch.days_until_expiry},"${category}"\n`;
            });
          }
        );
        break;
      case "movements":
        csvContent = "Date,Item,Type,Quantity,Before,After,Reason\n";
        reportData.movements?.forEach((m) => {
          csvContent += `"${new Date(m.created_at).toLocaleString()}","${
            m.item?.name
          }","${m.movement_type}",${m.quantity},${m.quantity_before},${
            m.quantity_after
          },"${m.reason || ""}"\n`;
        });
        break;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const renderValuationReport = () => (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-slate-400 text-sm">Total Items</p>
          <p className="text-2xl font-bold text-white">
            {reportData?.totals?.total_items || 0}
          </p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-slate-400 text-sm">Total Units</p>
          <p className="text-2xl font-bold text-white">
            {reportData?.totals?.total_units?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-slate-400 text-sm">Cost Value</p>
          <p className="text-2xl font-bold text-white">
            ₹{reportData?.totals?.total_cost_value?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-4">
          <p className="text-slate-400 text-sm">Selling Value</p>
          <p className="text-2xl font-bold text-white">
            ₹{reportData?.totals?.total_selling_value?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-emerald-500/10 rounded-lg p-4">
          <p className="text-emerald-400 text-sm">Potential Profit</p>
          <p className="text-2xl font-bold text-emerald-400">
            ₹{reportData?.totals?.total_potential_profit?.toLocaleString() || 0}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-3 text-slate-400 font-medium">Item</th>
              <th className="text-left p-3 text-slate-400 font-medium">SKU</th>
              <th className="text-center p-3 text-slate-400 font-medium">
                Stock
              </th>
              <th className="text-right p-3 text-slate-400 font-medium">
                Cost Price
              </th>
              <th className="text-right p-3 text-slate-400 font-medium">
                Selling Price
              </th>
              <th className="text-right p-3 text-slate-400 font-medium">
                Cost Value
              </th>
              <th className="text-right p-3 text-slate-400 font-medium">
                Selling Value
              </th>
            </tr>
          </thead>
          <tbody>
            {reportData?.report?.map((item) => (
              <tr
                key={item.id}
                className="border-b border-slate-700/50 hover:bg-slate-700/20"
              >
                <td className="p-3">
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-slate-400 text-xs">
                    {item.category?.name}
                  </p>
                </td>
                <td className="p-3 text-slate-300">{item.sku || "-"}</td>
                <td className="p-3 text-center text-white">
                  {item.current_stock} {item.unit_of_measure}
                </td>
                <td className="p-3 text-right text-slate-300">
                  ₹{item.cost_price}
                </td>
                <td className="p-3 text-right text-slate-300">
                  ₹{item.selling_price}
                </td>
                <td className="p-3 text-right text-white">
                  ₹{item.total_cost_value?.toLocaleString()}
                </td>
                <td className="p-3 text-right text-emerald-400">
                  ₹{item.total_selling_value?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLowStockReport = () => (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">Out of Stock</p>
          <p className="text-2xl font-bold text-red-400">
            {reportData?.summary?.total_out_of_stock || 0}
          </p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <p className="text-orange-400 text-sm">Low Stock</p>
          <p className="text-2xl font-bold text-orange-400">
            {reportData?.summary?.total_low_stock || 0}
          </p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">Reorder Needed</p>
          <p className="text-2xl font-bold text-yellow-400">
            {reportData?.summary?.total_reorder_needed || 0}
          </p>
        </div>
      </div>

      {/* Out of Stock */}
      {reportData?.outOfStockItems?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-400 mb-3">
            Out of Stock Items
          </h3>
          <div className="space-y-2">
            {reportData.outOfStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-slate-400 text-xs">
                    SKU: {item.sku || "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">
                    0 {item.unit_of_measure}
                  </p>
                  {item.supplier && (
                    <p className="text-slate-400 text-xs">
                      Supplier: {item.supplier.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock */}
      {reportData?.lowStockItems?.filter((i) => i.current_stock > 0).length >
        0 && (
        <div>
          <h3 className="text-lg font-semibold text-orange-400 mb-3">
            Low Stock Items
          </h3>
          <div className="space-y-2">
            {reportData.lowStockItems
              .filter((i) => i.current_stock > 0)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
                >
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-slate-400 text-xs">
                      SKU: {item.sku || "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold">
                      {item.current_stock} / {item.minimum_stock}{" "}
                      {item.unit_of_measure}
                    </p>
                    {item.supplier && (
                      <p className="text-slate-400 text-xs">
                        Contact: {item.supplier.phone}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderExpiryReport = () => (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">Expired</p>
          <p className="text-2xl font-bold text-red-400">
            {reportData?.summary?.expired || 0}
          </p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
          <p className="text-orange-400 text-sm">Expiring in 7 Days</p>
          <p className="text-2xl font-bold text-orange-400">
            {reportData?.summary?.expiring_7_days || 0}
          </p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">Expiring in 30 Days</p>
          <p className="text-2xl font-bold text-yellow-400">
            {reportData?.summary?.expiring_30_days || 0}
          </p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-400 text-sm">Expiring in 90 Days</p>
          <p className="text-2xl font-bold text-blue-400">
            {reportData?.summary?.expiring_90_days || 0}
          </p>
        </div>
      </div>

      {/* Expired */}
      {reportData?.batches?.expired?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-400 mb-3">
            Expired Items
          </h3>
          <div className="space-y-2">
            {reportData.batches.expired.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{batch.item?.name}</p>
                  <p className="text-slate-400 text-xs">
                    Batch: {batch.batch_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold">
                    {batch.available_quantity} units
                  </p>
                  <p className="text-red-400 text-xs">
                    Expired {Math.abs(batch.days_until_expiry)} days ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Soon */}
      {reportData?.batches?.expiring_7_days?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-orange-400 mb-3">
            Expiring in 7 Days
          </h3>
          <div className="space-y-2">
            {reportData.batches.expiring_7_days.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{batch.item?.name}</p>
                  <p className="text-slate-400 text-xs">
                    Batch: {batch.batch_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-orange-400 font-bold">
                    {batch.available_quantity} units
                  </p>
                  <p className="text-orange-400 text-xs">
                    {batch.days_until_expiry} days left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring in 30 days */}
      {reportData?.batches?.expiring_30_days?.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">
            Expiring in 30 Days
          </h3>
          <div className="space-y-2">
            {reportData.batches.expiring_30_days.map((batch) => (
              <div
                key={batch.id}
                className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{batch.item?.name}</p>
                  <p className="text-slate-400 text-xs">
                    Batch: {batch.batch_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">
                    {batch.available_quantity} units
                  </p>
                  <p className="text-yellow-400 text-xs">
                    {batch.days_until_expiry} days left
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMovementsReport = () => (
    <div>
      {/* Date Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, startDate: e.target.value }))
            }
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
            }
            className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          onClick={() => fetchReport("movements")}
          className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Apply
        </button>
      </div>

      {/* Summary by Type */}
      {reportData?.summary && Object.keys(reportData.summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(reportData.summary).map(([type, data]) => (
            <div key={type} className="bg-slate-700/30 rounded-lg p-4">
              <p className="text-slate-400 text-sm capitalize">
                {type.replace("_", " ")}
              </p>
              <p className="text-xl font-bold text-white">
                {data.count} movements
              </p>
              <p className="text-slate-400 text-xs">
                {data.total_quantity} units
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Movements Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-3 text-slate-400 font-medium">Date</th>
              <th className="text-left p-3 text-slate-400 font-medium">Item</th>
              <th className="text-left p-3 text-slate-400 font-medium">Type</th>
              <th className="text-center p-3 text-slate-400 font-medium">
                Qty
              </th>
              <th className="text-center p-3 text-slate-400 font-medium">
                Before
              </th>
              <th className="text-center p-3 text-slate-400 font-medium">
                After
              </th>
              <th className="text-left p-3 text-slate-400 font-medium">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {reportData?.movements?.map((movement) => {
              const isAddition = [
                "purchase",
                "adjustment_add",
                "return_customer",
                "transfer_in",
                "opening_stock",
              ].includes(movement.movement_type);
              return (
                <tr
                  key={movement.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/20"
                >
                  <td className="p-3 text-slate-300 text-sm">
                    {new Date(movement.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-white">{movement.item?.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        isAddition
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {movement.movement_type.replace("_", " ")}
                    </span>
                  </td>
                  <td
                    className={`p-3 text-center font-bold ${
                      isAddition ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {isAddition ? "+" : "-"}
                    {movement.quantity}
                  </td>
                  <td className="p-3 text-center text-slate-400">
                    {movement.quantity_before}
                  </td>
                  <td className="p-3 text-center text-white">
                    {movement.quantity_after}
                  </td>
                  <td className="p-3 text-slate-400 text-sm">
                    {movement.reason || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

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

      <main className="lg:ml-72 min-h-screen p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 ml-12 lg:ml-0">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/inventory"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Inventory Reports
              </h1>
              <p className="text-slate-400 mt-1">
                View and export inventory reports
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchReport(activeTab)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <FiRefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={exportToCsv}
              disabled={!reportData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <FiDownload className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              {activeTab === "valuation" && renderValuationReport()}
              {activeTab === "low-stock" && renderLowStockReport()}
              {activeTab === "expiry" && renderExpiryReport()}
              {activeTab === "movements" && renderMovementsReport()}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default InventoryReportsPage;
