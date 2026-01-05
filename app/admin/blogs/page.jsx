"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import AdminSidebar from "../components/AdminSidebar";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiPlus,
  FiSearch,
  FiFilter,
  FiFileText,
  FiMoreVertical,
  FiExternalLink,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import { toast } from "sonner";

const BlogsManagement = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, published, draft
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    blogId: null,
  });
  const [deleting, setDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If no user after loading completes, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      router.push("/");
      return;
    }
  }, [user, authLoading, router]);

  const fetchBlogs = useCallback(
    async (page, limit) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filterStatus !== "all") {
        params.append(
          "published",
          filterStatus === "published" ? "true" : "false"
        );
      }
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      const response = await fetch(`/api/admin/blogs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      return {
        items: data.documents || [],
        total: data.pagination?.total || data.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [filterStatus, debouncedSearch]
  );

  const {
    items: blogs,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    reset,
    sentinelRef,
  } = useInfiniteScroll(fetchBlogs, {
    limit: 12,
    enabled: !!user && user.role === "admin" && !authLoading,
    dependencies: [filterStatus, debouncedSearch],
  });

  const sortedBlogs = useMemo(() => {
    return [...blogs].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "status":
          comparison = (a.published ? 1 : 0) - (b.published ? 1 : 0);
          break;
        case "created":
          comparison = new Date(a.$createdAt) - new Date(b.$createdAt);
          break;
        case "updated":
          comparison = new Date(a.$updatedAt) - new Date(b.$updatedAt);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [blogs, sortBy, sortOrder]);

  const handleDelete = (blogId) => {
    setConfirmModal({ open: true, blogId });
  };

  const confirmDelete = async () => {
    const { blogId } = confirmModal;
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/blogs?id=${blogId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete blog");
      }

      reset();
      toast.success("Blog deleted successfully!");
      setConfirmModal({ open: false, blogId: null });
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (blog) => {
    const loadingToast = toast.loading(
      `${blog.published ? "Unpublishing" : "Publishing"} blog post...`
    );

    try {
      const response = await fetch(`/api/admin/blogs?id=${blog.$id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...blog,
          published: !blog.published,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update blog status");
      }

      reset();
      toast.dismiss(loadingToast);
      toast.success(
        `Blog ${blog.published ? "unpublished" : "published"} successfully!`
      );
    } catch (error) {
      console.error("Error updating blog status:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to update blog status");
    }
  };

  // Content loading skeleton
  const ContentSkeleton = () => (
    <div className="p-6 lg:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 h-12 bg-slate-800/50 rounded-xl"></div>
        <div className="h-12 w-40 bg-slate-800/50 rounded-xl"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-slate-800/50 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

  // Only show full-page loading for initial auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0 min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Manage Blogs
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {totalCount} blog posts • {sortedBlogs.length} loaded
                </p>
              </div>
              <button
                onClick={() => router.push("/admin/blogs/create")}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
              >
                <FiPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Create Blog</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {loading ? (
            <ContentSkeleton />
          ) : (
            <>
              {/* Filters and Search */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search blogs by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <FiFilter className="text-slate-400 w-5 h-5" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all" className="bg-slate-800">
                        All Blogs
                      </option>
                      <option value="published" className="bg-slate-800">
                        Published
                      </option>
                      <option value="draft" className="bg-slate-800">
                        Drafts
                      </option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="created" className="bg-slate-800">
                        Sort by Created
                      </option>
                      <option value="updated" className="bg-slate-800">
                        Sort by Updated
                      </option>
                      <option value="title" className="bg-slate-800">
                        Sort by Title
                      </option>
                      <option value="status" className="bg-slate-800">
                        Sort by Status
                      </option>
                    </select>
                    <button
                      onClick={() =>
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      }
                      className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                      title={sortOrder === "asc" ? "Ascending" : "Descending"}
                    >
                      {sortOrder === "asc" ? (
                        <FiArrowUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <FiArrowDown className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Blogs Grid */}
              {!loading && sortedBlogs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                    <FiFileText className="w-10 h-10 text-slate-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    No blog posts found
                  </h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search or filter to find what you're looking for"
                      : "Get started by creating your first blog post to share with your audience"}
                  </p>
                  <button
                    onClick={() => router.push("/admin/blogs/create")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                  >
                    <FiPlus className="w-5 h-5" />
                    Create Your First Blog
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedBlogs.map((blog) => (
                      <div
                        key={blog.$id}
                        className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 hover:shadow-xl transition-all duration-300"
                      >
                        {/* Image */}
                        <div className="relative h-48 overflow-hidden">
                          {blog.imageUrl ? (
                            <img
                              src={blog.imageUrl}
                              alt={blog.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                              <FiFileText className="w-12 h-12 text-slate-500" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                          {/* Status Badge */}
                          <div className="absolute top-4 left-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-md ${
                                blog.published
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  blog.published
                                    ? "bg-emerald-400"
                                    : "bg-amber-400"
                                }`}
                              ></span>
                              {blog.published ? "Published" : "Draft"}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                router.push(`/admin/blogs/edit/${blog.$id}`)
                              }
                              className="p-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-white hover:bg-emerald-500 transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(blog)}
                              className={`p-2 bg-slate-900/80 backdrop-blur-md rounded-lg transition-colors ${
                                blog.published
                                  ? "text-amber-400 hover:bg-amber-500 hover:text-white"
                                  : "text-emerald-400 hover:bg-emerald-500 hover:text-white"
                              }`}
                              title={blog.published ? "Unpublish" : "Publish"}
                            >
                              {blog.published ? (
                                <FiEyeOff className="w-4 h-4" />
                              ) : (
                                <FiEye className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(blog.$id)}
                              className="p-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                            {blog.title}
                          </h3>
                          <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                            {blog.description}
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">
                              By{" "}
                              <span className="text-slate-400">
                                {blog.author}
                              </span>
                            </span>
                            <span className="text-slate-500">
                              {new Date(blog.$createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-5 py-4 border-t border-slate-700/50 flex items-center justify-between">
                          <button
                            onClick={() =>
                              router.push(`/admin/blogs/edit/${blog.$id}`)
                            }
                            className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            Edit Post
                            <FiExternalLink className="w-4 h-4" />
                          </button>
                          {blog.published && (
                            <button
                              onClick={() => router.push(`/blog/${blog.slug}`)}
                              className="text-sm text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
                            >
                              View Live
                              <FiEye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <InfiniteScrollLoader
                    ref={sentinelRef}
                    loading={loading}
                    loadingMore={loadingMore}
                    hasMore={hasMore}
                    error={error}
                    itemCount={sortedBlogs.length}
                    totalCount={totalCount}
                    emptyMessage="No blogs found"
                    endMessage="You've seen all blog posts"
                    onRetry={reset}
                    loaderColor="purple"
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, blogId: null })}
        onConfirm={confirmDelete}
        title="Delete Blog Post"
        message="Are you sure you want to delete this blog post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
};

export default BlogsManagement;
