/**
 * Virtual scrolling card grid for large collections.
 *
 * Uses TanStack Virtual to render only visible cards plus overscan,
 * enabling smooth scrolling with 1000+ cards.
 */

import { useRef, useMemo, useState, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card } from "@/components/Card/Card";
import type { DisplayCard } from "@/hooks/useCollection";
import styles from "./VirtualCardGrid.module.css";

/**
 * Props for VirtualCardGrid component.
 */
interface VirtualCardGridProps {
  /** Cards to display */
  cards: DisplayCard[];
  /** Width of each card in pixels */
  cardWidth: number;
  /** Height of each card in pixels */
  cardHeight: number;
  /** Gap between cards in pixels */
  gap: number;
  /** IDs of cards that are flipped (showing front) */
  flippedCardIds: string[];
  /** Callback when a card is flipped */
  onFlip: (cardId: string) => void;
  /** Currently focused card index for keyboard navigation */
  focusedIndex?: number;
  /** Callback for focus change (keyboard navigation) */
  onFocusChange?: (index: number) => void;
}

/**
 * Virtual scrolling grid for large card collections.
 *
 * Features:
 * - Renders only visible cards + overscan buffer
 * - Smooth 60fps scrolling with 1000+ cards
 * - Automatic column calculation based on container width
 * - Keyboard navigation support
 * - Memory efficient (capped DOM nodes)
 *
 * @example
 * ```tsx
 * <VirtualCardGrid
 *   cards={cards}
 *   cardWidth={140}
 *   cardHeight={196}
 *   gap={16}
 *   flippedCardIds={flipped}
 *   onFlip={handleFlip}
 * />
 * ```
 */
export function VirtualCardGrid({
  cards,
  cardWidth,
  cardHeight,
  gap,
  flippedCardIds,
  onFlip,
  focusedIndex = 0,
  onFocusChange,
}: VirtualCardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const padding = parseFloat(getComputedStyle(container).paddingLeft) * 2;
      setContainerWidth(container.clientWidth - padding);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);

    return () => { observer.disconnect(); };
  }, []);

  // Calculate columns based on container width
  const columns = useMemo(() => {
    if (containerWidth === 0) return 1;
    return Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
  }, [containerWidth, cardWidth, gap]);

  // Calculate total rows
  const rows = useMemo(() => {
    return Math.ceil(cards.length / columns);
  }, [cards.length, columns]);

  // Row virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => cardHeight + gap,
    overscan: 3, // Render 3 extra rows above/below viewport
  });

  // Calculate total grid width and offset to centre
  const totalGridWidth = columns * cardWidth + (columns - 1) * gap;
  const offsetX = Math.max(0, (containerWidth - totalGridWidth) / 2);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!onFocusChange) return;

      let newIndex = focusedIndex;

      switch (event.key) {
        case "ArrowRight":
          newIndex = Math.min(focusedIndex + 1, cards.length - 1);
          break;
        case "ArrowLeft":
          newIndex = Math.max(focusedIndex - 1, 0);
          break;
        case "ArrowDown":
          newIndex = Math.min(focusedIndex + columns, cards.length - 1);
          break;
        case "ArrowUp":
          newIndex = Math.max(focusedIndex - columns, 0);
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = cards.length - 1;
          break;
        case "Enter":
        case " ": {
          event.preventDefault();
          const focusedCard = cards[focusedIndex];
          if (focusedCard) {
            onFlip(focusedCard.id);
          }
          return;
        }
        default:
          return;
      }

      if (newIndex !== focusedIndex) {
        event.preventDefault();
        onFocusChange(newIndex);

        // Scroll to make the focused card visible
        const rowIndex = Math.floor(newIndex / columns);
        rowVirtualizer.scrollToIndex(rowIndex, { align: "auto" });
      }
    },
    [focusedIndex, columns, cards, onFocusChange, onFlip, rowVirtualizer]
  );

  if (cards.length === 0) {
    return (
      <div className={styles.empty} role="grid" aria-label="Card collection">
        No cards to display
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      role="grid"
      aria-label="Card collection"
      aria-rowcount={rows}
      aria-colcount={columns}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div
        className={styles.virtualList}
        style={{
          height: `${String(rowVirtualizer.getTotalSize())}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index;
          const startIndex = rowIndex * columns;
          const rowCards = cards.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className={styles.row}
              role="row"
              aria-rowindex={rowIndex + 1}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${String(cardHeight)}px`,
                transform: `translateY(${String(virtualRow.start)}px)`,
                display: "flex",
                gap: `${String(gap)}px`,
                paddingLeft: `${String(offsetX)}px`,
              }}
            >
              {rowCards.map((card, colIndex) => {
                const cardIndex = startIndex + colIndex;
                const isFlipped = flippedCardIds.includes(card.id);
                const isFocused = cardIndex === focusedIndex;

                return (
                  <div
                    key={card.id}
                    role="gridcell"
                    aria-colindex={colIndex + 1}
                    style={{
                      width: `${String(cardWidth)}px`,
                      height: `${String(cardHeight)}px`,
                    }}
                  >
                    <Card
                      card={card}
                      isFlipped={isFlipped}
                      onFlip={() => { onFlip(card.id); }}
                      tabIndex={isFocused ? 0 : -1}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VirtualCardGrid;
