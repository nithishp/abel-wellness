"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBlogBySlug } from "@/lib/actions/blog.actions";
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiClock,
  FiShare2,
} from "react-icons/fi";
import { BookOpen } from "lucide-react";

const BlogPost = () => {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params.slug) {
      fetchBlog();
    }
  }, [params.slug]);

  const fetchBlog = async () => {
    try {
      const blogData = await getBlogBySlug(params.slug);
      setBlog(blogData);
    } catch (error) {
      console.error("Error fetching blog:", error);
      setError("Blog post not found");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.description,
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Estimate reading time
  const getReadingTime = (content) => {
    if (!content) return "3 min read";
    const text = content.replace(/<[^>]*>/g, "");
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f1f1]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-neutral-200 rounded w-24" />
            <div className="h-10 bg-neutral-200 rounded w-3/4" />
            <div className="flex gap-4">
              <div className="h-5 bg-neutral-200 rounded w-32" />
              <div className="h-5 bg-neutral-200 rounded w-32" />
            </div>
            <div className="h-72 sm:h-96 bg-neutral-200 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-5/6" />
              <div className="h-4 bg-neutral-200 rounded w-full" />
              <div className="h-4 bg-neutral-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl border border-neutral-200 p-10 sm:p-16 max-w-lg w-full shadow-sm">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-neutral-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
            Post Not Found
          </h1>
          <p className="text-neutral-600 mb-8 leading-relaxed">
            The blog post you&apos;re looking for doesn&apos;t exist or may have
            been removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/blog")}
              className="px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-medium text-sm transition-colors duration-300"
            >
              Browse All Posts
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-full hover:bg-neutral-50 font-medium text-sm transition-colors duration-300"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(
    blog.created_at || blog.$createdAt,
  ).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="min-h-screen bg-[#f1f1f1]">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 hover:text-emerald-700 transition-colors font-medium text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-1 text-neutral-400 text-sm">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">AWHCC Blog</span>
          </div>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-neutral-600 hover:text-emerald-700 transition-colors text-sm font-medium"
          >
            <FiShare2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <article>
          {/* Category Badge */}
          {blog.category && (
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium mb-4 uppercase tracking-wider">
              {blog.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-5 leading-tight">
            {blog.title}
          </h1>

          {/* Description / Subtitle */}
          {blog.description && (
            <p className="text-lg sm:text-xl text-neutral-600 mb-6 leading-relaxed">
              {blog.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8 pb-8 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <FiUser className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-neutral-800 block leading-tight">
                  {blog.author}
                </span>
                <span className="text-xs text-neutral-500">Author</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500 text-sm">
              <FiCalendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-500 text-sm">
              <FiClock className="w-4 h-4" />
              <span>{getReadingTime(blog.content)}</span>
            </div>
          </div>

          {/* Hero Image */}
          {blog.imageUrl && (
            <div className="mb-10 rounded-2xl overflow-hidden shadow-lg border border-neutral-200">
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="w-full h-64 sm:h-80 lg:h-[420px] object-cover"
                onError={(e) => {
                  e.target.parentElement.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Blog Content */}
          <div
            className="
              blog-content prose prose-lg max-w-none
              prose-headings:text-neutral-900 prose-headings:font-bold
              prose-h2:text-2xl prose-h2:sm:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-neutral-100
              prose-h3:text-xl prose-h3:sm:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:text-base prose-p:sm:text-lg
              prose-strong:text-neutral-900
              prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-blockquote:border-l-emerald-500 prose-blockquote:text-neutral-600 prose-blockquote:bg-emerald-50/50 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:italic
              prose-code:text-emerald-700 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-medium
              prose-ul:text-neutral-700 prose-ol:text-neutral-700
              prose-li:marker:text-emerald-500
              prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-neutral-200
              prose-hr:border-neutral-200
            "
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* Bottom Actions */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => router.push("/blog")}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-medium text-sm transition-colors duration-300 shadow-md hover:shadow-lg"
            >
              <FiArrowLeft className="w-4 h-4" />
              All Blog Posts
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-full hover:bg-neutral-50 font-medium text-sm transition-colors duration-300"
            >
              <FiShare2 className="w-4 h-4" />
              Share This Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
