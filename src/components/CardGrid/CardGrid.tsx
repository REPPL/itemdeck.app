import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "@/components/Card/Card";
import { DraggableCardGrid } from "@/components/DraggableCardGrid";
import { SearchBar } from "@/components/SearchBar";
import { CardGroup } from "@/components/CardGroup";
import { CardListItem } from "@/components/CardListItem";
import { CardCompactItem } from "@/components/CardCompactItem";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useSettingsContext } from "@/hooks/useSettingsContext";
import { useGridNavigation } from "@/hooks/useGridNavigation";
import { useShuffledCards } from "@/hooks/useShuffledCards";
import { useSettingsStore } from "@/stores/settingsStore";
import { useMechanicContext, useMechanicCardActions } from "@/mechanics";
import { useMemoryStore } from "@/mechanics/memory/store";
import { createFieldSortComparator, resolveFieldPath } from "@/utils/fieldPathResolver";
import { shuffle } from "@/utils/shuffle";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import type { CardDisplayConfig } from "@/types/display";
import type { DisplayCard } from "@/hooks/useCollection";
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
  // Derive showRankBadge from topBadgeField (when not "none")
  const topBadgeField = useSettingsStore((state) => state.fieldMapping.topBadgeField);
  const showRankBadge = topBadgeField !== "none";
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

  // v0.11.0: Search & Filter state
  const searchQuery = useSettingsStore((state) => state.searchQuery);
  const searchFields = useSettingsStore((state) => state.searchFields);
  const searchScope = useSettingsStore((state) => state.searchScope);
  const activeFilters = useSettingsStore((state) => state.activeFilters);
  const groupByField = useSettingsStore((state) => state.groupByField);
  const collapsedGroups = useSettingsStore((state) => state.collapsedGroups);
  const layout = useSettingsStore((state) => state.layout);
  const showSearchBar = useSettingsStore((state) => state.showSearchBar);

  // v0.11.0: Mechanics integration
  const { mechanic, state: mechanicState } = useMechanicContext();
  const mechanicCardActions = useMechanicCardActions();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [customOrder, setCustomOrder] = useState<string[] | null>(null);

  // Track flipped card IDs in order (oldest first)
  // Declared early because filteredCards depends on it for "visible" search scope
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);

  // Merge settings-based field mapping with collection displayConfig
  // Settings take precedence for user overrides
  const mergedDisplayConfig = useMemo((): CardDisplayConfig => {
    const base = displayConfig ?? {};
    return {
      front: {
        title: base.front?.title ?? fieldMapping.titleField,
        subtitle: fieldMapping.subtitleField !== "none" ? fieldMapping.subtitleField : undefined,
        badge: base.front?.badge ?? "order",
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

  // Helper function to check if a card matches a single search term
  const cardMatchesTerm = useCallback((card: DisplayCard, term: string): boolean => {
    const lowerTerm = term.toLowerCase();
    return searchFields.some((field) => {
      const value = resolveFieldPath(card as unknown as Record<string, unknown>, field);
      if (value === null || value === undefined) return false;
      const strValue = typeof value === "object" ? JSON.stringify(value) : String(value as string | number | boolean);
      return strValue.toLowerCase().includes(lowerTerm);
    });
  }, [searchFields]);

  // Parse boolean search query into tokens
  // Supports: AND, OR, NOT/-prefix, "exact phrases"
  const parseSearchQuery = useCallback((query: string): { type: "and" | "or" | "not" | "term"; value: string }[] => {
    const tokens: { type: "and" | "or" | "not" | "term"; value: string }[] = [];
    const trimmed = query.trim();
    if (!trimmed) return tokens;

    // Match quoted phrases, operators (AND/OR/NOT), -prefixed terms, or regular words
    const regex = /"([^"]+)"|(\bAND\b|\bOR\b|\bNOT\b)|(-\S+)|(\S+)/gi;
    let match;

    while ((match = regex.exec(trimmed)) !== null) {
      if (match[1]) {
        // Quoted phrase
        tokens.push({ type: "term", value: match[1] });
      } else if (match[2]) {
        // Boolean operator
        const op = match[2].toUpperCase();
        if (op === "AND") tokens.push({ type: "and", value: "" });
        else if (op === "OR") tokens.push({ type: "or", value: "" });
        else if (op === "NOT") tokens.push({ type: "not", value: "" });
      } else if (match[3]) {
        // -prefixed term (NOT shorthand)
        tokens.push({ type: "not", value: "" });
        tokens.push({ type: "term", value: match[3].slice(1) });
      } else if (match[4]) {
        // Regular term
        tokens.push({ type: "term", value: match[4] });
      }
    }

    return tokens;
  }, []);

  // Helper function to apply text search with boolean operators to a card array
  // Supports: AND, OR, NOT/-prefix, "exact phrases"
  // Default operator between terms is AND
  const applySearch = useCallback((cardsToSearch: DisplayCard[], query: string): DisplayCard[] => {
    if (!query.trim()) return cardsToSearch;

    const tokens = parseSearchQuery(query);
    if (tokens.length === 0) return cardsToSearch;

    return cardsToSearch.filter((card) => {
      let result: boolean | null = null; // null = not yet set
      let pendingOp: "and" | "or" = "and"; // Default operator
      let negateNext = false;

      for (const token of tokens) {
        if (token.type === "and") {
          pendingOp = "and";
        } else if (token.type === "or") {
          pendingOp = "or";
        } else if (token.type === "not") {
          negateNext = true;
        } else if (token.type === "term" && token.value) {
          let matches = cardMatchesTerm(card, token.value);
          if (negateNext) {
            matches = !matches;
            negateNext = false;
          }

          if (result === null) {
            // First term - just set the result
            result = matches;
          } else if (pendingOp === "and") {
            result = result && matches;
          } else {
            result = result || matches;
          }
          // Reset to default AND for implicit operators between terms
          pendingOp = "and";
        }
      }

      return result ?? true; // If no terms, return true (show all)
    });
  }, [parseSearchQuery, cardMatchesTerm]);

  // v0.11.0: Apply search and filter
  // searchScope: "all" = search all cards in the current set
  // searchScope: "visible" = search only face-up (flipped) cards
  const filteredCards = useMemo(() => {
    let result: DisplayCard[];

    if (searchScope === "visible" && searchQuery.trim()) {
      // Search only within face-up (flipped) cards
      const faceUpCards = sortedCards.filter(card => flippedCardIds.includes(card.id));
      result = applySearch(faceUpCards, searchQuery);
    } else {
      // Search all cards in the current set
      result = applySearch(sortedCards, searchQuery);
    }

    // Apply active filters
    for (const filter of activeFilters) {
      if (filter.values.length === 0) continue;
      result = result.filter((card) => {
        const value = resolveFieldPath(card as unknown as Record<string, unknown>, filter.field);
        if (value === null || value === undefined) return false;
        const strValue = typeof value === "object" ? JSON.stringify(value) : String(value as string | number | boolean);
        return filter.values.includes(strValue);
      });
    }

    return result;
  }, [sortedCards, searchQuery, searchScope, applySearch, activeFilters, flippedCardIds]);

  // Apply custom order if set (from drag and drop)
  const baseCards = useMemo(() => {
    if (!customOrder) return filteredCards;
    const cardMap = new Map(filteredCards.map((c) => [c.id, c]));
    return customOrder
      .map((id) => cardMap.get(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
  }, [filteredCards, customOrder]);

  // Get resetCount from mechanic state to trigger re-shuffle on reset
  const mechanicResetCount = (mechanicState as { resetCount?: number } | null)?.resetCount;

  // Get memory game settings
  const memoryPairCount = useMemoryStore((s) => s.pairCount);

  // v0.11.0: Transform cards for active mechanic
  // For memory game: duplicate cards and shuffle to create pairs
  const cards = useMemo(() => {
    if (!mechanic) return baseCards;

    // Memory game needs pairs of cards
    if (mechanic.manifest.id === "memory") {
      // Use the configured pair count from settings, limited to available cards
      const maxPairs = Math.min(
        Math.floor(baseCards.length),
        memoryPairCount
      );
      const selectedForPairs = baseCards.slice(0, maxPairs);

      // Duplicate each card with unique ID suffix for matching
      const pairedCards: DisplayCard[] = [];
      for (const card of selectedForPairs) {
        // Original card
        pairedCards.push({ ...card, id: `${card.id}-a` });
        // Duplicate for pair
        pairedCards.push({ ...card, id: `${card.id}-b` });
      }

      // Shuffle the paired cards
      return shuffle(pairedCards);
    }

    return baseCards;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCards, mechanic, mechanicResetCount, memoryPairCount]); // mechanicResetCount triggers re-shuffle on reset

  // v0.11.0: Initialize mechanic game state when cards change
  useEffect(() => {
    if (mechanic?.manifest.id === "memory" && cards.length > 0) {
      // Initialize memory game with card IDs
      const memoryState = mechanic.getState() as unknown as { initGame?: (ids: string[]) => void };
      if (typeof memoryState.initGame === "function") {
        memoryState.initGame(cards.map((c) => c.id));
      }
    }
  }, [mechanic, cards]);

  // Handle reorder from drag and drop
  const handleReorder = useCallback((newOrder: string[]) => {
    setCustomOrder(newOrder);
  }, []);

  // v0.11.0: Group cards by field
  const groupedCards = useMemo(() => {
    if (!groupByField || groupByField === "none") {
      return null; // No grouping
    }

    const groups = new Map<string, DisplayCard[]>();
    for (const card of cards) {
      let groupKey: string;
      if (groupByField === "decade") {
        // Special handling for decade grouping
        const year = resolveFieldPath(card as unknown as Record<string, unknown>, "year");
        if (year !== null && year !== undefined) {
          const yearNum = Number(year);
          groupKey = `${String(Math.floor(yearNum / 10) * 10)}s`;
        } else {
          groupKey = "Unknown";
        }
      } else {
        const value = resolveFieldPath(card as unknown as Record<string, unknown>, groupByField);
        if (value !== null && value !== undefined) {
          groupKey = typeof value === "object" ? JSON.stringify(value) : String(value as string | number | boolean);
        } else {
          groupKey = "Unknown";
        }
      }

      const existing = groups.get(groupKey);
      if (existing) {
        existing.push(card);
      } else {
        groups.set(groupKey, [card]);
      }
    }

    // Convert to array and sort by group key
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, groupCards]) => ({ key, cards: groupCards }));
  }, [cards, groupByField]);

  // Compute filter options for SearchBar
  const filterOptions = useMemo(() => {
    const platforms = new Set<string>();
    const years = new Set<number>();
    const genres = new Set<string>();

    for (const card of sourceCards) {
      const platformValue = resolveFieldPath(card as unknown as Record<string, unknown>, "platform.shortTitle");
      if (platformValue && typeof platformValue === "string") platforms.add(platformValue);

      const yearValue = resolveFieldPath(card as unknown as Record<string, unknown>, "year");
      if (yearValue !== null && yearValue !== undefined) years.add(Number(yearValue));

      const genresValue = resolveFieldPath(card as unknown as Record<string, unknown>, "genres");
      if (Array.isArray(genresValue)) {
        genresValue.forEach((g: unknown) => genres.add(String(g)));
      }
    }

    return {
      platforms: Array.from(platforms).sort(),
      years: Array.from(years).sort((a, b) => b - a),
      genres: Array.from(genres).sort(),
    };
  }, [sourceCards]);

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
  // When mechanic is active, delegate to mechanic's onClick handler
  const handleFlip = useCallback((cardId: string) => {
    // If mechanic is active, use its card actions
    if (mechanicCardActions) {
      // Check if card can be interacted with
      if (mechanicCardActions.canInteract && !mechanicCardActions.canInteract(cardId)) {
        return;
      }
      if (mechanicCardActions.onClick) {
        mechanicCardActions.onClick(cardId);
      }
      return;
    }

    // Default flip behaviour
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
  }, [maxVisibleCards, defaultCardFace, mechanicCardActions]);

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
  // Re-run when dragModeEnabled, layout, or mechanic changes so we measure when switching views
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
  }, [dragModeEnabled, layout, mechanic]);

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

      // When mechanic is active, use its highlight state for flip display
      // For memory game: cards are "flipped" when they're highlighted by the mechanic
      const isFlipped = mechanicCardActions?.isHighlighted
        ? mechanicCardActions.isHighlighted(card.id)
        : flippedCardIds.includes(card.id);
      const tabIndex = getTabIndex(index);

      // Get CardOverlay component from active mechanic
      const CardOverlay = mechanic?.CardOverlay;

      return (
        <div
          key={card.id}
          className={styles.card}
          style={{
            left: `${String(pos.left)}px`,
            top: `${String(pos.top)}px`,
            width: `${String(cardDimensions.width)}px`,
            height: `${String(cardDimensions.height)}px`,
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
          {/* Render mechanic card overlay */}
          {CardOverlay && <CardOverlay cardId={card.id} />}
        </div>
      );
    });
  };

  // Render draggable grid when drag mode is enabled AND layout is grid
  // (drag mode only works with grid layout)
  // Disable drag mode when a mechanic is active - mechanics control card interaction
  if (dragModeEnabled && !mechanic && layout === "grid" && !isLoading && !error && cards.length > 0) {
    return (
      <>
        {showSearchBar && !mechanic && (
          <SearchBar
            totalCards={sourceCards.length}
            filteredCount={cards.length}
            filterOptions={filterOptions}
          />
        )}
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
      </>
    );
  }

  // Render list view
  if (layout === "list" && !isLoading && !error) {
    return (
      <>
        {showSearchBar && !mechanic && (
          <SearchBar
            totalCards={sourceCards.length}
            filteredCount={cards.length}
            filterOptions={filterOptions}
          />
        )}
        <div className={styles.listContainer}>
          {groupedCards ? (
            groupedCards.map((group) => (
              <CardGroup
                key={group.key}
                groupKey={group.key}
                cardCount={group.cards.length}
                isCollapsed={collapsedGroups.includes(group.key)}
              >
                {group.cards.map((card, idx) => (
                  <CardListItem
                    key={card.id}
                    card={card}
                    cardNumber={idx + 1}
                  />
                ))}
              </CardGroup>
            ))
          ) : (
            cards.map((card, idx) => (
              <CardListItem
                key={card.id}
                card={card}
                cardNumber={idx + 1}
              />
            ))
          )}
          {cards.length === 0 && (
            <div className={styles.empty}>No cards to display</div>
          )}
        </div>
      </>
    );
  }

  // Render compact view
  if (layout === "compact" && !isLoading && !error) {
    return (
      <>
        {showSearchBar && !mechanic && (
          <SearchBar
            totalCards={sourceCards.length}
            filteredCount={cards.length}
            filterOptions={filterOptions}
          />
        )}
        <div className={styles.compactContainer}>
          {groupedCards ? (
            groupedCards.map((group) => (
              <CardGroup
                key={group.key}
                groupKey={group.key}
                cardCount={group.cards.length}
                isCollapsed={collapsedGroups.includes(group.key)}
              >
                <div className={styles.compactGrid}>
                  {group.cards.map((card, idx) => (
                    <CardCompactItem
                      key={card.id}
                      card={card}
                      cardNumber={idx + 1}
                    />
                  ))}
                </div>
              </CardGroup>
            ))
          ) : (
            <div className={styles.compactGrid}>
              {cards.map((card, idx) => (
                <CardCompactItem
                  key={card.id}
                  card={card}
                  cardNumber={idx + 1}
                />
              ))}
            </div>
          )}
          {cards.length === 0 && (
            <div className={styles.empty}>No cards to display</div>
          )}
        </div>
      </>
    );
  }

  // Get GridOverlay component from active mechanic
  const GridOverlay = mechanic?.GridOverlay;

  // Default grid view
  return (
    <>
      {/* Mechanic top overlay (stats bar, etc.) */}
      {GridOverlay && <GridOverlay position="top" />}

      {/* SearchBar hidden when mechanic is active (game info bar takes precedence) */}
      {showSearchBar && !mechanic && (
        <SearchBar
          totalCards={sourceCards.length}
          filteredCount={cards.length}
          filterOptions={filterOptions}
        />
      )}
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

      {/* Mechanic bottom overlay (completion modal, etc.) */}
      {GridOverlay && <GridOverlay position="bottom" />}
    </>
  );
}
