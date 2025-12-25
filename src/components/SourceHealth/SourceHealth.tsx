/**
 * Source health status indicator component.
 *
 * Displays visual health status for remote data sources with
 * colour-coded indicators and latency information.
 */

import type { HealthStatus, HealthCheckResult } from "@/services/sourceHealthCheck";
import styles from "./SourceHealth.module.css";

/**
 * Props for the SourceHealthIndicator component.
 */
interface SourceHealthIndicatorProps {
  /** Health status to display */
  status: HealthStatus;
  /** Size variant */
  size?: "small" | "medium" | "large";
  /** Whether to show status label */
  showLabel?: boolean;
}

/**
 * Simple health status dot indicator.
 *
 * @example
 * ```tsx
 * <SourceHealthIndicator status="healthy" />
 * <SourceHealthIndicator status="degraded" showLabel />
 * ```
 */
export function SourceHealthIndicator({
  status,
  size = "medium",
  showLabel = false,
}: SourceHealthIndicatorProps) {
  const statusLabels: Record<HealthStatus, string> = {
    healthy: "Healthy",
    degraded: "Slow",
    unreachable: "Offline",
    invalid: "Invalid",
  };

  return (
    <span
      className={[
        styles.indicator,
        styles[`indicator--${status}`],
        styles[`indicator--${size}`],
      ].join(" ")}
      title={statusLabels[status]}
      aria-label={statusLabels[status]}
    >
      {showLabel && <span className={styles.label}>{statusLabels[status]}</span>}
    </span>
  );
}

/**
 * Props for the SourceHealthBadge component.
 */
interface SourceHealthBadgeProps {
  /** Full health check result */
  result: HealthCheckResult;
  /** Whether to show latency */
  showLatency?: boolean;
  /** Whether to show item count */
  showItemCount?: boolean;
}

/**
 * Full health badge with status, latency, and optional details.
 *
 * @example
 * ```tsx
 * <SourceHealthBadge result={healthResult} showLatency />
 * ```
 */
export function SourceHealthBadge({
  result,
  showLatency = true,
  showItemCount = false,
}: SourceHealthBadgeProps) {
  return (
    <div className={styles.badge}>
      <SourceHealthIndicator status={result.status} size="small" />
      {result.collectionName && (
        <span className={styles.badgeName}>{result.collectionName}</span>
      )}
      {showItemCount && result.itemCount !== undefined && (
        <span className={styles.badgeCount}>{result.itemCount} items</span>
      )}
      {showLatency && (
        <span className={styles.badgeLatency}>{result.latency}ms</span>
      )}
    </div>
  );
}

/**
 * Props for the SourceHealthCard component.
 */
interface SourceHealthCardProps {
  /** Full health check result */
  result: HealthCheckResult;
  /** Whether the source is loading */
  isLoading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Whether the source is selected/active */
  isActive?: boolean;
}

/**
 * Full health card with all details.
 *
 * @example
 * ```tsx
 * <SourceHealthCard
 *   result={healthResult}
 *   isActive={isCurrentSource}
 *   onClick={() => selectSource(result.url)}
 * />
 * ```
 */
export function SourceHealthCard({
  result,
  isLoading = false,
  onClick,
  isActive = false,
}: SourceHealthCardProps) {
  const statusLabels: Record<HealthStatus, string> = {
    healthy: "Healthy",
    degraded: "Slow Response",
    unreachable: "Unreachable",
    invalid: "Invalid Schema",
  };

  return (
    <button
      type="button"
      className={[
        styles.card,
        styles[`card--${result.status}`],
        isActive ? styles["card--active"] : "",
        isLoading ? styles["card--loading"] : "",
      ].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={isLoading}
    >
      <div className={styles.cardHeader}>
        <SourceHealthIndicator status={result.status} size="medium" />
        <span className={styles.cardStatus}>{statusLabels[result.status]}</span>
        <span className={styles.cardLatency}>{result.latency}ms</span>
      </div>

      {result.collectionName && (
        <h3 className={styles.cardTitle}>{result.collectionName}</h3>
      )}

      <p className={styles.cardUrl}>{result.url}</p>

      {result.itemCount !== undefined && (
        <p className={styles.cardMeta}>
          {result.itemCount} items
          {result.schemaVersion && ` • v${result.schemaVersion}`}
        </p>
      )}

      {result.issues.length > 0 && (
        <ul className={styles.cardIssues}>
          {result.issues.slice(0, 2).map((issue, index) => (
            <li
              key={index}
              className={[
                styles.cardIssue,
                styles[`cardIssue--${issue.severity}`],
              ].join(" ")}
            >
              {issue.message}
            </li>
          ))}
          {result.issues.length > 2 && (
            <li className={styles.cardIssueMore}>
              +{result.issues.length - 2} more issues
            </li>
          )}
        </ul>
      )}

      {result.error && (
        <p className={styles.cardError}>{result.error}</p>
      )}
    </button>
  );
}

/**
 * Loading skeleton for health cards.
 */
export function SourceHealthSkeleton() {
  return (
    <div className={[styles.card, styles["card--loading"]].join(" ")}>
      <div className={styles.cardHeader}>
        <span className={styles.skeleton} style={{ width: "12px", height: "12px", borderRadius: "50%" }} />
        <span className={styles.skeleton} style={{ width: "60px" }} />
        <span className={styles.skeleton} style={{ width: "40px" }} />
      </div>
      <span className={[styles.skeleton, styles.cardTitle].join(" ")} style={{ width: "70%" }} />
      <span className={[styles.skeleton, styles.cardUrl].join(" ")} style={{ width: "100%" }} />
    </div>
  );
}
