# F-012: State Persistence

## Problem Statement

User preferences and application state are lost on page refresh. Currently:

1. Settings reset to defaults on every page load
2. No offline data caching for cards
3. Filter/sort state not preserved or shareable
4. No cross-tab synchronisation

## Design Approach

Implement **Zustand with persist middleware** for settings and **IndexedDB** for larger data:

### Settings Store with Persistence

```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  // Appearance
  theme: 'light' | 'dark' | 'system';

  // Card dimensions
  cardWidth: number;
  cardHeight: number;
  gap: number;

  // Layout
  layout: 'grid' | 'masonry' | 'list' | 'compact';

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCardDimensions: (width: number, height: number) => void;
  setGap: (gap: number) => void;
  setLayout: (layout: 'grid' | 'masonry' | 'list' | 'compact') => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS = {
  theme: 'system' as const,
  cardWidth: 200,
  cardHeight: 280,
  gap: 16,
  layout: 'grid' as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),
      setCardDimensions: (cardWidth, cardHeight) => set({ cardWidth, cardHeight }),
      setGap: (gap) => set({ gap }),
      setLayout: (layout) => set({ layout }),
      resetToDefaults: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'itemdeck-settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),

      // Only persist specific fields (not actions)
      partialize: (state) => ({
        theme: state.theme,
        cardWidth: state.cardWidth,
        cardHeight: state.cardHeight,
        gap: state.gap,
        layout: state.layout,
      }),

      // Migration between versions
      migrate: (persistedState, version) => {
        if (version === 0) {
          const oldState = persistedState as { cardSize?: number };
          return {
            ...DEFAULT_SETTINGS,
            ...persistedState,
            cardWidth: oldState.cardSize ?? DEFAULT_SETTINGS.cardWidth,
            cardHeight: Math.round((oldState.cardSize ?? DEFAULT_SETTINGS.cardWidth) * 1.4),
          };
        }
        return persistedState as SettingsState;
      },
    }
  )
);
```

### Card Store with IndexedDB

```typescript
// src/stores/cardStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

// Custom IndexedDB storage adapter
const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

interface CardCollection {
  id: string;
  name: string;
  cards: CardData[];
  lastUpdated: number;
}

interface CardStoreState {
  collections: CardCollection[];
  activeCollectionId: string | null;

  addCollection: (collection: CardCollection) => void;
  removeCollection: (id: string) => void;
  setActiveCollection: (id: string | null) => void;
  updateCollection: (id: string, updates: Partial<CardCollection>) => void;
}

export const useCardStore = create<CardStoreState>()(
  persist(
    (set) => ({
      collections: [],
      activeCollectionId: null,

      addCollection: (collection) => set((state) => ({
        collections: [...state.collections, collection],
      })),

      removeCollection: (id) => set((state) => ({
        collections: state.collections.filter(c => c.id !== id),
        activeCollectionId: state.activeCollectionId === id ? null : state.activeCollectionId,
      })),

      setActiveCollection: (id) => set({ activeCollectionId: id }),

      updateCollection: (id, updates) => set((state) => ({
        collections: state.collections.map(c =>
          c.id === id ? { ...c, ...updates, lastUpdated: Date.now() } : c
        ),
      })),
    }),
    {
      name: 'itemdeck-cards',
      version: 1,
      storage: createJSONStorage(() => indexedDBStorage),
    }
  )
);
```

### Hydration Guard Component

```typescript
// src/components/HydrationGuard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface HydrationGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function HydrationGuard({ children, fallback = null }: HydrationGuardProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const unsubSettings = useSettingsStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated (synchronous storage)
    if (useSettingsStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubSettings();
    };
  }, []);

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### URL State for Filters

```typescript
// src/hooks/useURLFilters.ts
import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

interface FilterState {
  search: string;
  category: string | null;
  sortBy: 'name' | 'date' | 'category';
  sortOrder: 'asc' | 'desc';
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  category: null,
  sortBy: 'name',
  sortOrder: 'asc',
};

