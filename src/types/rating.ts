/**
 * Rating type definitions for the v2 schema.
 *
 * Supports both simple numeric ratings and structured ratings with source metadata.
 */

/**
 * Structured rating with source metadata.
 *
 * Provides detailed rating information including the source and sample size.
 */
export interface RatingValue {
  /** The rating score */
  score: number;

  /** Maximum possible score (default: 5) */
  max?: number;

  /** Number of ratings/reviews this score is based on */
  sourceCount?: number;

  /** Source of the rating (e.g., "Wikipedia", "MobyGames") */
  source?: string;

  /** URL to the rating source page */
  sourceUrl?: string;
}

/**
 * Rating type - either a simple number or structured RatingValue.
 */
export type Rating = number | RatingValue;

/**
 * Type guard to check if a rating is a structured RatingValue.
 *
 * Accepts `unknown` because rating values originate from untrusted collection
 * data: a `null`, a wrong-typed value, or an object with a non-numeric `score`
 * must be rejected here rather than crashing a downstream `"score" in null`
 * check or a `.toFixed()` call.
 */
export function isStructuredRating(rating: unknown): rating is RatingValue {
  return (
    typeof rating === "object" &&
    rating !== null &&
    "score" in rating &&
    typeof (rating as { score: unknown }).score === "number"
  );
}

/**
 * Normalise any rating to a RatingValue.
 *
 * @param rating - Simple number or RatingValue
 * @param defaultMax - Default max value for simple numbers (default: 5)
 * @returns Normalised RatingValue
 */
export function normaliseRating(rating: Rating, defaultMax = 5): RatingValue {
  if (isStructuredRating(rating)) {
    return {
      ...rating,
      max: rating.max ?? defaultMax,
    };
  }
  // Simple numeric rating for valid data, but an untrusted collection can put
  // any JSON value here, so coerce defensively: a non-finite or non-numeric
  // value yields a usable RatingValue instead of a NaN/crash downstream.
  const raw: unknown = rating;
  const score = typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
  return {
    score,
    max: defaultMax,
  };
}

/**
 * Format a rating for display.
 *
 * @param rating - Rating to format
 * @param precision - Decimal places (default: 1)
 * @returns Formatted string (e.g., "4.5/5")
 */
export function formatRating(rating: Rating, precision = 1): string {
  const normalised = normaliseRating(rating);
  const score = normalised.score.toFixed(precision);
  const max = normalised.max ?? 5;
  return `${score}/${String(max)}`;
}

/**
 * Convert rating to a percentage (0-100).
 *
 * @param rating - Rating to convert
 * @returns Percentage value
 */
export function ratingToPercentage(rating: Rating): number {
  const normalised = normaliseRating(rating);
  const max = normalised.max ?? 5;
  if (max === 0) return 0;
  return (normalised.score / max) * 100;
}
