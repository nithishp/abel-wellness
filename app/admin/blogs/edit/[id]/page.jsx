"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { checkExistingSession } from "@/lib/actions/admin.actions";
import { FiArrowLeft, FiSave, FiEye } from "react-icons/fi";
import { toast } from "sonner";
import RichTextEditor from "@/app/components/ui/RichTextEditor";
import ImageUpload from "@/app/components/ui/ImageUpload";

const EditBlog = () => {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id;

  const [admin, setAdmin] = useState(null);
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
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (admin && blogId) {
      fetchBlog();
    }
  }, [admin, blogId]);

  const checkAuthentication = async () => {
    try {
      const currentAdmin = await checkExistingSession();
      if (currentAdmin) {
        setAdmin(currentAdmin);
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

  const fetchBlog = async () => {
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
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const loadingToast = toast.loading("Updating blog post...", {
      description: "Please wait while we save your changes.",
    });

    try {
      const response = await fetch(`/api/admin/blogs?id=${blogId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blog),
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Edit Blog</h1>
                <p className="text-gray-600">Update your blog post</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  // Preview functionality can be added later
                  toast.info("Preview functionality coming soon!");
                }}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FiEye className="mr-2" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
              >
                <FiSave className="mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={blog.title}
                  onChange={(e) =>
                    setBlog((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={blog.author}
                  onChange={(e) =>
                    setBlog((prev) => ({ ...prev, author: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={admin?.name || "Admin"}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={blog.description}
                onChange={(e) =>
                  setBlog((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter a brief description of your blog post"
                required
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Featured Image
            </h2>
            <ImageUpload
              onImageUpload={handleImageUpload}
              currentImage={blog.imageUrl}
              onImageRemove={handleImageRemove}
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Content *
            </h2>
            <RichTextEditor
              content={blog.content}
              onChange={(content) => setBlog((prev) => ({ ...prev, content }))}
              placeholder="Write your blog content here..."
            />
          </div>

          {/* Publishing Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Publishing Options
            </h2>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={blog.published}
                  onChange={(e) =>
                    setBlog((prev) => ({
                      ...prev,
                      published: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Published
                  <span className="text-gray-500 block text-xs">
                    Make this blog visible to the public
                  </span>
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={blog.featured}
                  onChange={(e) =>
                    setBlog((prev) => ({ ...prev, featured: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Featured
                  <span className="text-gray-500 block text-xs">
                    Highlight this blog on the homepage
                  </span>
                </span>
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBlog;
