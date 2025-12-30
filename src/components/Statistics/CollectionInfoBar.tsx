/**
 * Collection info bar component.
 *
 * Displays collection name, description, and statistics in a single
 * dismissable bar above the card grid. Combines CollectionHeader and
 * StatisticsBar functionality.
 *
 * @see F-062: Collection Statistics
 * @see F-067: Statistics Dashboard
 */

import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useSourceStore } from "@/stores/sourceStore";
import { useSettingsStore, type LayoutType } from "@/stores/settingsStore";
import { computeCollectionStats, formatStatsSummary } from "@/utils/collectionStats";
import { BarChart, type BarChartItem } from "./BarChart";
import { CloseIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/Icons";
import styles from "./CollectionInfoBar.module.css";

/**
 * Get display label for layout type.
 */
function getLayoutLabel(layout: LayoutType): string {
  const labels: Record<LayoutType, string> = {
    grid: "Grid",
    list: "List",
    compact: "Compact",
    fit: "Fit",
  };
  return labels[layout];
}

interface CollectionInfoBarProps {
  /** Callback when the bar is dismissed */
  onDismiss: () => void;
}

/**
 * Compute decade distribution from year data.
 */
function computeDecadeDistribution(cards: { year?: string | number }[]): BarChartItem[] {
  const decades = new Map<string, number>();

  for (const card of cards) {
    const yearValue = card.year;
    if (yearValue === undefined) continue;

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
 * Unified collection info bar showing name, description, and statistics.
 */
export function CollectionInfoBar({ onDismiss }: CollectionInfoBarProps) {
  const { cards, collection, isLoading, error } = useCollectionData();
  const [expanded, setExpanded] = useState(false);

  // Get active source info as fallback
  const activeSourceId = useSourceStore((s) => s.activeSourceId);
  const sources = useSourceStore((s) => s.sources);

  // Get current layout
  const layout = useSettingsStore((s) => s.layout);
  const layoutLabel = getLayoutLabel(layout);

  const sourceInfo = useMemo(() => {
    const source = sources.find((s) => s.id === activeSourceId);
    return {
      name: source?.name ?? source?.mpmFolder ?? null,
    };
  }, [sources, activeSourceId]);

  // Collection name and description
  const displayName = collection?.meta?.name ?? sourceInfo.name;
  const displayDescription = collection?.meta?.description ?? null;

  // Statistics
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

  // Don't render if loading, error, or no content
  if (isLoading || error || (!displayName && cards.length === 0)) {
    return null;
  }

  const hasDistributions = decadeDistribution.length > 0 || categoryDistribution.length > 0;

  return (
    <div className={styles.container}>
      {/* Main bar */}
      <div className={styles.bar} role="banner" aria-label="Collection information">
        {/* Left: Name and description */}
        <div className={styles.info}>
          {displayName && <h1 className={styles.name}>{displayName}</h1>}
          {displayDescription && (
            <p className={styles.description}>{displayDescription}</p>
          )}
        </div>

        {/* Right: View mode, statistics, and controls */}
        <div className={styles.statsArea}>
          <span className={styles.viewMode}>{layoutLabel}</span>
          {summary && (
            <span className={styles.summary}>{summary}</span>
          )}

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
            aria-label="Dismiss collection info"
          >
            <CloseIcon size={16} />
          </button>
        </div>
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

export default CollectionInfoBar;
