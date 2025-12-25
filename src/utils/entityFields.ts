/**
 * Entity field discovery utilities.
 *
 * Provides functions to extract displayable fields from card entities
 * and format them for presentation.
 */

/**
 * Fields to skip when auto-discovering entity fields.
 * These are internal/display fields that shouldn't be shown to users.
 */
const SKIP_FIELDS = new Set([
  // Internal fields
  "id",
  "_resolved",
  "metadata",
  // Image fields (shown in gallery)
  "images",
  "imageUrl",
  "imageUrls",
  "logoUrl",
  "imageAttribution",
  "primaryImage",
  // Link fields (shown as buttons)
  "detailUrl",
  "detailUrls",
  // Category fields (shown prominently elsewhere)
  "category",
  "categoryTitle",
  "categoryShort",
  "categoryInfo",
  "platform",
  "platformTitle",
  "originalPlatform",
  "device",
  // Genre fields (not needed in verdict view)
  "genre",
  "genres",
  // Ranking fields (order is internal, myRank shown in Verdict, skip rank)
  "order",
  "rank",
  // Title/year shown in header
  "title",
  "year",
  // Summary shown below header
  "summary",
  // Redundant release date (year already shown)
  "originalReleaseDate",
  // Rating fields (skip personal rating, keep average reviews)
  "rating",
]);

/**
 * Field definition for display purposes.
 */
export interface FieldDefinition {
  /** Display label for the field */
  label: string;
  /** Field type for formatting */
  type?: "text" | "year" | "number" | "enum" | "stars";
  /** Possible values for enum type */
  values?: string[];
  /** Number format (e.g., "stars" for star rating) */
  format?: string;
}

/**
 * Built-in field definitions with friendly labels.
 */
const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  // Core fields
  title: { label: "Title", type: "text" },
  year: { label: "Year", type: "year" },
  summary: { label: "Summary", type: "text" },
  // Personal fields (my* prefix)
  myVerdict: { label: "My verdict", type: "text" },
  myStartYear: { label: "Playing since", type: "year" },
  myRating: { label: "My rating", type: "number", format: "stars" },
  myRank: { label: "My rank", type: "number" },
  // Legacy personal fields
  playedSince: { label: "Playing since", type: "year" },
  verdict: { label: "Verdict", type: "text" },
  rating: { label: "Rating", type: "number", format: "stars" },
  status: { label: "Status", type: "enum", values: ["completed", "playing", "backlog", "abandoned"] },
  // Metadata fields
  genres: { label: "Genres", type: "text" },
  averageRating: { label: "Reviews", type: "number", format: "stars10" },
  // Category fields (usually skipped)
  rank: { label: "Rank", type: "number" },
  device: { label: "Platform", type: "text" },
  platform: { label: "Platform", type: "text" },
};

/**
 * Convert a camelCase or snake_case field name to title case.
 * @example "playedSince" -> "Played Since"
 * @example "some_field" -> "Some Field"
 */
