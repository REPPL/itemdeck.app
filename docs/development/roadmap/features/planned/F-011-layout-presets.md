# F-011: Layout Presets

## Problem Statement

Users have different preferences for viewing card collections. Currently:

1. Only grid layout is available
2. No way to switch between display modes
3. Fixed card sizing with limited flexibility
4. No masonry or list view options

## Design Approach

Implement **layout presets** with four options: grid, masonry, list, and compact:

### Layout Type Definitions

```typescript
// src/types/layout.ts
export type LayoutType = 'grid' | 'masonry' | 'list' | 'compact';

export interface LayoutConfig {
  type: LayoutType;
  columns?: number | 'auto';
  gap?: number;
  cardWidth?: number;
  cardHeight?: number;
  aspectRatio?: string;
}

export const layoutPresets: Record<LayoutType, LayoutConfig> = {
  grid: {
    type: 'grid',
    columns: 'auto', // auto-fill based on container
    gap: 16,
    cardWidth: 300,
    cardHeight: 420,
  },
  masonry: {
    type: 'masonry',
    columns: 4,
    gap: 16,
    cardWidth: 280,
    // height varies per card
  },
  list: {
    type: 'list',
    columns: 1,
    gap: 8,
    cardWidth: undefined, // full width
    cardHeight: 100,
  },
  compact: {
    type: 'compact',
    columns: 'auto',
    gap: 8,
    cardWidth: 150,
    cardHeight: 210,
  },
};
```

### Layout Context

```typescript
// src/context/LayoutContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { LayoutType, LayoutConfig } from '../types/layout';
import { layoutPresets } from '../types/layout';

interface LayoutContextValue {
  layout: LayoutType;
  config: LayoutConfig;
  setLayout: (layout: LayoutType) => void;
  customise: (overrides: Partial<LayoutConfig>) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutType>('grid');
  const [customOverrides, setCustomOverrides] = useState<Partial<LayoutConfig>>({});

  const config: LayoutConfig = {
    ...layoutPresets[layout],
    ...customOverrides,
  };

  const setLayout = useCallback((newLayout: LayoutType) => {
    setLayoutState(newLayout);
    setCustomOverrides({}); // Reset overrides when changing preset
  }, []);

  const customise = useCallback((overrides: Partial<LayoutConfig>) => {
    setCustomOverrides((prev) => ({ ...prev, ...overrides }));
  }, []);

  return (
    <LayoutContext.Provider value={{ layout, config, setLayout, customise }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return context;
}
```

### Layout Switcher Component

```tsx
// src/components/LayoutSwitcher/LayoutSwitcher.tsx
import { useLayout } from '../../context/LayoutContext';
import type { LayoutType } from '../../types/layout';
import styles from './LayoutSwitcher.module.css';

interface LayoutOption {
  type: LayoutType;
  label: string;
  icon: React.ReactNode;
}

const layoutOptions: LayoutOption[] = [
  { type: 'grid', label: 'Grid', icon: <GridIcon /> },
  { type: 'masonry', label: 'Masonry', icon: <MasonryIcon /> },
  { type: 'list', label: 'List', icon: <ListIcon /> },
  { type: 'compact', label: 'Compact', icon: <CompactIcon /> },
];

export function LayoutSwitcher() {
  const { layout, setLayout } = useLayout();

  return (
    <div className={styles.container} role="radiogroup" aria-label="Layout options">
      {layoutOptions.map(({ type, label, icon }) => (
        <button
          key={type}
          onClick={() => setLayout(type)}
          className={`${styles.button} ${layout === type ? styles.active : ''}`}
          role="radio"
          aria-checked={layout === type}
          title={label}
        >
          {icon}
          <span className={styles.label}>{label}</span>
        </button>
      ))}
    </div>
  );
}
```

### Masonry Grid Component

```tsx
// src/components/MasonryGrid/MasonryGrid.tsx
import { useMemo, ReactNode, CSSProperties } from 'react';
import styles from './MasonryGrid.module.css';

interface MasonryGridProps {
  children: ReactNode[];
  columns?: number;
  gap?: number;
}

export function MasonryGrid({ children, columns = 4, gap = 16 }: MasonryGridProps) {
  const columnItems = useMemo(() => {
    const cols: ReactNode[][] = Array.from({ length: columns }, () => []);

    children.forEach((child, index) => {
      cols[index % columns].push(child);
    });

    return cols;
  }, [children, columns]);

  const style: CSSProperties = {
    '--masonry-columns': columns,
    '--masonry-gap': `${gap}px`,
  } as CSSProperties;

  return (
    <div className={styles.container} style={style}>
      {columnItems.map((items, colIndex) => (
        <div key={colIndex} className={styles.column}>
          {items}
        </div>
      ))}
    </div>
  );
}
```

