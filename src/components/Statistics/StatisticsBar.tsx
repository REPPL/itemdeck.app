/**
 * Statistics bar component.
 *
 * Displays a compact summary of collection statistics above the card grid.
 */

import { useMemo } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { computeCollectionStats, formatStatsSummary } from "@/utils/collectionStats";
import { CloseIcon } from "@/components/Icons";
import styles from "./Statistics.module.css";

interface StatisticsBarProps {
  /** Callback when the bar is dismissed */
  onDismiss: () => void;
}

/**
 * Statistics bar showing collection summary.
 */
export function StatisticsBar({ onDismiss }: StatisticsBarProps) {
  const { cards, isLoading, error } = useCollectionData();

  const stats = useMemo(() => {
    return computeCollectionStats(cards);
  }, [cards]);

  const summary = useMemo(() => {
    return formatStatsSummary(stats);
  }, [stats]);

  // Don't render if loading, error, or no cards
  if (isLoading || error || cards.length === 0) {
    return null;
  }

  return (
    <div className={styles.statisticsBar} role="status" aria-live="polite">
      <span className={styles.statsIcon} aria-hidden="true">
        📊
      </span>
      <span className={styles.statsSummary}>{summary}</span>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={onDismiss}
        aria-label="Dismiss statistics bar"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
}
