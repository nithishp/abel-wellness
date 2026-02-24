import {
  getBlogs,
  getPublishedBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogPublished,
  getBlogById,
} from "@/lib/actions/blog.actions";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, TABLES, ROLES } from "@/lib/supabase.config";

// Helper function to verify admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;

  const { data: session } = await supabaseAdmin
    .from(TABLES.USER_SESSIONS)
    .select("*, user:users(*)")
    .eq("session_token", sessionToken)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) return null;
  if (session.user?.role !== ROLES.ADMIN) return null;

  return session.user;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");
    const published = searchParams.get("published");

    // Public access: only published blogs (no auth required)
    if (published === "true" && !blogId) {
      const page = parseInt(searchParams.get("page")) || 1;
      const limit = parseInt(searchParams.get("limit")) || 10;
      const search = searchParams.get("search") || "";
      const category = searchParams.get("category") || "";
      const blogs = await getBlogs(limit, true, page, search, category);
      return NextResponse.json(blogs);
    }

    // Admin access: all blogs (auth required)
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If ID is provided, fetch single blog
    if (blogId) {
      const blog = await getBlogById(blogId);
      return NextResponse.json(blog);
    }

    // Otherwise fetch all blogs with pagination
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";

    const publishedFilter =
      published === "true" ? true : published === "false" ? false : null;

    const blogs = await getBlogs(limit, publishedFilter, page, search);
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("API Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const newBlog = await createBlog(data);
    return NextResponse.json(newBlog);
  } catch (error) {
    console.error("API Error creating blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");
    const action = searchParams.get("action");
    const data = await request.json();

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 },
      );
    }

    let result;
    if (action === "toggle") {
      result = await toggleBlogPublished(blogId, data.published);
    } else {
      result = await updateBlog(blogId, data);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 },
      );
    }

    const result = await deleteBlog(blogId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 },
    );
  }
}
