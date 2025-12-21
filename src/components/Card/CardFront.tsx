import { ImageWithFallback } from "@/components/ImageWithFallback";
import styles from "./Card.module.css";

interface CardFrontProps {
  /** URL of the card's front image */
  imageUrl: string;
  /** Card title */
  title: string;
  /** Optional year to display in overlay */
  year?: string;
}

/**
 * Card front face component.
 * Displays image with title/year overlay at bottom.
 * Uses ImageWithFallback for graceful degradation.
 */
export function CardFront({ imageUrl, title, year }: CardFrontProps) {
  return (
    <div className={[styles.cardFace, styles.cardFront].join(" ")}>
      <ImageWithFallback
        src={imageUrl}
        alt={title}
        title={title}
        className={styles.frontImage}
        loading="lazy"
      />
      <div className={styles.overlay}>
        <h3 className={styles.overlayTitle}>{title}</h3>
        {year && <span className={styles.overlayYear}>{year}</span>}
      </div>
    </div>
  );
}
