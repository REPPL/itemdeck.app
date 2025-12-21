import { ImageWithFallback } from "@/components/ImageWithFallback";
import { Badge } from "@/components/Badge";
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

interface CardFrontProps {
  /** URL of the card's front image */
  imageUrl: string;
  /** Card title */
  title: string;
  /** Optional year to display in overlay */
  year?: string;
  /** Optional category title to display as badge */
  categoryTitle?: string;
  /** Callback when info button is clicked */
  onInfoClick?: (event: React.MouseEvent) => void;
}

/**
 * Card front face component.
 * Displays image with title/year overlay at bottom.
 * Includes info button for opening detail modal.
 * Shows category badge when available.
 * Uses ImageWithFallback for graceful degradation.
 */
export function CardFront({ imageUrl, title, year, categoryTitle, onInfoClick }: CardFrontProps) {
  return (
    <div className={[styles.cardFace, styles.cardFront].join(" ")}>
      <ImageWithFallback
        src={imageUrl}
        alt={title}
        title={title}
        className={styles.frontImage}
        loading="lazy"
      />

      {/* Category badge in top-left */}
      {categoryTitle && (
        <div className={styles.badges}>
          <Badge label={categoryTitle} variant="subtle" colour="primary" size="small" />
        </div>
      )}

      {/* Info button in top-right */}
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

      <div className={styles.overlay}>
        <h3 className={styles.overlayTitle}>{title}</h3>
        {year && <span className={styles.overlayYear}>{year}</span>}
      </div>
    </div>
  );
}
