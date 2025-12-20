# F-014: Virtual Scrolling

## Problem Statement

Large card collections cause performance degradation. Currently:

1. All cards render regardless of visibility
2. No virtualisation for scroll performance
3. Memory usage grows linearly with card count
4. Scrolling becomes janky with 100+ cards

## Design Approach

Implement **TanStack Virtual** for efficient rendering of large card collections:

### Virtual Card Grid Component

```tsx
// src/components/VirtualCardGrid/VirtualCardGrid.tsx
import { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '../Card';
import type { CardData } from '../../types/card';
import styles from './VirtualCardGrid.module.css';

interface VirtualCardGridProps {
  cards: CardData[];
  cardWidth: number;
  cardHeight: number;
  gap: number;
  onCardClick?: (card: CardData) => void;
}

export function VirtualCardGrid({
  cards,
  cardWidth,
  cardHeight,
  gap,
  onCardClick,
}: VirtualCardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width for responsive columns
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
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

  // Virtual row renderer
  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => cardHeight + gap,
    overscan: 2, // Render 2 extra rows above/below viewport
  });

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div
        className={styles.virtualList}
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const rowIndex = virtualRow.index;
          const startIndex = rowIndex * columns;
          const rowCards = cards.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              className={styles.row}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${cardHeight}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                gap: `${gap}px`,
                justifyContent: 'flex-start',
              }}
            >
              {rowCards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                  }}
                  onClick={() => onCardClick?.(card)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### Memoised Card Component

```tsx
// src/components/Card/Card.tsx
import { memo, useCallback, CSSProperties } from 'react';
import type { CardData } from '../../types/card';
import styles from './Card.module.css';

interface CardProps {
  card: CardData;
  style?: CSSProperties;
  onClick?: () => void;
  isFlipped?: boolean;
}

export const Card = memo(function Card({
  card,
  style,
  onClick,
  isFlipped = false,
}: CardProps) {
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  return (
    <article
      className={styles.card}
      style={style}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isFlipped}
    >
      {card.imageUrl && (
        <img
          src={card.imageUrl}
          alt={card.name}
          className={styles.image}
          loading="lazy"
        />
      )}
      <div className={styles.content}>
        <h3 className={styles.name}>{card.name}</h3>
        {card.category && (
          <span className={styles.category}>{card.category}</span>
        )}
      </div>
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.isFlipped === nextProps.isFlipped &&
    prevProps.card.imageUrl === nextProps.card.imageUrl &&
    prevProps.style?.width === nextProps.style?.width &&
    prevProps.style?.height === nextProps.style?.height
  );
});
```

### Filtered Cards Hook with Memoisation

```typescript
// src/hooks/useFilteredCards.ts
import { useMemo } from 'react';
import type { CardData } from '../types/card';

interface FilterOptions {
  search: string;
  category: string | null;
  tags: string[];
  sortBy: 'name' | 'date' | 'category';
  sortOrder: 'asc' | 'desc';
}

export function useFilteredCards(
  cards: CardData[],
  filters: FilterOptions
): CardData[] {
  return useMemo(() => {
    let filtered = [...cards];

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchLower) ||
        card.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(card => card.category === filters.category);
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter(card =>
        filters.tags.some(tag => card.tags?.includes(tag))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = (a.category ?? '').localeCompare(b.category ?? '');
          break;
        case 'date':
          comparison = (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0);
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [cards, filters.search, filters.category, filters.tags, filters.sortBy, filters.sortOrder]);
}
```

### Adaptive Grid Wrapper

```tsx
// src/components/AdaptiveCardGrid/AdaptiveCardGrid.tsx
import { useMemo } from 'react';
import { CardGrid } from '../CardGrid/CardGrid';
import { VirtualCardGrid } from '../VirtualCardGrid/VirtualCardGrid';
import type { CardData } from '../../types/card';

interface AdaptiveCardGridProps {
  cards: CardData[];
  cardWidth: number;
  cardHeight: number;
  gap: number;
  onCardClick?: (card: CardData) => void;
}

const VIRTUALIZATION_THRESHOLD = 100;

export function AdaptiveCardGrid({
  cards,
  cardWidth,
  cardHeight,
  gap,
  onCardClick,
}: AdaptiveCardGridProps) {
  const shouldVirtualise = useMemo(() => {
    return cards.length > VIRTUALIZATION_THRESHOLD;
  }, [cards.length]);

  if (shouldVirtualise) {
    return (
      <VirtualCardGrid
        cards={cards}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
        gap={gap}
        onCardClick={onCardClick}
      />
    );
  }

  return (
    <CardGrid
      cards={cards}
      cardWidth={cardWidth}
      cardHeight={cardHeight}
      gap={gap}
      onCardClick={onCardClick}
    />
  );
}
```

### Scroll Position Restoration

```typescript
// src/hooks/useScrollRestoration.ts
import { useEffect, useRef, RefObject } from 'react';

const STORAGE_KEY = 'itemdeck-scroll-position';

export function useScrollRestoration<T extends HTMLElement>(
  containerRef: RefObject<T>,
  collectionId: string
): void {
  const restoredRef = useRef(false);

  // Restore scroll position on mount
  useEffect(() => {
    if (!containerRef.current || restoredRef.current) return;

    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const positions = JSON.parse(stored) as Record<string, number>;
      const savedPosition = positions[collectionId];
      if (savedPosition !== undefined) {
        containerRef.current.scrollTop = savedPosition;
      }
    }
    restoredRef.current = true;
  }, [containerRef, collectionId]);

  // Save scroll position on scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      const positions = stored ? JSON.parse(stored) : {};
      positions[collectionId] = container.scrollTop;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef, collectionId]);
}
```

## Implementation Tasks

- [ ] Install TanStack Virtual: `npm install @tanstack/react-virtual`
- [ ] Create `VirtualCardGrid` component
- [ ] Add `React.memo()` to Card component with custom comparison
- [ ] Create `useFilteredCards` hook with `useMemo()`
- [ ] Create `AdaptiveCardGrid` that switches at threshold
- [ ] Implement scroll position restoration
- [ ] Configure overscan for smooth scrolling
- [ ] Handle dynamic row heights if needed
- [ ] Ensure keyboard navigation works with virtualisation
- [ ] Add ARIA attributes for accessibility
- [ ] Write performance tests
- [ ] Profile with React DevTools

## Success Criteria

- [ ] Virtualisation activates above 100 cards
- [ ] Smooth 60fps scrolling with 1000+ cards
- [ ] Memory usage capped regardless of card count
- [ ] Keyboard navigation works correctly
- [ ] Scroll position restored on navigation
- [ ] No visual flickering during scroll
- [ ] Render time < 16ms for visible cards
- [ ] Tests pass

## Dependencies

- **Requires**: v0.3.0 complete
- **Blocks**: None

## Complexity

**Medium** - Integration with existing grid layout requires careful handling of row/column calculations.

---

## Related Documentation

- [Performance & Virtualisation Research](../../../../research/performance-virtualisation.md)
- [ADR-006: TanStack Virtual for Large Lists](../../../decisions/adrs/ADR-006-virtualisation.md)
- [v0.4.0 Milestone](../../milestones/v0.4.0.md)
