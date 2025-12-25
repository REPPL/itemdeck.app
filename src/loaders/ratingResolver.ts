/**
 * Rating resolver for v1/v2 schema format.
 *
 * Handles normalisation and formatting of ratings,
 * supporting both simple numbers (v1) and structured ratings (v2).
 */

import type { Rating } from "@/types/rating";
import {
  isStructuredRating,
  normaliseRating,
  formatRating,
  ratingToPercentage,
} from "@/types/rating";

// Re-export helpers for convenience
export { isStructuredRating, normaliseRating, formatRating, ratingToPercentage };

/**
 * Get rating score from a Rating value.
 *
 * @param rating - Rating to extract score from
 * @returns Score value or undefined
 */
export function getRatingScore(rating: Rating | undefined): number | undefined {
  if (rating === undefined) {
    return undefined;
  }

  if (typeof rating === "number") {
    return rating;
  }

  return rating.score;
}

/**
 * Get rating max value from a Rating.
 *
 * @param rating - Rating to extract max from
 * @param defaultMax - Default max value (default: 5)
 * @returns Max value
 */
export function getRatingMax(rating: Rating | undefined, defaultMax = 5): number {
  if (rating === undefined || typeof rating === "number") {
    return defaultMax;
  }

  return rating.max ?? defaultMax;
}

/**
 * Get rating source metadata.
 *
 * @param rating - Rating to extract source from
 * @returns Source metadata or undefined
 */
export function getRatingSource(
  rating: Rating | undefined
): { source?: string; sourceUrl?: string; sourceCount?: number } | undefined {
  if (rating === undefined || typeof rating === "number") {
    return undefined;
  }

  return {
    source: rating.source,
    sourceUrl: rating.sourceUrl,
    sourceCount: rating.sourceCount,
  };
}

/**
 * Compare two ratings for sorting.
 *
 * @param a - First rating
 * @param b - Second rating
 * @param descending - Sort in descending order (default: true)
 * @returns Comparison result (-1, 0, 1)
 */
export function compareRatings(
  a: Rating | undefined,
  b: Rating | undefined,
  descending = true
): number {
  const scoreA = getRatingScore(a) ?? -Infinity;
  const scoreB = getRatingScore(b) ?? -Infinity;

  if (descending) {
    return scoreB - scoreA;
  }
  return scoreA - scoreB;
}

/**
 * Display rating with optional source attribution.
 *
 * @param rating - Rating to display
 * @param options - Display options
 * @returns Formatted display string
 */
export function displayRating(
  rating: Rating | undefined,
  options: {
    showMax?: boolean;
    showSource?: boolean;
    precision?: number;
  } = {}
): string {
  const { showMax = true, showSource = false, precision = 1 } = options;

  if (rating === undefined) {
    return "";
  }

  const normalised = normaliseRating(rating);
  let display = formatRating(normalised, precision);

  if (showMax && normalised.max !== 5) {
    display = `${normalised.score.toFixed(precision)}/${String(normalised.max ?? 5)}`;
  }

  if (showSource && normalised.source) {
    display += ` (${normalised.source})`;
  }

  return display;
}
