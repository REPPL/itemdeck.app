/**
 * CardListItem component for list view mode.
 *
 * Displays cards as horizontal rows with thumbnail, title, and metadata.
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { CardExpanded } from "@/components/CardExpanded";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./CardListItem.module.css";

interface CardListItemProps {
  /** Card data to display */
  card: DisplayCard;
  /** Card number for display (1-indexed) */
  cardNumber?: number;
  /** Tab index for keyboard navigation */
  tabIndex?: 0 | -1;
}

/**
 * List view card row.
 */
export function CardListItem({ card, cardNumber, tabIndex = 0 }: CardListItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const handleClick = useCallback((event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    setOriginRect(target.getBoundingClientRect());
    setIsModalOpen(true);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const target = event.currentTarget as HTMLElement;
        setOriginRect(target.getBoundingClientRect());
        setIsModalOpen(true);
      }
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const year = card.year ?? "";
  const platform = card.categoryTitle ?? card.categoryShort ?? "";
  const summary = card.summary ?? "";

  return (
    <>
      <motion.article
        className={styles.item}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={tabIndex}
        aria-label={`${card.title}${year ? `, ${year}` : ""}${platform ? ` on ${platform}` : ""}`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className={styles.thumbnail}>
          <ImageWithFallback
            src={card.imageUrl}
            alt={card.title}
            title={card.title}
            className={styles.image}
          />
          {cardNumber !== undefined && (
            <span className={styles.rank}>#{cardNumber}</span>
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h3 className={styles.title}>{card.title}</h3>
            <div className={styles.meta}>
              {year && <span className={styles.year}>{year}</span>}
              {platform && (
                <>
                  {year && <span className={styles.separator}>•</span>}
                  <span className={styles.platform}>{platform}</span>
                </>
              )}
            </div>
          </div>

          {summary && (
            <p className={styles.summary}>{summary}</p>
          )}
        </div>
      </motion.article>

      <CardExpanded
        card={card}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        originRect={originRect}
      />
    </>
  );
}

export default CardListItem;
