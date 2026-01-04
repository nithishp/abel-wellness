"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for implementing infinite scroll with Intersection Observer
 * Similar to TikTok/Instagram style lazy loading as user scrolls
 *
 * @param {Function} fetchFn - Async function to fetch data, receives (page, limit) params
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Items per page (default: 10)
 * @param {number} options.threshold - Intersection threshold (default: 0.1)
 * @param {string} options.rootMargin - Root margin for observer (default: "100px")
 * @param {boolean} options.enabled - Whether to enable fetching (default: true)
 * @param {any[]} options.dependencies - Additional dependencies to trigger refetch
 * @returns {Object} - { items, loading, loadingMore, hasMore, error, loadMore, reset, sentinelRef }
 */
export function useInfiniteScroll(fetchFn, options = {}) {
  const {
    limit = 10,
    threshold = 0.1,
    rootMargin = "100px",
    enabled = true,
    dependencies = [],
  } = options;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Fetch data function
  const fetchData = useCallback(
    async (pageNum, isLoadMore = false) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const result = await fetchFn(pageNum, limit);

        const newItems = result.items || result.data || [];
        const total = result.total || result.totalCount || 0;
        const hasMoreData = result.hasMore ?? newItems.length === limit;

        if (isLoadMore) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }

        setTotalCount(total);
        setHasMore(hasMoreData && newItems.length > 0);
        setPage(pageNum);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [fetchFn, limit]
  );

  // Load more function
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore || loading || isFetchingRef.current) return;
    fetchData(page + 1, true);
  }, [fetchData, hasMore, loadingMore, loading, page]);

  // Reset function
  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    isFetchingRef.current = false;
    fetchData(1, false);
  }, [fetchData]);

  // Initial fetch and dependency-triggered refetch
  useEffect(() => {
    if (enabled) {
      setItems([]);
      setPage(1);
      setHasMore(true);
      fetchData(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...dependencies]);

  // Setup Intersection Observer
  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, loadingMore, loading, loadMore, threshold, rootMargin]);

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    error,
    totalCount,
    loadMore,
    reset,
    sentinelRef,
    page,
  };
}

export default useInfiniteScroll;
