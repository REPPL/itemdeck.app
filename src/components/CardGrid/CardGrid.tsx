import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/Card/Card";
import { DraggableCardGrid } from "@/components/DraggableCardGrid";
import { useDefaultCollection } from "@/hooks/useCollection";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { useGridNavigation } from "@/hooks/useGridNavigation";
import { useShuffledCards } from "@/hooks/useShuffledCards";
import { useSettingsStore } from "@/stores/settingsStore";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import styles from "./CardGrid.module.css";

const GAP = 16; // var(--grid-gap) = 1rem = 16px

/**
 * Grid component that displays cards in a responsive layout.
 * Uses absolute positioning with JS-calculated positions.
 * CSS transitions handle smooth animation on resize.
 * Manages flip state with maxVisibleCards enforcement.
 * Supports keyboard navigation with roving tabindex.
 */
export function CardGrid() {
  const { data, isLoading, error } = useDefaultCollection();
  const sourceCards = useMemo(() => data?.cards ?? [], [data?.cards]);
  const { cardDimensions } = useSettingsContext();
  const dragModeEnabled = useSettingsStore((state) => state.dragModeEnabled);
  const showRankBadge = useSettingsStore((state) => state.showRankBadge);
  const showDeviceBadge = useSettingsStore((state) => state.showDeviceBadge);
  const rankPlaceholderText = useSettingsStore((state) => state.rankPlaceholderText);
  const dragFace = useSettingsStore((state) => state.dragFace);
  const maxVisibleCards = useSettingsStore((state) => state.maxVisibleCards);
  const cardBackDisplay = useSettingsStore((state) => state.cardBackDisplay);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [customOrder, setCustomOrder] = useState<string[] | null>(null);

  // Shuffle cards by default (F-027)
  const { cards: shuffledCards } = useShuffledCards(sourceCards, {
    enabled: true,
    shuffleOnLoad: true,
  });

  // Apply custom order if set (from drag and drop)
  const cards = useMemo(() => {
    if (!customOrder) return shuffledCards;
    const cardMap = new Map(shuffledCards.map((c) => [c.id, c]));
    return customOrder
      .map((id) => cardMap.get(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
  }, [shuffledCards, customOrder]);

  // Handle reorder from drag and drop
  const handleReorder = useCallback((newOrder: string[]) => {
    setCustomOrder(newOrder);
  }, []);

  // Track flipped card IDs in order (oldest first)
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);

  // Calculate number of columns for keyboard navigation
  const columns = useMemo(() => {
    if (containerWidth === 0) return 1;
    const cardWidth = cardDimensions.width;
    return Math.max(1, Math.floor((containerWidth + GAP) / (cardWidth + GAP)));
  }, [containerWidth, cardDimensions.width]);

  // Handle card flip with maxVisibleCards enforcement
  const handleFlip = useCallback((cardId: string) => {
    setFlippedCardIds(prev => {
      const isCurrentlyFlipped = prev.includes(cardId);

      if (isCurrentlyFlipped) {
        // Unflip: remove from list
        return prev.filter(id => id !== cardId);
      } else {
        // Flip: add to list, enforce maxVisibleCards
        const newList = [...prev, cardId];

        // Remove oldest cards if we exceed the limit
        while (newList.length > maxVisibleCards) {
          newList.shift(); // Remove oldest (first)
        }

        return newList;
      }
    });
  }, [maxVisibleCards]);

  // Handle selection from keyboard navigation
  const handleSelect = useCallback((index: number) => {
    const card = cards[index];
    if (card) {
      handleFlip(card.id);
    }
  }, [cards, handleFlip]);

  // Grid keyboard navigation
  const { handleKeyDown, getTabIndex, gridRef } = useGridNavigation({
    totalItems: cards.length,
    columns,
    onSelect: handleSelect,
    enabled: !isLoading && !error && cards.length > 0,
  });

  // Sync refs (containerRef for resize, gridRef for navigation)
  useEffect(() => {
    if (containerRef.current) {
      (gridRef as React.MutableRefObject<HTMLElement | null>).current = containerRef.current;
    }
  }, [gridRef]);

  // Track container width
  // Re-run when dragModeEnabled changes so we measure when switching back to regular grid
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const padding = parseFloat(getComputedStyle(container).paddingLeft) * 2;
      setContainerWidth(container.clientWidth - padding);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [dragModeEnabled]);

  // Calculate grid layout
  const calculateLayout = () => {
    if (containerWidth === 0 || cards.length === 0) {
      return { positions: [] as { left: number; top: number }[], rows: 0 };
    }

    const cardWidth = cardDimensions.width;
    const cardHeight = cardDimensions.height;

    // Calculate total grid width and offset to centre
    const totalGridWidth = columns * cardWidth + (columns - 1) * GAP;
    const offsetX = (containerWidth - totalGridWidth) / 2;

    // Calculate positions for each card
    const positions = cards.map((_, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        left: offsetX + col * (cardWidth + GAP),
        top: row * (cardHeight + GAP),
      };
    });

    const rows = Math.ceil(cards.length / columns);

    return { positions, rows };
  };

  const { positions, rows } = calculateLayout();
  const containerHeight = rows > 0
    ? rows * cardDimensions.height + (rows - 1) * GAP
    : 200;

  // Render loading/error/empty states inside the grid container
  // so the ref is always attached
  const renderContent = () => {
    if (isLoading) {
      return <LoadingSkeleton count={8} />;
    }

    if (error) {
      return <div className={styles.error}>Error: {error.message}</div>;
    }

    if (cards.length === 0 || positions.length === 0) {
      return <div className={styles.empty}>No cards to display</div>;
    }

    return cards.map((card, index) => {
      const pos = positions[index];
      if (!pos) return null;

      const isFlipped = flippedCardIds.includes(card.id);
      const tabIndex = getTabIndex(index);

      return (
        <div
          key={card.id}
          className={styles.card}
          style={{
            left: `${String(pos.left)}px`,
            top: `${String(pos.top)}px`,
          }}
          role="gridcell"
        >
          <Card
            card={card}
            isFlipped={isFlipped}
            onFlip={() => { handleFlip(card.id); }}
            tabIndex={tabIndex}
            cardBackDisplay={cardBackDisplay}
            showRankBadge={showRankBadge}
            showDeviceBadge={showDeviceBadge}
            rankPlaceholderText={rankPlaceholderText}
          />
        </div>
      );
    });
  };

  // Render draggable grid when drag mode is enabled
  if (dragModeEnabled && !isLoading && !error && cards.length > 0) {
    return (
      <DraggableCardGrid
        cards={cards}
        onReorder={handleReorder}
        cardWidth={cardDimensions.width}
        gap={GAP}
        flippedCardIds={flippedCardIds}
        onFlip={handleFlip}
        showRankBadge={showRankBadge}
        showDeviceBadge={showDeviceBadge}
        rankPlaceholderText={rankPlaceholderText}
        dragFace={dragFace}
        cardBackDisplay={cardBackDisplay}
      />
    );
  }

  return (
    <section
      ref={containerRef}
      className={styles.grid}
      style={{ minHeight: `${String(containerHeight)}px` }}
      role="grid"
      aria-label="Card collection"
      onKeyDown={handleKeyDown}
    >
      {renderContent()}
    </section>
  );
}
