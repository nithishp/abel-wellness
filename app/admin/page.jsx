"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AdminPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard
    router.push("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
        </div>
        <p className="text-slate-400 font-medium">Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
};

export default AdminPage;
