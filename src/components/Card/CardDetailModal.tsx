/**
 * Card detail modal for displaying extended card information.
 */

import { Modal } from "@/components/Modal";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./CardDetailModal.module.css";

interface CardDetailModalProps {
  /** Card to display details for */
  card: DisplayCard;

  /** Whether the modal is open */
  isOpen: boolean;

  /** Called when the modal should close */
  onClose: () => void;
}

/**
 * Modal displaying extended card information.
 */
export function CardDetailModal({ card, isOpen, onClose }: CardDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={card.title}>
      <div className={styles.container}>
        <div className={styles.imageContainer}>
          <img
            src={card.imageUrl}
            alt={card.title}
            className={styles.image}
            loading="lazy"
          />
        </div>

        <div className={styles.details}>
          <h3 className={styles.title}>{card.title}</h3>

          <div className={styles.meta}>
            {card.year && <span className={styles.year}>{card.year}</span>}
            {card.categoryTitle && (
              <>
                {card.year && <span className={styles.separator}>-</span>}
                <span className={styles.category}>{card.categoryTitle}</span>
              </>
            )}
          </div>

          {card.summary && <p className={styles.summary}>{card.summary}</p>}

          {card.detailUrl && (
            <a
              href={card.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              View More
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          {card.metadata && Object.keys(card.metadata).length > 0 && (
            <div className={styles.metadata}>
              <h4 className={styles.metadataTitle}>Details</h4>
              <dl className={styles.metadataList}>
                {Object.entries(card.metadata).map(([key, value]) => (
                  <div key={key} className={styles.metadataItem}>
                    <dt className={styles.metadataKey}>{key}</dt>
                    <dd className={styles.metadataValue}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
