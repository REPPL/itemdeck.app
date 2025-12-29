/**
 * Collection mechanic types.
 *
 * Types for the persistent collection tracking mechanic that allows
 * users to mark items as owned or wishlisted.
 */

/** Ownership status for a card */
export type OwnershipStatus = "none" | "owned" | "wishlist";

/** Collection state per source */
export interface CollectionState {
  /** Card IDs marked as owned */
  ownedIds: Set<string>;
  /** Card IDs on wishlist */
  wishlistIds: Set<string>;
}

/** Collection mechanic settings */
export interface CollectionSettings {
  /** Show progress bar in grid overlay */
  showProgress: boolean;
  /** Whether progress bar is collapsed (compact view) */
  progressCollapsed: boolean;
  /** Show badge on unowned cards */
  showUnownedBadge: boolean;
  /** Enable keyboard shortcuts */
  keyboardShortcuts: boolean;
}

/** Default settings values */
export const DEFAULT_SETTINGS: CollectionSettings = {
  showProgress: true,
  progressCollapsed: true,
  showUnownedBadge: false,
  keyboardShortcuts: true,
};

/** Collection statistics */
export interface CollectionStats {
  /** Total number of cards in collection */
  total: number;
  /** Number of owned cards */
  owned: number;
  /** Number of wishlisted cards */
  wishlist: number;
  /** Number of remaining (unowned, not wishlisted) cards */
  remaining: number;
  /** Percentage of collection owned (0-100) */
  percentComplete: number;
}

/** Export format version */
export const EXPORT_VERSION = "1.0" as const;

/** Export format for collection data */
export interface CollectionExport {
  /** Format version */
  version: typeof EXPORT_VERSION;
  /** Source identifier for this collection */
  sourceId: string;
  /** ISO timestamp of export */
  exportedAt: string;
  /** Array of owned card IDs */
  owned: string[];
  /** Array of wishlisted card IDs */
  wishlist: string[];
}

/** Import mode for collection data */
export type ImportMode = "merge" | "replace";

/**
 * Validate an imported collection export.
 * Returns true if the export is valid, false otherwise.
 */
export function isValidCollectionExport(data: unknown): data is CollectionExport {
  if (!data || typeof data !== "object") return false;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (obj.version !== EXPORT_VERSION) return false;
  if (typeof obj.sourceId !== "string") return false;
  if (typeof obj.exportedAt !== "string") return false;
  if (!Array.isArray(obj.owned)) return false;
  if (!Array.isArray(obj.wishlist)) return false;

  // Validate arrays contain only strings
  if (!obj.owned.every((id) => typeof id === "string")) return false;
  if (!obj.wishlist.every((id) => typeof id === "string")) return false;

  return true;
}
