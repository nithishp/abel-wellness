import { ID, Query } from "node-appwrite";
import { account } from "../appwrite.client";
import { parseStringify } from "../utils";

// Admin login - enhanced with session management
export const adminLogin = async (email, password) => {
  try {
    // First check if there's already an active session
    try {
      const existingUser = await account.get();
      if (existingUser) {
        // Session already exists, return it
        return parseStringify(existingUser);
      }
    } catch (error) {
      // No active session, proceed with login
    }

    // Create new session
    const session = await account.createEmailPasswordSession(email, password);
    return parseStringify(session);
  } catch (error) {
    console.error("Error logging in admin:", error);

    // Provide more specific error messages
    if (error.code === 401) {
      throw new Error(
        "Invalid email or password. Please check your credentials."
      );
    } else if (error.type === "user_not_found") {
      throw new Error(
        "Admin account not found. Please contact the system administrator."
      );
    } else if (error.message?.includes("session is active")) {
      // If there's already a session active, try to get current user
      try {
        const existingUser = await account.get();
        return parseStringify(existingUser);
      } catch (getUserError) {
        // If we can't get user, delete session and try again
        try {
          await account.deleteSession("current");
          const session = await account.createEmailPasswordSession(
            email,
            password
          );
          return parseStringify(session);
        } catch (retryError) {
          throw new Error("Login failed. Please try again.");
        }
      }
    }

    throw new Error(error.message || "Login failed. Please try again.");
  }
};

// Create admin account
export const createAdmin = async (email, password, name) => {
  try {
    // Create user account in Appwrite auth
    const user = await account.create(ID.unique(), email, password, name);

    // Note: Admin record in database should be created manually or via server-side API
    return parseStringify(user);
  } catch (error) {
    console.error("Error creating admin:", error);
    throw new Error("Failed to create admin account");
  }
};

// Check for existing session on app load
export const checkExistingSession = async () => {
  try {
    const user = await account.get();
    return parseStringify(user);
  } catch (error) {
    // No active session
    return null;
  }
};

// Get current admin session - only call this after login
export const getCurrentAdmin = async () => {
  try {
    const user = await account.get();
    return parseStringify(user);
  } catch (error) {
    // Don't log error - this is expected when not logged in
    return null;
  }
};

// Admin logout
export const adminLogout = async () => {
  try {
    await account.deleteSession("current");
    return { success: true };
  } catch (error) {
    console.error("Error logging out admin:", error);
    throw new Error("Failed to logout");
  }
};

// Check if user is admin - only use after attempted login
export const isAdmin = async () => {
  try {
    const user = await getCurrentAdmin();
    return user !== null;
  } catch (error) {
    return false;
  }
};
