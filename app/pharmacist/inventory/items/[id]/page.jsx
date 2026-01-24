"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PharmacistSidebar from "../../../components/PharmacistSidebar";
import {
  FiArrowLeft,
  FiEdit2,
  FiPackage,
  FiAlertTriangle,
  FiTrendingUp,
  FiDollarSign,
  FiBox,
  FiClock,
  FiPlus,
  FiMinus,
  FiX,
  FiCheck,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const PharmacistItemDetailPage = ({ params }) => {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [item, setItem] = useState(null);
  const [batches, setBatches] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    type: "add",
    quantity: 0,
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

    fetchItemData();
  }, [user, authLoading, router, id]);

  const fetchItemData = async () => {
    try {
      const [itemRes, batchesRes, movementsRes] = await Promise.all([
        fetch(`/api/inventory/items/${id}`),
        fetch(`/api/inventory/batches?item_id=${id}`),
        fetch(`/api/inventory/movements?item_id=${id}&limit=10`),
      ]);

      const itemData = await itemRes.json();
      const batchesData = await batchesRes.json();
      const movementsData = await movementsRes.json();

      if (itemData.success) {
        setItem(itemData.item);
      } else {
        toast.error("Item not found");
        router.push("/pharmacist/inventory/items");
        return;
      }

      if (batchesData.success) {
        setBatches(batchesData.batches || []);
      }

      if (movementsData.success) {
        setMovements(movementsData.movements || []);
      }
    } catch (error) {
      console.error("Error fetching item data:", error);
      toast.error("Failed to load item");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (adjustmentData.quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/items/${id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustment_type: adjustmentData.type,
          quantity: adjustmentData.quantity,
          reason: adjustmentData.reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Stock adjusted successfully");
        setShowAdjustModal(false);
        setAdjustmentData({ type: "add", quantity: 0, reason: "" });
        fetchItemData();
      } else {
        toast.error(data.error || "Failed to adjust stock");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  const getStockPercentage = () => {
    if (!item) return 0;
    const max = Math.max(item.reorder_level * 2, item.current_stock);
    return Math.min((item.current_stock / max) * 100, 100);
  };

  const getStockColor = () => {
    if (!item) return "bg-slate-600";
    if (item.current_stock === 0) return "bg-red-500";
    if (item.current_stock <= item.minimum_stock) return "bg-yellow-500";
    if (item.current_stock <= item.reorder_level) return "bg-orange-500";
    return "bg-emerald-500";
  };

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

  if (!item) return null;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <PharmacistSidebar />

      <main className="flex-1 p-6 lg:ml-72 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/pharmacist/inventory/items"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{item.name}</h1>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    item.is_active
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-slate-400 mt-1">
                SKU: {item.sku || "N/A"} •{" "}
                {item.category?.name || "Uncategorized"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdjustModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <FiTrendingUp className="w-4 h-4" />
              Adjust Stock
            </button>
            <Link
              href={`/pharmacist/inventory/items/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiPackage className="w-5 h-5 text-purple-500" />
              <span className="text-slate-400 text-sm">Current Stock</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {item.current_stock} {item.unit_of_measure}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiDollarSign className="w-5 h-5 text-emerald-500" />
              <span className="text-slate-400 text-sm">Stock Value</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{(item.current_stock * item.cost_price).toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiDollarSign className="w-5 h-5 text-purple-500" />
              <span className="text-slate-400 text-sm">Selling Price</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{item.selling_price}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <FiBox className="w-5 h-5 text-blue-500" />
              <span className="text-slate-400 text-sm">Active Batches</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {batches.filter((b) => b.available_quantity > 0).length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Item Details & Stock Levels */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stock Level */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Stock Levels
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm">
                      Current Stock
                    </span>
                    <span className="text-white font-bold">
                      {item.current_stock}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getStockColor()} transition-all duration-300`}
                      style={{ width: `${getStockPercentage()}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Minimum Stock</span>
                    <span className="text-white">{item.minimum_stock}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Reorder Level</span>
                    <span className="text-white">{item.reorder_level}</span>
                  </div>
                </div>
                {item.current_stock <= item.minimum_stock && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <FiAlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-400 text-sm">
                      Stock is below minimum level. Consider reordering.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Batches */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Active Batches
              </h2>
              {batches.filter((b) => b.available_quantity > 0).length > 0 ? (
                <div className="space-y-3">
                  {batches
                    .filter((b) => b.available_quantity > 0)
                    .map((batch) => {
                      const daysUntilExpiry = batch.expiry_date
                        ? Math.ceil(
                            (new Date(batch.expiry_date) - new Date()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : null;
                      return (
                        <div
                          key={batch.id}
                          className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                        >
                          <div>
                            <p className="text-white font-medium">
                              {batch.batch_number}
                            </p>
                            {batch.expiry_date && (
                              <p
                                className={`text-sm ${
                                  daysUntilExpiry <= 30
                                    ? "text-orange-400"
                                    : "text-slate-400"
                                }`}
                              >
                                Expires:{" "}
                                {new Date(
                                  batch.expiry_date
                                ).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                                {daysUntilExpiry <= 30 &&
                                  ` (${daysUntilExpiry} days)`}
                              </p>
                            )}
                          </div>
                          <span className="text-lg font-bold text-white">
                            {batch.available_quantity}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">
                  No active batches
                </p>
              )}
            </div>
          </div>

          {/* Recent Movements & Details */}
          <div className="space-y-6">
            {/* Item Info */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Item Details
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white capitalize">
                    {item.item_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit</span>
                  <span className="text-white">{item.unit_of_measure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cost Price</span>
                  <span className="text-white">₹{item.cost_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Selling Price</span>
                  <span className="text-white">₹{item.selling_price}</span>
                </div>
                {item.supplier && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Supplier</span>
                    <span className="text-white">{item.supplier.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Movements */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Recent Movements
              </h2>
              {movements.length > 0 ? (
                <div className="space-y-3">
                  {movements.slice(0, 5).map((movement) => {
                    const isAddition = [
                      "purchase",
                      "adjustment_add",
                      "return_customer",
                      "transfer_in",
                    ].includes(movement.movement_type);
                    return (
                      <div
                        key={movement.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          <p className="text-slate-400 capitalize">
                            {movement.movement_type.replace("_", " ")}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {new Date(movement.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                          </p>
                        </div>
                        <span
                          className={`font-bold ${
                            isAddition ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {isAddition ? "+" : "-"}
                          {movement.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">
                  No recent movements
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-white">Adjust Stock</h2>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Adjustment Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setAdjustmentData({ ...adjustmentData, type: "add" })
                    }
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      adjustmentData.type === "add"
                        ? "bg-green-500/20 border-green-500 text-green-400"
                        : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <FiPlus className="w-4 h-4" />
                    Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAdjustmentData({ ...adjustmentData, type: "subtract" })
                    }
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                      adjustmentData.type === "subtract"
                        ? "bg-red-500/20 border-red-500 text-red-400"
                        : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    <FiMinus className="w-4 h-4" />
                    Remove Stock
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={adjustmentData.quantity}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      quantity:
                        e.target.value === "" ? "" : parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) =>
                    setAdjustmentData({
                      ...adjustmentData,
                      reason: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Reason for adjustment..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustStock}
                  disabled={submitting || adjustmentData.quantity <= 0}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistItemDetailPage;
