/**
 * TanStack Query client configuration.
 *
 * Provides a singleton QueryClient with sensible defaults for itemdeck.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Default stale time for queries (5 minutes).
 * Data is considered fresh for this duration.
 */
const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Default garbage collection time (30 minutes).
 * Cached data is kept in memory for this duration after becoming unused.
 */
const DEFAULT_GC_TIME = 30 * 60 * 1000;

/**
 * Maximum number of retry attempts for failed queries.
 */
const MAX_RETRIES = 3;

/**
 * Calculate retry delay with exponential backoff.
 * Caps at 30 seconds.
 *
 * @param attemptIndex - Zero-based attempt index
 * @returns Delay in milliseconds
 */
function calculateRetryDelay(attemptIndex: number): number {
  const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
  return delay;
}

/**
 * Singleton QueryClient instance.
 *
 * Configured with defaults optimised for external data fetching:
 * - 5 minute stale time (reduces unnecessary refetches)
 * - 30 minute garbage collection (keeps data available for navigation)
 * - 3 retry attempts with exponential backoff
 * - No refetch on window focus (avoids unexpected data changes)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
      retry: MAX_RETRIES,
      retryDelay: calculateRetryDelay,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Create a new QueryClient for testing.
 *
 * Uses minimal caching and no retries for predictable test behaviour.
 *
 * @returns Fresh QueryClient instance configured for testing
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}
