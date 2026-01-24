"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useInfiniteScroll } from "@/lib/hooks/useInfiniteScroll";
import { InfiniteScrollLoader } from "@/components/ui/InfiniteScrollLoader";
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiArrowRight,
  FiSearch,
} from "react-icons/fi";

const BlogsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch blogs callback for infinite scroll
  const fetchBlogs = useCallback(
    async (page, limit) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        published: "true",
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedCategory && selectedCategory !== "All")
        params.append("category", selectedCategory);

      const response = await fetch(`/api/admin/blogs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();
      return {
        items: data.blogs || [],
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [debouncedSearch, selectedCategory]
  );

  // Use infinite scroll hook
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
    limit: 9,
    enabled: true,
    dependencies: [debouncedSearch, selectedCategory],
  });

  // Categories for filtering
  const categories = useMemo(
    () => ["All", "Health Tips", "Treatments", "Wellness", "Lifestyle", "News"],
    []
  );

  if (loading && blogs.length === 0) {
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

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {totalCount > 0 && (
          <div className="mb-4 text-gray-600">
            Showing {blogs.length} of {totalCount} posts
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {blogs.length === 0 && !loading ? (
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
                key={blog.id || blog.$id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push(`/blog/${blog.slug}`)}
              >
                <div className="relative">
                  {blog.imageUrl || blog.image_url ? (
                    <img
                      src={blog.imageUrl || blog.image_url}
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
                      {new Date(
                        blog.created_at || blog.$createdAt
                      ).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        timeZone: "Asia/Kolkata",
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
                    {blog.category && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {blog.category}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {blog.title}
                  </h2>

                  <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                    {blog.description || blog.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiCalendar className="mr-1 text-xs" />
                      <span>
                        {new Date(
                          blog.created_at || blog.$createdAt
                        ).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
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

        {/* Infinite Scroll Loader */}
        <InfiniteScrollLoader
          loading={loadingMore}
          hasMore={hasMore}
          sentinelRef={sentinelRef}
        />
      </div>
    </div>
  );
};

export default BlogsPage;