export function toTitleCase(fieldName: string): string {
  return fieldName
    // Insert space before uppercase letters
    .replace(/([A-Z])/g, " $1")
    // Replace underscores with spaces
    .replace(/_/g, " ")
    // Capitalize first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Get the display label for a field.
 * Uses field definition if available, otherwise converts to title case.
 */
export function getFieldLabel(fieldName: string): string {
  return FIELD_DEFINITIONS[fieldName]?.label ?? toTitleCase(fieldName);
}

/**
 * Format a field value for display.
 * Handles different value types: strings, numbers, arrays, objects.
 */
export function formatFieldValue(
  value: unknown,
  fieldName?: string
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Check for star rating format (5-star scale)
  if (fieldName && FIELD_DEFINITIONS[fieldName]?.format === "stars") {
    const valueStr = typeof value === "number" ? String(value) : (typeof value === "string" ? value : "");
    const num = parseFloat(valueStr);
    if (!isNaN(num)) {
      const fullStars = Math.floor(num);
      const emptyStars = 5 - fullStars;
      return "★".repeat(fullStars) + "☆".repeat(emptyStars);
    }
  }

  // Check for 10-star rating format (for review scores)
  if (fieldName && FIELD_DEFINITIONS[fieldName]?.format === "stars10") {
    const valueStr = typeof value === "number" ? String(value) : (typeof value === "string" ? value : "");
    const num = parseFloat(valueStr);
    if (!isNaN(num)) {
      // Round to nearest whole star for clean display
      const fullStars = Math.round(num);
      const emptyStars = 10 - fullStars;
      return "★".repeat(fullStars) + "☆".repeat(emptyStars);
    }
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    const items = value.map((v) => formatFieldValue(v)).filter(Boolean);
    return items.length > 0 ? items.join(", ") : null;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // Handle rating objects (averageRating, rating)
    if (typeof obj.score === "number") {
      const score = obj.score;
      // Default max is 5 (most review scores are out of 5)
      // For 10-point scales, data should explicitly set max: 10
      const max = typeof obj.max === "number" ? obj.max : 5;
      const sourceCount = typeof obj.sourceCount === "number" ? obj.sourceCount : undefined;

      // For stars10 format, display as 10-star scale
      // Normalise score to 10-point scale regardless of original max
      if (fieldName && FIELD_DEFINITIONS[fieldName]?.format === "stars10") {
        const normalisedScore = (score / max) * 10;
        // Round to nearest whole star for clean display
        const fullStars = Math.round(normalisedScore);
        const emptyStars = 10 - fullStars;
        const stars = "★".repeat(fullStars) + "☆".repeat(emptyStars);
        return sourceCount ? `${stars} (${String(sourceCount)})` : stars;
      }

      // Default 5-star display
      const source = typeof obj.source === "string" ? obj.source : undefined;
      const stars = "★".repeat(Math.floor(score)) + "☆".repeat(max - Math.floor(score));
      return source ? `${stars} (${source})` : stars;
    }

    // For objects like platform, try to get title or shortTitle
    if (typeof obj.title === "string" || typeof obj.title === "number") {
      return String(obj.title);
    }
    if (typeof obj.shortTitle === "string" || typeof obj.shortTitle === "number") {
      return String(obj.shortTitle);
    }
    // Otherwise skip complex objects
    return null;
  }

  // Handle primitives
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

/**
 * A displayable field with label and formatted value.
 */
export interface DisplayableField {
  /** Original field key */
  key: string;
  /** Display label */
  label: string;
  /** Formatted value */
  value: string;
}

/**
 * Options for filtering and ordering displayable fields.
 */
export interface GetDisplayableFieldsOptions {
  /**
   * If specified, only these fields are displayed, in this order.
   * Field names can be the raw key or the display label.
   * If not specified, all fields are shown in alphabetical order.
   */
  verdictFields?: string[];
}

/**
 * Extract displayable fields from an entity.
 * Returns fields that have non-empty values and aren't in the skip list.
 *
 * @param entity - The entity to extract fields from
 * @param options - Optional filtering and ordering options
 */
export function getDisplayableFields(
  entity: Record<string, unknown>,
  options?: GetDisplayableFieldsOptions
): DisplayableField[] {
  const fields: DisplayableField[] = [];

  for (const [key, value] of Object.entries(entity)) {
    // Skip internal fields
    if (SKIP_FIELDS.has(key)) {
      continue;
    }

    // Format the value
    const formattedValue = formatFieldValue(value, key);

    // Skip empty values
    if (!formattedValue) {
      continue;
    }

    fields.push({
      key,
      label: getFieldLabel(key),
      value: formattedValue,
    });
  }

  // If verdictFields is specified, filter and order by it
  if (options?.verdictFields && options.verdictFields.length > 0) {
    const orderedFields: DisplayableField[] = [];

    for (const fieldSpec of options.verdictFields) {
      // Find field by key or label (case-insensitive)
      const field = fields.find(
        (f) =>
          f.key.toLowerCase() === fieldSpec.toLowerCase() ||
          f.label.toLowerCase() === fieldSpec.toLowerCase()
      );
      if (field) {
        orderedFields.push(field);
      }
    }

    return orderedFields;
  }

  // Default: sort alphabetically by label
  return fields.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Fields that should be displayed prominently (not in "more" section).
 * Note: rank, device, platform are now in SKIP_FIELDS as they're shown
 * in dedicated UI elements (badge, platform row).
 */
const PROMINENT_FIELDS = new Set(["title", "year", "summary"]);

/**
 * Check if a field should be displayed prominently.
 */
export function isProminentField(fieldName: string): boolean {
  return PROMINENT_FIELDS.has(fieldName);
}

/**
 * Separate fields into prominent and additional categories.
 */
export function categoriseFields(fields: DisplayableField[]): {
  prominent: DisplayableField[];
  additional: DisplayableField[];
} {
  const prominent: DisplayableField[] = [];
  const additional: DisplayableField[] = [];

  for (const field of fields) {
    if (isProminentField(field.key)) {
      prominent.push(field);
    } else {
      additional.push(field);
    }
  }

  return { prominent, additional };
}
