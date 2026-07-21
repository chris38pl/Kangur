import { useCallback, useEffect, useMemo, useState } from "react";

export type UseListPaginationOptions = {
  /** Items shown per “page” / show-more step. */
  pageSize: number;
  /**
   * When this value changes, visible count resets to `pageSize`
   * (e.g. filter, search query, workspace id).
   */
  resetKey?: string | number;
  /**
   * External “has more” for server-driven pagination.
   * When set with `onLoadMore`, the hook does not slice locally -
   * `visibleItems` equals `items` and `showMore` calls `onLoadMore`.
   */
  hasMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
  isLoadingMore?: boolean;
};

export type UseListPaginationResult<T> = {
  visibleItems: T[];
  hasMore: boolean;
  remainingCount: number;
  isLoadingMore: boolean;
  showMore: () => void;
  /** Current client-side window size (ignored in remote mode). */
  visibleCount: number;
};

/**
 * Progressive list reveal - “Show more” pagination for mobile lists.
 *
 * Default: client-side window over an already-fetched array.
 * Optional remote mode: pass `hasMore` + `onLoadMore` when the next page
 * comes from the network (`items` is the accumulated result set).
 */
export function useListPagination<T>(
  items: T[],
  options: UseListPaginationOptions,
): UseListPaginationResult<T> {
  const {
    pageSize,
    resetKey,
    hasMore: remoteHasMore,
    onLoadMore,
    isLoadingMore = false,
  } = options;

  const remote = typeof remoteHasMore === "boolean" && onLoadMore != null;
  const safePageSize = Math.max(1, pageSize);

  const [visibleCount, setVisibleCount] = useState(safePageSize);

  useEffect(() => {
    setVisibleCount(safePageSize);
  }, [resetKey, safePageSize]);

  // If the list shrinks (delete / filter), keep window in bounds.
  useEffect(() => {
    if (remote) return;
    setVisibleCount((prev) => {
      if (items.length === 0) return safePageSize;
      if (prev > items.length) {
        return Math.max(safePageSize, items.length);
      }
      return prev;
    });
  }, [items.length, remote, safePageSize]);

  const visibleItems = useMemo(() => {
    if (remote) return items;
    return items.slice(0, visibleCount);
  }, [items, remote, visibleCount]);

  const remainingCount = remote
    ? 0
    : Math.max(0, items.length - visibleItems.length);

  const hasMore = remote ? Boolean(remoteHasMore) : remainingCount > 0;

  const showMore = useCallback(() => {
    if (remote) {
      void onLoadMore?.();
      return;
    }
    setVisibleCount((prev) => prev + safePageSize);
  }, [remote, onLoadMore, safePageSize]);

  return {
    visibleItems,
    hasMore,
    remainingCount,
    isLoadingMore: remote ? isLoadingMore : false,
    showMore,
    visibleCount: remote ? items.length : visibleCount,
  };
}
