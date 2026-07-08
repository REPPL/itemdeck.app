/**
 * Query key factory for TanStack Query.
 *
 * Provides consistent, type-safe query keys for all data fetching operations.
 * Following the factory pattern ensures proper cache invalidation.
 */

/**
 * Query keys for collection queries.
 */
export const collectionKeys = {
  /** Base key for all collection queries */
  all: ["collections"] as const,

  /** Key for local collection queries */
  local: (path: string) => [...collectionKeys.all, "local", path] as const,
};

