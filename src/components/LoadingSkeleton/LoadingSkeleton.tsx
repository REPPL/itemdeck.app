/**
 * Loading skeleton component for placeholder content.
 *
 * Displays animated placeholder shapes while content is loading.
 */

import styles from "./LoadingSkeleton.module.css";

interface LoadingSkeletonProps {
  /** Number of skeleton cards to display */
  count?: number;
}

/**
 * Single skeleton card placeholder.
 */
function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.image} />
      <div className={styles.content}>
        <div className={styles.title} />
        <div className={styles.text} />
        <div className={styles.textShort} />
      </div>
    </div>
  );
}

/**
 * Loading skeleton grid.
 *
 * Displays placeholder cards while the actual content is loading.
 * Uses CSS animation for a subtle shimmer effect.
 *
 * @example
 * ```tsx
 * {isLoading ? <LoadingSkeleton count={6} /> : <CardGrid cards={cards} />}
 * ```
 */
export function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps) {
  return (
    <div
      className={styles.grid}
      role="status"
      aria-label="Loading cards"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={`skeleton-${String(i)}`} />
      ))}
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}
