"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import AdminSidebar from "../components/AdminSidebar";
import {
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUser,
  FiMail,
  FiPhone,
  FiX,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiBriefcase,
  FiAward,
  FiClock,
} from "react-icons/fi";
import { toast } from "sonner";

const UserManagement = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useRoleAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    role: "doctor",
    specialization: "",
    qualification: "",
    experienceYears: "",
    bio: "",
    licenseNumber: "",
  });

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If no user after loading completes, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      router.push("/");
      return;
    }

    if (user) {
      fetchUsers();
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loadingToast = toast.loading(
      editingUser ? "Updating user..." : "Creating user..."
    );

    try {
      const url = editingUser
        ? `/api/admin/users?id=${editingUser.id}`
        : "/api/admin/users";

      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save user");
      }

      toast.dismiss(loadingToast);
      toast.success(
        editingUser
          ? "User updated successfully!"
          : "User created successfully!"
      );

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to save user");
    }
  };

  const handleDelete = async (userId, userName) => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${userName}? They will no longer be able to log in.`
      )
    ) {
      return;
    }

    const loadingToast = toast.loading("Deactivating user...");

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate user");
      }

      toast.dismiss(loadingToast);
      toast.success("User deactivated successfully!");
      fetchUsers();
    } catch (error) {
      console.error("Error deactivating user:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to deactivate user");
    }
  };

  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: "",
      name: userToEdit.full_name || "",
      phone: userToEdit.phone || "",
      role: userToEdit.role,
      specialization: userToEdit.roleData?.specialization || "",
      qualification: userToEdit.roleData?.qualification || "",
      experienceYears: userToEdit.roleData?.experience_years || "",
      bio: userToEdit.roleData?.bio || "",
      licenseNumber: userToEdit.roleData?.license_number || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      phone: "",
      role: "doctor",
      specialization: "",
      qualification: "",
      experienceYears: "",
      bio: "",
      licenseNumber: "",
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterRole === "all" || u.role === filterRole;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-emerald-500 animate-spin"></div>
          </div>
          <p className="text-slate-400 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <AdminSidebar />

      <main className="lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
          <div className="px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="ml-12 lg:ml-0">
                <h1 className="text-2xl font-bold text-white">Manage Staff</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  {users.length} staff members • {filteredUsers.length} shown
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
              >
                <FiUserPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Staff</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
              <FiBriefcase className="text-slate-400 w-5 h-5" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-transparent text-white border-none focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="all" className="bg-slate-800">
                  All Roles
                </option>
                <option value="doctor" className="bg-slate-800">
                  Doctors
                </option>
                <option value="pharmacist" className="bg-slate-800">
                  Pharmacists
                </option>
              </select>
            </div>
          </div>

          {/* Users Grid */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-6">
                <FiUser className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                No staff found
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                {searchTerm || filterRole !== "all"
                  ? "Try adjusting your search or filter to find what you're looking for"
                  : "Add your first staff member to get started"}
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                <FiUserPlus className="w-5 h-5" />
                Add Your First Staff
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredUsers.map((staffUser) => (
                <div
                  key={staffUser.id}
                  className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 hover:shadow-xl transition-all duration-300"
                >
                  {/* Header with gradient */}
                  <div
                    className={`relative h-20 ${
                      staffUser.role === "doctor"
                        ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20"
                        : "bg-gradient-to-r from-emerald-500/20 to-teal-500/20"
                    }`}
                  >
                    <div className="absolute -bottom-10 left-6">
                      <div
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center border-4 border-slate-800 ${
                          staffUser.role === "doctor"
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                            : "bg-gradient-to-br from-emerald-500 to-teal-600"
                        }`}
                      >
                        <span className="text-2xl font-bold text-white">
                          {staffUser.full_name?.charAt(0) ||
                            staffUser.email?.charAt(0) ||
                            "S"}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(staffUser)}
                        className="p-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-white hover:bg-emerald-500 transition-colors"
                        title="Edit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(staffUser.id, staffUser.full_name)
                        }
                        className="p-2 bg-slate-900/80 backdrop-blur-md rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pt-14 px-6 pb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {staffUser.full_name || "No name"}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
                            staffUser.role === "doctor"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              staffUser.role === "doctor"
                                ? "bg-blue-400"
                                : "bg-emerald-400"
                            }`}
                          ></span>
                          {staffUser.role === "doctor"
                            ? "Doctor"
                            : "Pharmacist"}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full ${
                          staffUser.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        {staffUser.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3 text-slate-400">
                        <FiMail className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{staffUser.email}</span>
                      </div>
                      {staffUser.phone && (
                        <div className="flex items-center gap-3 text-slate-400">
                          <FiPhone className="w-4 h-4 text-slate-500" />
                          <span>{staffUser.phone}</span>
                        </div>
                      )}
                      {staffUser.role === "doctor" && staffUser.roleData && (
                        <>
                          {staffUser.roleData.specialization && (
                            <div className="flex items-center gap-3 text-slate-400">
                              <FiBriefcase className="w-4 h-4 text-slate-500" />
                              <span>{staffUser.roleData.specialization}</span>
                            </div>
                          )}
                          {staffUser.roleData.experience_years && (
                            <div className="flex items-center gap-3 text-slate-400">
                              <FiClock className="w-4 h-4 text-slate-500" />
                              <span>
                                {staffUser.roleData.experience_years} years
                                experience
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {staffUser.role === "pharmacist" &&
                        staffUser.roleData?.license_number && (
                          <div className="flex items-center gap-3 text-slate-400">
                            <FiAward className="w-4 h-4 text-slate-500" />
                            <span>
                              License: {staffUser.roleData.license_number}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <span className="text-xs text-slate-500">
                        Added{" "}
                        {new Date(staffUser.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingUser ? "Edit Staff Member" : "Add New Staff Member"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  disabled={!!editingUser}
                >
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password {editingUser ? "(leave blank to keep current)" : "*"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all pr-12"
                    required={!editingUser}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                />
              </div>

              {/* Doctor-specific fields */}
              {formData.role === "doctor" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specialization: e.target.value,
                        })
                      }
                      placeholder="e.g., Homeopathy, General Medicine"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Qualification
                    </label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          qualification: e.target.value,
                        })
                      }
                      placeholder="e.g., BHMS, MD"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          experienceYears: e.target.value,
                        })
                      }
                      min="0"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      placeholder="Brief description about the doctor"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all resize-none"
                    />
                  </div>
                </>
              )}

              {/* Pharmacist-specific fields */}
              {formData.role === "pharmacist" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 border border-slate-600 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-medium"
                >
                  {editingUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
