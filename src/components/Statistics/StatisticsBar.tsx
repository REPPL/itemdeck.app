/**
 * Statistics bar component with expandable dashboard.
 *
 * Displays a compact summary of collection statistics above the card grid,
 * with an option to expand into a detailed dashboard with distribution charts.
 *
 * @see F-062: Collection Statistics (base feature)
 * @see F-067: Statistics Dashboard (expandable charts)
 */

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCollectionData } from "@/context/CollectionDataContext";
import { computeCollectionStats, formatStatsSummary } from "@/utils/collectionStats";
import { BarChart, type BarChartItem } from "./BarChart";
import { CloseIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/Icons";
import styles from "./Statistics.module.css";

interface StatisticsBarProps {
  /** Callback when the bar is dismissed */
  onDismiss: () => void;
}

/**
 * Compute decade distribution from year data.
 * Handles years as strings (e.g., "1985") or numbers.
 */
function computeDecadeDistribution(cards: { year?: string | number }[]): BarChartItem[] {
  const decades = new Map<string, number>();

  for (const card of cards) {
    const yearValue = card.year;
    if (yearValue === undefined) continue;

    // Parse year - handle both string and number formats
    const yearNum = typeof yearValue === "string" ? parseInt(yearValue, 10) : yearValue;

    if (typeof yearNum === "number" && !isNaN(yearNum) && yearNum > 1900 && yearNum < 2100) {
      const decade = Math.floor(yearNum / 10) * 10;
      const label = `${String(decade)}s`;
      decades.set(label, (decades.get(label) ?? 0) + 1);
    }
  }

  return Array.from(decades.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Compute platform/category distribution from card data.
 */
function computeCategoryDistribution(cards: { categoryTitle?: string }[]): BarChartItem[] {
  const categories = new Map<string, number>();

  for (const card of cards) {
    const category = card.categoryTitle;
    if (typeof category === "string" && category.trim() !== "") {
      categories.set(category, (categories.get(category) ?? 0) + 1);
    }
  }

  return Array.from(categories.entries())
    .map(([label, value]) => ({ label, value }));
}

/**
 * Statistics bar showing collection summary with expandable dashboard.
 */
export function StatisticsBar({ onDismiss }: StatisticsBarProps) {
  const { cards, isLoading, error } = useCollectionData();
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    return computeCollectionStats(cards);
  }, [cards]);

  const summary = useMemo(() => {
    return formatStatsSummary(stats);
  }, [stats]);

  const decadeDistribution = useMemo(() => {
    return computeDecadeDistribution(cards as { year?: string | number }[]);
  }, [cards]);

  const categoryDistribution = useMemo(() => {
    return computeCategoryDistribution(cards as { categoryTitle?: string }[]);
  }, [cards]);

  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // Don't render if loading, error, or no cards
  if (isLoading || error || cards.length === 0) {
    return null;
  }

  const hasDistributions = decadeDistribution.length > 0 || categoryDistribution.length > 0;

  return (
    <div className={styles.statisticsContainer}>
      {/* Compact bar */}
      <div className={styles.statisticsBar} role="status" aria-live="polite">
        <span className={styles.statsIcon} aria-hidden="true">
          📊
        </span>
        <span className={styles.statsSummary}>{summary}</span>

        {/* Expand/collapse toggle */}
        {hasDistributions && (
          <button
            type="button"
            className={styles.expandButton}
            onClick={handleToggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse statistics" : "Expand statistics"}
          >
            {expanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
          </button>
        )}

        <button
          type="button"
          className={styles.dismissButton}
          onClick={onDismiss}
          aria-label="Dismiss statistics bar"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      {/* Expanded dashboard */}
      <AnimatePresence>
        {expanded && hasDistributions && (
          <motion.div
            className={styles.dashboard}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.dashboardContent}>
              {/* Category/Platform distribution */}
              {categoryDistribution.length > 0 && (
                <BarChart
                  title="Platform Distribution"
                  items={categoryDistribution}
                  maxBars={6}
                  showOther={true}
                />
              )}

              {/* Year/Decade distribution */}
              {decadeDistribution.length > 0 && (
                <BarChart
                  title="Year Distribution"
                  items={decadeDistribution}
                  maxBars={8}
                  showOther={false}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
