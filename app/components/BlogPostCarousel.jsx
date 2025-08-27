"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import useMeasure from "react-use-measure";
import { getPublishedBlogs } from "@/lib/actions/blog.actions";

const CARD_WIDTH = 350;
const MARGIN = 20;
const CARD_SIZE = CARD_WIDTH + MARGIN;

const BREAKPOINTS = {
  sm: 640,
  lg: 1024,
};

const BlogPostCarousel = () => {
  const [ref, { width }] = useMeasure();
  const [offset, setOffset] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch blog posts on component mount
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await getPublishedBlogs(10);
        setPosts(response.documents || []);
      } catch (error) {
        console.error("Error fetching blogs:", error);
        // Fallback to static data if API fails
        setPosts(fallbackPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const CARD_BUFFER =
    width > BREAKPOINTS.lg ? 3 : width > BREAKPOINTS.sm ? 2 : 1;

  const CAN_SHIFT_LEFT = offset < 0;

  const CAN_SHIFT_RIGHT =
    Math.abs(offset) < CARD_SIZE * (posts.length - CARD_BUFFER);

  const shiftLeft = () => {
    if (!CAN_SHIFT_LEFT) {
      return;
    }
    setOffset((pv) => (pv += CARD_SIZE));
  };

  const shiftRight = () => {
    if (!CAN_SHIFT_RIGHT) {
      return;
    }
    setOffset((pv) => (pv -= CARD_SIZE));
  };

  if (loading) {
    return (
      <section className="bg-neutral-100 py-8">
        <div className="relative overflow-hidden p-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-4xl">The Team Blog</h2>
            <div className="flex items-center justify-center py-8">
              <div className="text-lg text-neutral-500">
                Loading blog posts...
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="bg-neutral-100 py-8">
        <div className="relative overflow-hidden p-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-4xl">The Team Blog</h2>
            <div className="flex items-center justify-center py-8">
              <div className="text-lg text-neutral-500">
                No blog posts available yet.
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-neutral-100 py-8" ref={ref}>
      <div className="relative overflow-hidden p-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <h2 className="mb-4 text-4xl">The Team Blog</h2>

            <div className="flex items-center gap-2">
              <button
                className={`rounded-lg border-[1px] border-neutral-400 bg-white p-1.5 text-2xl transition-opacity ${
                  CAN_SHIFT_LEFT ? "" : "opacity-30"
                }`}
                disabled={!CAN_SHIFT_LEFT}
                onClick={shiftLeft}
              >
                <FiArrowLeft />
              </button>
              <button
                className={`rounded-lg border-[1px] border-neutral-400 bg-white p-1.5 text-2xl transition-opacity ${
                  CAN_SHIFT_RIGHT ? "" : "opacity-30"
                }`}
                disabled={!CAN_SHIFT_RIGHT}
                onClick={shiftRight}
              >
                <FiArrowRight />
              </button>
            </div>
          </div>
          <motion.div
            animate={{
              x: offset,
            }}
            transition={{
              ease: "easeInOut",
            }}
            className="flex"
          >
            {posts.map((post) => {
              return <Post key={post.$id || post.id} {...post} />;
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Post = ({ imageUrl, imgUrl, author, title, description, slug }) => {
  // Handle both API data and fallback data structure
  const imgSrc = imageUrl || imgUrl || "/api/placeholder/350/200";

  return (
    <div
      className="relative shrink-0 cursor-pointer transition-transform hover:-translate-y-1"
      style={{
        width: CARD_WIDTH,
        marginRight: MARGIN,
      }}
      onClick={() => {
        // Navigate to blog post detail page
        if (slug) {
          window.location.href = `/blog/${slug}`;
        }
      }}
    >
      <img
        src={imgSrc}
        className="mb-3 h-[200px] w-full rounded-lg object-cover"
        alt={`An image for blog post titled ${title}`}
        onError={(e) => {
          // Fallback image if the provided image fails to load
          e.target.src = "/api/placeholder/350/200";
        }}
      />
      <span className="rounded-md border-[1px] border-neutral-500 px-1.5 py-1 text-xs uppercase text-neutral-500">
        {author}
      </span>
      <p className="mt-1.5 text-lg font-medium">{title}</p>
      <p className="text-sm text-neutral-500">
        {description?.length > 100
          ? `${description.substring(0, 100)}...`
          : description}
      </p>
    </div>
  );
};

export default BlogPostCarousel;

// Fallback static data for development/demo purposes
const fallbackPosts = [
  {
    id: 1,
    imgUrl: "/imgs/blog/1.png",
    author: "Dr. John Anderson",
    title: "The Importance of Regular Dental Checkups",
    description:
      "Regular dental checkups are essential for maintaining optimal oral health and preventing serious dental issues.",
  },
  {
    id: 2,
    imgUrl: "/imgs/blog/2.png",
    author: "Dr. Sarah Wilson",
    title: "How to Maintain Healthy Teeth and Gums",
    description:
      "Learn the best practices for daily oral hygiene and maintaining healthy teeth and gums throughout your life.",
  },
  {
    id: 3,
    imgUrl: "/imgs/blog/3.png",
    author: "Dr. Michael Chen",
    title: "Understanding Different Types of Dental Procedures",
    description:
      "A comprehensive guide to common dental procedures and what to expect during your visit.",
  },
  {
    id: 4,
    imgUrl: "/imgs/blog/4.png",
    author: "Dr. Emily Davis",
    title: "The Latest Advances in Dental Technology",
    description:
      "Discover how modern dental technology is revolutionizing patient care and treatment outcomes.",
  },
  {
    id: 5,
    imgUrl: "/imgs/blog/5.png",
    author: "Dr. Robert Martinez",
    title: "Preventing Tooth Decay in Children",
    description:
      "Essential tips for parents to help prevent tooth decay and establish good oral health habits in children.",
  },
  {
    id: 6,
    imgUrl: "/imgs/blog/6.png",
    author: "Dr. Lisa Thompson",
    title: "Cosmetic Dentistry: Options and Benefits",
    description:
      "Explore the various cosmetic dentistry options available to enhance your smile and boost confidence.",
  },
  {
    id: 7,
    imgUrl: "/imgs/blog/7.png",
    author: "Dr. James Rodriguez",
    title: "Managing Dental Anxiety: Tips for Nervous Patients",
    description:
      "Practical strategies to help nervous patients feel more comfortable during dental visits.",
  },
];
