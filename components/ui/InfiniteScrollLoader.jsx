"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { FiLoader } from "react-icons/fi";

/**
 * Loading spinner component for infinite scroll
 * Place this at the end of your list and pass the sentinelRef
 */
export const InfiniteScrollLoader = forwardRef(
  (
    {
      loading = false,
      hasMore = true,
      loadingMore = false,
      error = null,
      itemCount = 0,
      totalCount = 0,
      emptyMessage = "No items found",
      endMessage = "You've reached the end",
      loadingMessage = "Loading more...",
      errorMessage = "Failed to load items",
      onRetry,
      showCount = true,
      showEndMessage = true,
      className = "",
      loaderColor = "purple",
    },
    ref,
  ) => {
    // Color variants for the loader
    const colorVariants = {
      purple: {
        border: "border-purple-500",
        text: "text-purple-400",
        bg: "bg-purple-500/10",
      },
      emerald: {
        border: "border-emerald-500",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
      },
      blue: {
        border: "border-blue-500",
        text: "text-blue-400",
        bg: "bg-blue-500/10",
      },
      amber: {
        border: "border-amber-500",
        text: "text-amber-400",
        bg: "bg-amber-500/10",
      },
      slate: {
        border: "border-slate-500",
        text: "text-slate-400",
        bg: "bg-slate-500/10",
      },
    };

    const colors = colorVariants[loaderColor] || colorVariants.purple;

    // Initial loading state (first page)
    if (loading && itemCount === 0) {
      return (
        <div className={`flex justify-center py-12 ${className}`}>
          <div className="text-center">
            <div className="relative w-12 h-12 mx-auto mb-3">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
              <div
                className={`absolute inset-0 rounded-full border-4 border-t-transparent ${colors.border} animate-spin`}
              ></div>
            </div>
            <p className="text-slate-400 text-sm">Loading...</p>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div className={`flex justify-center py-8 ${className}`}>
          <div className="text-center">
            <p className="text-red-400 mb-3">{errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    // Empty state
    if (!loading && itemCount === 0) {
      return (
        <div className={`flex justify-center py-12 ${className}`}>
          <div className="text-center">
            <div
              className={`w-16 h-16 mx-auto mb-4 rounded-full ${colors.bg} flex items-center justify-center`}
            >
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-slate-400">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={`py-6 ${className}`}>
        {/* Loading more indicator */}
        {loadingMore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center items-center gap-3"
          >
            <FiLoader className={`w-5 h-5 ${colors.text} animate-spin`} />
            <span className="text-slate-400 text-sm">{loadingMessage}</span>
          </motion.div>
        )}

        {/* End of list message */}
        {showEndMessage && !hasMore && !loadingMore && itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700">
              <span className="text-slate-400 text-sm">{endMessage}</span>
              {showCount && totalCount > 0 && (
                <span className={`text-xs ${colors.text}`}>
                  ({itemCount} of {totalCount})
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Invisible sentinel for triggering load more */}
        {hasMore && !loadingMore && <div className="h-1" />}
      </div>
    );
  },
);

InfiniteScrollLoader.displayName = "InfiniteScrollLoader";

/**
 * Simple skeleton loader for list items
 */
export const ListItemSkeleton = ({ count = 3, className = "" }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/50 rounded-xl p-6 animate-pulse border border-slate-700/50"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-5 bg-slate-700 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </div>
            <div className="w-20 h-8 bg-slate-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table row skeleton for table-based lists
 */
export const TableRowSkeleton = ({ columns = 5, rows = 5, className = "" }) => {
  return (
    <tbody className={className}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="p-4">
              <div className="h-4 bg-slate-700 rounded w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

export default InfiniteScrollLoader;
