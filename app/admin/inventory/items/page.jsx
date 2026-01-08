"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import AdminSidebar from "../../components/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  FiPackage,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiAlertTriangle,
  FiChevronDown,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";

const InventoryItemsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useRoleAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(
    searchParams.get("lowStock") === "true"
  );
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, item: null });
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/inventory/categories");
        const data = await res.json();
        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch items callback
  const fetchItems = useCallback(
    async (page, limit) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (categoryFilter) params.append("categoryId", categoryFilter);
      if (typeFilter) params.append("itemType", typeFilter);
      if (lowStockFilter) params.append("lowStock", "true");

      const response = await fetch(`/api/inventory/items?${params}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      return {
        items: data.items || [],
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [debouncedSearch, categoryFilter, typeFilter, lowStockFilter]
  );

  const {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchItems, {
    limit: 20,
    enabled:
      !!user && ["admin", "pharmacist"].includes(user.role) && !authLoading,
    dependencies: [debouncedSearch, categoryFilter, typeFilter, lowStockFilter],
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await reset();
    setRefreshing(false);
    toast.success("Items refreshed!");
  };

  const handleDelete = async () => {
    if (!deleteModal.item) return;

    try {
      const res = await fetch(`/api/inventory/items/${deleteModal.item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Item deleted successfully");
        reset();
      } else {
        toast.error(data.error || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
    } finally {
      setDeleteModal({ open: false, item: null });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setTypeFilter("");
    setLowStockFilter(false);
  };

  const getStockStatusColor = (item) => {
    if (item.current_stock === 0) return "text-red-500 bg-red-500/10";
    if (item.current_stock <= item.minimum_stock)
      return "text-orange-500 bg-orange-500/10";
    return "text-green-500 bg-green-500/10";
  };

  const getItemTypeColor = (type) => {
    switch (type) {
      case "medication":
        return "bg-blue-500/10 text-blue-400";
      case "supply":
        return "bg-purple-500/10 text-purple-400";
      case "equipment":
        return "bg-orange-500/10 text-orange-400";
      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

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
              { label: "Items" },
            ]}
            backHref="/admin/inventory"
          />
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 ml-12 lg:ml-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Inventory Items
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-1">
              {totalCount} items total
              {lowStockFilter && " • Showing low stock only"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <FiRefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href="/admin/inventory/items/new"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Item</span>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search items by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters || categoryFilter || typeFilter || lowStockFilter
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              <FiFilter className="w-4 h-4" />
              Filters
              {(categoryFilter || typeFilter || lowStockFilter) && (
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {
                    [categoryFilter, typeFilter, lowStockFilter].filter(Boolean)
                      .length
                  }
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="medication">Medication</option>
                  <option value="supply">Supply</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>

              {/* Low Stock Toggle */}
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lowStockFilter}
                    onChange={(e) => setLowStockFilter(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800"
                  />
                  <span className="text-white">Low Stock Only</span>
                </label>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400 font-medium">
                    Item
                  </th>
                  <th className="text-left p-4 text-slate-400 font-medium">
                    SKU
                  </th>
                  <th className="text-left p-4 text-slate-400 font-medium">
                    Type
                  </th>
                  <th className="text-left p-4 text-slate-400 font-medium">
                    Category
                  </th>
                  <th className="text-center p-4 text-slate-400 font-medium">
                    Stock
                  </th>
                  <th className="text-right p-4 text-slate-400 font-medium">
                    Price
                  </th>
                  <th className="text-center p-4 text-slate-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No items found
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                            <FiPackage className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {item.name}
                            </p>
                            {item.generic_name && (
                              <p className="text-xs text-slate-400">
                                {item.generic_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{item.sku || "-"}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getItemTypeColor(
                            item.item_type
                          )}`}
                        >
                          {item.item_type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        {item.category?.name || "-"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {(item.current_stock === 0 ||
                            item.current_stock <= item.minimum_stock) && (
                            <FiAlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                          <span
                            className={`px-2 py-1 rounded-lg text-sm font-medium ${getStockStatusColor(
                              item
                            )}`}
                          >
                            {item.current_stock} {item.unit_of_measure}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-slate-300">
                        ₹{item.selling_price?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/inventory/items/${item.id}`}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/inventory/items/${item.id}/edit`}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModal({ open: true, item })}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Infinite Scroll Loader */}
          <InfiniteScrollLoader
            ref={sentinelRef}
            loading={loadingMore}
            hasMore={hasMore}
          />
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, item: null })}
          onConfirm={handleDelete}
          title="Delete Item"
          message={`Are you sure you want to delete "${deleteModal.item?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmStyle="danger"
        />
      </main>
    </div>
  );
};

const InventoryItemsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5B8C51]"></div>
        </div>
      }
    >
      <InventoryItemsContent />
    </Suspense>
  );
};

export default InventoryItemsPage;
