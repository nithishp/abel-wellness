"use client";

import { createClient } from "@supabase/supabase-js";

// Client-side only Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables for client-side operations"
  );
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Export table names
export const TABLES = {
  BLOGS: "blogs",
  APPOINTMENTS: "appointments",
  ADMINS: "admins",
};

export default supabase;
