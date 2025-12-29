/**
 * Cache indicator component.
 *
 * Shows a visual indicator for cache status:
 * - Fresh (green dot): Cache is less than 1 hour old
 * - Stale (yellow dot): Cache is 1-24 hours old
 * - None (grey dot): No cache available
 *
 * Includes a tooltip showing when data was cached.
 */

import { useState } from "react";
import { useCacheState } from "@/hooks/useCacheState";
import styles from "./CacheIndicator.module.css";

/**
 * Props for CacheIndicator component.
 */
export interface CacheIndicatorProps {
  /** Source ID to check cache status for */
  sourceId: string;

  /** Size of the indicator */
  size?: "small" | "medium";

  /** Additional CSS class */
  className?: string;
}

/**
 * Cache indicator component showing cache freshness status.
 *
 * @example
 * ```tsx
 * <CacheIndicator sourceId="src_12345" />
 * ```
 */
export function CacheIndicator({
  sourceId,
  size = "medium",
  className,
}: CacheIndicatorProps) {
  const cacheState = useCacheState(sourceId);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  if (cacheState.isLoading) {
    return null;
  }

  const statusLabels = {
    fresh: "Fresh",
    stale: "Stale",
    none: "No cache",
  };

  const statusDescriptions = {
    fresh: cacheState.ageDescription
      ? `Cached ${cacheState.ageDescription}`
      : "Cache is up to date",
    stale: cacheState.ageDescription
      ? `Cached ${cacheState.ageDescription}`
      : "Cache may be outdated",
    none: "No cached data",
  };

  const handleMouseEnter = () => {
    setIsTooltipVisible(true);
  };

  const handleMouseLeave = () => {
    setIsTooltipVisible(false);
  };

  const handleFocus = () => {
    setIsTooltipVisible(true);
  };

  const handleBlur = () => {
    setIsTooltipVisible(false);
  };

  const classNames = [
    styles.indicator,
    styles[cacheState.status],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={styles.container}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="status"
      aria-label={`Cache status: ${statusLabels[cacheState.status]}. ${statusDescriptions[cacheState.status]}`}
    >
      <span className={classNames} aria-hidden="true" />

      {isTooltipVisible && (
        <span className={styles.tooltip} role="tooltip">
          <span className={styles.tooltipTitle}>
            {statusLabels[cacheState.status]}
          </span>
          <span className={styles.tooltipDescription}>
            {statusDescriptions[cacheState.status]}
          </span>
        </span>
      )}
    </span>
  );
}

export default CacheIndicator;
