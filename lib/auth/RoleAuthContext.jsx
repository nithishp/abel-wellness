"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { ROLES } from "@/lib/supabase.config";

const RoleAuthContext = createContext({
  user: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  isPatient: false,
  isDoctor: false,
  isPharmacist: false,
  isAdmin: false,
  login: async () => {},
  loginWithOTP: async () => {},
  verifyOTP: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

export const useRoleAuth = () => {
  const context = useContext(RoleAuthContext);
  if (!context) {
    throw new Error("useRoleAuth must be used within a RoleAuthProvider");
  }
  return context;
};

export const RoleAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setRole(data.user.role);
        }
      }
    } catch (error) {
      console.error("Session check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    await checkSession();
  }, []);

  // Staff login (Admin, Doctor, Pharmacist) - username/password
  const login = async (email, password) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      setRole(data.user.role);

      return { success: true, user: data.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  // Patient login - request OTP
  const loginWithOTP = async (email) => {
    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error("OTP request error:", error);
      return { success: false, error: error.message };
    }
  };

  // Patient login - verify OTP
  const verifyOTP = async (email, code) => {
    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      setUser(data.user);
      setRole(data.user.role);

      return { success: true, user: data.user };
    } catch (error) {
      console.error("OTP verification error:", error);
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setRole(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isPatient: role === ROLES.PATIENT,
    isDoctor: role === ROLES.DOCTOR,
    isPharmacist: role === ROLES.PHARMACIST,
    isAdmin: role === ROLES.ADMIN,
    login,
    loginWithOTP,
    verifyOTP,
    logout,
    refreshUser,
  };

  return (
    <RoleAuthContext.Provider value={value}>
      {children}
    </RoleAuthContext.Provider>
  );
};

export default RoleAuthProvider;
