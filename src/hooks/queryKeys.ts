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
 * GitHub data source configuration.
 */
export interface GitHubSourceConfig {
  /** Repository owner */
  owner: string;

  /** Repository name */
  repo: string;

  /** Collection name/path */
  collection: string;

  /** Git branch (defaults to 'main') */
  branch?: string;
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

  /** Key for GitHub collection queries */
  github: (config: GitHubSourceConfig) =>
    [
      ...collectionKeys.all,
      "github",
      config.owner,
      config.repo,
      config.collection,
      config.branch ?? "main",
    ] as const,
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

/**
 * Query keys for GitHub-specific queries.
 */
export const githubKeys = {
  /** Base key for all GitHub queries */
  all: ["github"] as const,

  /** Key for manifest queries */
  manifest: (owner: string, repo: string, branch?: string) =>
    [...githubKeys.all, "manifest", owner, repo, branch ?? "main"] as const,

  /** Key for raw content queries */
  raw: (url: string) => [...githubKeys.all, "raw", url] as const,
};
