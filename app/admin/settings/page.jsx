"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import {
  FiSave,
  FiSettings,
  FiHome,
  FiDroplet,
  FiImage,
  FiUpload,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";
import { toast } from "sonner";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const logoInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Clinic info fields (synced with billing_settings key-value table)
  const [formData, setFormData] = useState({
    clinic_name: "",
    clinic_address: "",
    clinic_phone: "",
    clinic_email: "",
    clinic_gstin: "",
    invoice_theme_color: "#059669",
  });

  // Logo state
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Preset theme colors
  const THEME_COLORS = [
    { value: "#059669", label: "Emerald", className: "bg-emerald-600" },
    { value: "#3b82f6", label: "Blue", className: "bg-blue-500" },
    { value: "#8b5cf6", label: "Purple", className: "bg-purple-500" },
    { value: "#ef4444", label: "Red", className: "bg-red-500" },
    { value: "#f59e0b", label: "Amber", className: "bg-amber-500" },
    { value: "#06b6d4", label: "Cyan", className: "bg-cyan-500" },
    { value: "#ec4899", label: "Pink", className: "bg-pink-500" },
    { value: "#c42861", label: "Rose", className: "bg-pink-700" },
    { value: "#64748b", label: "Slate", className: "bg-slate-500" },
  ];

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin") {
      toast.error("Access denied. Admin account required.");
      router.push("/");
      return;
    }
    fetchSettings();
    fetchLogo();
  }, [user, authLoading, router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/billing/settings");
      const data = await res.json();

      if (data.success) {
        const s = data.settings || {};
        setFormData({
          clinic_name: s.clinic_name || "",
          clinic_address: s.clinic_address || "",
          clinic_phone: s.clinic_phone || "",
          clinic_email: s.clinic_email || "",
          clinic_gstin: s.clinic_gstin || "",
          invoice_theme_color: s.invoice_theme_color || "#059669",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogo = async () => {
    try {
      const res = await fetch("/api/admin/settings/logo");
      const data = await res.json();
      if (data.success && data.logoUrl) {
        setLogoUrl(data.logoUrl);
      }
    } catch {
      // No logo set
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/billing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            clinic_name: formData.clinic_name,
            clinic_address: formData.clinic_address,
            clinic_phone: formData.clinic_phone,
            clinic_email: formData.clinic_email,
            clinic_gstin: formData.clinic_gstin,
            invoice_theme_color: formData.invoice_theme_color,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    const file = logoInputRef.current?.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/admin/settings/logo", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setLogoUrl(data.logoUrl);
        setLogoPreview(null);
        logoInputRef.current.value = "";
        toast.success("Logo updated successfully");
      } else {
        toast.error(data.error || "Failed to upload logo");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    try {
      setUploadingLogo(true);
      const res = await fetch("/api/admin/settings/logo", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setLogoUrl(null);
        setLogoPreview(null);
        toast.success("Logo removed");
      } else {
        toast.error(data.error || "Failed to remove logo");
      }
    } catch (error) {
      console.error("Error removing logo:", error);
      toast.error("Failed to remove logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <AdminSidebar />
        <div className="lg:ml-72 min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen p-4 sm:p-6 overflow-auto">
        {/* Breadcrumb */}
        <div className="mb-4 ml-12 lg:ml-0">
          <Breadcrumb
            items={[
              {
                label: "Settings",
                icon: <FiSettings className="w-4 h-4" />,
              },
            ]}
          />
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 ml-12 lg:ml-0">
          <div className="p-3 bg-slate-800 rounded-xl">
            <FiSettings className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Clinic Settings</h1>
            <p className="text-slate-400">
              Manage clinic information, branding and theme
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Clinic Information ────────────────────────── */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FiHome className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Clinic Information
                </h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                This information appears on invoices, case sheets and other
                documents
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    value={formData.clinic_name}
                    onChange={(e) =>
                      handleInputChange("clinic_name", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.clinic_address}
                    onChange={(e) =>
                      handleInputChange("clinic_address", e.target.value)
                    }
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="Full clinic address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.clinic_phone}
                      onChange={(e) =>
                        handleInputChange("clinic_phone", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.clinic_email}
                      onChange={(e) =>
                        handleInputChange("clinic_email", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                      placeholder="clinic@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.clinic_gstin}
                    onChange={(e) =>
                      handleInputChange("clinic_gstin", e.target.value)
                    }
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                    placeholder="GST Identification Number"
                  />
                </div>
              </div>
            </div>

            {/* ── Clinic Logo ──────────────────────────────── */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <FiImage className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Clinic Logo
                </h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Displayed on invoices, case sheet PDFs and other documents
              </p>

              {/* Current / Preview */}
              <div className="flex items-center gap-6 mb-6">
                <div className="w-24 h-24 rounded-xl bg-slate-700/50 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview || logoUrl ? (
                    <img
                      src={logoPreview || logoUrl}
                      alt="Clinic Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <FiImage className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {logoUrl && !logoPreview && (
                    <p className="text-sm text-emerald-400 flex items-center gap-1.5 mb-2">
                      <FiCheck className="w-4 h-4" /> Logo uploaded
                    </p>
                  )}
                  {logoPreview && (
                    <p className="text-sm text-amber-400 mb-2">
                      New logo selected — click &quot;Upload&quot; to save
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    Recommended: Square image, PNG or JPG, max 2 MB
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer transition-colors text-sm">
                  <FiUpload className="w-4 h-4" />
                  Choose File
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleLogoSelect}
                  />
                </label>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleLogoUpload}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FiUpload className="w-4 h-4" />
                    )}
                    Upload
                  </button>
                )}

                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors text-sm disabled:opacity-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* ── Clinic Theme Color ───────────────────────── */}
            <div className="lg:col-span-2 bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                  <FiDroplet className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Clinic Theme Color
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Primary color used across invoices, case sheet PDFs and
                    other generated documents
                  </p>
                </div>
              </div>

              {/* Preset Colors */}
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mb-5">
                {THEME_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() =>
                      handleInputChange("invoice_theme_color", color.value)
                    }
                    className={`relative group flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all border ${
                      formData.invoice_theme_color === color.value
                        ? "border-white/40 bg-slate-700/60 scale-105"
                        : "border-transparent hover:bg-slate-700/30 hover:scale-105"
                    }`}
                    title={color.label}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg shadow-inner ${
                        formData.invoice_theme_color === color.value
                          ? "ring-2 ring-offset-2 ring-offset-slate-800 ring-white"
                          : ""
                      }`}
                      style={{ backgroundColor: color.value }}
                    >
                      {formData.invoice_theme_color === color.value && (
                        <span className="flex items-center justify-center h-full">
                          <svg
                            className="w-5 h-5 text-white drop-shadow"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {color.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Color + Preview */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-400">Custom:</label>
                  <input
                    type="color"
                    value={formData.invoice_theme_color}
                    onChange={(e) =>
                      handleInputChange("invoice_theme_color", e.target.value)
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.invoice_theme_color}
                    onChange={(e) =>
                      handleInputChange("invoice_theme_color", e.target.value)
                    }
                    className="w-28 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                    placeholder="#059669"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>

                {/* Live Preview */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/30 border border-slate-700/50">
                  <p className="text-xs text-slate-500">Preview:</p>
                  <div
                    className="h-8 w-20 rounded"
                    style={{
                      backgroundColor: formData.invoice_theme_color,
                    }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: formData.invoice_theme_color }}
                  >
                    Document Header
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium"
            >
              <FiSave className="w-4 h-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
