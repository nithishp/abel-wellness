import { 
  getBlogs, 
  createBlog, 
  updateBlog, 
  deleteBlog, 
  toggleBlogPublished 
} from "@/lib/actions/blog.actions";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;
    const published = searchParams.get("published");

    const publishedFilter =
      published === "true" ? true : published === "false" ? false : null;

    const blogs = await getBlogs(limit, publishedFilter);
    return NextResponse.json(blogs);
  } catch (error) {
    console.error("API Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const newBlog = await createBlog(data);
    return NextResponse.json(newBlog);
  } catch (error) {
    console.error("API Error creating blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");
    const action = searchParams.get("action");
    const data = await request.json();

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = searchParams.get("id");

    if (!blogId) {
      return NextResponse.json(
        { error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const result = await deleteBlog(blogId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
