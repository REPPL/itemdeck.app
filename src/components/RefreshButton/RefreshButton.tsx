/**
 * Refresh button component for manual data refresh.
 */

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import styles from "./RefreshButton.module.css";

interface RefreshButtonProps {
  /** Query key to invalidate */
  queryKey?: unknown[];

  /** Called when refresh starts */
  onRefreshStart?: () => void;

  /** Called when refresh completes */
  onRefreshComplete?: () => void;

  /** Additional CSS class */
  className?: string;

  /** Size variant */
  size?: "small" | "medium";
}

/**
 * Refresh icon component.
 */
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

/**
 * Button to manually refresh data.
 *
 * Invalidates TanStack Query cache to trigger a refetch.
 */
export function RefreshButton({
  queryKey,
  onRefreshStart,
  onRefreshComplete,
  className,
  size = "medium",
}: RefreshButtonProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    onRefreshStart?.();

    try {
      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey });
      } else {
        // Invalidate all queries if no specific key provided
        await queryClient.invalidateQueries();
      }
    } finally {
      setIsRefreshing(false);
      onRefreshComplete?.();
    }
  }, [isRefreshing, queryClient, queryKey, onRefreshStart, onRefreshComplete]);

  const classNames = [
    styles.button,
    styles[size],
    isRefreshing ? styles.refreshing : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classNames}
      onClick={() => {
        void handleRefresh();
      }}
      disabled={isRefreshing}
      aria-label={isRefreshing ? "Refreshing data" : "Refresh data"}
      aria-busy={isRefreshing}
    >
      <RefreshIcon className={styles.icon} />
      <span className={styles.label}>
        {isRefreshing ? "Refreshing..." : "Refresh"}
      </span>
    </button>
  );
}
