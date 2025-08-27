import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    endpoint: process.env.NEXT_PUBLIC_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
    bucketId: process.env.STORAGE_BUCKET_ID,
    apiKey: process.env.API_KEY ? "SET" : "NOT SET",
    databaseId: process.env.DATABASE_ID,
  });
}
