/**
 * Hook to extract available fields from collection data.
 *
 * Analyses the first few cards in the collection to determine
 * which fields are available for display configuration.
 *
 * v0.11.5: Dynamic field detection for collection-agnostic settings.
 */

import { useMemo } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import type { FieldOption } from "@/utils/fieldPathResolver";

/**
 * Fields that qualify for the top corner badge: a field qualifies when its
 * values are short rank/verdict/score-like data that fits a small badge.
 * Exact field names are matched against TOP_BADGE_FIELD_NAMES; any field
 * whose name contains one of TOP_BADGE_FIELD_KEYWORDS also qualifies.
 */
const TOP_BADGE_FIELD_NAMES = new Set(["myRank", "myVerdict", "rank", "year"]);
const TOP_BADGE_FIELD_KEYWORDS = ["verdict", "rating", "score"];

/**
 * Upper bound on the number of distinct fields discovered for the settings
 * dropdowns.
 *
 * Entity schemas are `.loose()`, so an untrusted collection can carry an
 * unbounded number of keys, all of which are copied onto the display card.
 * Every discovered field becomes an `<option>` in the settings panel (sort,
 * badge and group-by selectors), which renders outside the collection error
 * boundary — so an entity with tens of thousands of matching keys freezes or
 * OOMs the tab on a single synchronous commit. Cap discovery the way
 * MAX_DISPLAYABLE_FIELDS (entityFields.ts) caps the card-detail rows.
 */
const MAX_AVAILABLE_FIELDS = 100;

/**
 * Convert camelCase to Title Case.
 */
function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Generate a human-readable label from a field path.
 */
function generateLabel(fieldPath: string): string {
  // Handle nested paths like "platform.shortTitle"
  const parts = fieldPath.split(".");
  const lastPart = parts[parts.length - 1] ?? fieldPath;

  // Handle array notation like "genres[0]"
  const cleanPart = lastPart.replace(/\[\d+\]$/, "");

  // Convert camelCase to Title Case
  return camelToTitle(cleanPart);
}

/**
 * Check if a value is a simple displayable type.
 */
function isDisplayableValue(value: unknown): boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Extract field paths from an object recursively.
 */
function extractFields(
  obj: Record<string, unknown>,
  prefix = "",
  maxDepth = 2,
  currentDepth = 0,
  limit = Number.POSITIVE_INFINITY,
  fields: string[] = []
): string[] {
  if (currentDepth >= maxDepth) return fields;

  for (const [key, value] of Object.entries(obj)) {
    // Stop once the caller's ceiling is reached so a hostile entity with a huge
    // key space cannot make discovery walk (and allocate) without bound.
    if (fields.length >= limit) break;

    // Skip internal/private fields
    if (key.startsWith("_")) continue;

    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (isDisplayableValue(value)) {
      fields.push(fieldPath);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Recurse into nested objects
      extractFields(value as Record<string, unknown>, fieldPath, maxDepth, currentDepth + 1, limit, fields);
    } else if (Array.isArray(value) && value.length > 0) {
      // Check first element of arrays
      const first: unknown = value[0];
      if (isDisplayableValue(first)) {
        fields.push(`${fieldPath}[0]`);
      }
    }
  }

  return fields;
}

/**
 * Hook to get available field options from the collection.
 *
 * @returns Object with field option arrays for different purposes
 */
export function useAvailableFields() {
  const { cards } = useCollectionData();

  return useMemo(() => {
    // Analyse first 5 cards to determine available fields
    const sampleCards = cards.slice(0, 5);
    const fieldSet = new Set<string>();

    for (const card of sampleCards) {
      if (fieldSet.size >= MAX_AVAILABLE_FIELDS) break;
      const fields = extractFields(
        card as Record<string, unknown>,
        "",
        2,
        0,
        MAX_AVAILABLE_FIELDS
      );
      for (const field of fields) {
        fieldSet.add(field);
        if (fieldSet.size >= MAX_AVAILABLE_FIELDS) break;
      }
    }

    // Convert to sorted array and create FieldOption objects
    const allFields: FieldOption[] = Array.from(fieldSet)
      .sort()
      .slice(0, MAX_AVAILABLE_FIELDS)
      .map((value) => ({
        value,
        label: generateLabel(value),
      }));

    // Footer badge fields: short text fields suitable for badges
    const footerBadgeFields: FieldOption[] = [
      ...allFields.filter((f) =>
        // Prefer known short fields
        f.value.includes("Short") ||
        f.value.includes("short") ||
        f.value === "year" ||
        f.value === "categoryShort" ||
        // Include platform-related fields
        f.value.startsWith("platform.")
      ),
      // Add "None" option
      { value: "none", label: "None" },
    ];

    // If no specific badge fields found, use all simple string fields
    if (footerBadgeFields.length <= 1) {
      footerBadgeFields.unshift(
        ...allFields.filter((f) => !f.value.includes("."))
      );
    }

    // Subtitle fields: date/year fields or status fields
    const subtitleFields: FieldOption[] = [
      ...allFields.filter((f) =>
        f.value === "year" ||
        f.value === "playedSince" ||
        f.value === "status" ||
        f.value.toLowerCase().includes("date") ||
        f.value.toLowerCase().includes("year")
      ),
      { value: "none", label: "None" },
    ];

    // If no specific subtitle fields found, use year-like or status fields
    if (subtitleFields.length <= 1) {
      subtitleFields.unshift(
        ...allFields.filter((f) =>
          f.value === "year" ||
          f.value.toLowerCase().includes("status")
        )
      );
    }

    // Sort fields: numeric and common sort candidates
    // Include title, year, platform, category, rating, and any numeric fields
    const sortFields: FieldOption[] = [
      { value: "order", label: "Order/Rank" },
      ...allFields.filter((f) =>
        f.value === "myRank" ||
        f.value === "title" ||
        f.value === "year" ||
        f.value === "playedSince" ||
        f.value === "categoryTitle" ||
        f.value === "categoryShort" ||
        f.value.includes("rating") ||
        f.value.includes("score") ||
        // Platform fields
        f.value.startsWith("platform.") ||
        // Any numeric-looking field
        f.value.includes("count") ||
        f.value.includes("rank") ||
        f.value.includes("order")
      ),
    ];

    // Group by fields: categorical fields
    const groupByFields: FieldOption[] = [
      { value: "none", label: "None" },
      ...allFields.filter((f) =>
        f.value === "categoryTitle" ||
        f.value === "year" ||
        f.value.toLowerCase().includes("genre") ||
        f.value.toLowerCase().includes("category") ||
        f.value.toLowerCase().includes("type")
      ),
    ];

    // Top badge fields: numeric or short text fields suitable for corner badges
    // Only include fields that actually exist in the collection (except "order" which is always available)
    const topBadgeFields: FieldOption[] = [
      { value: "order", label: "Order/Rank" },
      ...allFields.filter((f) =>
        TOP_BADGE_FIELD_NAMES.has(f.value) ||
        TOP_BADGE_FIELD_KEYWORDS.some((keyword) => f.value.toLowerCase().includes(keyword))
      ),
      { value: "none", label: "None" },
    ];

    return {
      /** All discovered fields */
      allFields,
      /** Fields suitable for footer badges */
      footerBadgeFields,
      /** Fields suitable for subtitles */
      subtitleFields,
      /** Fields suitable for sorting */
      sortFields,
      /** Fields suitable for grouping */
      groupByFields,
      /** Fields suitable for top corner badge */
      topBadgeFields,
    };
  }, [cards]);
}
