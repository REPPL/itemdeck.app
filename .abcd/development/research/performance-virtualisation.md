# Performance & Virtualisation

## Executive Summary

For Itemdeck's performance with large card collections, implement **TanStack Virtual** for list virtualisation when displaying 100+ cards. Key optimisations include **React.memo()** for card components, **useMemo/useCallback** for expensive computations, and **intersection observer** for lazy image loading.

Key recommendations:
1. Virtualise card grid when collection exceeds 100 cards
2. Use TanStack Virtual for headless virtualisation with full styling control
3. Implement image lazy loading with Intersection Observer
4. Profile with React DevTools before optimising

## Current State in Itemdeck

Itemdeck currently uses:
- **100 mock cards** - well within non-virtualised limits
- **ResizeObserver** for responsive grid
- **Absolute positioning** for card placement
- **No lazy loading** - images not yet loaded

Performance optimisation is not yet critical but should be planned for scale.

## Research Findings

### When to Virtualise

| Card Count | Virtualisation | Notes |
|------------|----------------|-------|
| 1-50 | Not needed | Standard rendering fine |
| 50-200 | Optional | Consider if animations heavy |
| 200-1000 | Recommended | Noticeable performance impact |
| 1000+ | Required | Browser will struggle |

### Virtualisation Libraries Comparison

| Library | Weekly Downloads | Bundle Size | TypeScript | Headless |
|---------|-----------------|-------------|------------|----------|
| [TanStack Virtual](https://tanstack.com/virtual) | 800k | 10-15KB | ✅ Native | ✅ Yes |
| [react-window](https://github.com/bvaughn/react-window) | 1.8M | 6KB | ✅ @types | ❌ No |
| [react-virtuoso](https://virtuoso.dev/) | 400k | 20KB | ✅ Native | ❌ No |
| [react-virtualized](https://github.com/bvaughn/react-virtualized) | 1.5M | 35KB | ✅ @types | ❌ No |

**Recommendation:** TanStack Virtual for headless control matching Itemdeck's custom grid layout.

### TanStack Virtual Implementation

```tsx
// src/components/VirtualCardGrid/VirtualCardGrid.tsx
import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card } from '../Card';
import type { CardData } from '../../types/card';
import styles from './VirtualCardGrid.module.css';

interface VirtualCardGridProps {
  cards: CardData[];
  cardWidth: number;
  cardHeight: number;
  gap: number;
}

export function VirtualCardGrid({
  cards,
  cardWidth,
  cardHeight,
  gap,
}: VirtualCardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate columns based on container width
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const columns = useMemo(() => {
    if (containerWidth === 0) return 1;
    return Math.max(1, Math.floor((containerWidth + gap) / (cardWidth + gap)));
  }, [containerWidth, cardWidth, gap]);

  const rows = useMemo(() => {
    return Math.ceil(cards.length / columns);
  }, [cards.length, columns]);

  // Virtual rows
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
              }}
            >
              {rowCards.map((card, colIndex) => (
                <Card
                  key={card.id}
                  card={card}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                  }}
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

### Memoisation Strategies

```tsx
// src/components/Card/Card.tsx
import { memo, useCallback } from 'react';

interface CardProps {
  card: CardData;
  onFlip?: (id: string) => void;
  isFlipped?: boolean;
}

// Memo with custom comparison
export const Card = memo(function Card({
  card,
  onFlip,
  isFlipped = false,
}: CardProps) {
  const handleClick = useCallback(() => {
    onFlip?.(card.id);
  }, [card.id, onFlip]);

  return (
    <article className={styles.card} onClick={handleClick}>
      {/* Card content */}
    </article>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these change
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.isFlipped === nextProps.isFlipped &&
    prevProps.card.imageUrl === nextProps.card.imageUrl
  );
});
```

### useMemo for Expensive Computations

```tsx
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
          comparison = (a.createdAt ?? 0) - (b.createdAt ?? 0);
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [cards, filters.search, filters.category, filters.tags, filters.sortBy, filters.sortOrder]);
}
```

### Intersection Observer for Lazy Loading

```tsx
// src/hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0, rootMargin = '100px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}

// Usage in Card component
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '200px',
  });

  return (
    <div ref={ref} className={styles.imageContainer}>
      {isVisible ? (
        <img src={src} alt={alt} loading="lazy" />
      ) : (
        <div className={styles.placeholder} />
      )}
    </div>
  );
}
```

### Performance Profiling

```tsx
// src/utils/performance.ts

