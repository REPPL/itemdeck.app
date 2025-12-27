/**
 * CardCompactItem component for compact view mode.
 *
 * Displays cards as small thumbnails with title on hover.
 */

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { CardExpanded } from "@/components/CardExpanded";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./CardCompactItem.module.css";

interface CardCompactItemProps {
  /** Card data to display */
  card: DisplayCard;
  /** Card number for display (1-indexed) */
  cardNumber?: number;
  /** Tab index for keyboard navigation */
  tabIndex?: 0 | -1;
}

/**
 * Compact view thumbnail card.
 */
export function CardCompactItem({ card, cardNumber, tabIndex = 0 }: CardCompactItemProps) {
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

  return (
    <>
      <motion.article
        className={styles.item}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={tabIndex}
        aria-label={card.title}
        title={card.title}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <ImageWithFallback
          src={card.imageUrl}
          alt={card.title}
          title={card.title}
          className={styles.image}
        />
        {cardNumber !== undefined && (
          <span className={styles.rank}>#{cardNumber}</span>
        )}
        <div className={styles.overlay}>
          <span className={styles.title}>{card.title}</span>
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

export default CardCompactItem;
