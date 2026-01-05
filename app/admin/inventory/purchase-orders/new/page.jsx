"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiSave,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const NewPurchaseOrderPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const [formData, setFormData] = useState({
    supplier_id: "",
    expected_date: "",
    notes: "",
    status: "draft",
  });

  const [orderItems, setOrderItems] = useState([]);

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

    fetchInitialData();
  }, [user, authLoading, router]);

  const fetchInitialData = async () => {
    try {
      const [suppliersRes, itemsRes] = await Promise.all([
        fetch("/api/inventory/suppliers"),
        fetch("/api/inventory/items"),
      ]);

      const suppliersData = await suppliersRes.json();
      const itemsData = await itemsRes.json();

      if (suppliersData.success) {
        setSuppliers(suppliersData.suppliers.filter((s) => s.is_active));
      }
      if (itemsData.success) {
        setItems(itemsData.items || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const results = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.sku?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  };

  const addItem = (item) => {
    const exists = orderItems.find((oi) => oi.item_id === item.id);
    if (exists) {
      toast.error("Item already added");
      return;
    }

    setOrderItems([
      ...orderItems,
      {
        item_id: item.id,
        item_name: item.name,
        item_sku: item.sku,
        quantity: 1,
        unit_price: item.cost_price || 0,
        total_price: item.cost_price || 0,
      },
    ]);

    setSearchQuery("");
    setSearchResults([]);
    setShowItemSearch(false);
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...orderItems];
    newItems[index].quantity = parseInt(quantity) || 0;
    newItems[index].total_price =
      newItems[index].quantity * newItems[index].unit_price;
    setOrderItems(newItems);
  };

  const updateItemPrice = (index, price) => {
    const newItems = [...orderItems];
    newItems[index].unit_price = parseFloat(price) || 0;
    newItems[index].total_price =
      newItems[index].quantity * newItems[index].unit_price;
    setOrderItems(newItems);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async (status) => {
    if (!formData.supplier_id) {
      toast.error("Please select a supplier");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status,
          items: orderItems.map((item) => ({
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Purchase order created");
        router.push(`/admin/inventory/purchase-orders/${data.order.id}`);
      } else {
        toast.error(data.error || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    } finally {
      setSubmitting(false);
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
              <h1 className="text-2xl font-bold text-white">
                New Purchase Order
              </h1>
              <p className="text-slate-400 mt-1">
                Create a new inventory purchase order
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier & Details */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Details
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Supplier *
                  </label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_id: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expected_date: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>
            </div>

            {/* Items */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Order Items
                </h2>
                <button
                  onClick={() => setShowItemSearch(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              {/* Item Search Modal */}
              {showItemSearch && (
                <div className="mb-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-slate-300">
                      Search Items
                    </p>
                    <button
                      onClick={() => {
                        setShowItemSearch(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                      placeholder="Search by name or SKU..."
                      autoFocus
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addItem(item)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-slate-400 text-xs">
                            SKU: {item.sku || "N/A"} • Cost: ₹{item.cost_price}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Items Table */}
              {orderItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-slate-400 font-medium">
                          Item
                        </th>
                        <th className="text-center p-3 text-slate-400 font-medium">
                          Qty
                        </th>
                        <th className="text-right p-3 text-slate-400 font-medium">
                          Unit Price
                        </th>
                        <th className="text-right p-3 text-slate-400 font-medium">
                          Total
                        </th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-700/50"
                        >
                          <td className="p-3">
                            <p className="text-white font-medium">
                              {item.item_name}
                            </p>
                            <p className="text-slate-400 text-xs">
                              SKU: {item.item_sku || "N/A"}
                            </p>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(index, e.target.value)
                              }
                              className="w-20 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-center focus:outline-none focus:border-emerald-500"
                              min="1"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItemPrice(index, e.target.value)
                              }
                              className="w-24 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-right focus:outline-none focus:border-emerald-500"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="p-3 text-right text-white font-medium">
                            ₹{item.total_price.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No items added yet. Click "Add Item" to start.
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Items</span>
                  <span>{orderItems.length}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Total Quantity</span>
                  <span>
                    {orderItems.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-emerald-400">
                      ₹{calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSubmit("draft")}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit("pending")}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      Submit Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NewPurchaseOrderPage;
