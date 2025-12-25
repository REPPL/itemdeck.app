/**
 * Collection statistics computation.
 *
 * Computes various statistics from collection data including
 * item counts, numeric field aggregations, and categorical distributions.
 */

import type { DisplayCard } from "@/hooks/useCollection";

/**
 * Numeric field statistics.
 */
export interface NumericFieldStats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

/**
 * Collection statistics.
 */
export interface CollectionStats {
  /** Total number of items */
  totalItems: number;
  /** Statistics for numeric fields */
  numericFields: Map<string, NumericFieldStats>;
  /** Distribution of values for categorical fields */
  categoricalDistribution: Map<string, Map<string, number>>;
  /** Year range (if year field exists) */
  yearRange?: { min: number; max: number };
  /** Unique platform count (if platform field exists) */
  platformCount?: number;
}

/**
 * Extract numeric value from a field.
 */
function extractNumeric(value: unknown): number | null {
  if (typeof value === "number" && !isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  return null;
}

/**
 * Extract string value from a field.
 */
function extractString(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

/**
 * Compute collection statistics from display cards.
 *
 * @param items - Array of display cards to analyse
 * @param numericFieldNames - Field names to compute numeric stats for
 * @param categoricalFieldNames - Field names to compute distributions for
 * @returns Collection statistics
 */
export function computeCollectionStats(
  items: DisplayCard[],
  numericFieldNames: string[] = ["year", "rating", "score"],
  categoricalFieldNames: string[] = ["platform", "genre", "verdict"]
): CollectionStats {
  const stats: CollectionStats = {
    totalItems: items.length,
    numericFields: new Map(),
    categoricalDistribution: new Map(),
  };

  if (items.length === 0) {
    return stats;
  }

  // Initialise accumulators for numeric fields
  const numericAccumulators = new Map<string, { values: number[] }>();

  numericFieldNames.forEach((field) => {
    numericAccumulators.set(field, { values: [] });
  });

  // Initialise accumulators for categorical fields
  const categoricalAccumulators = new Map<string, Map<string, number>>();

  categoricalFieldNames.forEach((field) => {
    categoricalAccumulators.set(field, new Map());
  });

  // Process each item
  for (const item of items) {
    // Process numeric fields
    for (const field of numericFieldNames) {
      const value = item[field as keyof DisplayCard];
      const numeric = extractNumeric(value);
      if (numeric !== null) {
        const acc = numericAccumulators.get(field);
        if (acc) {
          acc.values.push(numeric);
        }
      }
    }

    // Process categorical fields
    for (const field of categoricalFieldNames) {
      const value = item[field as keyof DisplayCard];
      const str = extractString(value);
      if (str !== null) {
        const acc = categoricalAccumulators.get(field);
        if (acc) {
          acc.set(str, (acc.get(str) ?? 0) + 1);
        }
      }
    }
  }

  // Compute final numeric statistics
  for (const [field, acc] of numericAccumulators) {
    if (acc.values.length > 0) {
      const values = acc.values;
      const sum = values.reduce((a, b) => a + b, 0);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const avg = sum / values.length;

      stats.numericFields.set(field, {
        min,
        max,
        avg,
        count: values.length,
      });

      // Special handling for year field
      if (field === "year") {
        stats.yearRange = { min, max };
      }
    }
  }

  // Copy categorical distributions
  for (const [field, counts] of categoricalAccumulators) {
    if (counts.size > 0) {
      stats.categoricalDistribution.set(field, counts);

      // Special handling for platform field
      if (field === "platform") {
        stats.platformCount = counts.size;
      }
    }
  }

  return stats;
}

/**
 * Format statistics for display.
 *
 * @param stats - Collection statistics
 * @returns Formatted string summary
 */
export function formatStatsSummary(stats: CollectionStats): string {
  const parts: string[] = [`${String(stats.totalItems)} items`];

  if (stats.yearRange) {
    if (stats.yearRange.min === stats.yearRange.max) {
      parts.push(`Year: ${String(stats.yearRange.min)}`);
    } else {
      parts.push(`Years: ${String(stats.yearRange.min)}-${String(stats.yearRange.max)}`);
    }
  }

  if (stats.platformCount !== undefined && stats.platformCount > 0) {
    parts.push(`Platforms: ${String(stats.platformCount)}`);
  }

  const ratingStats = stats.numericFields.get("rating");
  if (ratingStats) {
    parts.push(`Avg Rating: ${ratingStats.avg.toFixed(1)}`);
  }

  const scoreStats = stats.numericFields.get("score");
  if (scoreStats) {
    parts.push(`Avg Score: ${scoreStats.avg.toFixed(1)}`);
  }

  return parts.join(" | ");
}
