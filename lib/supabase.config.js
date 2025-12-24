import { createClient } from "@supabase/supabase-js";

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.warn("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

// Client-side Supabase client (uses anon key, respects RLS)
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Server-side Supabase client with service role key (bypasses RLS)
// Use this only in server-side code (API routes, server actions)
export const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceRoleKey || supabaseAnonKey || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Export table names as constants for consistency
export const TABLES = {
  BLOGS: "blogs",
  APPOINTMENTS: "appointments",
  ADMINS: "admins",
};

// Export storage bucket names
export const STORAGE_BUCKETS = {
  BLOG_IMAGES: "blog-images",
};

export default supabase;
