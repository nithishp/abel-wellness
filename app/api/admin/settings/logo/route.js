import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin, STORAGE_BUCKETS } from "@/lib/supabase.config";

// Verify admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  const { data: session, error } = await supabaseAdmin
    .from("user_sessions")
    .select("user_id, expires_at, user:users(id, full_name, email, role)")
    .eq("session_token", sessionToken)
    .single();

  if (error || !session || new Date(session.expires_at) < new Date()) {
    return null;
  }
  if (session.user?.role !== "admin") return null;
  return session.user;
}

// GET — return current clinic logo URL
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("clinic_logo")
      .select("img")
      .limit(1)
      .single();

    if (error || !data?.img) {
      return NextResponse.json({ success: true, logoUrl: null });
    }
    return NextResponse.json({ success: true, logoUrl: data.img });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logo" },
      { status: 500 },
    );
  }
}

// POST — upload new logo image
export async function POST(request) {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    // Validate
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "File must be an image" },
        { status: 400 },
      );
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image must be less than 2MB" },
        { status: 400 },
      );
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `clinic-logo-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BLOG_IMAGES)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload image" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from(STORAGE_BUCKETS.BLOG_IMAGES)
      .getPublicUrl(fileName);

    // Upsert into clinic_logo table
    // First check if a row exists
    const { data: existing } = await supabaseAdmin
      .from("clinic_logo")
      .select("id")
      .limit(1)
      .single();

    if (existing) {
      await supabaseAdmin
        .from("clinic_logo")
        .update({ img: publicUrl })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("clinic_logo").insert({ img: publicUrl });
    }

    return NextResponse.json({ success: true, logoUrl: publicUrl });
  } catch (error) {
    console.error("Error uploading logo:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload logo" },
      { status: 500 },
    );
  }
}

// DELETE — remove clinic logo
export async function DELETE() {
  try {
    const user = await verifyAdminSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("clinic_logo")
      .select("id")
      .limit(1)
      .single();

    if (existing) {
      await supabaseAdmin
        .from("clinic_logo")
        .update({ img: null })
        .eq("id", existing.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing logo:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove logo" },
      { status: 500 },
    );
  }
}
