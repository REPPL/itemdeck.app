/**
 * Collection type definitions.
 *
 * Re-exports schema types and provides additional UI-specific types.
 */

// Re-export schema types for convenience
export type {
  CardData,
  Category,
  Collection,
  CollectionMeta,
  CardWithCategory,
} from "@/schemas";

/**
 * Card state for UI rendering.
 *
 * Combines card data with display state (flip, order, etc.).
 */
export interface CardState {
  /** The card data with optional category */
  card: import("@/schemas").CardWithCategory;

  /** Whether the card is currently flipped (face up) */
  isFlipped: boolean;

  /** Display order in the grid */
  order: number;
}

/**
 * Data source configuration.
 *
 * Defines where to fetch collection data from.
 */
export interface DataSourceConfig {
  /** Type of data source */
  type: "local" | "github-raw" | "github-api";

  /** Base URL or path for data */
  baseUrl?: string;

  /** GitHub owner (for github sources) */
  owner?: string;

  /** GitHub repository name */
  repo?: string;

  /** Collection name/path within repository */
  collection?: string;

  /** Git branch to fetch from */
  branch?: string;
}

/**
 * Collection loading state.
 */
export interface CollectionState {
  /** Current collection data (if loaded) */
  collection: import("@/schemas").Collection | null;

  /** Whether collection is currently loading */
  isLoading: boolean;

  /** Error message if loading failed */
  error: string | null;

  /** Whether data is from cache (offline mode) */
  isFromCache: boolean;
}
