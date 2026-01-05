"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../../components/AdminSidebar";
import {
  FiArrowLeft,
  FiSave,
  FiFileText,
  FiImage,
  FiEye,
} from "react-icons/fi";
import { toast } from "sonner";
import RichTextEditor from "@/app/components/ui/RichTextEditor";
import ImageUpload from "@/app/components/ui/ImageUpload";

const CreateBlog = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [saving, setSaving] = useState(false);

  const [blogForm, setBlogForm] = useState({
    title: "",
    description: "",
    content: "",
    author: "",
    imageUrl: "",
    imageFileId: "",
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

    setBlogForm((prev) => ({
      ...prev,
      author: user.full_name || user.email || "Admin",
    }));
  }, [user, authLoading, router]);

  const handleImageUpload = (imageUrl, fileId) => {
    console.log("Image upload callback received:", { imageUrl, fileId });
    setBlogForm({
      ...blogForm,
      imageUrl,
      imageFileId: fileId,
    });
  };

  const handleImageRemove = () => {
    setBlogForm({
      ...blogForm,
      imageUrl: "",
      imageFileId: "",
    });
  };

  const handleCreateBlog = async (e, shouldPublish = false) => {
    e.preventDefault();
    setSaving(true);

    // Validate form data
    if (!blogForm.title.trim()) {
      toast.error("Title is required");
      setSaving(false);
      return;
    }

    if (blogForm.description.length > 500) {
      toast.error("Description must be 500 characters or less");
      setSaving(false);
      return;
    }

    if (!blogForm.content.trim()) {
      toast.error("Content is required");
      setSaving(false);
      return;
    }

    const loadingToast = toast.loading(
      shouldPublish ? "Publishing blog post..." : "Creating blog post...",
      {
        description: "Please wait while we save your blog post.",
      }
    );

    try {
      const { imageFileId, ...blogData } = {
        ...blogForm,
        published: shouldPublish,
        author:
          blogForm.author ||
          user?.user_metadata?.name ||
          user?.email ||
          "Admin",
      };

      const response = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      if (!response.ok) {
        throw new Error("Failed to create blog");
      }

      toast.dismiss(loadingToast);
      toast.success(
        shouldPublish ? "Blog published successfully!" : "Blog saved as draft!",
        {
          description: shouldPublish
            ? "Your blog post is now live and visible to the public."
            : "Your blog post has been saved as a draft.",
        }
      );

      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to create blog", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);

    // Validate form data
    if (!blogForm.title.trim()) {
      toast.error("Title is required");
      setSaving(false);
      return;
    }

    if (blogForm.description.length > 500) {
      toast.error("Description must be 500 characters or less");
      setSaving(false);
      return;
    }

    const originalPublished = blogForm.published;
    setBlogForm((prev) => ({ ...prev, published: false }));

    const loadingToast = toast.loading("Saving draft...");

    try {
      const { imageFileId, ...blogData } = {
        ...blogForm,
        published: false,
        author:
          blogForm.author ||
          user?.user_metadata?.name ||
          user?.email ||
          "Admin",
      };

      const response = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      toast.dismiss(loadingToast);
      toast.success("Draft saved successfully!");

      router.push("/admin/blogs");
    } catch (error) {
      console.error("Error saving draft:", error);
      setBlogForm((prev) => ({ ...prev, published: originalPublished }));
      toast.dismiss(loadingToast);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 ml-12 lg:ml-0 min-w-0 flex-1">
                <button
                  onClick={() => router.push("/admin/blogs")}
                  className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all shrink-0"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                    Create New Blog
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Write and publish a new blog post
                  </p>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 ml-12 sm:ml-0">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || !blogForm.title.trim()}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
                >
                  <FiSave className="w-4 h-4" />
                  <span className="hidden xs:inline">Save</span> Draft
                </button>
                <button
                  onClick={(e) => handleCreateBlog(e, true)}
                  disabled={
                    saving || !blogForm.title.trim() || !blogForm.content.trim()
                  }
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1 sm:flex-none"
                >
                  <FiSave className="w-4 h-4" />
                  {saving ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <form
            onSubmit={(e) => handleCreateBlog(e, false)}
            className="space-y-4 sm:space-y-6"
          >
            {/* Blog Details Card */}
            <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <FiFileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  Blog Details
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, title: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Enter blog title"
                    required
                  />
                </div>

                {/* Author */}
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={blogForm.author}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, author: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    placeholder="Author name"
                  />
                </div>

                {/* Featured Toggle */}
                <div className="lg:col-span-1 flex items-end">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={blogForm.featured}
                        onChange={(e) =>
                          setBlogForm({
                            ...blogForm,
                            featured: e.target.checked,
                          })
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          blogForm.featured ? "bg-emerald-500" : "bg-slate-600"
                        }`}
                      ></div>
                      <div
                        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          blogForm.featured ? "translate-x-5" : "translate-x-0"
                        }`}
                      ></div>
                    </div>
                    <span className="ml-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                      Featured post
                    </span>
                  </label>
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                    <span
                      className={`ml-2 text-xs ${
                        blogForm.description.length > 450
                          ? "text-amber-400"
                          : "text-slate-500"
                      }`}
                    >
                      ({blogForm.description.length}/500)
                    </span>
                  </label>
                  <textarea
                    value={blogForm.description}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) {
                        setBlogForm({
                          ...blogForm,
                          description: e.target.value,
                        });
                      }
                    }}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900/50 border rounded-xl text-white text-sm sm:text-base placeholder-slate-500 focus:outline-none focus:ring-2 transition-all resize-none ${
                      blogForm.description.length > 450
                        ? "border-amber-500/50 focus:ring-amber-500/50 focus:border-amber-500/50"
                        : "border-slate-600/50 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                    }`}
                    rows={3}
                    placeholder="Brief description of the blog post (max 500 characters)"
                    maxLength={500}
                  />
                  {blogForm.description.length > 450 && (
                    <p className="text-xs text-amber-400 mt-1">
                      Approaching character limit
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload Card */}
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
                currentImage={blogForm.imageUrl}
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
              <div className="bg-slate-900/50 rounded-xl border border-slate-600/50 overflow-hidden">
                <RichTextEditor
                  content={blogForm.content}
                  onChange={(content) => {
                    console.log("Content changed:", content);
                    setBlogForm({ ...blogForm, content });
                  }}
                  placeholder="Write your blog content here..."
                />
              </div>
            </div>

            {/* Preview Card */}
            {(blogForm.title || blogForm.description) && (
              <div className="rounded-xl sm:rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <FiEye className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    Preview
                  </h2>
                </div>
                <div className="rounded-xl border border-slate-600/50 bg-slate-900/30 p-4 sm:p-6">
                  {blogForm.imageUrl && (
                    <img
                      src={blogForm.imageUrl}
                      alt="Blog preview"
                      className="w-full h-40 sm:h-48 object-cover rounded-xl mb-4"
                    />
                  )}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    {blogForm.title || "Untitled"}
                  </h3>
                  <p className="text-slate-400 text-sm sm:text-base mb-4">
                    {blogForm.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    <span>By {blogForm.author || "Unknown"}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString()}</span>
                    {blogForm.featured && (
                      <>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                          Featured
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateBlog;
