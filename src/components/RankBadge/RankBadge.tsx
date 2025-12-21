/**
 * Rank badge component for displaying card rankings.
 *
 * Shows a prominent badge in the top-left corner with star indicators:
 * - Rank 1: ★★★ (three stars)
 * - Rank 2: ★★ (two stars)
 * - Rank 3: ★ (one star)
 * - Rank 4+: no stars, just number
 * - Unranked: placeholder text
 */

import styles from "./RankBadge.module.css";

/**
 * Star icon component.
 */
function StarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={styles.starIcon}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/**
 * Render stars based on rank.
 */
function RankStars({ rank }: { rank: number }) {
  // Rank 1 = 3 stars, Rank 2 = 2 stars, Rank 3 = 1 star
  const starCount = Math.max(0, 4 - rank);
  if (starCount === 0) return null;

  return (
    <span className={styles.stars} aria-hidden="true">
      {Array.from({ length: starCount }, (_, i) => (
        <StarIcon key={i} />
      ))}
    </span>
  );
}

interface RankBadgeProps {
  /** Rank number (1-based) or null for unranked */
  rank: number | null;

  /** Placeholder text for unranked items */
  placeholderText?: string;

  /** Size variant */
  size?: "small" | "medium" | "large";
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.).
 */
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0] ?? "th";
}

/**
 * Rank badge component.
 *
 * Features:
 * - Gold background + crown for rank #1
 * - Silver background for rank #2
 * - Bronze background for rank #3
 * - Neutral background for rank 4+
 * - Configurable placeholder for unranked items
 *
 * @example
 * ```tsx
 * <RankBadge rank={1} />
 * <RankBadge rank={null} placeholderText="Unranked" />
 * ```
 */
export function RankBadge({
  rank,
  placeholderText = "The one that got away!",
  size = "medium",
}: RankBadgeProps) {
  // Determine variant based on rank
  // Treat null, 0, and negative values as unranked
  const getVariant = (): string => {
    if (rank === null || rank <= 0) return "unranked";
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "default";
  };

  const variant = getVariant();

  const className = [
    styles.badge,
    styles[variant],
    styles[size],
  ]
    .filter(Boolean)
    .join(" ");

  // Display content: stars for ranks 1-3, number + ordinal for all ranked
  // Use explicit check for valid positive rank to avoid issues with 0 or falsy values
  const isValidRank = rank !== null && rank > 0;

  const content = isValidRank ? (
    <>
      <RankStars rank={rank} />
      <span className={styles.rankNumber}>{rank}</span>
      <span className={styles.ordinal}>{getOrdinalSuffix(rank)}</span>
    </>
  ) : (
    <span className={styles.placeholder}>{placeholderText}</span>
  );

  return (
    <div
      className={className}
      role="status"
      aria-label={isValidRank ? `Rank ${String(rank)}` : "Unranked"}
    >
      {content}
    </div>
  );
}

export default RankBadge;
