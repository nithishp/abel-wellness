"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../components/AdminSidebar";
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
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const InventoryItemDetailPage = ({ params }) => {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);
  const [batches, setBatches] = useState([]);
  const [movements, setMovements] = useState([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: 0,
    reason: "",
    notes: "",
  });
  const [adjusting, setAdjusting] = useState(false);

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

    fetchItemDetails();
  }, [user, authLoading, router, resolvedParams.id]);

  const fetchItemDetails = async () => {
    setLoading(true);
    try {
      const [itemRes, batchesRes, movementsRes] = await Promise.all([
        fetch(`/api/inventory/items/${resolvedParams.id}`),
        fetch(`/api/inventory/batches/${resolvedParams.id}?byItem=true`),
        fetch(`/api/inventory/movements?itemId=${resolvedParams.id}&limit=10`),
      ]);

      const [itemData, batchesData, movementsData] = await Promise.all([
        itemRes.json(),
        batchesRes.json(),
        movementsRes.json(),
      ]);

      if (itemData.success) {
        setItem(itemData.item);
      } else {
        toast.error("Item not found");
        router.push("/admin/inventory/items");
        return;
      }

      if (batchesData.success) setBatches(batchesData.batches || []);
      if (movementsData.success) setMovements(movementsData.movements || []);
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast.error("Failed to load item details");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustmentData.quantity || adjustmentData.quantity === 0) {
      toast.error("Please enter a quantity");
      return;
    }
    if (!adjustmentData.reason) {
      toast.error("Please select a reason");
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch(
        `/api/inventory/items/${resolvedParams.id}/adjust`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(adjustmentData),
        },
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Stock adjusted successfully");
        setShowAdjustModal(false);
        setAdjustmentData({ quantity: 0, reason: "", notes: "" });
        fetchItemDetails();
      } else {
        toast.error(data.error || "Failed to adjust stock");
      }
    } catch (error) {
      toast.error("Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  const getStockStatusColor = () => {
    if (!item) return "text-slate-400";
    if (item.current_stock === 0) return "text-red-500";
    if (item.current_stock <= item.minimum_stock) return "text-orange-500";
    return "text-green-500";
  };

  const getMovementTypeColor = (type) => {
    const addTypes = [
      "purchase",
      "adjustment_add",
      "return_customer",
      "transfer_in",
      "opening_stock",
    ];
    return addTypes.includes(type) ? "text-green-500" : "text-red-500";
  };

  const getMovementTypeLabel = (type) => {
    const labels = {
      purchase: "Purchase",
      sale: "Sale",
      dispensing: "Dispensed",
      adjustment_add: "Adjustment (+)",
      adjustment_subtract: "Adjustment (-)",
      return_supplier: "Return to Supplier",
      return_customer: "Customer Return",
      transfer_in: "Transfer In",
      transfer_out: "Transfer Out",
      expired: "Expired",
      damaged: "Damaged",
      opening_stock: "Opening Stock",
      other: "Other",
    };
    return labels[type] || type;
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

  if (!item) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 ml-12 lg:ml-0">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/inventory/items"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{item.name}</h1>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.is_active
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {item.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {item.generic_name && (
                <p className="text-slate-400 mt-1">{item.generic_name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdjustModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              <FiTrendingUp className="w-4 h-4" />
              Adjust Stock
            </button>
            <Link
              href={`/admin/inventory/items/${resolvedParams.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit Item
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FiPackage className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-slate-400 text-sm">Current Stock</span>
            </div>
            <p className={`text-2xl font-bold ${getStockStatusColor()}`}>
              {item.current_stock} {item.unit_of_measure}
            </p>
            {item.current_stock <= item.minimum_stock && (
              <p className="text-orange-400 text-xs mt-1 flex items-center gap-1">
                <FiAlertTriangle className="w-3 h-3" />
                Below minimum ({item.minimum_stock})
              </p>
            )}
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FiDollarSign className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-slate-400 text-sm">Stock Value</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{(item.current_stock * item.cost_price).toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              @ ₹{item.cost_price}/unit
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <FiDollarSign className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-slate-400 text-sm">Selling Price</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{item.selling_price}
            </p>
            <p className="text-emerald-400 text-xs mt-1">
              Margin:{" "}
              {item.cost_price > 0
                ? (
                    ((item.selling_price - item.cost_price) / item.cost_price) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <FiBox className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-slate-400 text-sm">Active Batches</span>
            </div>
            <p className="text-2xl font-bold text-white">{batches.length}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Item Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Item Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">SKU</p>
                  <p className="text-white">{item.sku || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Barcode</p>
                  <p className="text-white">{item.barcode || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Type</p>
                  <p className="text-white capitalize">{item.item_type}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Category</p>
                  <p className="text-white">{item.category?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Supplier</p>
                  <p className="text-white">{item.supplier?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Manufacturer</p>
                  <p className="text-white">{item.manufacturer || "-"}</p>
                </div>
                {item.item_type === "medication" && (
                  <>
                    <div>
                      <p className="text-slate-400 text-sm">Dosage Form</p>
                      <p className="text-white capitalize">
                        {item.dosage_form || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Strength</p>
                      <p className="text-white">{item.strength || "-"}</p>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <p className="text-slate-400 text-sm">Description</p>
                  <p className="text-white">{item.description || "-"}</p>
                </div>
              </div>
            </div>

            {/* Stock Levels */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Stock Levels
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs">Minimum</p>
                  <p className="text-white font-bold">{item.minimum_stock}</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs">Reorder</p>
                  <p className="text-white font-bold">{item.reorder_level}</p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs">Current</p>
                  <p className={`font-bold ${getStockStatusColor()}`}>
                    {item.current_stock}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-slate-400 text-xs">Maximum</p>
                  <p className="text-white font-bold">{item.maximum_stock}</p>
                </div>
              </div>
              {/* Stock Level Bar */}
              <div className="mt-4">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      item.current_stock <= item.minimum_stock
                        ? "bg-red-500"
                        : item.current_stock <= item.reorder_level
                          ? "bg-orange-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (item.current_stock / item.maximum_stock) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recent Movements */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Recent Stock Movements
              </h2>
              {movements.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  No movements recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            getMovementTypeColor(movement.movement_type) ===
                            "text-green-500"
                              ? "bg-green-500/10"
                              : "bg-red-500/10"
                          }`}
                        >
                          {getMovementTypeColor(movement.movement_type) ===
                          "text-green-500" ? (
                            <FiPlus className="w-4 h-4 text-green-500" />
                          ) : (
                            <FiMinus className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {getMovementTypeLabel(movement.movement_type)}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(movement.created_at).toLocaleString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${getMovementTypeColor(
                            movement.movement_type,
                          )}`}
                        >
                          {getMovementTypeColor(movement.movement_type) ===
                          "text-green-500"
                            ? "+"
                            : "-"}
                          {movement.quantity}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {movement.quantity_before} → {movement.quantity_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Batches */}
          <div className="space-y-6">
            {/* Batches */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Active Batches
              </h2>
              {batches.length === 0 ? (
                <p className="text-slate-400 text-center py-4">
                  No active batches
                </p>
              ) : (
                <div className="space-y-3">
                  {batches.map((batch) => {
                    const daysUntilExpiry = batch.expiry_date
                      ? Math.ceil(
                          (new Date(batch.expiry_date) - new Date()) /
                            (1000 * 60 * 60 * 24),
                        )
                      : null;
                    const isExpiringSoon =
                      daysUntilExpiry !== null && daysUntilExpiry <= 30;
                    const isExpired =
                      daysUntilExpiry !== null && daysUntilExpiry <= 0;

                    return (
                      <div
                        key={batch.id}
                        className={`p-3 rounded-lg border ${
                          isExpired
                            ? "bg-red-500/10 border-red-500/30"
                            : isExpiringSoon
                              ? "bg-orange-500/10 border-orange-500/30"
                              : "bg-slate-700/30 border-slate-600/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium text-sm">
                            {batch.batch_number}
                          </p>
                          <span
                            className={`text-xs font-medium ${
                              isExpired
                                ? "text-red-400"
                                : isExpiringSoon
                                  ? "text-orange-400"
                                  : "text-slate-400"
                            }`}
                          >
                            {batch.available_quantity} units
                          </span>
                        </div>
                        {batch.expiry_date && (
                          <p
                            className={`text-xs ${
                              isExpired
                                ? "text-red-400"
                                : isExpiringSoon
                                  ? "text-orange-400"
                                  : "text-slate-400"
                            }`}
                          >
                            <FiClock className="inline w-3 h-3 mr-1" />
                            Expires:{" "}
                            {new Date(batch.expiry_date).toLocaleDateString(
                              "en-IN",
                              { timeZone: "Asia/Kolkata" },
                            )}
                            {isExpired
                              ? " (Expired)"
                              : isExpiringSoon
                                ? ` (${daysUntilExpiry} days)`
                                : ""}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Additional Info */}
            {item.item_type === "medication" && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Additional Info
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">
                      Requires Prescription
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.requires_prescription
                          ? "bg-orange-500/10 text-orange-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {item.requires_prescription ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Controlled Substance</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.is_controlled_substance
                          ? "bg-red-500/10 text-red-400"
                          : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {item.is_controlled_substance ? "Yes" : "No"}
                    </span>
                  </div>
                  {item.storage_conditions && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Storage</span>
                      <span className="text-white text-sm capitalize">
                        {item.storage_conditions.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Adjustment Modal */}
        {showAdjustModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">
                Adjust Stock
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Quantity (positive to add, negative to subtract)
                  </label>
                  <input
                    type="number"
                    value={adjustmentData.quantity}
                    onChange={(e) =>
                      setAdjustmentData((prev) => ({
                        ...prev,
                        quantity: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Reason
                  </label>
                  <select
                    value={adjustmentData.reason}
                    onChange={(e) =>
                      setAdjustmentData((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select reason</option>
                    <option value="Stock count correction">
                      Stock count correction
                    </option>
                    <option value="Damaged goods">Damaged goods</option>
                    <option value="Expired items">Expired items</option>
                    <option value="Received stock">Received stock</option>
                    <option value="Return from customer">
                      Return from customer
                    </option>
                    <option value="Return to supplier">
                      Return to supplier
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={adjustmentData.notes}
                    onChange={(e) =>
                      setAdjustmentData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {adjustmentData.quantity !== 0 && (
                  <div className="p-3 bg-slate-700/30 rounded-lg">
                    <p className="text-slate-400 text-sm">
                      New Stock Level:{" "}
                      <span
                        className={`font-bold ${
                          item.current_stock + adjustmentData.quantity < 0
                            ? "text-red-500"
                            : "text-white"
                        }`}
                      >
                        {Math.max(
                          0,
                          item.current_stock + adjustmentData.quantity,
                        )}{" "}
                        {item.unit_of_measure}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustmentData({ quantity: 0, reason: "", notes: "" });
                  }}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustStock}
                  disabled={
                    adjusting ||
                    !adjustmentData.quantity ||
                    !adjustmentData.reason
                  }
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {adjusting ? "Adjusting..." : "Adjust Stock"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InventoryItemDetailPage;
