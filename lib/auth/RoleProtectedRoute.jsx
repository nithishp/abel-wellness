"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "./RoleAuthContext";
import { ROLES } from "@/lib/supabase.config";

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Generic role-protected route wrapper
export const RoleProtectedRoute = ({ children, allowedRoles, redirectTo }) => {
  const router = useRouter();
  const { user, role, loading, isAuthenticated } = useRoleAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo || "/");
        return;
      }

      if (!allowedRoles.includes(role)) {
        // Redirect to appropriate dashboard based on role
        switch (role) {
          case ROLES.ADMIN:
            router.push("/admin/dashboard");
            break;
          case ROLES.DOCTOR:
            router.push("/doctor/dashboard");
            break;
          case ROLES.PHARMACIST:
            router.push("/pharmacist/dashboard");
            break;
          case ROLES.PATIENT:
            router.push("/patient/dashboard");
            break;
          default:
            router.push("/");
        }
      }
    }
  }, [loading, isAuthenticated, role, allowedRoles, router, redirectTo]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !allowedRoles.includes(role)) {
    return <LoadingSpinner />;
  }

  return children;
};

// Admin protected route
export const AdminRoute = ({ children }) => (
  <RoleProtectedRoute allowedRoles={[ROLES.ADMIN]} redirectTo="/login">
    {children}
  </RoleProtectedRoute>
);

// Doctor protected route
export const DoctorRoute = ({ children }) => (
  <RoleProtectedRoute allowedRoles={[ROLES.DOCTOR]} redirectTo="/login">
    {children}
  </RoleProtectedRoute>
);

// Pharmacist protected route
export const PharmacistRoute = ({ children }) => (
  <RoleProtectedRoute allowedRoles={[ROLES.PHARMACIST]} redirectTo="/login">
    {children}
  </RoleProtectedRoute>
);

// Patient protected route
export const PatientRoute = ({ children }) => (
  <RoleProtectedRoute allowedRoles={[ROLES.PATIENT]} redirectTo="/login">
    {children}
  </RoleProtectedRoute>
);

// Staff route (Admin, Doctor, or Pharmacist)
export const StaffRoute = ({ children }) => (
  <RoleProtectedRoute
    allowedRoles={[ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST]}
    redirectTo="/login"
  >
    {children}
  </RoleProtectedRoute>
);

export default RoleProtectedRoute;
