/**
 * Field path resolver utility.
 *
 * Provides functions to resolve field paths from entity objects,
 * supporting dot notation for nested properties (e.g., "platform.shortTitle").
 */

/**
 * Available field options for configuration dropdowns.
 */
export interface FieldOption {
  /** Field path (e.g., "title", "platform.shortTitle") */
  value: string;
  /** Display label */
  label: string;
  /** Field type hint */
  type?: "string" | "number" | "date";
}

/**
 * Default field options for card display mapping.
 *
 * These are fallback options used when no collection schema is loaded.
 * v2: Uses generic terminology with legacy aliases.
 */
export const TITLE_FIELD_OPTIONS: FieldOption[] = [
  { value: "title", label: "Title" },
];

export const SUBTITLE_FIELD_OPTIONS: FieldOption[] = [
  { value: "year", label: "Year" },
  { value: "playedSince", label: "Played Since" },
  { value: "status", label: "Status" },
  { value: "none", label: "None" },
];

export const FOOTER_BADGE_FIELD_OPTIONS: FieldOption[] = [
  { value: "platform.shortTitle", label: "Platform (Short)" },
  { value: "platform.title", label: "Platform (Full)" },
  { value: "categoryShort", label: "Category (Short)" },
  { value: "categoryTitle", label: "Category (Full)" },
  { value: "year", label: "Year" },
  { value: "none", label: "None" },
];

export const LOGO_FIELD_OPTIONS: FieldOption[] = [
  { value: "logoUrl", label: "Platform Logo" },
  { value: "images[type=logo][0].url", label: "Card Logo" },
  { value: "none", label: "None (App Logo)" },
];

/**
 * Background options for card back.
 * Includes built-in images (full/tiled) and collection-specific logos.
 */
export interface BackgroundOption {
  /** Unique value identifier */
  value: string;
  /** Display label */
  label: string;
  /** Type of background: 'full', 'tiled', 'logo', or 'app' */
  type: "full" | "tiled" | "logo" | "app";
  /** URL for built-in images, or field path for collection logos */
  url?: string;
  /** Field path for collection-specific logos */
  fieldPath?: string;
}

/**
 * Built-in background options (images from public/backgrounds/).
 */
export const BUILT_IN_BACKGROUNDS: BackgroundOption[] = [
  { value: "full-1", label: "Pattern 1 (Full)", type: "full", url: "/backgrounds/full/1.png" },
  { value: "full-2", label: "Pattern 2 (Full)", type: "full", url: "/backgrounds/full/2.png" },
  { value: "tiled-1", label: "Pattern 1 (Tiled)", type: "tiled", url: "/backgrounds/tiled/1.png" },
];

/**
 * Collection-specific background options (logos from entity data).
 */
export const COLLECTION_BACKGROUNDS: BackgroundOption[] = [
  { value: "platform-logo", label: "Platform Logo", type: "logo", fieldPath: "logoUrl" },
  { value: "card-logo", label: "Card Logo", type: "logo", fieldPath: "images[type=logo][0].url" },
];

/**
 * App logo background option.
 */
export const APP_LOGO_BACKGROUND: BackgroundOption = {
  value: "app-logo", label: "itemdeck App Logo", type: "app"
};

/**
 * All background options for card back settings.
 */
export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  ...BUILT_IN_BACKGROUNDS,
  ...COLLECTION_BACKGROUNDS,
  APP_LOGO_BACKGROUND,
];

export const SORT_FIELD_OPTIONS: FieldOption[] = [
  { value: "order", label: "Order/Rank" },
  { value: "myRank", label: "My Rank" },
  { value: "title", label: "Title" },
  { value: "year", label: "Year" },
  { value: "playedSince", label: "Played Since" },
  { value: "platform.shortTitle", label: "Platform" },
  { value: "categoryTitle", label: "Category" },
  { value: "rating.score", label: "Rating" },
];

/**
 * Available fields for grouping cards.
 */
export const GROUP_BY_FIELD_OPTIONS: FieldOption[] = [
  { value: "none", label: "None" },
  { value: "categoryTitle", label: "Platform" },
  { value: "year", label: "Year" },
  { value: "decade", label: "Decade" },
  { value: "genres[0]", label: "Genre" },
];

/**
 * Parsed segment result.
 */
interface ParsedSegment {
  /** Property name (null if segment is just brackets) */
  prop: string | null;
  /** Numeric array index (null if not present or using filter) */
  index: number | null;
  /** Filter expression (e.g., { key: "type", value: "logo" }) */
  filter: { key: string; value: string } | null;
}

/**
 * Parse a field path segment that may contain array bracket notation.
 *
 * Supports:
 * - "field" → { prop: "field", index: null, filter: null }
 * - "field[0]" → { prop: "field", index: 0, filter: null }
 * - "[0]" → { prop: null, index: 0, filter: null }
 * - "field[key=value]" → { prop: "field", index: null, filter: { key, value } }
 * - "field[key=value][0]" → { prop: "field", index: 0, filter: { key, value } }
 *
 * @param segment - A path segment like "field" or "field[0]" or "field[type=logo][0]"
 * @returns Object with property name, optional array index, and optional filter
 */
