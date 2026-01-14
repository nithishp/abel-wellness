"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PharmacistSidebar from "../../components/PharmacistSidebar";
import {
  FiArrowLeft,
  FiPlus,
  FiShoppingCart,
  FiTruck,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiSearch,
  FiFilter,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

const PurchaseOrdersPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

    fetchOrders();
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/inventory/purchase-orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "draft":
        return <FiClock className="w-4 h-4" />;
      case "pending":
        return <FiShoppingCart className="w-4 h-4" />;
      case "approved":
        return <FiCheckCircle className="w-4 h-4" />;
      case "ordered":
        return <FiTruck className="w-4 h-4" />;
      case "received":
        return <FiPackage className="w-4 h-4" />;
      case "cancelled":
        return <FiX className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.po_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <PharmacistSidebar />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <PharmacistSidebar />

      <main className="lg:ml-72 min-h-screen p-4 sm:p-6 overflow-auto">
        {/* Breadcrumb */}
        <div className="mb-4 ml-12 lg:ml-0">
          <Breadcrumb
            items={[
              {
                label: "Inventory",
                href: "/pharmacist/inventory",
                icon: <FiPackage className="w-4 h-4" />,
              },
              {
                label: "Purchase Orders",
                icon: <FiShoppingCart className="w-4 h-4" />,
              },
            ]}
            backHref="/pharmacist/inventory"
          />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ml-12 lg:ml-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Purchase Orders
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              Manage inventory purchase orders
            </p>
          </div>
          <Link
            href="/pharmacist/inventory/purchase-orders/new"
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto"
          >
            <FiPlus className="w-4 h-4" />
            <span>New Order</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <button
            onClick={() => setStatusFilter("all")}
            className={`p-3 rounded-lg border transition-colors ${
              statusFilter === "all"
                ? "bg-purple-500/10 border-purple-500 text-purple-400"
                : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wider">All</p>
            <p className="text-xl font-bold">{orders.length}</p>
          </button>
          {["draft", "pending", "approved", "ordered", "received"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`p-3 rounded-lg border transition-colors ${
                  statusFilter === status
                    ? `${getStatusColor(status)}`
                    : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:border-slate-600"
                }`}
              >
                <p className="text-xs uppercase tracking-wider">
                  {status.replace("_", " ")}
                </p>
                <p className="text-xl font-bold">{statusCounts[status] || 0}</p>
              </button>
            )
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by PO number or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/pharmacist/inventory/purchase-orders/${order.id}`}
              className="block bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${getStatusColor(order.status)}`}
                  >
                    {getStatusIcon(order.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {order.po_number}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {order.supplier?.name || "No supplier"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      ₹{order.total_amount?.toLocaleString() || 0}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {order.items?.length || 0} items
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <p className="text-slate-400 text-xs mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <FiChevronRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>

              {order.notes && (
                <p className="mt-3 text-slate-400 text-sm border-t border-slate-700/50 pt-3">
                  {order.notes}
                </p>
              )}
            </Link>
          ))}

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <FiShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {searchQuery || statusFilter !== "all"
                  ? "No matching purchase orders"
                  : "No purchase orders yet"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Link
                  href="/pharmacist/inventory/purchase-orders/new"
                  className="mt-4 inline-block text-purple-500 hover:text-purple-400"
                >
                  Create your first purchase order
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PurchaseOrdersPage;
