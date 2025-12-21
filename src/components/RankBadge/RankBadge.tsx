/**
 * Rank badge component for displaying card rankings.
 *
 * Shows a prominent badge in the top-left corner with special styling
 * for top 3 positions (gold, silver, bronze) and a crown icon for #1.
 */

import styles from "./RankBadge.module.css";

/**
 * Crown icon SVG for rank #1.
 */
function CrownIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={styles.crownIcon}
      aria-hidden="true"
    >
      <path d="M12 1L15.5 8L23 9.5L17.5 15L19 23L12 19L5 23L6.5 15L1 9.5L8.5 8L12 1Z" />
    </svg>
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
  const getVariant = (): string => {
    if (rank === null) return "unranked";
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "default";
  };

  const variant = getVariant();
  const showCrown = rank === 1;

  const className = [
    styles.badge,
    styles[variant],
    styles[size],
  ]
    .filter(Boolean)
    .join(" ");

  // Display content
  const content = rank !== null ? (
    <>
      {showCrown && <CrownIcon />}
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
      aria-label={rank !== null ? `Rank ${String(rank)}` : "Unranked"}
    >
      {content}
    </div>
  );
}

export default RankBadge;
