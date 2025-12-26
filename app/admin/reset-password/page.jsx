"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import { supabase } from "@/lib/supabase.client";
import { FiLock, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { toast } from "sonner";

const ResetPassword = () => {
  const router = useRouter();
  const { user } = useRoleAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Check if this is a recovery session
        if (session?.user) {
          setIsValidSession(true);
        } else {
          // No valid session, redirect to login
          toast.error("Invalid or expired reset link", {
            description: "Please request a new password reset link.",
          });
          router.push("/login");
        }
      } catch (error) {
        console.error("Session check error:", error);
        router.push("/login");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  const validatePassword = (pass) => {
    const requirements = {
      minLength: pass.length >= 8,
      hasUppercase: /[A-Z]/.test(pass),
      hasLowercase: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(password);
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!allRequirementsMet) {
      toast.error("Password does not meet requirements");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Updating password...");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      toast.dismiss(loadingToast);
      toast.success("Password updated successfully!", {
        description: "You can now login with your new password.",
      });

      // Sign out and redirect to login
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Reset password error:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to update password", {
        description: error.message || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValidSession) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <FiLock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create a strong password for your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Password requirements:
              </p>
              <ul className="space-y-1">
                <li
                  className={`flex items-center text-sm ${
                    passwordRequirements.minLength
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <FiCheck
                    className={`h-4 w-4 mr-2 ${
                      passwordRequirements.minLength
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  />
                  At least 8 characters
                </li>
                <li
                  className={`flex items-center text-sm ${
                    passwordRequirements.hasUppercase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <FiCheck
                    className={`h-4 w-4 mr-2 ${
                      passwordRequirements.hasUppercase
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  />
                  One uppercase letter
                </li>
                <li
                  className={`flex items-center text-sm ${
                    passwordRequirements.hasLowercase
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <FiCheck
                    className={`h-4 w-4 mr-2 ${
                      passwordRequirements.hasLowercase
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  />
                  One lowercase letter
                </li>
                <li
                  className={`flex items-center text-sm ${
                    passwordRequirements.hasNumber
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  <FiCheck
                    className={`h-4 w-4 mr-2 ${
                      passwordRequirements.hasNumber
                        ? "opacity-100"
                        : "opacity-30"
                    }`}
                  />
                  One number
                </li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading || !allRequirementsMet || password !== confirmPassword
            }
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
