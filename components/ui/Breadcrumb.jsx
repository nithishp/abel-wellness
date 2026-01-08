"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiChevronRight, FiHome, FiArrowLeft } from "react-icons/fi";

/**
 * Breadcrumb component with optional back button
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items: [{ label: string, href?: string, icon?: React.Node }]
 * @param {boolean} props.showBackButton - Whether to show back button (default: true)
 * @param {string} props.backHref - Custom back href (optional, uses router.back() if not provided)
 * @param {string} props.className - Additional CSS classes
 */
export default function Breadcrumb({
  items = [],
  showBackButton = true,
  backHref,
  className = "",
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <nav
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${className}`}
    >
      {/* Back Button - Always visible on mobile for easy navigation */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0 w-fit"
          aria-label="Go back"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span className="sm:hidden text-sm">Back</span>
        </button>
      )}

      {/* Breadcrumb Trail */}
      <ol className="flex items-center flex-wrap gap-1 sm:gap-2 text-sm sm:text-base min-w-0">
        {/* Home Link */}
        <li className="flex items-center">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <FiHome className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </li>

        {/* Breadcrumb Items */}
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center min-w-0">
              <FiChevronRight className="w-4 h-4 text-slate-600 mx-1 sm:mx-2 shrink-0" />
              {isLast || !item.href ? (
                <span className="flex items-center gap-1 text-white font-medium truncate">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors truncate"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Inline Breadcrumb for compact header layouts
 * Shows only the breadcrumb trail without back button
 */
export function InlineBreadcrumb({ items = [], className = "" }) {
  return (
    <ol
      className={`flex items-center flex-wrap gap-1 text-xs sm:text-sm ${className}`}
    >
      <li>
        <Link
          href="/admin/dashboard"
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          Dashboard
        </Link>
      </li>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <li key={index} className="flex items-center">
            <FiChevronRight className="w-3 h-3 text-slate-600 mx-1" />
            {isLast || !item.href ? (
              <span className="text-slate-400">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
