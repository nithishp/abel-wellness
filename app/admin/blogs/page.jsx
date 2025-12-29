"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
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
} from "react-icons/fi";
import { toast } from "sonner";

const BlogsManagement = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, published, draft

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

    fetchBlogs();
  }, [user, authLoading, router]);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/blogs?limit=50");
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.documents || []);
      } else {
        toast.error("Failed to fetch blogs");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blogId) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    const loadingToast = toast.loading("Deleting blog post...");

    try {
      const response = await fetch(`/api/admin/blogs?id=${blogId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete blog");
      }

      await fetchBlogs();
      toast.dismiss(loadingToast);
      toast.success("Blog deleted successfully!");
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to delete blog");
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

      await fetchBlogs();
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

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "published" && blog.published) ||
      (filterStatus === "draft" && !blog.published);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-white">Manage Blogs</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {blogs.length} blog posts • {filteredBlogs.length} shown
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
            </div>
          </div>

          {/* Blogs Grid */}
          {filteredBlogs.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBlogs.map((blog) => (
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
                            blog.published ? "bg-emerald-400" : "bg-amber-400"
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
                        By <span className="text-slate-400">{blog.author}</span>
                      </span>
                      <span className="text-slate-500">
                        {new Date(blog.$createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
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
          )}
        </div>
      </main>
    </div>
  );
};

export default BlogsManagement;
