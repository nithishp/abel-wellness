"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkExistingSession } from "@/lib/actions/admin.actions";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import RichTextEditor from "@/app/components/ui/RichTextEditor";
import ImageUpload from "@/app/components/ui/ImageUpload";

const CreateBlog = () => {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
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
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const currentAdmin = await checkExistingSession();
      if (currentAdmin) {
        setAdmin(currentAdmin);
        setBlogForm((prev) => ({
          ...prev,
          author: currentAdmin.name || currentAdmin.email || "Admin",
        }));
      } else {
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/admin/login");
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    setSaving(true);

    const loadingToast = toast.loading("Creating blog post...", {
      description: "Please wait while we save your blog post.",
    });

    try {
      const { imageFileId, ...blogData } = {
        ...blogForm,
        author: blogForm.author || admin?.name || "Admin",
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
      toast.success("Blog created successfully!", {
        description: "Your new blog post has been saved.",
      });

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

    const originalPublished = blogForm.published;
    setBlogForm((prev) => ({ ...prev, published: false }));

    const loadingToast = toast.loading("Saving draft...");

    try {
      const { imageFileId, ...blogData } = {
        ...blogForm,
        published: false,
        author: blogForm.author || admin?.name || "Admin",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/admin/blogs")}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create New Blog
                </h1>
                <p className="text-gray-600">
                  Write and publish a new blog post
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSaveDraft}
                disabled={saving || !blogForm.title.trim()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={(e) => {
                  setBlogForm((prev) => ({ ...prev, published: true }));
                  handleCreateBlog(e);
                }}
                disabled={
                  saving || !blogForm.title.trim() || !blogForm.content.trim()
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSave className="mr-2" />
                {saving ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleCreateBlog} className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Blog Details
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={blogForm.title}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter blog title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={blogForm.author}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, author: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Author name"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={blogForm.description}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Brief description of the blog post"
                />
              </div>

              <div className="lg:col-span-2">
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  currentImage={blogForm.imageUrl}
                  onImageRemove={handleImageRemove}
                />
              </div>

              <div className="lg:col-span-2 flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={blogForm.featured}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, featured: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Featured post
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Content *
            </h2>
            <RichTextEditor
              content={blogForm.content}
              onChange={(content) => {
                console.log("Content changed:", content);
                setBlogForm({ ...blogForm, content });
              }}
              placeholder="Write your blog content here..."
            />
          </div>

          {/* Preview Section */}
          {(blogForm.title || blogForm.description) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Preview
              </h2>
              <div className="border rounded-lg p-4">
                {blogForm.imageUrl && (
                  <img
                    src={blogForm.imageUrl}
                    alt="Blog preview"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {blogForm.title}
                </h3>
                <p className="text-gray-600 mb-4">{blogForm.description}</p>
                <div className="text-sm text-gray-500">
                  By {blogForm.author} • {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateBlog;
