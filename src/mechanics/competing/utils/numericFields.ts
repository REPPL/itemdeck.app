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
  /^rank$/i, // generic rank field (prefer specific variants like myRank)
];

/**
 * Fields where LOWER values are better (ranks, orders, positions).
 * These will have higherIsBetter = false.
 */
const LOWER_IS_BETTER_PATTERNS = [
  /rank/i,
  /order/i,
  /place/i,
  /position/i,
];

/**
 * Minimum percentage of cards that must have valid values for a field.
 */
const MIN_VALID_PERCENTAGE = 0.8;

/**
 * Convert a camelCase or snake_case field key to a human-readable label.
 */
export function humaniseFieldName(key: string): string {
  return key
    // Insert space before capitals in camelCase
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, " ")
    // Capitalise first letter of each word
    .replace(/\b\w/g, (char) => char.toUpperCase())
    // Clean up multiple spaces
    .replace(/\s+/g, " ")
    .trim();
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

  if (typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)) {
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
export function detectNumericFields(cards: CardData[]): NumericFieldInfo[] {
  if (cards.length === 0) {
    return [];
  }

  // Collect all unique field keys from all cards
  const allKeys = new Set<string>();
  for (const card of cards) {
    for (const key of Object.keys(card)) {
      allKeys.add(key);
    }
  }

  const numericFields: NumericFieldInfo[] = [];

  for (const key of allKeys) {
    // Skip excluded fields
    if (shouldExcludeField(key)) {
      continue;
    }

    // Collect numeric values for this field
    const values: number[] = [];
    for (const card of cards) {
      const value = getCardValue(card, key);
      if (value !== null) {
        values.push(value);
      }
    }

    // Check if enough cards have valid values
    const validPercentage = values.length / cards.length;
    if (validPercentage < MIN_VALID_PERCENTAGE) {
      continue;
    }

    // Check if values have any variance (not all the same)
    const uniqueValues = new Set(values);
    if (uniqueValues.size <= 1) {
      continue;
    }

    // Calculate min, max, and variance
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Determine if higher or lower is better for this field
    const higherIsBetter = !isLowerBetterField(key);

    numericFields.push({
      key,
      label: humaniseFieldName(key),
      min,
      max,
      higherIsBetter,
    });
  }

  // Sort by variance (range) to put more interesting stats first
  numericFields.sort((a, b) => {
    const rangeA = a.max - a.min;
    const rangeB = b.max - b.min;
    return rangeB - rangeA;
  });

  return numericFields;
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
