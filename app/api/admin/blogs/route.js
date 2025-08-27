import { getBlogs } from "@/lib/actions/blog.actions";
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
