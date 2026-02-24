"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import PatientSidebar from "@/app/patient/components/PatientSidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiBriefcase,
  FiSave,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "sonner";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    age: "",
    sex: "",
    occupation: "",
    address: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/patient/login");
      return;
    }
    if (user.role !== "patient") {
      router.push("/");
      return;
    }
    fetchProfile();
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/patient/profile");
      if (res.ok) {
        const data = await res.json();
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          age: data.age || "",
          sex: data.sex || "",
          occupation: data.occupation || "",
          address: data.address || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getCompletionPercentage = () => {
    const fields = [
      "full_name",
      "phone",
      "age",
      "sex",
      "occupation",
      "address",
    ];
    const filled = fields.filter(
      (f) => formData[f] && String(formData[f]).trim() !== "",
    ).length;
    return Math.round((filled / fields.length) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/patient/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully!");

      // If profile is now complete, redirect to dashboard
      if (getCompletionPercentage() === 100) {
        setTimeout(() => router.push("/patient/dashboard"), 1500);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <PatientSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </div>
    );
  }

  const completion = getCompletionPercentage();

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <PatientSidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Complete Your Profile
            </h1>
            <p className="text-slate-400 mt-1">
              Help us provide better care by completing your profile
              information.
            </p>
          </div>

          {/* Progress */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">
                  Profile Completion
                </span>
                <span
                  className={`text-sm font-semibold ${
                    completion === 100 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {completion}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    completion === 100 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${completion}%` }}
                />
              </div>
              {completion === 100 && (
                <div className="flex items-center gap-2 mt-3 text-emerald-400 text-sm">
                  <FiCheckCircle className="w-4 h-4" />
                  Your profile is complete!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FiUser className="w-5 h-5 text-emerald-400" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                This information helps your doctor understand your background
                better.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="full_name"
                    className="text-slate-300 flex items-center gap-2"
                  >
                    <FiUser className="w-4 h-4" />
                    Full Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>

                {/* Phone & Age row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-slate-300 flex items-center gap-2"
                    >
                      <FiPhone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="age"
                      className="text-slate-300 flex items-center gap-2"
                    >
                      <FiCalendar className="w-4 h-4" />
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      max="150"
                      value={formData.age}
                      onChange={(e) => handleChange("age", e.target.value)}
                      placeholder="Your age"
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Sex & Occupation row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Sex</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value) => handleChange("sex", value)}
                    >
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="occupation"
                      className="text-slate-300 flex items-center gap-2"
                    >
                      <FiBriefcase className="w-4 h-4" />
                      Occupation
                    </Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) =>
                        handleChange("occupation", e.target.value)
                      }
                      placeholder="Your occupation"
                      className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label
                    htmlFor="address"
                    className="text-slate-300 flex items-center gap-2"
                  >
                    <FiMapPin className="w-4 h-4" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Your full address"
                    rows={3}
                    className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <FiSave className="w-4 h-4" />
                      Save Profile
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