```css
/* src/components/MasonryGrid/MasonryGrid.module.css */
.container {
  display: flex;
  gap: var(--masonry-gap);
  width: 100%;
}

.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--masonry-gap);
}
```

### Adaptive Layout Container

```tsx
// src/components/AdaptiveLayout/AdaptiveLayout.tsx
import { useLayout } from '../../context/LayoutContext';
import { CardGrid } from '../CardGrid/CardGrid';
import { MasonryGrid } from '../MasonryGrid/MasonryGrid';
import { ListView } from '../ListView/ListView';
import type { CardData } from '../../types/card';

interface AdaptiveLayoutProps {
  cards: CardData[];
  onCardClick?: (card: CardData) => void;
}

export function AdaptiveLayout({ cards, onCardClick }: AdaptiveLayoutProps) {
  const { layout, config } = useLayout();

  switch (layout) {
    case 'masonry':
      return (
        <MasonryGrid columns={config.columns as number} gap={config.gap}>
          {cards.map((card) => (
            <Card key={card.id} data={card} onClick={() => onCardClick?.(card)} />
          ))}
        </MasonryGrid>
      );

    case 'list':
      return (
        <ListView cards={cards} onCardClick={onCardClick} />
      );

    case 'compact':
    case 'grid':
    default:
      return (
        <CardGrid
          cards={cards}
          cardWidth={config.cardWidth}
          cardHeight={config.cardHeight}
          gap={config.gap}
          onCardClick={onCardClick}
        />
      );
  }
}
```

### List View Component

```tsx
// src/components/ListView/ListView.tsx
import type { CardData } from '../../types/card';
import styles from './ListView.module.css';

interface ListViewProps {
  cards: CardData[];
  onCardClick?: (card: CardData) => void;
}

export function ListView({ cards, onCardClick }: ListViewProps) {
  return (
    <div className={styles.list} role="list">
      {cards.map((card) => (
        <button
          key={card.id}
          className={styles.item}
          onClick={() => onCardClick?.(card)}
          role="listitem"
        >
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt=""
              className={styles.thumbnail}
              loading="lazy"
            />
          )}
          <div className={styles.content}>
            <h3 className={styles.name}>{card.name}</h3>
            {card.description && (
              <p className={styles.description}>{card.description}</p>
            )}
          </div>
          {card.category && (
            <span className={styles.category}>{card.category}</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

## Implementation Tasks

- [ ] Create `src/types/layout.ts` with layout definitions
- [ ] Create `LayoutContext` and `LayoutProvider`
- [ ] Create `useLayout` hook
- [ ] Create `LayoutSwitcher` component with icons
- [ ] Create `MasonryGrid` component (CSS-based)
- [ ] Create `ListView` component
- [ ] Create `AdaptiveLayout` container component
- [ ] Modify `CardGrid` to accept layout config
- [ ] Add smooth transitions between layouts
- [ ] Persist layout preference to localStorage
- [ ] Ensure keyboard navigation works in all layouts
- [ ] Test responsive behaviour
- [ ] Write unit tests for layout switching
- [ ] Write visual tests for each layout

## Success Criteria

- [ ] Four layout options available (grid, masonry, list, compact)
- [ ] Layout switcher is keyboard accessible
- [ ] Smooth animated transitions between layouts
- [ ] Layout preference persists across sessions
- [ ] All layouts work responsively
- [ ] Keyboard navigation works in all layouts
- [ ] Screen readers announce layout changes
- [ ] Tests pass

## Dependencies

- **Requires**: F-010 Theme System (uses CSS variables)
- **Blocks**: F-013 Settings Panel

## Complexity

**Medium** - Multiple layout implementations with consistent card rendering.

---

## Related Documentation

- [Customisation Options Research](../../../../research/customisation-options.md)
- [Card Layouts & Animations Research](../../../../research/card-layouts-animations.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)
