/**
 * Carousel view for single-card focused browsing.
 *
 * Displays one card at a time at large scale with navigation controls
 * and peek previews of adjacent cards.
 */

import { useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/Card/Card";
import type { DisplayCard } from "@/hooks/useCollection";
import { useTouchGestures } from "@/hooks/useTouchGestures";
import styles from "./CardCarousel.module.css";

/**
 * Props for CardCarousel component.
 */
interface CardCarouselProps {
  /** Cards to display */
  cards: DisplayCard[];
  /** Currently active card index */
  activeIndex: number;
  /** Callback when active index changes */
  onIndexChange: (index: number) => void;
  /** IDs of cards that are flipped */
  flippedCardIds: string[];
  /** Callback when a card is flipped */
  onFlip: (cardId: string) => void;
}

/**
 * Animation variants for carousel transitions.
 */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    zIndex: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.8,
    zIndex: 0,
  }),
};

/**
 * Carousel view for focused card browsing.
 *
 * Features:
 * - Single card display at large scale
 * - Swipe navigation on touch devices
 * - Arrow key navigation
 * - Dot indicators for position
 * - Smooth slide transitions
 * - Peek previews of adjacent cards
 *
 * @example
 * ```tsx
 * <CardCarousel
 *   cards={cards}
 *   activeIndex={currentIndex}
 *   onIndexChange={setCurrentIndex}
 *   flippedCardIds={flipped}
 *   onFlip={handleFlip}
 * />
 * ```
 */
export function CardCarousel({
  cards,
  activeIndex,
  onIndexChange,
  flippedCardIds,
  onFlip,
}: CardCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(0);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      directionRef.current = -1;
      onIndexChange(activeIndex - 1);
    }
  }, [activeIndex, onIndexChange]);

  const goToNext = useCallback(() => {
    if (activeIndex < cards.length - 1) {
      directionRef.current = 1;
      onIndexChange(activeIndex + 1);
    }
  }, [activeIndex, cards.length, onIndexChange]);

  const goToIndex = useCallback(
    (index: number) => {
      directionRef.current = index > activeIndex ? 1 : -1;
      onIndexChange(index);
    },
    [activeIndex, onIndexChange]
  );

  // Touch gesture handling
  const { handlers: touchHandlers } = useTouchGestures({
    swipeThreshold: 50,
    onSwipe: (direction) => {
      if (direction === "left") {
        goToNext();
      } else if (direction === "right") {
        goToPrevious();
      }
    },
    onTap: () => {
      const currentCard = cards[activeIndex];
      if (currentCard) {
        onFlip(currentCard.id);
      }
    },
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToNext();
          break;
        case "Home":
          event.preventDefault();
          goToIndex(0);
          break;
        case "End":
          event.preventDefault();
          goToIndex(cards.length - 1);
          break;
        case "Enter":
        case " ": {
          event.preventDefault();
          const currentCard = cards[activeIndex];
          if (currentCard) {
            onFlip(currentCard.id);
          }
          break;
        }
      }
    };

    const container = containerRef.current;
    container?.addEventListener("keydown", handleKeyDown);
    return () => container?.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, cards, goToPrevious, goToNext, goToIndex, onFlip]);

  if (cards.length === 0) {
    return (
      <div className={styles.empty}>No cards to display</div>
    );
  }

  const currentCard = cards[activeIndex];
  const isFlipped = currentCard ? flippedCardIds.includes(currentCard.id) : false;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label={`Card carousel, ${String(cards.length)} cards`}
      {...touchHandlers}
    >
      {/* Previous button */}
      <button
        className={`${styles.navButton ?? ""} ${styles.prevButton ?? ""}`}
        onClick={goToPrevious}
        disabled={activeIndex === 0}
        aria-label="Previous card"
        type="button"
      >
        <ChevronLeftIcon />
      </button>

      {/* Main card display */}
      <div className={styles.cardContainer}>
        <AnimatePresence mode="popLayout" custom={directionRef.current}>
          {currentCard && (
            <motion.div
              key={currentCard.id}
              className={styles.cardWrapper}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${String(activeIndex + 1)} of ${String(cards.length)}: ${currentCard.title}`}
            >
              <Card
                card={currentCard}
                isFlipped={isFlipped}
                onFlip={() => { onFlip(currentCard.id); }}
                tabIndex={-1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next button */}
      <button
        className={`${styles.navButton ?? ""} ${styles.nextButton ?? ""}`}
        onClick={goToNext}
        disabled={activeIndex === cards.length - 1}
        aria-label="Next card"
        type="button"
      >
        <ChevronRightIcon />
      </button>

      {/* Dot indicators */}
      <div className={styles.indicators} role="tablist" aria-label="Card navigation">
        {cards.length <= 20 ? (
          // Show all dots for small collections
          cards.map((card, index) => (
            <button
              key={card.id}
              className={`${styles.dot ?? ""} ${index === activeIndex ? (styles.active ?? "") : ""}`}
              onClick={() => { goToIndex(index); }}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to card ${String(index + 1)}: ${card.title}`}
              type="button"
            />
          ))
        ) : (
          // Show counter for large collections
          <span className={styles.counter}>
            {activeIndex + 1} / {cards.length}
          </span>
        )}
      </div>
    </div>
  );
}

// Icon components
function ChevronLeftIcon() {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default CardCarousel;
