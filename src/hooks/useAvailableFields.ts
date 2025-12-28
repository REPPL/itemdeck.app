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
  prefix: string = "",
  maxDepth: number = 2,
  currentDepth: number = 0
): string[] {
  if (currentDepth >= maxDepth) return [];

  const fields: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    // Skip internal/private fields
    if (key.startsWith("_")) continue;

    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (isDisplayableValue(value)) {
      fields.push(fieldPath);
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      // Recurse into nested objects
      fields.push(...extractFields(value as Record<string, unknown>, fieldPath, maxDepth, currentDepth + 1));
    } else if (Array.isArray(value) && value.length > 0) {
      // Check first element of arrays
      const first = value[0];
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
      const fields = extractFields(card as Record<string, unknown>);
      for (const field of fields) {
        fieldSet.add(field);
      }
    }

    // Convert to sorted array and create FieldOption objects
    const allFields: FieldOption[] = Array.from(fieldSet)
      .sort()
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
    const sortFields: FieldOption[] = [
      { value: "order", label: "Order/Rank" },
      ...allFields.filter((f) =>
        f.value === "myRank" ||
        f.value === "title" ||
        f.value === "year" ||
        f.value === "playedSince" ||
        f.value.includes("rating")
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
    const topBadgeFields: FieldOption[] = [
      { value: "order", label: "Order/Rank" },
      { value: "myRank", label: "My Rank" },
      ...allFields.filter((f) =>
        f.value === "myVerdict" ||
        f.value.toLowerCase().includes("verdict") ||
        f.value.toLowerCase().includes("rating") ||
        f.value.toLowerCase().includes("score")
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
