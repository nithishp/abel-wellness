import { NextResponse } from "next/server";
import { Client, Storage, ID } from "node-appwrite";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log("File object:", {
      name: file.name,
      type: file.type,
      size: file.size,
      constructor: file.constructor.name,
    });

    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT)
      .setProject(process.env.NEXT_PUBLIC_PROJECT_ID)
      .setKey(process.env.API_KEY);

    const storage = new Storage(client);

    // Upload file directly to Appwrite Storage
    const uploadedFile = await storage.createFile(
      process.env.STORAGE_BUCKET_ID,
      ID.unique(),
      file
    );

    // Get the file URL
    const imageUrl = `${process.env.NEXT_PUBLIC_ENDPOINT}/storage/buckets/${process.env.STORAGE_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${process.env.NEXT_PUBLIC_PROJECT_ID}`;

    console.log("Generated image URL:", imageUrl);
    console.log("Environment check:", {
      endpoint: process.env.NEXT_PUBLIC_ENDPOINT,
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      bucketId: process.env.STORAGE_BUCKET_ID,
      fileId: uploadedFile.$id
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      fileId: uploadedFile.$id,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
