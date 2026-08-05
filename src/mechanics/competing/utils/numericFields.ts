/**
 * Numeric field detection utilities for Competing mechanic.
 *
 * Detects numeric fields in card data suitable for stat comparison.
 */

import type { CardData, NumericFieldInfo } from "../types";

/**
 * Fields to exclude from stat detection.
 * These are typically IDs, timestamps, or metadata fields.
 */
const EXCLUDED_FIELD_PATTERNS = [
  /^id$/i,
  /^_id$/i,
  /Id$/i, // ends with 'Id' (camelCase IDs like cardId, userId)
  /^created/i,
  /^updated/i,
  /^modified/i,
  /timestamp/i,
  /^_/i, // private/internal fields
  /^index$/i,
  /^sort/i,
  /^position$/i,
  /^order$/i, // generic order field (often just display order, not meaningful stat)
  // Note: 'rank' is NOT excluded - it's a valid stat for comparison
];

/**
 * Fields where LOWER values are better (ranks, orders, positions, years owned).
 * These will have higherIsBetter = false.
 */
const LOWER_IS_BETTER_PATTERNS = [
  /rank/i,
  /order/i,
  /place/i,
  /position/i,
  /^my\s*year$/i, // "myYear", "my year" - year acquired (lower = owned longer)
];

/**
 * Minimum percentage of cards that must have valid values for a field.
 */
const MIN_VALID_PERCENTAGE = 0.8;

/**
 * Maximum number of fields to display.
 * Limited to prevent UI overflow on smaller screens (iPad, etc.).
 */
const MAX_FIELDS_TO_DISPLAY = 5;

/**
 * Convert a camelCase or snake_case field key to a human-readable label.
 */
export function humaniseFieldName(key: string): string {
  return (
    key
      // Insert space before capitals in camelCase
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, " ")
      // Capitalise first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
      // Clean up multiple spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Check if a field key should be excluded from stat detection.
 */
function shouldExcludeField(key: string): boolean {
  return EXCLUDED_FIELD_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Check if a field is a "lower is better" field (ranks, orders, etc.).
 */
function isLowerBetterField(key: string): boolean {
  return LOWER_IS_BETTER_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Try to parse a value as a number.
 * Returns null if the value cannot be parsed.
 */
function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value === "number" &&
    !Number.isNaN(value) &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    // Try parsing as number (handles "1985", "3.5", etc.)
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
    // Try parsing as integer (stricter)
    const intParsed = parseInt(trimmed, 10);
    if (!Number.isNaN(intParsed) && String(intParsed) === trimmed) {
      return intParsed;
    }
  }

  return null;
}

/**
 * Get the numeric value from a card for a specific field.
 */
export function getCardValue(card: CardData, fieldKey: string): number | null {
  const value = card[fieldKey];
  return parseNumericValue(value);
}

/**
 * Detect numeric fields in a collection of cards.
 *
 * @param cards - Array of card data objects
 * @returns Array of detected numeric field information, sorted by variance
 */
/**
 * Per-field running statistics accumulated during detection.
 */
interface FieldStats {
  count: number;
  min: number;
  max: number;
  firstValue: number;
  hasVariance: boolean;
}

export function detectNumericFields(cards: CardData[]): NumericFieldInfo[] {
  if (cards.length === 0) {
    return [];
  }

  // Single pass over each card's own fields, accumulating per-field stats.
  // The previous implementation unioned every field key, then re-scanned every
  // card for each key: with an untrusted collection supplying many uniquely
  // named fields the key set grows with the card count, making that O(keys x
  // cards) — effectively quadratic — and freezing the main thread for seconds
  // on a large hostile collection. Iterating each card's own keys once keeps
  // the work linear in the total number of fields present.
  const stats = new Map<string, FieldStats>();

  for (const card of cards) {
    for (const key of Object.keys(card)) {
      if (shouldExcludeField(key)) {
        continue;
      }

      const value = getCardValue(card, key);
      if (value === null) {
        continue;
      }

      const existing = stats.get(key);
      if (existing === undefined) {
        stats.set(key, {
          count: 1,
          min: value,
          max: value,
          firstValue: value,
          hasVariance: false,
        });
      } else {
        existing.count += 1;
        if (value < existing.min) existing.min = value;
        if (value > existing.max) existing.max = value;
        if (value !== existing.firstValue) existing.hasVariance = true;
      }
    }
  }

  const numericFields: NumericFieldInfo[] = [];

  for (const [key, field] of stats) {
    // Check if enough cards have valid values
    const validPercentage = field.count / cards.length;
    if (validPercentage < MIN_VALID_PERCENTAGE) {
      continue;
    }

    // Skip fields whose values are all identical (not an interesting stat)
    if (!field.hasVariance) {
      continue;
    }

    numericFields.push({
      key,
      label: humaniseFieldName(key),
      min: field.min,
      max: field.max,
      // Determine if higher or lower is better for this field
      higherIsBetter: !isLowerBetterField(key),
    });
  }

  // Sort by variance (range) to put more interesting stats first
  numericFields.sort((a, b) => {
    const rangeA = a.max - a.min;
    const rangeB = b.max - b.min;
    return rangeB - rangeA;
  });

  // Limit to max fields to prevent UI overflow on smaller screens
  return numericFields.slice(0, MAX_FIELDS_TO_DISPLAY);
}

/**
 * Get the relative strength of a value within a field's range.
 * Returns a value between 0 and 1.
 */
export function getRelativeStrength(
  value: number,
  field: NumericFieldInfo
): number {
  const range = field.max - field.min;
  if (range === 0) {
    return 0.5;
  }

  const normalised = (value - field.min) / range;
  return field.higherIsBetter ? normalised : 1 - normalised;
}

/**
 * Compare two values for a given field.
 * Returns 1 if value1 wins, -1 if value2 wins, 0 for tie.
 */
export function compareValues(
  value1: number,
  value2: number,
  field: NumericFieldInfo
): 1 | -1 | 0 {
  if (value1 === value2) {
    return 0;
  }

  if (field.higherIsBetter) {
    return value1 > value2 ? 1 : -1;
  } else {
    return value1 < value2 ? 1 : -1;
  }
}
