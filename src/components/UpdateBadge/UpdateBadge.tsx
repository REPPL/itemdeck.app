/**
 * Update badge component.
 *
 * Shows a small blue dot indicator when an update is available
 * for a remote source.
 */

import { useState } from "react";
import { useUpdateChecker } from "@/hooks/useUpdateChecker";
import styles from "./UpdateBadge.module.css";

/**
 * Props for UpdateBadge component.
 */
export interface UpdateBadgeProps {
  /** Source ID to check for updates */
  sourceId: string;

  /** Callback when badge is clicked */
  onClick?: () => void;

  /** Size of the badge */
  size?: "small" | "medium";

  /** Additional CSS class */
  className?: string;
}

/**
 * Update badge component showing when an update is available.
 *
 * Shows a small blue dot with tooltip indicating an update is available.
 * Click handler can be used to trigger a refresh.
 *
 * @example
 * ```tsx
 * <UpdateBadge
 *   sourceId="src_12345"
 *   onClick={() => refreshCollection()}
 * />
 * ```
 */
export function UpdateBadge({
  sourceId,
  onClick,
  size = "medium",
  className,
}: UpdateBadgeProps) {
  const { hasUpdate, isChecking, lastChecked, checkNow } = useUpdateChecker(sourceId);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Don't render if no update available and not checking
  if (!hasUpdate && !isChecking) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    void checkNow();
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

  const formatLastChecked = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return "just now";
    }
    if (diffMins < 60) {
      return `${String(diffMins)} min ago`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return `${String(diffHours)} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    return date.toLocaleDateString();
  };

  const classNames = [
    styles.badge,
    styles[size],
    isChecking ? styles.checking : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isChecking) {
    return (
      <span
        className={classNames}
        role="status"
        aria-label="Checking for updates"
      />
    );
  }

  return (
    <button
      type="button"
      className={styles.container}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      aria-label="Update available - click to refresh"
    >
      <span className={classNames} aria-hidden="true" />

      {isTooltipVisible && (
        <span className={styles.tooltip} role="tooltip">
          <span className={styles.tooltipTitle}>Update available</span>
          <span className={styles.tooltipDescription}>
            Click to refresh collection
          </span>
          {lastChecked && (
            <span className={styles.tooltipMeta}>
              Checked {formatLastChecked(lastChecked)}
            </span>
          )}
          <button
            type="button"
            className={styles.tooltipButton}
            onClick={handleCheckClick}
          >
            Check again
          </button>
        </span>
      )}
    </button>
  );
}

export default UpdateBadge;
