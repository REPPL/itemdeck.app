/**
 * Query key factory for TanStack Query.
 *
 * Provides consistent, type-safe query keys for all data fetching operations.
 * Following the factory pattern ensures proper cache invalidation.
 */

/**
 * Filter options for card queries.
 */
export interface CardFilters {
  /** Filter by category */
  category?: string;

  /** Filter by search term */
  search?: string;

  /** Filter by year */
  year?: string;
}

/**
 * Query keys for card-related queries.
 *
 * Structured hierarchically for granular cache invalidation:
 * - cardKeys.all: All card queries
 * - cardKeys.lists(): All list queries
 * - cardKeys.list(filters): Specific filtered list
 * - cardKeys.details(): All detail queries
 * - cardKeys.detail(id): Specific card detail
 */
export const cardKeys = {
  /** Base key for all card queries */
  all: ["cards"] as const,

  /** Key for all card list queries */
  lists: () => [...cardKeys.all, "list"] as const,

  /** Key for a specific filtered card list */
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,

  /** Key for all card detail queries */
  details: () => [...cardKeys.all, "detail"] as const,

  /** Key for a specific card detail */
  detail: (id: string) => [...cardKeys.details(), id] as const,
};

/**
 * Query keys for collection queries.
 */
export const collectionKeys = {
  /** Base key for all collection queries */
  all: ["collections"] as const,

  /** Key for local collection queries */
  local: (path: string) => [...collectionKeys.all, "local", path] as const,
};

/**
 * Query keys for category queries.
 */
export const categoryKeys = {
  /** Base key for all category queries */
  all: ["categories"] as const,

  /** Key for categories list */
  list: () => [...categoryKeys.all, "list"] as const,
};