// Measure render time
export function measureRender(componentName: string) {
  if (import.meta.env.DEV) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 16) { // Longer than one frame (60fps)
        console.warn(`${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  }
  return () => {};
}

// Usage in component
function CardGrid({ cards }: { cards: CardData[] }) {
  const endMeasure = measureRender('CardGrid');

  // ... render logic

  useEffect(() => {
    endMeasure();
  });

  return <div>{/* content */}</div>;
}
```

### React DevTools Profiler Usage

```tsx
// src/components/ProfilerWrapper.tsx
import { Profiler, ProfilerOnRenderCallback, ReactNode } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (import.meta.env.DEV && actualDuration > 16) {
    console.table({
      id,
      phase,
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
    });
  }
};

export function ProfilerWrapper({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  if (!import.meta.env.DEV) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
```

### Bundle Size Optimisation

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'animation': ['framer-motion'],
          'query': ['@tanstack/react-query'],
          'virtual': ['@tanstack/react-virtual'],
        },
      },
    },
    // Enable source map for production debugging
    sourcemap: true,
    // Minify with terser for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

### Performance Checklist

```markdown
## Before Optimising
- [ ] Profile with React DevTools Profiler
- [ ] Measure with Chrome DevTools Performance tab
- [ ] Identify specific bottlenecks
- [ ] Set performance budgets

## Quick Wins
- [ ] Add React.memo() to expensive components
- [ ] Use useMemo() for filtered/sorted data
- [ ] Use useCallback() for event handlers passed as props
- [ ] Implement lazy loading for images

## Virtualisation (if needed)
- [ ] Install @tanstack/react-virtual
- [ ] Wrap card grid with virtualiser
- [ ] Configure appropriate overscan
- [ ] Handle resize with ResizeObserver

## Bundle Optimisation
- [ ] Split vendor chunks
- [ ] Lazy load routes/features
- [ ] Enable tree shaking
- [ ] Analyse bundle with vite-plugin-visualizer
```

## Recommendations for Itemdeck

### Priority 1: Baseline Performance

1. **Add React.memo()** to Card component
2. **Use useMemo()** for filtered cards
3. **Profile with React DevTools** before further optimisation

### Priority 2: Image Lazy Loading

1. **Implement useIntersectionObserver hook**
2. **Lazy load images** as they enter viewport
3. **Add loading="lazy"** to img elements

### Priority 3: Virtualisation (When Needed)

1. **Install TanStack Virtual**: `npm install @tanstack/react-virtual`
2. **Create VirtualCardGrid** component
3. **Switch to virtual grid** when cards > 100

### Priority 4: Bundle Optimisation

1. **Configure code splitting** in Vite
2. **Lazy load settings panel** and other modals
3. **Analyse bundle** with visualiser

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.x"
  },
  "devDependencies": {
    "rollup-plugin-visualizer": "^5.x"
  }
}
```

### Bundle Size Impact

- @tanstack/react-virtual: ~10-15KB gzipped
- React.memo/useMemo/useCallback: 0KB (built-in)

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Render 100 cards | < 16ms | React Profiler |
| Scroll performance | 60fps | Chrome DevTools |
| Bundle size (gzipped) | < 150KB | Vite build |

### When NOT to Optimise

- Don't add React.memo() to every component
- Don't virtualise < 100 items
- Don't add useMemo() for simple computations
- Profile first, optimise second

## References

- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Optimising Performance - React](https://legacy.reactjs.org/docs/optimizing-performance.html)
- [Speed Up Long Lists with TanStack Virtual - LogRocket](https://blog.logrocket.com/speed-up-long-lists-tanstack-virtual/)
- [react-window Documentation](https://react-window.vercel.app/)
- [Web Vitals](https://web.dev/vitals/)

---

## Related Documentation

### Research
- [Card Layouts & Animations](./card-layouts-animations.md) - Animation performance
- [Asset Management](./asset-management.md) - Image loading strategies
- [Testing Strategies](./testing-strategies.md) - Performance testing

### Features
- [F-014: Virtual Scrolling](../roadmap/features/completed/F-014-virtual-scrolling.md) - Virtualisation implementation
- [F-015: Image Lazy Loading](../roadmap/features/completed/F-015-image-lazy-loading.md) - Lazy loading implementation

---

**Applies to**: Itemdeck v0.1.0+
