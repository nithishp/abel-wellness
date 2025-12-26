"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPublishedBlogs } from "@/lib/actions/blog.actions";
import { FiArrowLeft, FiCalendar, FiUser, FiArrowRight } from "react-icons/fi";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors"
        >
          <FiArrowLeft className="mr-2" />
          Back to Home
        </button>

        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Our Blog
            <span className="block text-2xl font-normal text-gray-600 mt-2">
              Expert Insights & Homoeopathic Health Tips
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest Homoeopathic health tips, treatments,
            and news from our expert team of Homoeopathy professionals.
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
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(`/blog/${blog.slug}`)}
              >
                <div className="relative">
                  {blog.imageUrl ? (
                    <img
                      src={blog.imageUrl}
                      alt={blog.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=200&fit=crop&crop=center";
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-4xl">📝</div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                      {new Date(blog.$createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-3 text-sm text-gray-500 mb-4">
                    <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                      <FiUser className="mr-1 text-xs" />
                      <span className="font-medium">{blog.author}</span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {blog.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiCalendar className="mr-1 text-xs" />
                      <span>
                        {new Date(blog.$createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700 transition-colors">
                      <span>Read more</span>
                      <FiArrowRight className="ml-1 text-xs group-hover:translate-x-1 transition-transform" />
                    </div>
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
