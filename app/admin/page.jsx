"use client";
import { useState, useEffect } from "react";
import {
  adminLogin,
  adminLogout,
  getCurrentAdmin,
  checkExistingSession,
} from "@/lib/actions/admin.actions";
import { FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlus } from "react-icons/fi";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Blog form state
  const [blogForm, setBlogForm] = useState({
    title: "",
    description: "",
    content: "",
    author: "",
    imageUrl: "",
    published: false,
    featured: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    checkExistingAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBlogs();
    }
  }, [isAuthenticated]);

  const checkExistingAuth = async () => {
    try {
      const existingUser = await checkExistingSession();
      if (existingUser) {
        setAdmin(existingUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log("No existing session found");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const result = await adminLogin(loginData.email, loginData.password);
      if (result) {
        // Get updated admin info after successful login
        const currentAdmin = await getCurrentAdmin();
        setAdmin(
          currentAdmin || { name: loginData.email, email: loginData.email }
        );
        setIsAuthenticated(true);
        setLoginData({ email: "", password: "" });

        toast.success("Welcome back!", {
          description:
            "You have successfully logged in to the admin dashboard.",
        });
      }
    } catch (error) {
      console.error("Login failed:", error);
      setLoginError(
        error.message || "Login failed. Please check your credentials."
      );
      toast.error("Login failed", {
        description:
          error.message || "Please check your credentials and try again.",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      setIsAuthenticated(false);
      setAdmin(null);
      setBlogs([]);
      setLoginError(""); // Clear any login errors

      toast.success("Logged out successfully", {
        description: "You have been safely logged out of the admin dashboard.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      // Force logout even if API call fails
      setIsAuthenticated(false);
      setAdmin(null);
      setBlogs([]);

      toast.success("Logged out", {
        description: "You have been logged out of the admin dashboard.",
      });
    }
  };

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/admin/blogs?limit=50");
      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }
      const data = await response.json();
      setBlogs(data.documents || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();

    const loadingToast = toast.loading("Creating blog post...", {
      description: "Please wait while we save your blog post.",
    });

    try {
      const blogData = {
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

      await fetchBlogs();
      setShowCreateForm(false);
      setBlogForm({
        title: "",
        description: "",
        content: "",
        author: "",
        imageUrl: "",
        published: false,
        featured: false,
      });

      toast.dismiss(loadingToast);
      toast.success("Blog created successfully!", {
        description: "Your new blog post has been published.",
      });
    } catch (error) {
      console.error("Error creating blog:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to create blog", {
        description: "Please try again or check your connection.",
      });
    }
  };

  const handleUpdateBlog = async (e) => {
    e.preventDefault();

    const loadingToast = toast.loading("Updating blog post...", {
      description: "Please wait while we save your changes.",
    });

    try {
      const response = await fetch(`/api/admin/blogs?id=${editingBlog.$id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update blog");
      }

      await fetchBlogs();
      setEditingBlog(null);
      setBlogForm({
        title: "",
        description: "",
        content: "",
        author: "",
        imageUrl: "",
        published: false,
        featured: false,
      });

      toast.dismiss(loadingToast);
      toast.success("Blog updated successfully!", {
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error updating blog:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to update blog", {
        description: "Please try again or check your connection.",
      });
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      const loadingToast = toast.loading("Deleting blog post...", {
        description: "Please wait while we remove the blog post.",
      });

      try {
        const response = await fetch(`/api/admin/blogs?id=${blogId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete blog");
        }

        await fetchBlogs();

        toast.dismiss(loadingToast);
        toast.success("Blog deleted successfully!", {
          description: "The blog post has been permanently removed.",
        });
      } catch (error) {
        console.error("Error deleting blog:", error);
        toast.dismiss(loadingToast);
        toast.error("Failed to delete blog", {
          description: "Please try again or check your connection.",
        });
      }
    }
  };

  const handleTogglePublished = async (blogId, currentStatus) => {
    try {
      const response = await fetch(
        `/api/admin/blogs?id=${blogId}&action=toggle`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ published: !currentStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle blog status");
      }

      await fetchBlogs();
      toast.success(
        `Blog ${!currentStatus ? "published" : "unpublished"} successfully!`,
        {
          description: `The blog post is now ${
            !currentStatus ? "visible to the public" : "hidden from the public"
          }.`,
        }
      );
    } catch (error) {
      console.error("Error toggling blog status:", error);
      toast.error("Failed to update blog status", {
        description: "Please try again or check your connection.",
      });
    }
  };

  const startEditing = (blog) => {
    setEditingBlog(blog);
    setBlogForm({
      title: blog.title,
      description: blog.description,
      content: blog.content,
      author: blog.author,
      imageUrl: blog.imageUrl || "",
      published: blog.published,
      featured: blog.featured,
    });
    setShowCreateForm(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>

          {loginError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={loginData.email}
                onChange={(e) =>
                  setLoginData({ ...loginData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 text-black focus:ring-blue-500"
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Blog Admin Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {admin?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingBlog(null);
              setBlogForm({
                title: "",
                description: "",
                content: "",
                author: "",
                imageUrl: "",
                published: false,
                featured: false,
              });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
          >
            <FiPlus className="mr-2" />
            Create New Blog
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingBlog ? "Edit Blog" : "Create New Blog"}
            </h2>
            <form onSubmit={editingBlog ? handleUpdateBlog : handleCreateBlog}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={blogForm.title}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    placeholder={admin?.name || "Admin"}
                  />
                </div>
              </div>

              <div className="mb-4">
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
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={blogForm.imageUrl}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, imageUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={blogForm.content}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, content: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={10}
                  required
                />
              </div>

              <div className="flex items-center space-x-6 mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={blogForm.published}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, published: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Published
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={blogForm.featured}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, featured: e.target.checked })
                    }
                    className="mr-2"
                  />
                  Featured
                </label>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingBlog ? "Update Blog" : "Create Blog"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingBlog(null);
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold">
              All Blog Posts ({blogs.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <tr key={blog.$id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {blog.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {blog.description?.substring(0, 100)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {blog.author}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          blog.published
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {blog.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(blog.$createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(blog)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          onClick={() =>
                            handleTogglePublished(blog.$id, blog.published)
                          }
                          className={`${
                            blog.published
                              ? "text-red-600 hover:text-red-900"
                              : "text-green-600 hover:text-green-900"
                          }`}
                        >
                          {blog.published ? <FiEyeOff /> : <FiEye />}
                        </button>
                        <button
                          onClick={() => handleDeleteBlog(blog.$id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
