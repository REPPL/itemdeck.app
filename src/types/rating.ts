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
 */
export function isStructuredRating(rating: Rating): rating is RatingValue {
  return typeof rating === "object" && rating !== null && "score" in rating;
}

/**
 * Normalise any rating to a RatingValue.
 *
 * @param rating - Simple number or RatingValue
 * @param defaultMax - Default max value for simple numbers (default: 5)
 * @returns Normalised RatingValue
 */
export function normaliseRating(
  rating: Rating,
  defaultMax: number = 5
): RatingValue {
  if (isStructuredRating(rating)) {
    return {
      ...rating,
      max: rating.max ?? defaultMax,
    };
  }
  return {
    score: rating,
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
export function formatRating(rating: Rating, precision: number = 1): string {
  const normalised = normaliseRating(rating);
  const score = normalised.score.toFixed(precision);
  const max = normalised.max ?? 5;
  return `${score}/${max}`;
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
