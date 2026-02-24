"use client";

import { useState, useEffect, useRef } from "react";
import {
  FiBell,
  FiCheck,
  FiX,
  FiCalendar,
  FiPackage,
  FiFileText,
  FiAlertTriangle,
  FiAlertCircle,
  FiBox,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();

    // Close dropdown on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment_approved":
      case "appointment_rejected":
      case "appointment_scheduled":
      case "new_appointment":
        return <FiCalendar className="w-4 h-4" />;
      case "prescription_ready":
      case "prescription_dispensed":
        return <FiPackage className="w-4 h-4" />;
      case "consultation_completed":
        return <FiFileText className="w-4 h-4" />;
      case "warning":
      case "inventory":
        return <FiAlertTriangle className="w-4 h-4" />;
      case "error":
        return <FiAlertCircle className="w-4 h-4" />;
      case "inventory_alert":
        return <FiBox className="w-4 h-4" />;
      default:
        return <FiBell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (notification) => {
    if (notification.related_type === "inventory_alert") {
      if (notification.type === "error") {
        return {
          bg: notification.is_read ? "bg-red-50" : "bg-red-100",
          iconBg: "bg-red-100 text-red-600",
        };
      }
      if (notification.type === "warning") {
        return {
          bg: notification.is_read ? "bg-yellow-50" : "bg-yellow-100",
          iconBg: "bg-yellow-100 text-yellow-600",
        };
      }
    }
    return {
      bg: notification.is_read ? "" : "bg-blue-50",
      iconBg: notification.is_read
        ? "bg-gray-100 text-gray-600"
        : "bg-blue-100 text-blue-600",
    };
  };

  const formatTime = (dateString) => {
    const { formatRelativeTimeIST } = require("@/lib/utils");
    return formatRelativeTimeIST(dateString);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all relative"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center ring-2 ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed right-4 sm:right-6 lg:right-8 top-16 sm:top-[4.5rem] w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-2xl border overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => {
                    const colors = getNotificationColor(notification);
                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${colors.bg}`}
                      >
                        <div className="flex gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}
                          >
                            {notification.related_type === "inventory_alert" ? (
                              <FiBox className="w-4 h-4" />
                            ) : (
                              getNotificationIcon(notification.type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-sm ${
                                  !notification.is_read
                                    ? "font-medium text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                                  title="Mark as read"
                                >
                                  <FiCheck className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50 text-center">
                <a
                  href="#"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    // Navigate to full notifications page
                    setIsOpen(false);
                  }}
                >
                  View all notifications
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
