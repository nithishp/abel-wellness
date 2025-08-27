"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPublishedBlogs } from "@/lib/actions/blog.actions";
import { FiArrowLeft, FiCalendar, FiUser } from "react-icons/fi";

const BlogsPage = () => {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await getPublishedBlogs(50);
      setBlogs(response.documents || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading blog posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest dental health tips, treatments, and
            news from our expert team.
          </p>
        </div>

        {blogs.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Blog Posts Yet
            </h2>
            <p className="text-gray-600">
              Check back soon for the latest updates!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <article
                key={blog.$id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/blog/${blog.slug}`)}
              >
                {blog.imageUrl && (
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=200&fit=crop&crop=center";
                    }}
                  />
                )}

                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center">
                      <FiUser className="mr-1" />
                      {blog.author}
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="mr-1" />
                      {new Date(blog.$createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {blog.title}
                  </h2>

                  <p className="text-gray-600 line-clamp-3">
                    {blog.description}
                  </p>

                  <div className="mt-4">
                    <span className="text-blue-600 hover:text-blue-800 font-medium">
                      Read more →
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogsPage;
