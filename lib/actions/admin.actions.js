import { supabase } from "../supabase.client";
import { parseStringify } from "../utils";

// Admin login - using Supabase Auth
export const adminLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Supabase auth error:", error);

    if (error.message.includes("Invalid login credentials")) {
      throw new Error(
        "Invalid email or password. Please check your credentials."
      );
    }

    throw new Error(error.message || "Login failed. Please try again.");
  }

  return parseStringify(data.user);
};

// Create admin account
export const createAdmin = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: "admin",
      },
    },
  });

  if (error) {
    console.error("Supabase auth error:", error);
    throw new Error(error.message);
  }

  return parseStringify(data.user);
};

// Check for existing session on app load
export const checkExistingSession = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session ? parseStringify(session.user) : null;
  } catch (error) {
    return null;
  }
};

// Get current admin session
export const getCurrentAdmin = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? parseStringify(user) : null;
  } catch (error) {
    return null;
  }
};

// Admin logout
export const adminLogout = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

// Check if user is admin
export const isAdmin = async () => {
  const user = await getCurrentAdmin();
  return user !== null;
};

// Reset password
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/admin/reset-password`,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, data };
};

// Update password (after reset)
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return parseStringify(data.user);
};

// Update user profile
export const updateProfile = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });

  if (error) {
    throw new Error(error.message);
  }

  return parseStringify(data.user);
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};
