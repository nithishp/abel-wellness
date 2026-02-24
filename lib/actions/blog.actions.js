"use server";

import { supabaseAdmin, TABLES } from "../supabase.config";
import { parseStringify } from "../utils";

// Create a new blog post
export const createBlog = async (data) => {
  try {
    const blogData = {
      title: data.title,
      description: data.description,
      content: data.content,
      author: data.author,
      category: data.category || null,
      image_url: data.imageUrl || null,
      slug: generateSlug(data.title),
      published: data.published || false,
      featured: data.featured || false,
    };

    const { data: newBlog, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .insert(blogData)
      .select()
      .single();

    if (error) {
      console.error("Supabase error creating blog:", error);
      throw new Error(error.message);
    }

    return parseStringify(transformBlogFromDB(newBlog));
  } catch (error) {
    console.error("Error creating blog:", error);
    throw new Error("Failed to create blog post");
  }
};

// Get all blog posts with optional filters (server-side only)
export const getBlogs = async (
  limit = 10,
  published = null,
  page = 1,
  search = "",
  category = "",
) => {
  try {
    const offset = (page - 1) * limit;

    // Build query with count in a single request for better performance
    let query = supabaseAdmin
      .from(TABLES.BLOGS)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (published !== null) {
      query = query.eq("published", published);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`,
      );
    }

    const {
      data: blogs,
      error,
      count: totalCount,
    } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error fetching blogs:", error);
      throw new Error(error.message);
    }

    const hasMore = offset + blogs.length < totalCount;

    return parseStringify({
      blogs: blogs.map(transformBlogFromDB),
      total: totalCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blog posts");
  }
};

// Get published blogs for public display with pagination
export const getPublishedBlogs = async (limit = 10, page = 1) => {
  try {
    const offset = (page - 1) * limit;

    // Combined query with count for better performance
    const {
      data: blogs,
      error,
      count: totalCount,
    } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("*", { count: "exact" })
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Supabase error fetching published blogs:", error);
      return {
        blogs: [],
        total: 0,
        pagination: { page, limit, total: 0, hasMore: false },
      };
    }

    const hasMore = offset + blogs.length < totalCount;

    return parseStringify({
      blogs: blogs.map(transformBlogFromDB),
      total: totalCount,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching published blogs:", error);
    return {
      blogs: [],
      total: 0,
      pagination: { page, limit, total: 0, hasMore: false },
    };
  }
};

// Get a single blog post by ID
export const getBlogById = async (blogId) => {
  try {
    const { data: blog, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("*")
      .eq("id", blogId)
      .single();

    if (error) {
      console.error("Supabase error fetching blog:", error);
      throw new Error(error.message);
    }

    return parseStringify(transformBlogFromDB(blog));
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw new Error("Failed to fetch blog post");
  }
};

// Get a blog post by slug
export const getBlogBySlug = async (slug) => {
  try {
    const { data: blog, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new Error("Blog post not found");
      }
      console.error("Supabase error fetching blog by slug:", error);
      throw new Error(error.message);
    }

    return parseStringify(transformBlogFromDB(blog));
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    throw new Error("Failed to fetch blog post");
  }
};

// Update a blog post
export const updateBlog = async (blogId, data) => {
  try {
    // Build update data, only including fields that are provided
    const updateData = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = generateSlug(data.title);
    }
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.category !== undefined)
      updateData.category = data.category || null;
    if (data.published !== undefined) updateData.published = data.published;
    if (data.featured !== undefined) updateData.featured = data.featured;

    const { data: updatedBlog, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .update(updateData)
      .eq("id", blogId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating blog:", error);
      throw new Error(error.message);
    }

    return parseStringify(transformBlogFromDB(updatedBlog));
  } catch (error) {
    console.error("Error updating blog:", error);
    throw new Error("Failed to update blog post");
  }
};

// Delete a blog post
export const deleteBlog = async (blogId) => {
  try {
    const { error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .delete()
      .eq("id", blogId);

    if (error) {
      console.error("Supabase error deleting blog:", error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw new Error("Failed to delete blog post");
  }
};

// Toggle blog published status
export const toggleBlogPublished = async (blogId, published) => {
  try {
    const { data: updatedBlog, error } = await supabaseAdmin
      .from(TABLES.BLOGS)
      .update({ published })
      .eq("id", blogId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error toggling blog status:", error);
      throw new Error(error.message);
    }

    return parseStringify(transformBlogFromDB(updatedBlog));
  } catch (error) {
    console.error("Error toggling blog status:", error);
    throw new Error("Failed to update blog status");
  }
};

// Utility function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Transform blog from database format to match previous Appwrite format
// This ensures backward compatibility with existing components
function transformBlogFromDB(blog) {
  if (!blog) return null;

  return {
    $id: blog.id,
    $createdAt: blog.created_at,
    $updatedAt: blog.updated_at,
    title: blog.title,
    description: blog.description,
    content: blog.content,
    author: blog.author,
    imageUrl: blog.image_url,
    image_url: blog.image_url,
    slug: blog.slug,
    published: blog.published,
    featured: blog.featured,
    category: blog.category || null,
    id: blog.id,
    created_at: blog.created_at,
  };
}
