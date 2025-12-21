import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { useConfig } from "@/hooks/useConfig";
import { CardBack } from "./CardBack";
import { CardFront } from "./CardFront";
import { CardInner } from "./CardInner";
import { CardExpanded } from "@/components/CardExpanded";
import type { DisplayCard } from "@/hooks/useCollection";
import type { CardBackDisplay } from "@/stores/settingsStore";
import styles from "./Card.module.css";

/**
 * Props for card display.
 * Accepts any object with the required card fields.
 */
interface CardDisplayData {
  id: string;
  title: string;
  year?: string;
  imageUrl: string;
  imageUrls?: string[];
  logoUrl?: string;
  summary?: string;
  detailUrl?: string;
  categoryTitle?: string;
  rank?: number | null;
  device?: string;
  metadata?: Record<string, string>;
}

interface CardProps {
  /** Card data to display */
  card: CardDisplayData;
  /** Whether the card is flipped to show front */
  isFlipped?: boolean;
  /** Callback when card is clicked */
  onFlip?: () => void;
  /** Tab index for keyboard navigation (roving tabindex) */
  tabIndex?: 0 | -1;
  /** What to display on card back */
  cardBackDisplay?: CardBackDisplay;
  /** Whether to show the rank badge */
  showRankBadge?: boolean;
  /** Whether to show the device badge */
  showDeviceBadge?: boolean;
  /** Placeholder text for unranked items */
  rankPlaceholderText?: string;
}

/**
 * Card component with 3D flip animation.
 *
 * Shows back face (logo + year) by default.
 * When flipped, reveals front face (image + title overlay).
 *
 * Features:
 * - 3D flip animation with Framer Motion
 * - Hover lift effect (scale 1.02)
 * - Tap press effect (scale 0.98)
 * - Keyboard support (Enter/Space)
 * - Respects reduced motion preference via MotionProvider
 *
 * Flip state is controlled externally via isFlipped prop.
 * CardGrid manages which cards are flipped.
 */
export function Card({
  card,
  isFlipped = false,
  onFlip,
  tabIndex = 0,
  cardBackDisplay = "year",
  showRankBadge = true,
  showDeviceBadge = true,
  rankPlaceholderText,
}: CardProps) {
  const { cardDimensions, settings } = useSettingsContext();
  const { config } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLElement>(null);

  const cardStyle = {
    width: `${String(cardDimensions.width)}px`,
    height: `${String(cardDimensions.height)}px`,
  };

  const handleClick = () => {
    onFlip?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onFlip?.();
    }
  };

  const handleInfoClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    // Capture card position for animation origin
    if (cardRef.current) {
      setOriginRect(cardRef.current.getBoundingClientRect());
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Cast to DisplayCard for modal (includes optional fields)
  const displayCard = card as DisplayCard;

  return (
    <>
      <motion.article
        ref={cardRef}
        className={styles.card}
        style={cardStyle}
        title={card.title}
        data-card-id={card.id}
        data-flipped={isFlipped}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={tabIndex}
        aria-pressed={isFlipped}
        aria-label={`${card.title}${isFlipped ? " (showing front)" : " (showing back)"}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <CardInner
          isFlipped={isFlipped}
          flipDuration={config.animation.flipDuration}
          back={
            <CardBack
              logoUrl={card.logoUrl ?? settings.card.logoUrl}
              year={card.year}
              display={cardBackDisplay}
            />
          }
          front={
            <CardFront
              imageUrl={card.imageUrl}
              title={card.title}
              year={card.year}
              rank={card.rank}
              device={card.device}
              showRankBadge={showRankBadge}
              showDeviceBadge={showDeviceBadge}
              rankPlaceholderText={rankPlaceholderText}
              onInfoClick={handleInfoClick}
            />
          }
        />
      </motion.article>
      <CardExpanded
        card={displayCard}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        originRect={originRect}
      />
    </>
  );
}

// Re-export compound components for flexible composition
Card.Back = CardBack;
Card.Front = CardFront;
Card.Inner = CardInner;
