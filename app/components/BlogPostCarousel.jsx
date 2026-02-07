"use client";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiUser,
  FiArrowUpRight,
} from "react-icons/fi";
import { BookOpen } from "lucide-react";
import { getPublishedBlogs } from "@/lib/actions/blog.actions";
import { useRouter } from "next/navigation";

const BlogPostCarousel = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await getPublishedBlogs(10);
        setPosts(response.documents || []);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setPosts(fallbackPosts);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => el.removeEventListener("scroll", checkScroll);
    }
  }, [posts]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 380;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Loading state
  if (loading) {
    return (
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
              Our Blog
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4">
              Latest Health Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
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
      </section>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="max-w-7xl mx-auto text-center">
          <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            Our Blog
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4">
            Latest Health Insights
          </h2>
          <p className="text-neutral-600 text-lg">
            No blog posts available yet. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-transparent w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <span className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <BookOpen className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            Our Blog
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4">
            Latest Health Insights
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Expert tips on homoeopathic treatments, wellness, and healthy living
            from our team of professionals.
          </p>
        </motion.div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-end gap-2 mb-6">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-lg transition-all duration-200 ${
              canScrollLeft
                ? "hover:bg-emerald-50 hover:border-emerald-300 text-neutral-700 hover:text-emerald-700 shadow-sm"
                : "opacity-30 cursor-not-allowed text-neutral-400"
            }`}
          >
            <FiArrowLeft />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center text-lg transition-all duration-200 ${
              canScrollRight
                ? "hover:bg-emerald-50 hover:border-emerald-300 text-neutral-700 hover:text-emerald-700 shadow-sm"
                : "opacity-30 cursor-not-allowed text-neutral-400"
            }`}
          >
            <FiArrowRight />
          </button>
        </div>

        {/* Blog Cards Carousel */}
        <div className="-mx-4 sm:-mx-6 lg:-mx-8">
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory px-4 sm:px-6 lg:px-8 touch-pan-x"
            style={{
              WebkitOverflowScrolling: "touch",
            }}
          >
            {posts.map((post, index) => (
              <Post key={post.$id || post.id} index={index} {...post} />
            ))}
            {/* Spacer to ensure last card isn't cut off */}
            <div className="flex-shrink-0 w-1" aria-hidden="true" />
          </div>
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <a
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium text-sm transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            View All Posts
            <FiArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

const Post = ({
  imageUrl,
  imgUrl,
  author,
  title,
  description,
  slug,
  category,
  created_at,
  $createdAt,
  index = 0,
}) => {
  const router = useRouter();
  const defaultImage =
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=260&fit=crop&crop=center";
  const imgSrc = imageUrl || imgUrl || defaultImage;

  const handleImageError = (e) => {
    e.target.src = defaultImage;
  };

  const dateStr = created_at || $createdAt;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex-shrink-0 w-[280px] sm:w-[320px] md:w-[350px] snap-start"
      onClick={() => slug && router.push(`/blog/${slug}`)}
    >
      {/* Image */}
      <div className="relative overflow-hidden h-52">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {category && (
          <span className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
            {category}
          </span>
        )}
        {formattedDate && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-neutral-700 text-xs font-medium px-3 py-1 rounded-full">
            {formattedDate}
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
          <span className="text-xs font-medium text-neutral-500">{author}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors duration-200">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2 mb-4">
          {description}
        </p>

        {/* Read More */}
        <div className="flex items-center text-emerald-600 font-medium text-sm group-hover:text-emerald-700 transition-colors">
          <span>Read article</span>
          <FiArrowUpRight className="ml-1 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
        </div>
      </div>
    </motion.article>
  );
};

export default BlogPostCarousel;

// Fallback static data for development/demo purposes
const fallbackPosts = [
  {
    id: 1,
    imgUrl:
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&h=260&fit=crop&crop=center",
    author: "Dr. John Anderson",
    title: "The Importance of Regular Homoeopathic Checkups",
    description:
      "Regular homoeopathic checkups are essential for maintaining optimal health and preventing serious health issues.",
    category: "Health Tips",
  },
  {
    id: 2,
    imgUrl:
      "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=260&fit=crop&crop=center",
    author: "Dr. Sarah Wilson",
    title: "Natural Remedies for Better Sleep Quality",
    description:
      "Learn how homoeopathic remedies can help you achieve deeper, more restful sleep without side effects.",
    category: "Wellness",
  },
  {
    id: 3,
    imgUrl:
      "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=400&h=260&fit=crop&crop=center",
    author: "Dr. Michael Chen",
    title: "Understanding Homoeopathic Treatment Approaches",
    description:
      "A comprehensive guide to homoeopathic treatment methods and what to expect during your consultation.",
    category: "Treatments",
  },
  {
    id: 4,
    imgUrl:
      "https://images.unsplash.com/photo-1643297654082-7c16ab80a48c?w=400&h=260&fit=crop&crop=center",
    author: "Dr. Emily Davis",
    title: "Boosting Immunity Naturally with Homoeopathy",
    description:
      "Discover how homoeopathic medicine strengthens your body's natural defenses for lasting health.",
    category: "Wellness",
  },
  {
    id: 5,
    imgUrl:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=260&fit=crop&crop=center",
    author: "Dr. Robert Martinez",
    title: "Managing Childhood Allergies with Homoeopathy",
    description:
      "Essential tips for parents on using gentle homoeopathic treatments for children's allergies.",
    category: "Health Tips",
  },
  {
    id: 6,
    imgUrl:
      "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=400&h=260&fit=crop&crop=center",
    author: "Dr. Lisa Thompson",
    title: "Holistic Approaches to Chronic Pain Relief",
    description:
      "Explore how homoeopathy offers long-term relief for chronic pain conditions without dependency.",
    category: "Treatments",
  },
  {
    id: 7,
    imgUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=260&fit=crop&crop=center",
    author: "Dr. James Rodriguez",
    title: "Stress Management Through Homoeopathic Care",
    description:
      "Practical homoeopathic strategies to manage everyday stress and improve mental well-being.",
    category: "Lifestyle",
  },
];
