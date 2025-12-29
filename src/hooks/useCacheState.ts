/**
 * Hook to get cache state for a source.
 *
 * Returns the current cache status (fresh, stale, none) and metadata
 * for displaying cache indicators in the UI.
 */

import { useState, useEffect } from "react";
import { getCacheMetadata, type CacheMetadata } from "@/lib/cardCache";

/**
 * Cache state with human-readable formatting.
 */
export interface CacheState {
  /** Cache status: fresh, stale, or none */
  status: "fresh" | "stale" | "none";

  /** Timestamp when cached */
  cachedAt?: Date;

  /** Cache age in milliseconds */
  ageMs?: number;

  /** Whether data is being loaded */
  isLoading: boolean;

  /** Human-readable age description (e.g., "2 hours ago") */
  ageDescription?: string;
}

/**
 * Format a time duration in milliseconds to a human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable string (e.g., "2 hours ago", "5 minutes ago")
 */
function formatAge(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? "1 day ago" : `${String(days)} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? "1 hour ago" : `${String(hours)} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "1 minute ago" : `${String(minutes)} minutes ago`;
  }
  return "Just now";
}

/**
 * Hook to get cache state for a source.
 *
 * @param sourceId - Unique identifier for the data source
 * @returns Cache state including status, age, and human-readable description
 *
 * @example
 * ```tsx
 * const cacheState = useCacheState(sourceId);
 *
 * if (cacheState.status === 'fresh') {
 *   // Show green indicator
 * } else if (cacheState.status === 'stale') {
 *   // Show yellow indicator
 * } else {
 *   // Show grey indicator (no cache)
 * }
 * ```
 */
export function useCacheState(sourceId: string): CacheState {
  const [state, setState] = useState<CacheState>({
    status: "none",
    isLoading: true,
  });

  useEffect(() => {
    if (!sourceId) {
      setState({
        status: "none",
        isLoading: false,
      });
      return;
    }

    let cancelled = false;

    async function fetchCacheState() {
      try {
        const metadata: CacheMetadata = await getCacheMetadata(sourceId);

        if (cancelled) return;

        setState({
          status: metadata.status,
          cachedAt: metadata.cachedAt,
          ageMs: metadata.ageMs,
          isLoading: false,
          ageDescription: metadata.ageMs ? formatAge(metadata.ageMs) : undefined,
        });
      } catch {
        if (cancelled) return;

        setState({
          status: "none",
          isLoading: false,
        });
      }
    }

    void fetchCacheState();

    // Refresh cache state every minute to keep age description current
    const intervalId = setInterval(() => {
      void fetchCacheState();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [sourceId]);

  return state;
}