function parsePathSegment(segment: string): ParsedSegment {
  let prop: string | null = segment;
  let index: number | null = null;
  let filter: { key: string; value: string } | null = null;

  // Extract property name (everything before first bracket)
  const propMatch = /^([^[]*)?/.exec(segment);
  if (propMatch?.[1]) {
    prop = propMatch[1];
  } else if (segment.startsWith("[")) {
    prop = null;
  }

  // Extract filter expression: [key=value]
  const filterMatch = /\[([^=\]]+)=([^\]]+)\]/.exec(segment);
  if (filterMatch) {
    filter = {
      key: filterMatch[1] ?? "",
      value: filterMatch[2] ?? "",
    };
  }

  // Extract numeric index: [0] (must be numeric, not a filter)
  const indexMatch = /\[(\d+)\](?![^[])/.exec(segment);
  if (indexMatch) {
    index = parseInt(indexMatch[1] ?? "", 10);
  }

  return { prop, index, filter };
}

/**
 * Resolve a field path from an entity object.
 *
 * Supports dot notation for nested properties, bracket notation for arrays,
 * and filter expressions for finding items in arrays by property value.
 *
 * @param entity - The entity object to resolve from
 * @param fieldPath - Field path (e.g., "platform.shortTitle", "genres[0]", "images[type=logo][0].url")
 * @returns The resolved value or undefined if not found
 *
 * @example
 * ```ts
 * const entity = { platform: { title: "Nintendo Switch", shortTitle: "Switch" } };
 * resolveFieldPath(entity, "platform.shortTitle"); // "Switch"
 * resolveFieldPath(entity, "platform.title"); // "Nintendo Switch"
 * resolveFieldPath(entity, "title"); // undefined
 *
 * const entityWithArray = { genres: ["Action", "RPG"] };
 * resolveFieldPath(entityWithArray, "genres[0]"); // "Action"
 * resolveFieldPath(entityWithArray, "genres[1]"); // "RPG"
 *
 * const entityWithImages = { images: [{ type: "cover", url: "cover.jpg" }, { type: "logo", url: "logo.png" }] };
 * resolveFieldPath(entityWithImages, "images[type=logo][0].url"); // "logo.png"
 * ```
 */
export function resolveFieldPath(
  entity: Record<string, unknown>,
  fieldPath: string
): unknown {
  if (fieldPath === "none") {
    return undefined;
  }

  const parts = fieldPath.split(".");
  let current: unknown = entity;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    const { prop, index, filter } = parsePathSegment(part);

    // Check in _resolved first for relationship fields
    const obj = current as Record<string, unknown>;
    if (parts[0] === part && obj._resolved && typeof obj._resolved === "object") {
      const resolved = obj._resolved as Record<string, unknown>;
      if (prop && prop in resolved) {
        current = resolved[prop];
        // Apply filter if present
        if (filter && Array.isArray(current)) {
          current = current.filter((item: unknown) =>
            item !== null &&
            typeof item === "object" &&
            (item as Record<string, unknown>)[filter.key] === filter.value
          );
        }
        // Apply array index if present
        if (index !== null && Array.isArray(current)) {
          current = current[index];
        }
        continue;
      }
    }

    // Access property if specified
    if (prop) {
      current = obj[prop];
    }

    // Apply filter if present (e.g., images[type=logo] filters to items where type === "logo")
    if (filter && Array.isArray(current)) {
      current = current.filter((item: unknown) =>
        item !== null &&
        typeof item === "object" &&
        (item as Record<string, unknown>)[filter.key] === filter.value
      );
    }

    // Apply array index if present
    if (index !== null) {
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    }
  }

  return current;
}

/**
 * Resolve a field path and convert to string.
 *
 * @param entity - The entity object to resolve from
 * @param fieldPath - Dot-separated field path
 * @param fallback - Fallback value if resolution fails
 * @returns String value or fallback
 */
export function resolveFieldPathAsString(
  entity: Record<string, unknown>,
  fieldPath: string,
  fallback?: string
): string | undefined {
  const value = resolveFieldPath(entity, fieldPath);

  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

/**
 * Compare function for sorting entities by a field path.
 *
 * @param fieldPath - Field path to sort by
 * @param direction - Sort direction
 * @returns Compare function for Array.sort()
 */
export function createFieldSortComparator(
  fieldPath: string,
  direction: "asc" | "desc"
): (a: Record<string, unknown>, b: Record<string, unknown>) => number {
  return (a, b) => {
    const aValue = resolveFieldPath(a, fieldPath);
    const bValue = resolveFieldPath(b, fieldPath);

    // Handle nullish values - push to end regardless of direction
    if (aValue === null || aValue === undefined) {
      return 1;
    }
    if (bValue === null || bValue === undefined) {
      return -1;
    }

    // Compare based on type
    let comparison = 0;

    if (typeof aValue === "number" && typeof bValue === "number") {
      comparison = aValue - bValue;
    } else if (typeof aValue === "string" && typeof bValue === "string") {
      comparison = aValue.localeCompare(bValue);
    } else {
      // Convert to strings for comparison, handling objects safely
      const toSortString = (val: unknown): string => {
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return JSON.stringify(val);
        if (typeof val === "string") return val;
        if (typeof val === "number" || typeof val === "boolean") return String(val);
        return "";
      };
      comparison = toSortString(aValue).localeCompare(toSortString(bValue));
    }

    return direction === "desc" ? -comparison : comparison;
  };
}
