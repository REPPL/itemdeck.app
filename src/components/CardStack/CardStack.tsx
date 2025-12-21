/**
 * Card stack view (Apple Wallet style).
 *
 * Displays cards in an overlapping stack formation where clicking
 * brings a card to the front.
 */

import { useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/Card/Card";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./CardStack.module.css";

/**
 * Props for CardStack component.
 */
interface CardStackProps {
  /** Cards to display */
  cards: DisplayCard[];
  /** Index of the card at the front of the stack */
  frontIndex: number;
  /** Callback when front index changes */
  onFrontChange: (index: number) => void;
  /** IDs of cards that are flipped */
  flippedCardIds: string[];
  /** Callback when a card is flipped */
  onFlip: (cardId: string) => void;
  /** Offset between stacked cards in pixels */
  stackOffset?: number;
  /** Rotation angle for fanned effect in degrees */
  fanAngle?: number;
  /** Maximum visible cards in stack */
  maxVisible?: number;
}

/**
 * Card stack view with Apple Wallet style stacking.
 *
 * Features:
 * - Overlapping card stack formation
 * - Click to bring card to front
 * - Smooth spring animations
 * - Optional fan rotation effect
 * - Keyboard navigation
 *
 * @example
 * ```tsx
 * <CardStack
 *   cards={cards}
 *   frontIndex={activeCard}
 *   onFrontChange={setActiveCard}
 *   flippedCardIds={flipped}
 *   onFlip={handleFlip}
 *   stackOffset={15}
 *   fanAngle={2}
 * />
 * ```
 */
export function CardStack({
  cards,
  frontIndex,
  onFrontChange,
  flippedCardIds,
  onFlip,
  stackOffset = 15,
  fanAngle = 1,
  maxVisible = 5,
}: CardStackProps) {
  // Calculate visible cards (limited for performance)
  const visibleCards = useMemo(() => {
    const visible: { card: DisplayCard; originalIndex: number }[] = [];

    // Start from front card and go backwards
    for (let i = 0; i < Math.min(maxVisible, cards.length); i++) {
      const index = (frontIndex - i + cards.length) % cards.length;
      const card = cards[index];
      if (card) {
        visible.push({ card, originalIndex: index });
      }
    }

    return visible.reverse(); // Reverse so front card renders last (on top)
  }, [cards, frontIndex, maxVisible]);

  // Click handler to bring card to front
  const handleCardClick = useCallback(
    (originalIndex: number) => {
      const card = cards[originalIndex];
      if (!card) return;

      if (originalIndex === frontIndex) {
        // Already at front, flip it
        onFlip(card.id);
      } else {
        // Bring to front
        onFrontChange(originalIndex);
      }
    },
    [frontIndex, cards, onFlip, onFrontChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
        case "ArrowRight":
          event.preventDefault();
          onFrontChange((frontIndex + 1) % cards.length);
          break;
        case "ArrowDown":
        case "ArrowLeft":
          event.preventDefault();
          onFrontChange((frontIndex - 1 + cards.length) % cards.length);
          break;
        case "Enter":
        case " ": {
          event.preventDefault();
          const frontCard = cards[frontIndex];
          if (frontCard) {
            onFlip(frontCard.id);
          }
          break;
        }
      }
    },
    [frontIndex, cards, onFrontChange, onFlip]
  );

  if (cards.length === 0) {
    return <div className={styles.empty}>No cards to display</div>;
  }

  return (
    <div
      className={styles.container}
      role="region"
      aria-label={`Card stack, ${String(cards.length)} cards`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.stack}>
        <AnimatePresence mode="popLayout">
          {visibleCards.map(({ card, originalIndex }, stackPosition) => {
            const isAtFront = originalIndex === frontIndex;
            const isFlipped = flippedCardIds.includes(card.id);

            // Calculate offset from front
            const depth = visibleCards.length - 1 - stackPosition;
            const yOffset = depth * stackOffset;
            const rotation = depth * fanAngle;
            const scale = 1 - depth * 0.02;
            const zIndex = visibleCards.length - depth;

            return (
              <motion.div
                key={card.id}
                className={`${styles.cardWrapper ?? ""} ${isAtFront ? (styles.front ?? "") : ""}`}
                style={{ zIndex }}
                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: yOffset,
                  rotate: rotation,
                  scale,
                }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                onClick={() => { handleCardClick(originalIndex); }}
                role="button"
                aria-label={`${card.title}${isAtFront ? " (front of stack)" : ""}`}
              >
                <Card
                  card={card}
                  isFlipped={isFlipped}
                  onFlip={() => { onFlip(card.id); }}
                  tabIndex={-1}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Stack position indicator */}
      <div className={styles.indicator}>
        <span className={styles.counter}>
          {frontIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Navigation hints */}
      <div className={styles.hints}>
        <span>Click a card to bring it to front</span>
        <span>Use arrow keys to cycle</span>
      </div>
    </div>
  );
}

export default CardStack;
