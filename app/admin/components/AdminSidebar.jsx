"use client";
import { useRouter, usePathname } from "next/navigation";
import { useRoleAuth } from "@/lib/auth/RoleAuthContext";
import {
  FiHome,
  FiFileText,
  FiCalendar,
  FiUsers,
  FiLogOut,
  FiSettings,
  FiMenu,
  FiX,
  FiChevronRight,
} from "react-icons/fi";
import { useState } from "react";

const AdminSidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useRoleAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      icon: FiHome,
      href: "/admin/dashboard",
      description: "Overview & analytics",
    },
    {
      name: "Blogs",
      icon: FiFileText,
      href: "/admin/blogs",
      description: "Manage blog posts",
    },
    {
      name: "Appointments",
      icon: FiCalendar,
      href: "/admin/appointments",
      description: "View & manage appointments",
    },
    {
      name: "Staff",
      icon: FiUsers,
      href: "/admin/users",
      description: "Manage doctors & staff",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isActive = (href) => pathname === href;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-lg tracking-tight">
                Abel Wellness
              </h1>
              <p className="text-slate-400 text-xs">Admin Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p
          className={`text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4 ${
            collapsed ? "text-center" : "px-3"
          }`}
        >
          {collapsed ? "•••" : "Main Menu"}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.name}
              onClick={() => {
                router.push(item.href);
                setMobileOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                ${
                  active
                    ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }
              `}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-r-full" />
              )}
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  active ? "text-emerald-400" : "group-hover:text-emerald-400"
                } transition-colors`}
              />
              {!collapsed && (
                <>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                      {item.description}
                    </p>
                  </div>
                  <FiChevronRight
                    className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${
                      active ? "opacity-100 text-emerald-400" : ""
                    }`}
                  />
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700/50">
        <div
          className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "A"}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.name || "Admin"}
              </p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`
            mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
            text-red-400 hover:text-red-300 hover:bg-red-500/10
            transition-all duration-200 group
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <FiLogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-slate-800 text-white shadow-lg"
      >
        <FiMenu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-slate-900 z-50 transform transition-transform duration-300 lg:hidden
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <FiX className="w-6 h-6" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:flex flex-col fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800
          transition-all duration-300 z-30
          ${collapsed ? "w-20" : "w-72"}
        `}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <FiChevronRight
            className={`w-4 h-4 transition-transform ${
              collapsed ? "" : "rotate-180"
            }`}
          />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
};

export default AdminSidebar;