export function useURLFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<FilterState>(() => ({
    search: searchParams.get('q') ?? DEFAULT_FILTERS.search,
    category: searchParams.get('category'),
    sortBy: (searchParams.get('sort') as FilterState['sortBy']) ?? DEFAULT_FILTERS.sortBy,
    sortOrder: (searchParams.get('order') as FilterState['sortOrder']) ?? DEFAULT_FILTERS.sortOrder,
  }), [searchParams]);

  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== DEFAULT_FILTERS[key as keyof FilterState]) {
          next.set(key === 'search' ? 'q' : key, String(value));
        } else {
          next.delete(key === 'search' ? 'q' : key);
        }
      });

      return next;
    });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return { filters, setFilters, resetFilters };
}
```

### Cross-Tab Synchronisation

```typescript
// src/hooks/useCrossTabSync.ts
import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

const CHANNEL_NAME = 'itemdeck-sync';

export function useCrossTabSync() {
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    channel.onmessage = (event) => {
      const { type } = event.data;

      if (type === 'SETTINGS_CHANGED') {
        useSettingsStore.persist.rehydrate();
      }
    };

    const unsubscribe = useSettingsStore.subscribe((state, prevState) => {
      if (
        state.theme !== prevState.theme ||
        state.cardWidth !== prevState.cardWidth ||
        state.layout !== prevState.layout
      ) {
        channel.postMessage({ type: 'SETTINGS_CHANGED' });
      }
    });

    return () => {
      channel.close();
      unsubscribe();
    };
  }, []);
}
```

### Storage Utilities

```typescript
// src/utils/storage.ts
import { get, set, del, keys } from 'idb-keyval';

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percent: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    return {
      usage,
      quota,
      percent: quota > 0 ? (usage / quota) * 100 : 0,
    };
  }
  return { usage: 0, quota: 0, percent: 0 };
}

export async function exportData(): Promise<string> {
  const allKeys = await keys();
  const data: Record<string, unknown> = {};

  for (const key of allKeys) {
    if (typeof key === 'string' && key.startsWith('itemdeck-')) {
      data[key] = await get(key);
    }
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('itemdeck-')) {
      data[key] = localStorage.getItem(key);
    }
  }

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString) as Record<string, unknown>;

  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('itemdeck-')) {
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      } else {
        await set(key, value);
      }
    }
  }
}
```

## Implementation Tasks

- [ ] Install Zustand: `npm install zustand`
- [ ] Install idb-keyval: `npm install idb-keyval`
- [ ] Create `src/stores/settingsStore.ts` with persist middleware
- [ ] Create `src/stores/cardStore.ts` with IndexedDB storage
- [ ] Create `HydrationGuard` component
- [ ] Create `useURLFilters` hook
- [ ] Create `useCrossTabSync` hook
- [ ] Create storage utilities (export/import)
- [ ] Implement version migration logic
- [ ] Add error handling for storage failures
- [ ] Integrate stores with existing contexts
- [ ] Write unit tests for stores
- [ ] Write integration tests for persistence
- [ ] Test cross-tab synchronisation

## Success Criteria

- [ ] Settings persist across page reloads
- [ ] Theme, layout, and card dimensions remembered
- [ ] Card collections stored in IndexedDB
- [ ] Filter state reflected in URL (shareable)
- [ ] Changes sync across browser tabs
- [ ] Storage version migrations work correctly
- [ ] Graceful degradation when storage unavailable
- [ ] Export/import functionality works
- [ ] Tests pass

## Dependencies

- **Requires**: F-010 Theme System, F-011 Layout Presets
- **Blocks**: F-013 Settings Panel

## Complexity

**Medium** - Multiple storage mechanisms with version migration.

---

## Related Documentation

- [State Persistence Research](../../../../research/state-persistence.md)
- [ADR-004: Zustand for State Management](../../../decisions/adrs/ADR-004-state-management.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)
