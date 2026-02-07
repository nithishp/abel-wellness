"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiSave,
  FiEye,
  FiFileText,
  FiImage,
  FiSettings,
} from "react-icons/fi";
import { toast } from "sonner";
import RichTextEditor from "@/app/components/ui/RichTextEditor";
import ImageUpload from "@/app/components/ui/ImageUpload";
import Breadcrumb from "@/components/ui/Breadcrumb";

const EditBlog = () => {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id;
  const { user, loading: authLoading } = useRoleAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blog, setBlog] = useState({
    title: "",
    description: "",
    content: "",
    author: "",
    imageUrl: "",
    published: false,
    featured: false,
  });

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

  useEffect(() => {
    if (user && blogId) {
      fetchBlog();
    }
  }, [user, blogId]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/blogs?id=${blogId}`);
      if (response.ok) {
        const data = await response.json();
        setBlog(data);
      } else {
        toast.error("Failed to fetch blog");
        router.push("/admin/blogs");
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      toast.error("Failed to fetch blog");
      router.push("/admin/blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Validate form data
    if (!blog.title.trim()) {
      toast.error("Title is required");
      setSaving(false);
      return;
    }

    if (blog.description.length > 500) {
      toast.error("Description must be 500 characters or less");
      setSaving(false);
      return;
    }

    if (!blog.content.trim()) {
      toast.error("Content is required");
      setSaving(false);
      return;
    }

    const loadingToast = toast.loading("Updating blog post...", {
      description: "Please wait while we save your changes.",
    });

    try {
      // Only send the fields that should be updated
      const updateData = {
        title: blog.title,
        description: blog.description,
        content: blog.content,
        author: blog.author,
        imageUrl: blog.imageUrl,
        published: blog.published,
        featured: blog.featured,
      };

      const response = await fetch(`/api/admin/blogs?id=${blogId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update blog");
      }

      toast.dismiss(loadingToast);
      toast.success("Blog updated successfully!", {
        description: "Your changes have been saved.",
      });

      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to update blog", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (imageUrl, fileId) => {
    setBlog((prev) => ({
      ...prev,
      imageUrl,
      imageFileId: fileId,
    }));
  };

  const handleImageRemove = () => {
    setBlog((prev) => ({
      ...prev,
      imageUrl: "",
      imageFileId: "",
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            {/* Breadcrumb */}
            <div className="mb-3 ml-12 lg:ml-0">
              <Breadcrumb
                items={[
                  {
                    label: "Blogs",
                    href: "/admin/blogs",
                    icon: <FiFileText className="w-4 h-4" />,
                  },
                  { label: "Edit" },
                ]}
                backHref="/admin/blogs"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 ml-12 lg:ml-0 min-w-0 flex-1">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                    Edit Blog
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Update your blog post
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 ml-12 sm:ml-0">
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Preview functionality coming soon!")
                  }
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm sm:text-base flex-1 sm:flex-none"
                >
                  <FiEye className="w-4 h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
            {/* Basic Information Card */}
            <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={blog.title}
                    onChange={(e) =>
                      setBlog((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Enter blog title"
                    required
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={blog.author}
                    onChange={(e) =>
                      setBlog((prev) => ({ ...prev, author: e.target.value }))
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Author name"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description <span className="text-red-400">*</span>
                    <span
                      className={`ml-2 text-xs ${
                        blog.description.length > 450
                          ? "text-amber-400"
                          : "text-slate-500"
                      }`}
                    >
                      ({blog.description.length}/500)
                    </span>
                  </label>
                  <textarea
                    value={blog.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setBlog((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                      }
                    }}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 transition-all resize-none ${
                      blog.description.length > 450
                        ? "border-amber-500/50 focus:ring-amber-500/50 focus:border-amber-500/50"
                        : "border-slate-600/50 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    }`}
                    rows={3}
                    placeholder="Enter a brief description of your blog post (max 500 characters)"
                    maxLength={500}
                    required
                  />
                  {blog.description.length > 450 && (
                    <p className="text-xs text-amber-400 mt-1">
                      Approaching character limit
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Featured Image Card */}
            <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <FiImage className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Featured Image
                </h2>
              </div>
              <ImageUpload
                onImageUpload={handleImageUpload}
                currentImage={blog.imageUrl}
                onImageRemove={handleImageRemove}
              />
            </div>

            {/* Content Card */}
            <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Content <span className="text-red-400">*</span>
                </h2>
              </div>
              <div className="rounded-xl border border-slate-600/50 overflow-hidden">
                <RichTextEditor
                  content={blog.content}
                  onChange={(content) =>
                    setBlog((prev) => ({ ...prev, content }))
                  }
                  placeholder="Write your blog content here..."
                />
              </div>
            </div>

            {/* Publishing Options Card */}
            <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <FiSettings className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Publishing Options
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                {/* Published Toggle */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={blog.published}
                      onChange={(e) =>
                        setBlog((prev) => ({
                          ...prev,
                          published: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        blog.published ? "bg-emerald-500" : "bg-slate-600"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        blog.published ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors block">
                      Published
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Make this blog visible to the public
                    </span>
                  </div>
                </label>

                {/* Featured Toggle */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={blog.featured}
                      onChange={(e) =>
                        setBlog((prev) => ({
                          ...prev,
                          featured: e.target.checked,
                        }))
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-11 h-6 rounded-full transition-colors ${
                        blog.featured ? "bg-amber-500" : "bg-slate-600"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        blog.featured ? "translate-x-5" : "translate-x-0"
                      }`}
                    ></div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors block">
                      Featured
                    </span>
                    <span className="text-xs text-slate-500 block">
                      Highlight this blog on the homepage
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditBlog;
