"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PharmacistSidebar from "../../components/PharmacistSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import InfiniteScrollLoader from "@/components/ui/InfiniteScrollLoader";
import {
  FiArrowLeft,
  FiPlus,
  FiSearch,
  FiFilter,
  FiPackage,
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "sonner";
import Link from "next/link";

const PAGE_SIZE = 20;

const PharmacistItemsPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    type: "",
    lowStock: false,
  });
  const [deleteItem, setDeleteItem] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

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

    fetchCategories();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === "pharmacist") {
      setItems([]);
      setPage(0);
      setHasMore(true);
      fetchItems(0, true);
    }
  }, [searchQuery, filters, user]);

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

  const fetchItems = async (pageNum = page, reset = false) => {
    if (loading && !reset) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: (pageNum * PAGE_SIZE).toString(),
      });

      if (searchQuery) params.append("search", searchQuery);
      if (filters.category) params.append("category_id", filters.category);
      if (filters.type) params.append("item_type", filters.type);
      if (filters.lowStock) params.append("low_stock", "true");

      const res = await fetch(`/api/inventory/items?${params}`);
      const data = await res.json();

      if (data.success) {
        const newItems = data.items || [];
        if (reset) {
          setItems(newItems);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }
        setHasMore(newItems.length === PAGE_SIZE);
        setPage(pageNum + 1);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchItems(page);
    }
  }, [loading, hasMore, page]);

  const observerRef = useRef(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const res = await fetch(`/api/inventory/items/${deleteItem.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Item deleted");
        setItems((prev) => prev.filter((i) => i.id !== deleteItem.id));
      } else {
        toast.error(data.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setDeleteItem(null);
    }
  };

  const getStockStatus = (item) => {
    if (item.current_stock === 0)
      return { label: "Out of Stock", color: "red" };
    if (item.current_stock <= item.minimum_stock)
      return { label: "Low Stock", color: "yellow" };
    if (item.current_stock <= item.reorder_level)
      return { label: "Reorder", color: "orange" };
    return { label: "In Stock", color: "green" };
  };

  if (authLoading) {
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/pharmacist/inventory"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Inventory Items</h1>
              <p className="text-slate-400 mt-1">Manage all inventory items</p>
            </div>
          </div>
          <Link
            href="/pharmacist/inventory/items/new"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Item
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value })
                }
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Types</option>
                <option value="medication">Medication</option>
                <option value="supply">Supply</option>
                <option value="equipment">Equipment</option>
              </select>

              <button
                onClick={() =>
                  setFilters({ ...filters, lowStock: !filters.lowStock })
                }
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                  filters.lowStock
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                    : "bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500"
                }`}
              >
                <FiAlertTriangle className="w-4 h-4" />
                Low Stock
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {items.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <div
                key={item.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/pharmacist/inventory/items/${item.id}`}
                    className="flex items-center gap-4 flex-1"
                  >
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <FiPackage className="w-6 h-6 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold">
                          {item.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            stockStatus.color === "red"
                              ? "bg-red-500/20 text-red-400"
                              : stockStatus.color === "yellow"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : stockStatus.color === "orange"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {stockStatus.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                        <span>{item.sku || "No SKU"}</span>
                        <span>•</span>
                        <span className="capitalize">{item.item_type}</span>
                        <span>•</span>
                        <span>{item.category?.name || "Uncategorized"}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {item.current_stock}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {item.unit_of_measure}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-purple-400">
                        ₹{item.selling_price}
                      </p>
                      <p className="text-slate-500 text-sm">
                        Cost: ₹{item.cost_price}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/pharmacist/inventory/items/${item.id}/edit`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/pharmacist/inventory/items/${item.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading & Infinite Scroll */}
          <InfiniteScrollLoader
            ref={observerRef}
            loading={loading}
            hasMore={hasMore}
            itemCount={items.length}
            emptyMessage="No items found"
            emptyIcon={<FiPackage className="w-12 h-12 text-slate-600" />}
          />
        </div>
      </main>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
};

export default PharmacistItemsPage;
