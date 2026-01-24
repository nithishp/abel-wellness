"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../components/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  FiArrowLeft,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiTruck,
  FiPackage,
  FiClock,
  FiX,
  FiCheck,
  FiAlertTriangle,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const PurchaseOrderDetailPage = ({ params }) => {
  const { id } = use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [receivedItems, setReceivedItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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

    fetchOrder();
  }, [user, authLoading, router, id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${id}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        // Initialize received items with ordered quantities
        if (data.order.items) {
          setReceivedItems(
            data.order.items.map((item) => ({
              id: item.id,
              received_quantity: item.quantity,
              batch_number: "",
              expiry_date: "",
            }))
          );
        }
      } else {
        toast.error("Order not found");
        router.push("/admin/inventory/purchase-orders");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Order ${newStatus}`);
        fetchOrder();
      } else {
        toast.error(data.error || "Failed to update order");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleReceive = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "receive",
          received_items: receivedItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Order received and stock updated");
        setShowReceiveModal(false);
        fetchOrder();
      } else {
        toast.error(data.error || "Failed to receive order");
      }
    } catch (error) {
      console.error("Error receiving order:", error);
      toast.error("Failed to receive order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/inventory/purchase-orders/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Order deleted");
        router.push("/admin/inventory/purchase-orders");
      } else {
        toast.error(data.error || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  const updateReceivedItem = (index, field, value) => {
    const newItems = [...receivedItems];
    newItems[index][field] = value;
    setReceivedItems(newItems);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "draft":
        return <FiClock className="w-5 h-5" />;
      case "pending":
        return <FiClock className="w-5 h-5" />;
      case "approved":
        return <FiCheckCircle className="w-5 h-5" />;
      case "ordered":
        return <FiTruck className="w-5 h-5" />;
      case "received":
        return <FiPackage className="w-5 h-5" />;
      case "cancelled":
        return <FiX className="w-5 h-5" />;
      default:
        return <FiClock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "approved":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "ordered":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "received":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
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

  if (!order) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 ml-12 lg:ml-0">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/inventory/purchase-orders"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">
                  {order.po_number}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-slate-400 mt-1">
                Created {new Date(order.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {order.status === "draft" && (
              <>
                <button
                  onClick={() => handleStatusChange("pending")}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Submit for Approval
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-5 h-5" />
                </button>
              </>
            )}
            {order.status === "pending" && (
              <>
                <button
                  onClick={() => handleStatusChange("approved")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange("cancelled")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              </>
            )}
            {order.status === "approved" && (
              <button
                onClick={() => handleStatusChange("ordered")}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Mark as Ordered
              </button>
            )}
            {order.status === "ordered" && (
              <button
                onClick={() => setShowReceiveModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Receive Stock
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Info */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Supplier Information
              </h2>
              {order.supplier ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Name</p>
                    <p className="text-white font-medium">
                      {order.supplier.name}
                    </p>
                  </div>
                  {order.supplier.contact_person && (
                    <div>
                      <p className="text-slate-400 text-sm">Contact Person</p>
                      <p className="text-white">
                        {order.supplier.contact_person}
                      </p>
                    </div>
                  )}
                  {order.supplier.phone && (
                    <div>
                      <p className="text-slate-400 text-sm">Phone</p>
                      <p className="text-white">{order.supplier.phone}</p>
                    </div>
                  )}
                  {order.supplier.email && (
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white">{order.supplier.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400">No supplier assigned</p>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400 font-medium">
                        Item
                      </th>
                      <th className="text-center p-3 text-slate-400 font-medium">
                        Quantity
                      </th>
                      <th className="text-right p-3 text-slate-400 font-medium">
                        Unit Price
                      </th>
                      <th className="text-right p-3 text-slate-400 font-medium">
                        Total
                      </th>
                      {order.status === "received" && (
                        <th className="text-center p-3 text-slate-400 font-medium">
                          Received
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-700/50"
                      >
                        <td className="p-3">
                          <p className="text-white font-medium">
                            {item.item?.name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            SKU: {item.item?.sku || "N/A"}
                          </p>
                        </td>
                        <td className="p-3 text-center text-white">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right text-slate-300">
                          ₹{item.unit_price}
                        </td>
                        <td className="p-3 text-right text-white font-medium">
                          ₹{item.total_price?.toLocaleString()}
                        </td>
                        {order.status === "received" && (
                          <td className="p-3 text-center">
                            <span
                              className={
                                item.received_quantity === item.quantity
                                  ? "text-emerald-400"
                                  : "text-yellow-400"
                              }
                            >
                              {item.received_quantity || 0}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-3">Notes</h2>
                <p className="text-slate-300">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Total Items</span>
                  <span>{order.items?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Total Quantity</span>
                  <span>
                    {order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0}
                  </span>
                </div>
                {order.expected_date && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Expected Date</span>
                    <span>
                      {new Date(order.expected_date).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                      ₹{order.total_amount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Status Timeline
              </h2>
              <div className="space-y-3">
                {["draft", "pending", "approved", "ordered", "received"].map(
                  (status, index) => {
                    const isCompleted =
                      [
                        "received",
                        "ordered",
                        "approved",
                        "pending",
                        "draft",
                      ].indexOf(order.status) >=
                      [
                        "received",
                        "ordered",
                        "approved",
                        "pending",
                        "draft",
                      ].indexOf(status);
                    const isCurrent = order.status === status;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isCurrent
                              ? getStatusColor(status)
                              : isCompleted
                              ? "bg-emerald-500/20 text-emerald-500"
                              : "bg-slate-700 text-slate-500"
                          }`}
                        >
                          {isCompleted ? (
                            <FiCheck className="w-4 h-4" />
                          ) : (
                            getStatusIcon(status)
                          )}
                        </div>
                        <span
                          className={`capitalize ${
                            isCurrent
                              ? "text-white font-medium"
                              : isCompleted
                              ? "text-slate-300"
                              : "text-slate-500"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Receive Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800">
              <h2 className="text-lg font-semibold text-white">
                Receive Stock
              </h2>
              <button
                onClick={() => setShowReceiveModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-400">
                  <FiAlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    This will add stock to inventory and create batch records
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {order.items?.map((item, index) => (
                  <div key={item.id} className="p-4 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-medium">
                          {item.item?.name}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Ordered: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          Received Qty
                        </label>
                        <input
                          type="number"
                          value={receivedItems[index]?.received_quantity ?? ""}
                          onChange={(e) =>
                            updateReceivedItem(
                              index,
                              "received_quantity",
                              e.target.value === ""
                                ? ""
                                : parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          min="0"
                          max={item.quantity}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          Batch Number
                        </label>
                        <input
                          type="text"
                          value={receivedItems[index]?.batch_number || ""}
                          onChange={(e) =>
                            updateReceivedItem(
                              index,
                              "batch_number",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          placeholder="e.g., BATCH-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={receivedItems[index]?.expiry_date || ""}
                          onChange={(e) =>
                            updateReceivedItem(
                              index,
                              "expiry_date",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReceive}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                  Confirm Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
};

export default PurchaseOrderDetailPage;
