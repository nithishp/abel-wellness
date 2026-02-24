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
  FiArrowUpRight,
  FiX,
} from "react-icons/fi";
import { BookOpen } from "lucide-react";

const BlogsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { value: "all", label: "All" },
    { value: "homeopathy", label: "Homeopathy" },
    { value: "wellness", label: "Wellness" },
    { value: "nutrition", label: "Nutrition" },
    { value: "mental-health", label: "Mental Health" },
    { value: "chronic-conditions", label: "Chronic Conditions" },
    { value: "womens-health", label: "Women's Health" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "case-studies", label: "Case Studies" },
    { value: "general", label: "General" },
  ];

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
      if (selectedCategory && selectedCategory !== "all")
        params.append("category", selectedCategory);

      const response = await fetch(`/api/admin/blogs?${params}`);
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const data = await response.json();

      // Mark initial load as complete after first successful fetch
      if (isInitialLoad) setIsInitialLoad(false);

      return {
        items: data.blogs || [],
        total: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
      };
    },
    [debouncedSearch, selectedCategory, isInitialLoad],
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

  // Only show skeleton on initial page load, not during search
  if (isInitialLoad && loading && blogs.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f1f1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-6 bg-neutral-200 rounded w-24 mb-4 animate-pulse" />
          <div className="text-center mb-16">
            <div className="h-12 bg-neutral-200 rounded w-1/3 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-neutral-200 rounded w-2/3 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden animate-pulse"
              >
                <div className="h-52 bg-neutral-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-1/4" />
                  <div className="h-5 bg-neutral-200 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded w-full" />
                  <div className="h-4 bg-neutral-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f1f1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-neutral-600 hover:text-emerald-700 mb-10 transition-colors font-medium text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Our Blog
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4">
            Health Insights & Tips
          </h1>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto leading-relaxed">
            Stay updated with the latest homoeopathic health tips, treatments,
            and wellness advice from our expert team.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-10 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-neutral-200 rounded-full text-neutral-800 placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        {totalCount > 0 && (
          <div className="mb-6 text-neutral-500 text-sm">
            Showing {blogs.length} of {totalCount} posts
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        {blogs.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-800 mb-3">
              No Posts Found
            </h2>
            <p className="text-neutral-600 mb-6">
              {searchTerm || selectedCategory !== "all"
                ? "Try adjusting your search or filter."
                : "Check back soon for the latest updates!"}
            </p>
            {(searchTerm || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-medium text-sm transition-colors duration-300"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, index) => (
              <article
                key={blog.id || blog.$id}
                className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => router.push(`/blog/${blog.slug}`)}
              >
                {/* Image */}
                <div className="relative overflow-hidden h-52">
                  {blog.imageUrl || blog.image_url ? (
                    <img
                      src={blog.imageUrl || blog.image_url}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=260&fit=crop&crop=center";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Date Badge */}
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-neutral-700">
                    {new Date(
                      blog.created_at || blog.$createdAt,
                    ).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      timeZone: "Asia/Kolkata",
                    })}
                  </span>

                  {/* Category Badge */}
                  {blog.category && (
                    <span className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full capitalize">
                      {blog.category.replace(/-/g, " ")}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Author */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <FiUser className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-neutral-500">
                      {blog.author}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-200">
                    {blog.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                    {blog.description || blog.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                      <FiCalendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(
                          blog.created_at || blog.$createdAt,
                        ).toLocaleDateString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:text-emerald-700 transition-colors">
                      <span>Read more</span>
                      <FiArrowUpRight className="ml-1 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Infinite Scroll Loader - only show when there are items */}
        {blogs.length > 0 && (
          <InfiniteScrollLoader
            loading={loadingMore}
            hasMore={hasMore}
            sentinelRef={sentinelRef}
            itemCount={blogs.length}
            totalCount={totalCount}
            showEndMessage={false}
          />
        )}
      </div>
    </div>
  );
};

export default BlogsPage;
