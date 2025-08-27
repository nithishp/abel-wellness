import { ID, Query } from "node-appwrite";
import { databases, DATABASE_ID, BLOGS_ID } from "../appwrite.config";
import {
  clientDatabases,
  CLIENT_DATABASE_ID,
  CLIENT_BLOGS_ID,
} from "../appwrite.client";
import { parseStringify } from "../utils";

// Create a new blog post
export const createBlog = async (data) => {
  try {
    // Fallback for environment variables
    const databaseId =
      DATABASE_ID ||
      process.env.DATABASE_ID ||
      process.env.NEXT_PUBLIC_DATABASE_ID;
    const blogsId =
      BLOGS_ID ||
      process.env.BLOGS_ID ||
      process.env.NEXT_PUBLIC_BLOGS_ID ||
      "blogs";

    if (!databaseId) {
      throw new Error(
        "Database ID is not configured. Please check your environment variables."
      );
    }

    const blogData = {
      ...data,
      slug: generateSlug(data.title),
      // Remove createdAt and updatedAt - Appwrite handles these automatically
    };

    const newBlog = await databases.createDocument(
      databaseId,
      blogsId,
      ID.unique(),
      blogData
    );
    return parseStringify(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    throw new Error("Failed to create blog post");
  }
};

// Get all blog posts with optional filters (server-side only)
export const getBlogs = async (limit = 10, published = null) => {
  try {
    // Fallback for environment variables
    const databaseId = DATABASE_ID || process.env.DATABASE_ID;
    const blogsId = BLOGS_ID || process.env.BLOGS_ID || "blogs";

    if (!databaseId) {
      throw new Error(
        "Database ID is not configured. Please check your environment variables."
      );
    }

    const queries = [Query.orderDesc("$createdAt"), Query.limit(limit)];

    if (published !== null) {
      queries.push(Query.equal("published", published));
    }

    const blogs = await databases.listDocuments(databaseId, blogsId, queries);
    return parseStringify(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    throw new Error("Failed to fetch blog posts");
  }
};

// Get published blogs for public display
export const getPublishedBlogs = async (limit = 10) => {
  try {
    const queries = [
      Query.equal("published", true),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ];

    // Use client-side database for public operations
    const blogs = await clientDatabases.listDocuments(
      CLIENT_DATABASE_ID || DATABASE_ID,
      CLIENT_BLOGS_ID || BLOGS_ID,
      queries
    );
    return parseStringify(blogs);
  } catch (error) {
    console.error("Error fetching published blogs:", error);
    // Return empty result instead of throwing to handle gracefully on client
    return { documents: [] };
  }
};

// Get a single blog post by ID
export const getBlogById = async (blogId) => {
  try {
    // Fallback for environment variables
    const databaseId =
      DATABASE_ID ||
      process.env.DATABASE_ID ||
      process.env.NEXT_PUBLIC_DATABASE_ID;
    const blogsId =
      BLOGS_ID ||
      process.env.BLOGS_ID ||
      process.env.NEXT_PUBLIC_BLOGS_ID ||
      "blogs";

    const blog = await databases.getDocument(databaseId, blogsId, blogId);
    return parseStringify(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    throw new Error("Failed to fetch blog post");
  }
};

// Get a blog post by slug
export const getBlogBySlug = async (slug) => {
  try {
    const blogs = await clientDatabases.listDocuments(
      CLIENT_DATABASE_ID || DATABASE_ID,
      CLIENT_BLOGS_ID || BLOGS_ID,
      [Query.equal("slug", slug), Query.equal("published", true)]
    );

    if (blogs.documents.length === 0) {
      throw new Error("Blog post not found");
    }

    return parseStringify(blogs.documents[0]);
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    throw new Error("Failed to fetch blog post");
  }
};

// Update a blog post
export const updateBlog = async (blogId, data) => {
  try {
    // Fallback for environment variables
    const databaseId =
      DATABASE_ID ||
      process.env.DATABASE_ID ||
      process.env.NEXT_PUBLIC_DATABASE_ID;
    const blogsId =
      BLOGS_ID ||
      process.env.BLOGS_ID ||
      process.env.NEXT_PUBLIC_BLOGS_ID ||
      "blogs";

    // Remove Appwrite system fields and any undefined values
    const cleanData = {};
    Object.keys(data).forEach((key) => {
      // Exclude Appwrite system fields (starting with $) and undefined values
      if (!key.startsWith("$") && data[key] !== undefined) {
        cleanData[key] = data[key];
      }
    });

    const updateData = {
      ...cleanData,
      // Remove updatedAt - Appwrite handles this automatically with $updatedAt
    };

    // Update slug if title changed
    if (updateData.title) {
      updateData.slug = generateSlug(updateData.title);
    }

    const updatedBlog = await databases.updateDocument(
      databaseId,
      blogsId,
      blogId,
      updateData
    );
    return parseStringify(updatedBlog);
  } catch (error) {
    console.error("Error updating blog:", error);
    throw new Error("Failed to update blog post");
  }
};

// Delete a blog post
export const deleteBlog = async (blogId) => {
  try {
    // Fallback for environment variables
    const databaseId =
      DATABASE_ID ||
      process.env.DATABASE_ID ||
      process.env.NEXT_PUBLIC_DATABASE_ID;
    const blogsId =
      BLOGS_ID ||
      process.env.BLOGS_ID ||
      process.env.NEXT_PUBLIC_BLOGS_ID ||
      "blogs";

    await databases.deleteDocument(databaseId, blogsId, blogId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw new Error("Failed to delete blog post");
  }
};

// Toggle blog published status
export const toggleBlogPublished = async (blogId, published) => {
  try {
    // Fallback for environment variables
    const databaseId =
      DATABASE_ID ||
      process.env.DATABASE_ID ||
      process.env.NEXT_PUBLIC_DATABASE_ID;
    const blogsId =
      BLOGS_ID ||
      process.env.BLOGS_ID ||
      process.env.NEXT_PUBLIC_BLOGS_ID ||
      "blogs";

    const updatedBlog = await databases.updateDocument(
      databaseId,
      blogsId,
      blogId,
      {
        published,
        // Remove updatedAt - Appwrite handles this automatically with $updatedAt
      }
    );
    return parseStringify(updatedBlog);
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
