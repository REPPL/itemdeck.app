/**
 * Source health check hooks using TanStack Query.
 *
 * Provides reactive health status for remote data sources.
 */

import { useQuery, useQueries } from "@tanstack/react-query";
import { checkSourceHealth, type HealthCheckResult } from "@/services/sourceHealthCheck";

/**
 * Query key factory for source health checks.
 */
export const sourceHealthKeys = {
  all: ["source-health"] as const,
  single: (url: string) => [...sourceHealthKeys.all, url] as const,
};

/**
 * Default stale time for health checks (5 minutes).
 */
const HEALTH_STALE_TIME = 5 * 60 * 1000;

/**
 * Default refetch interval (10 minutes).
 */
const HEALTH_REFETCH_INTERVAL = 10 * 60 * 1000;

/**
 * Hook for checking health of a single source.
 *
 * @param url - Source URL to check
 * @param options - Query options
 * @returns Query result with health check data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useSourceHealth("https://example.com/data");
 *
 * if (isLoading) return <Skeleton />;
 * if (data?.status === "healthy") return <HealthyIndicator />;
 * ```
 */
export function useSourceHealth(
  url: string,
  options?: {
    /** Whether to enable the query (default: true) */
    enabled?: boolean;
    /** Stale time in ms (default: 5 minutes) */
    staleTime?: number;
    /** Refetch interval in ms (default: 10 minutes) */
    refetchInterval?: number;
  }
) {
  const {
    enabled = true,
    staleTime = HEALTH_STALE_TIME,
    refetchInterval = HEALTH_REFETCH_INTERVAL,
  } = options ?? {};

  return useQuery({
    queryKey: sourceHealthKeys.single(url),
    queryFn: () => checkSourceHealth(url),
    enabled: enabled && Boolean(url),
    staleTime,
    refetchInterval,
    retry: 1, // Only retry once for health checks
    refetchOnWindowFocus: false, // Don't spam health checks on tab focus
  });
}

/**
 * Hook for checking health of multiple sources in parallel.
 *
 * @param urls - Array of source URLs to check
 * @param options - Query options
 * @returns Array of query results with health check data
 *
 * @example
 * ```tsx
 * const healthResults = useMultiSourceHealth([
 *   "https://source1.com/data",
 *   "https://source2.com/data",
 * ]);
 *
 * const allHealthy = healthResults.every(r => r.data?.status === "healthy");
 * ```
 */
export function useMultiSourceHealth(
  urls: string[],
  options?: {
    /** Whether to enable the queries (default: true) */
    enabled?: boolean;
    /** Stale time in ms (default: 5 minutes) */
    staleTime?: number;
    /** Refetch interval in ms (default: 10 minutes) */
    refetchInterval?: number;
  }
) {
  const {
    enabled = true,
    staleTime = HEALTH_STALE_TIME,
    refetchInterval = HEALTH_REFETCH_INTERVAL,
  } = options ?? {};

  return useQueries({
    queries: urls.map((url) => ({
      queryKey: sourceHealthKeys.single(url),
      queryFn: () => checkSourceHealth(url),
      enabled: enabled && Boolean(url),
      staleTime,
      refetchInterval,
      retry: 1,
      refetchOnWindowFocus: false,
    })),
  });
}

/**
 * Helper to aggregate multiple health check results.
 *
 * @param results - Array of health check results
 * @returns Aggregated health summary
 */
export function aggregateHealthResults(
  results: (HealthCheckResult | undefined)[]
): {
  total: number;
  healthy: number;
  degraded: number;
  unreachable: number;
  invalid: number;
  loading: number;
  averageLatency: number;
} {
  const validResults = results.filter((r): r is HealthCheckResult => r !== undefined);

  const counts = {
    total: results.length,
    healthy: validResults.filter((r) => r.status === "healthy").length,
    degraded: validResults.filter((r) => r.status === "degraded").length,
    unreachable: validResults.filter((r) => r.status === "unreachable").length,
    invalid: validResults.filter((r) => r.status === "invalid").length,
    loading: results.length - validResults.length,
  };

  const totalLatency = validResults.reduce((sum, r) => sum + r.latency, 0);
  const averageLatency = validResults.length > 0
    ? Math.round(totalLatency / validResults.length)
    : 0;

  return {
    ...counts,
    averageLatency,
  };
}
