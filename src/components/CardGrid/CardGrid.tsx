import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/Card/Card";
import { DraggableCardGrid } from "@/components/DraggableCardGrid";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { useGridNavigation } from "@/hooks/useGridNavigation";
import { useShuffledCards } from "@/hooks/useShuffledCards";
import { useSettingsStore } from "@/stores/settingsStore";
import { createFieldSortComparator } from "@/utils/fieldPathResolver";
import { shuffle } from "@/utils/shuffle";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { CardDisplayConfig } from "@/types/display";
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
  const { cards: sourceCards, displayConfig: collectionDisplayConfig, isLoading, error } = useCollectionData();
  const displayConfig = collectionDisplayConfig?.card;
  const { cardDimensions } = useSettingsContext();
  const dragModeEnabled = useSettingsStore((state) => state.dragModeEnabled);
  const showRankBadge = useSettingsStore((state) => state.showRankBadge);
  const showFooterBadge = useSettingsStore((state) => state.showDeviceBadge);
  const rankPlaceholderText = useSettingsStore((state) => state.rankPlaceholderText);
  const dragFace = useSettingsStore((state) => state.dragFace);
  const maxVisibleCards = useSettingsStore((state) => state.maxVisibleCards);
  const cardBackDisplay = useSettingsStore((state) => state.cardBackDisplay);
  const shuffleOnLoad = useSettingsStore((state) => state.shuffleOnLoad);
  const fieldMapping = useSettingsStore((state) => state.fieldMapping);
  const randomSelectionEnabled = useSettingsStore((state) => state.randomSelectionEnabled);
  const randomSelectionCount = useSettingsStore((state) => state.randomSelectionCount);
  const defaultCardFace = useSettingsStore((state) => state.defaultCardFace);
  const cardSizePreset = useSettingsStore((state) => state.cardSizePreset);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [customOrder, setCustomOrder] = useState<string[] | null>(null);

  // Merge settings-based field mapping with collection displayConfig
  // Settings take precedence for user overrides
  const mergedDisplayConfig = useMemo((): CardDisplayConfig => {
    const base = displayConfig ?? {};
    return {
      front: {
        title: base.front?.title ?? fieldMapping.titleField,
        subtitle: fieldMapping.subtitleField !== "none" ? fieldMapping.subtitleField : undefined,
        badge: base.front?.badge ?? "rank",
        footerBadge: fieldMapping.footerBadgeField !== "none" ? fieldMapping.footerBadgeField : undefined,
      },
      back: {
        logo: fieldMapping.logoField !== "none" ? fieldMapping.logoField : undefined,
      },
    };
  }, [displayConfig, fieldMapping]);

  // Track selected card IDs for stable random selection (survives edits)
  const [selectedCardIds, setSelectedCardIds] = useState<string[] | null>(null);

  // Apply random selection before shuffle/sort
  // Use stable IDs to survive card edits
  const selectedCards = useMemo(() => {
    if (!randomSelectionEnabled || randomSelectionCount <= 0 || sourceCards.length === 0) {
      return sourceCards;
    }

    // If we have stable selected IDs, use them to filter
    if (selectedCardIds) {
      const idSet = new Set(selectedCardIds);
      const filtered = sourceCards.filter(c => idSet.has(c.id));
      // If selection is still valid (all IDs exist), use it
      if (filtered.length === selectedCardIds.length) {
        // Preserve the original selection order
        return selectedCardIds.map(id => {
          const card = filtered.find(c => c.id === id);
          if (!card) throw new Error(`Card with id ${id} not found`);
          return card;
        });
      }
    }

    // Otherwise, create new random selection and store IDs
    const count = Math.min(randomSelectionCount, sourceCards.length);
    const shuffled = shuffle([...sourceCards]);
    const selected = shuffled.slice(0, count);
    // Store stable IDs (effect will handle this)
    return selected;
  }, [sourceCards, randomSelectionEnabled, randomSelectionCount, selectedCardIds]);

  // Update stable IDs when random selection changes
  useEffect(() => {
    if (randomSelectionEnabled && randomSelectionCount > 0 && sourceCards.length > 0) {
      // Only set if we don't have stable IDs yet or count changed
      if (selectedCardIds?.length !== Math.min(randomSelectionCount, sourceCards.length)) {
        const count = Math.min(randomSelectionCount, sourceCards.length);
        const shuffled = shuffle([...sourceCards]);
        const newIds = shuffled.slice(0, count).map(c => c.id);
        setSelectedCardIds(newIds);
      }
    } else {
      setSelectedCardIds(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sourceCards.length is sufficient, we don't want to re-shuffle on content changes
  }, [randomSelectionEnabled, randomSelectionCount, sourceCards.length, selectedCardIds]);

  // Shuffle or sort cards based on settings
  const { cards: shuffledCards } = useShuffledCards(selectedCards, {
    enabled: true,
    shuffleOnLoad,
  });

  // Apply sort when shuffle is disabled
  const sortedCards = useMemo(() => {
    if (shuffleOnLoad) {
      return shuffledCards;
    }
    // Sort by configured field when not shuffling
    const comparator = createFieldSortComparator(
      fieldMapping.sortField,
      fieldMapping.sortDirection
    );
    return [...shuffledCards].sort((a, b) =>
      comparator(
        a as unknown as Record<string, unknown>,
        b as unknown as Record<string, unknown>
      )
    );
  }, [shuffledCards, shuffleOnLoad, fieldMapping.sortField, fieldMapping.sortDirection]);

  // Apply custom order if set (from drag and drop)
  const cards = useMemo(() => {
    if (!customOrder) return sortedCards;
    const cardMap = new Map(sortedCards.map((c) => [c.id, c]));
    return customOrder
      .map((id) => cardMap.get(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
  }, [sortedCards, customOrder]);

  // Handle reorder from drag and drop
  const handleReorder = useCallback((newOrder: string[]) => {
    setCustomOrder(newOrder);
  }, []);

  // Track flipped card IDs in order (oldest first)
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);

  // Track previous setting to detect user changes
  const prevDefaultFaceRef = useRef<string | null>(null);
  // Track the card IDs we last initialized with (to detect actual changes)
  const lastInitializedIdsRef = useRef<string | null>(null);

  // Determine if cards are stable (not in the middle of random selection initialization)
  // When random selection is enabled but selectedCardIds is null, we're still initializing
  const cardsAreStable = !randomSelectionEnabled || selectedCardIds !== null;

  // Apply initial flip state and handle setting changes
  // Uses a single effect to avoid race conditions
  useEffect(() => {
    if (cards.length === 0 || !cardsAreStable) return;

    // Create a stable identifier for the current card set
    const currentIdsKey = cards.map(c => c.id).join(',');
    const isNewCardSet = lastInitializedIdsRef.current !== currentIdsKey;
    const settingChanged = prevDefaultFaceRef.current !== null &&
                          prevDefaultFaceRef.current !== defaultCardFace;

    // Initialize or update based on what changed
    if (isNewCardSet || settingChanged) {
      if (defaultCardFace === "front") {
        setFlippedCardIds(cards.map(c => c.id));
      } else if (settingChanged) {
        // Only clear if setting changed (not on initial load with "back")
        setFlippedCardIds([]);
      }
      // If isNewCardSet and defaultCardFace is "back", flippedCardIds stays empty (correct)
    }

    lastInitializedIdsRef.current = currentIdsKey;
    prevDefaultFaceRef.current = defaultCardFace;
  }, [cards, defaultCardFace, cardsAreStable]);

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
        // Flip: add to list
        const newList = [...prev, cardId];

        // Only enforce maxVisibleCards when default is "back"
        // When default is "front", allow unlimited flipped cards
        if (defaultCardFace === "back") {
          while (newList.length > maxVisibleCards) {
            newList.shift(); // Remove oldest (first)
          }
        }

        return newList;
      }
    });
  }, [maxVisibleCards, defaultCardFace]);

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
            cardNumber={index + 1}
            isFlipped={isFlipped}
            onFlip={() => { handleFlip(card.id); }}
            tabIndex={tabIndex}
            cardBackDisplay={cardBackDisplay}
            showRankBadge={showRankBadge}
            showFooterBadge={showFooterBadge}
            rankPlaceholderText={rankPlaceholderText}
            displayConfig={mergedDisplayConfig}
            cardSize={cardSizePreset}
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
        showFooterBadge={showFooterBadge}
        rankPlaceholderText={rankPlaceholderText}
        dragFace={dragFace}
        cardBackDisplay={cardBackDisplay}
        displayConfig={mergedDisplayConfig}
        cardSize={cardSizePreset}
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
