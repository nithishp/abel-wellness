"use client";

import { createClient } from "@supabase/supabase-js";

// Client-side only Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a placeholder client if environment variables are not available
// This prevents build-time errors while still allowing the app to work at runtime
let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
} else if (typeof window !== "undefined") {
  // Only warn on client-side, not during SSR/build
  console.warn(
    "Missing Supabase environment variables. Please check your .env.local file."
  );
}

// Export table names
export const TABLES = {
  BLOGS: "blogs",
  APPOINTMENTS: "appointments",
  ADMINS: "admins",
};

export { supabase };
export default supabase;
