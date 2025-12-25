import { ImageWithFallback } from "@/components/ImageWithFallback";
import { RankBadge } from "@/components/RankBadge";
import { DeviceBadge } from "@/components/DeviceBadge";
import styles from "./Card.module.css";

/**
 * Info icon SVG component.
 */
function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

/**
 * Drag handle grip icon (6 dots arranged in 2x3 pattern).
 */
function DragGripIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={styles.dragGripIconSmall}
    >
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="9" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
    </svg>
  );
}

interface CardFrontProps {
  /** URL of the card's front image */
  imageUrl: string;
  /** Card title */
  title: string;
  /** Subtitle to display in overlay (e.g., year or playedSince) */
  subtitle?: string;
  /** Optional category title (legacy, use device instead) */
  categoryTitle?: string;
  /** Rank number (1-based) or null for unranked */
  rank?: number | null;
  /** Device/platform name for footer badge */
  device?: string;
  /** Placeholder text for unranked items */
  rankPlaceholderText?: string;
  /** Whether to show the rank badge */
  showRankBadge?: boolean;
  /** Whether to show the footer badge (device/platform) */
  showFooterBadge?: boolean;
  /** Card size preset for responsive adjustments */
  cardSize?: "small" | "medium" | "large";
  /** Callback when info button is clicked */
  onInfoClick?: (event: React.MouseEvent) => void;
  /** Whether drag handle should be shown */
  showDragHandle?: boolean;
  /** Drag handle props (listeners and attributes from dnd-kit) */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  /** Whether the card is currently flipping (hides drag handle during animation) */
  isFlipping?: boolean;
}

/**
 * Card front face component.
 *
 * Features:
 * - RankBadge in top-left (gold/silver/bronze for top 3)
 * - Info button in top-right (always visible, prominent)
 * - DeviceBadge in bottom-right
 * - Image with title/year overlay at bottom
 * - ImageWithFallback for graceful degradation
 */
export function CardFront({
  imageUrl,
  title,
  subtitle,
  rank,
  device,
  rankPlaceholderText,
  showRankBadge = true,
  showFooterBadge = true,
  cardSize = "medium",
  onInfoClick,
  showDragHandle = false,
  dragHandleProps,
  isFlipping = false,
}: CardFrontProps) {
  // Hide unranked badge on small cards to prevent overflow
  const shouldShowRankBadge = showRankBadge && (rank !== null || cardSize !== "small");

  // Hide drag handle during flip animation
  const shouldShowDragHandle = showDragHandle && !isFlipping;

  return (
    <div className={[styles.cardFace, styles.cardFront].join(" ")}>
      <ImageWithFallback
        src={imageUrl}
        alt={title}
        title={title}
        className={styles.frontImage}
        loading="lazy"
      />

      {/* Rank badge in top-left - hide unranked text on small cards */}
      {shouldShowRankBadge && (
        <div className={styles.badges}>
          <RankBadge
            rank={rank ?? null}
            placeholderText={rankPlaceholderText}
            size="small"
          />
        </div>
      )}

      {/* Info button in top-right - always visible */}
      {onInfoClick && (
        <button
          type="button"
          className={styles.infoButton}
          onClick={onInfoClick}
          aria-label={`More information about ${title}`}
        >
          <InfoIcon />
        </button>
      )}

      <div
        className={[
          styles.overlay,
          shouldShowDragHandle ? styles.overlayDraggable : "",
        ].filter(Boolean).join(" ")}
        {...(shouldShowDragHandle ? dragHandleProps : {})}
        aria-label={shouldShowDragHandle ? "Drag to reorder" : undefined}
      >
        <h3 className={styles.overlayTitle}>{title}</h3>
        <div className={styles.overlayFooter}>
          {subtitle && <span className={styles.overlayYear}>{subtitle}</span>}
          {/* Drag grip icon shown when draggable - centred, hidden during flip */}
          {shouldShowDragHandle && (
            <div className={styles.overlayDragIcon}>
              <DragGripIcon />
            </div>
          )}
          {showFooterBadge && device && (
            <div className={styles.overlayDeviceBadge}>
              <DeviceBadge device={device} size="small" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
