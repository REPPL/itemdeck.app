/**
 * Display configuration type definitions for the v1 schema.
 *
 * Controls how collections and entities are rendered.
 */

/**
 * Sort specification - field name with optional direction.
 */
export type SortSpec = string | [string, "asc" | "desc"];

/**
 * Image mapping with fallback support.
 */
export interface ImageMapping {
  /** Primary image source expression (e.g., "images[0]") */
  source: string;

  /** Fallback expression if primary is not found */
  fallback?: string;
}

/**
 * Card front face configuration.
 */
export interface CardFrontConfig {
  /** Field path for title */
  title?: string;

  /** Field path for subtitle (displayed below title) */
  subtitle?: string;

  /** Image mapping configuration */
  image?: ImageMapping | string;

  /** Field path for primary badge (e.g., rank) */
  badge?: string;

  /** Field path for secondary badge (e.g., rating) */
  secondaryBadge?: string;

  /** Field paths for footer elements */
  footer?: string[];
}

/**
 * Card back face configuration.
 */
export interface CardBackConfig {
  /** Field path for logo image */
  logo?: string;

  /** Field path for title text (e.g., verdict) */
  title?: string;

  /** Field path for secondary text (e.g., year) */
  text?: string;
}

/**
 * Card face configuration (front or back).
 * @deprecated Use CardFrontConfig or CardBackConfig instead
 */
export interface CardFaceConfig {
  /** Field mapping for title */
  title?: string;

  /** Field mapping for subtitle */
  subtitle?: string;

  /** Image mapping configuration */
  image?: ImageMapping | string;

  /** Field mapping for badge (e.g., rank) */
  badge?: string;

  /** Field mapping for text content */
  text?: string;

  /** Field mapping for logo */
  logo?: string;
}

/**
 * Card display configuration.
 */
export interface CardDisplayConfig {
  /** Front face configuration */
  front?: CardFrontConfig;

  /** Back face configuration */
  back?: CardBackConfig;
}

/**
 * Expanded view display configuration.
 */
export interface ExpandedDisplayConfig {
  /** Fields to show in expanded view */
  fields?: string[];

  /** Image display mode */
  imageMode?: "gallery" | "single" | "carousel";

  /** Whether to show attribution */
  showAttribution?: boolean;
}

/**
 * Complete display configuration for a collection.
 */
export interface DisplayConfig {
  /** Primary entity type to display */
  primaryEntity?: string;

  /** Field to group entities by */
  groupBy?: string;

  /** Sort order for entities */
  sortBy?: SortSpec;

  /** Sort order within groups */
  sortWithinGroup?: SortSpec;

  /** Card display configuration */
  card?: CardDisplayConfig;

  /** Expanded view configuration */
  expanded?: ExpandedDisplayConfig;

  /** Visual theme name */
  theme?: string;
}

/**
 * Type guard to check if a value is a valid SortSpec.
 */
export function isSortSpec(value: unknown): value is SortSpec {
  if (typeof value === "string") {
    return true;
  }
  if (Array.isArray(value) && value.length === 2) {
    return (
      typeof value[0] === "string" &&
      (value[1] === "asc" || value[1] === "desc")
    );
  }
  return false;
}

/**
 * Parse a SortSpec into field and direction.
 */
export function parseSortSpec(
  spec: SortSpec
): { field: string; direction: "asc" | "desc" } {
  if (typeof spec === "string") {
    return { field: spec, direction: "asc" };
  }
  return { field: spec[0], direction: spec[1] };
}
