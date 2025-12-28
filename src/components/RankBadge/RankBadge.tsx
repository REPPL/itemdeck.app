/**
 * Rank badge component for displaying card rankings.
 *
 * Shows a prominent badge in the top-left corner with star indicators:
 * - Rank 1: 1st ★★★ (three filled stars)
 * - Rank 2: 2nd ★★☆ (two filled, one empty)
 * - Rank 3: 3rd ★☆☆ (one filled, two empty)
 * - Rank 4+: no stars, just number
 * - Unranked: placeholder text
 */

import { useUILabels } from "@/context/CollectionUIContext";
import styles from "./RankBadge.module.css";

/**
 * Filled star icon component.
 */
function FilledStarIcon() {
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
 * Empty star icon component.
 */
function EmptyStarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={styles.starIcon}
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

/**
 * Render stars based on rank.
 * All top 3 get 3 stars total, with filled/empty based on rank:
 * - Rank 1: ★★★ (3 filled)
 * - Rank 2: ★★☆ (2 filled, 1 empty)
 * - Rank 3: ★☆☆ (1 filled, 2 empty)
 */
function RankStars({ rank }: { rank: number }) {
  // Only show stars for top 3
  if (rank > 3) return null;

  // Calculate filled and empty stars (always 3 total)
  const filledCount = 4 - rank; // Rank 1 = 3, Rank 2 = 2, Rank 3 = 1
  const emptyCount = 3 - filledCount;

  return (
    <span className={styles.stars} aria-hidden="true">
      {Array.from({ length: filledCount }, (_, i) => (
        <FilledStarIcon key={`filled-${String(i)}`} />
      ))}
      {Array.from({ length: emptyCount }, (_, i) => (
        <EmptyStarIcon key={`empty-${String(i)}`} />
      ))}
    </span>
  );
}

interface RankBadgeProps {
  /** Rank number (1-based) or null for unranked */
  rank: number | null;

  /** Placeholder text for unranked items (overrides collection default) */
  placeholderText?: string;

  /** Size variant */
  size?: "small" | "medium" | "large";

  /** Whether to show ordinal suffix (1st, 2nd, 3rd) and star icons. Default: true */
  showOrdinal?: boolean;
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
  placeholderText,
  size = "medium",
  showOrdinal = true,
}: RankBadgeProps) {
  // Get default from collection context, allow prop override
  const uiLabels = useUILabels();
  const displayPlaceholder = placeholderText ?? uiLabels.rankPlaceholder;
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

  // Display content: number + ordinal + stars for ranks 1-3
  // Use explicit check for valid positive rank to avoid issues with 0 or falsy values
  const isValidRank = rank !== null && rank > 0;

  // Order: "1st ★★★" (text before stars) - only if showOrdinal is true
  const content = isValidRank ? (
    <>
      <span className={styles.rankNumber}>{rank}</span>
      {showOrdinal && (
        <>
          <span className={styles.ordinal}>{getOrdinalSuffix(rank)}</span>
          <RankStars rank={rank} />
        </>
      )}
    </>
  ) : (
    <span className={styles.placeholder}>{displayPlaceholder}</span>
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
