# State Persistence

## Executive Summary

For Itemdeck's state persistence, use **localStorage** for user preferences (theme, layout, card size) and **IndexedDB with idb-keyval** for larger data (card collections, cached images). Implement **Zustand persist middleware** for seamless React integration with version migration support.

Key recommendations:
1. Use localStorage for small settings (< 5KB)
2. Use IndexedDB (via idb-keyval) for card data and collections
3. Implement Zustand persist for React state management
4. Add version numbers and migration logic for schema changes
5. Sync preferences across tabs with BroadcastChannel API

## Current State in Itemdeck

Itemdeck currently uses:
- **React Context** for settings (cardWidth, cardHeight, gap)
- **No persistence** - settings reset on page refresh
- **Mock data** - 100 cards in memory

Implementing persistence will improve user experience by remembering preferences and enabling offline viewing.

## Research Findings

### Storage Options Comparison

| Storage | Capacity | Sync/Async | Data Types | Use Case |
|---------|----------|------------|------------|----------|
| localStorage | ~5MB | Sync | Strings only | Small preferences |
| sessionStorage | ~5MB | Sync | Strings only | Session-only data |
| IndexedDB | 50%+ of disk | Async | Structured data | Large datasets |
| Cache API | Large | Async | Request/Response | Network caching |

### What to Persist in Itemdeck

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Theme (light/dark) | localStorage | Small, fast access needed |
| Card dimensions | localStorage | Small, frequently accessed |
| Layout preferences | localStorage | Small, user settings |
| Last viewed collection | localStorage | Small, navigation state |
| Card collection data | IndexedDB | Large, structured data |
| Cached images | Cache API | Binary data, large |
| Filter/sort state | URL params | Shareable, bookmarkable |

### Zustand with Persist Middleware

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
  layout: 'grid' | 'list' | 'carousel';

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCardDimensions: (width: number, height: number) => void;
  setGap: (gap: number) => void;
  setLayout: (layout: 'grid' | 'list' | 'carousel') => void;
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

      // Only persist specific fields
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
          // Example migration from v0 to v1
          const oldState = persistedState as { cardSize?: number };
          return {
            ...DEFAULT_SETTINGS,
            ...persistedState,
            // Convert old cardSize to separate width/height
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

### IndexedDB for Large Data

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

interface CardData {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
}

interface CardCollection {
  id: string;
  name: string;
  cards: CardData[];
  lastUpdated: number;
}

interface CardStoreState {
  collections: CardCollection[];
  activeCollectionId: string | null;

  // Actions
  addCollection: (collection: CardCollection) => void;
  removeCollection: (id: string) => void;
  setActiveCollection: (id: string | null) => void;
  updateCollection: (id: string, updates: Partial<CardCollection>) => void;
}

export const useCardStore = create<CardStoreState>()(
  persist(
    (set, get) => ({
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

### Hydration Handling

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
    // Zustand persist stores have a hasHydrated method
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

// Usage in App.tsx
function App() {
  return (
    <HydrationGuard fallback={<LoadingSpinner />}>
      <CardGrid />
    </HydrationGuard>
  );
}
```

### URL State for Shareable Filters

```typescript
// src/hooks/useURLState.ts
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

      if (updates.search !== undefined) {
        if (updates.search) {
          next.set('q', updates.search);
        } else {
          next.delete('q');
        }
      }

      if (updates.category !== undefined) {
        if (updates.category) {
          next.set('category', updates.category);
        } else {
          next.delete('category');
        }
      }

      if (updates.sortBy !== undefined) {
        if (updates.sortBy !== DEFAULT_FILTERS.sortBy) {
          next.set('sort', updates.sortBy);
        } else {
          next.delete('sort');
        }
      }

      if (updates.sortOrder !== undefined) {
        if (updates.sortOrder !== DEFAULT_FILTERS.sortOrder) {
          next.set('order', updates.sortOrder);
        } else {
          next.delete('order');
        }
      }

      return next;
    });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return { filters, setFilters, resetFilters };
}
```

### Tab Synchronisation

```typescript
// src/hooks/useCrossTabSync.ts
import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

const CHANNEL_NAME = 'itemdeck-sync';

export function useCrossTabSync() {
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);

    // Listen for changes from other tabs
    channel.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'SETTINGS_CHANGED') {
        // Rehydrate from storage
        useSettingsStore.persist.rehydrate();
      }
    };

    // Broadcast when this tab changes settings
    const unsubscribe = useSettingsStore.subscribe((state, prevState) => {
      // Only broadcast if values actually changed
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

// Usage in App.tsx
function App() {
  useCrossTabSync();
  return <CardGrid />;
}
```

### Version Migration

```typescript
// src/stores/migrations.ts
import type { SettingsState } from './settingsStore';
import type { CardStoreState } from './cardStore';

// Settings migrations
export const settingsMigrations = {
  // v0 -> v1: Added layout preference
  1: (state: unknown): SettingsState => {
    const oldState = state as Omit<SettingsState, 'layout'>;
    return {
      ...oldState,
      layout: 'grid',
    };
  },

  // v1 -> v2: Renamed cardSize to cardWidth/cardHeight
  2: (state: unknown): SettingsState => {
    const oldState = state as { cardSize?: number } & Omit<SettingsState, 'cardWidth' | 'cardHeight'>;
    const cardSize = oldState.cardSize ?? 200;
    return {
      ...oldState,
      cardWidth: cardSize,
      cardHeight: Math.round(cardSize * 1.4),
    };
  },
};

// Card store migrations
export const cardMigrations = {
  // v0 -> v1: Added lastUpdated timestamp
  1: (state: unknown): CardStoreState => {
    const oldState = state as Omit<CardStoreState, 'collections'> & {
      collections: Array<Omit<CardStoreState['collections'][number], 'lastUpdated'>>;
    };
    return {
      ...oldState,
      collections: oldState.collections.map(c => ({
        ...c,
        lastUpdated: Date.now(),
      })),
    };
  },
};

// Generic migration runner
export function runMigrations<T>(
  state: unknown,
  currentVersion: number,
  targetVersion: number,
  migrations: Record<number, (state: unknown) => T>
): T {
  let migratedState = state;

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    if (migrations[v]) {
      migratedState = migrations[v](migratedState);
    }
  }

  return migratedState as T;
}
```

### Storage Utilities

```typescript
// src/utils/storage.ts
import { get, set, del, keys } from 'idb-keyval';

// Storage size estimation
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

// Clear old data when storage is low
export async function pruneOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
  const now = Date.now();
  const allKeys = await keys();

  for (const key of allKeys) {
    if (typeof key === 'string' && key.startsWith('itemdeck-cache-')) {
      const data = await get(key);
      if (data && data.timestamp && now - data.timestamp > maxAge) {
        await del(key);
      }
    }
  }
}

// Export all data for backup
export async function exportData(): Promise<string> {
  const allKeys = await keys();
  const data: Record<string, unknown> = {};

  for (const key of allKeys) {
    if (typeof key === 'string' && key.startsWith('itemdeck-')) {
      data[key] = await get(key);
    }
  }

  // Also include localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('itemdeck-')) {
      data[key] = localStorage.getItem(key);
    }
  }

  return JSON.stringify(data, null, 2);
}

// Import data from backup
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

### Error Handling

```typescript
// src/utils/storageErrors.ts

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.code === 22 || // Legacy
      error.code === 1014 || // Firefox
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export async function safeStorageSet<T>(
  key: string,
  value: T,
  storage: 'local' | 'indexeddb' = 'local'
): Promise<boolean> {
  try {
    if (storage === 'local') {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      const { set } = await import('idb-keyval');
      await set(key, value);
    }
    return true;
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn('Storage quota exceeded, attempting cleanup...');
      await pruneOldData();

      // Retry once after cleanup
      try {
        if (storage === 'local') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          const { set } = await import('idb-keyval');
          await set(key, value);
        }
        return true;
      } catch {
        console.error('Storage failed even after cleanup');
        return false;
      }
    }

    console.error('Storage error:', error);
    return false;
  }
}
```

### Testing Persistence

```typescript
// src/stores/settingsStore.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store to defaults
    useSettingsStore.setState({
      theme: 'system',
      cardWidth: 200,
      cardHeight: 280,
      gap: 16,
      layout: 'grid',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists settings to localStorage', () => {
    useSettingsStore.getState().setTheme('dark');

    const stored = localStorage.getItem('itemdeck-settings');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.theme).toBe('dark');
  });

  it('restores settings from localStorage', () => {
    // Simulate stored data
    localStorage.setItem('itemdeck-settings', JSON.stringify({
      state: {
        theme: 'light',
        cardWidth: 250,
        cardHeight: 350,
        gap: 20,
        layout: 'list',
      },
      version: 1,
    }));

    // Rehydrate
    useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().theme).toBe('light');
    expect(useSettingsStore.getState().cardWidth).toBe(250);
    expect(useSettingsStore.getState().layout).toBe('list');
  });

  it('handles version migration', () => {
    // Store old version data
    localStorage.setItem('itemdeck-settings', JSON.stringify({
      state: {
        theme: 'dark',
        cardSize: 180, // Old format
      },
      version: 0,
    }));

    // Rehydrate should trigger migration
    useSettingsStore.persist.rehydrate();

    const state = useSettingsStore.getState();
    expect(state.cardWidth).toBe(180);
    expect(state.cardHeight).toBe(252); // 180 * 1.4
  });

  it('falls back to defaults on corrupted data', () => {
    localStorage.setItem('itemdeck-settings', 'not valid json');

    // Should not throw
    useSettingsStore.persist.rehydrate();

    // Should have defaults
    expect(useSettingsStore.getState().theme).toBe('system');
    expect(useSettingsStore.getState().cardWidth).toBe(200);
  });
});
```

## Recommendations for Itemdeck

### Priority 1: Settings Persistence

1. **Install Zustand**: `npm install zustand`
2. **Create settings store** with persist middleware
3. **Use localStorage** for fast, synchronous access
4. **Add version and migration** support from the start

### Priority 2: Card Collection Persistence

1. **Install idb-keyval**: `npm install idb-keyval`
2. **Create card store** with IndexedDB storage
3. **Handle hydration** with loading states
4. **Implement cleanup** for old cached data

### Priority 3: URL State for Filters

1. **Use react-router-dom** for URL management
2. **Sync filter state** to URL params
3. **Support shareable URLs** for filtered views
4. **Default to sensible values** when params missing

### Priority 4: Cross-Tab Sync

1. **Implement BroadcastChannel** for settings sync
2. **Rehydrate on message** from other tabs
3. **Avoid infinite loops** with change detection

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "zustand": "^5.x",
    "idb-keyval": "^6.x"
  }
}
```

### Bundle Size Impact

- Zustand: ~2KB gzipped
- idb-keyval: ~600 bytes gzipped
- Total: < 3KB additional bundle

### Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| localStorage | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| BroadcastChannel | ✅ | ✅ | ✅ 15.4+ | ✅ |
| Storage API | ✅ | ✅ | ✅ | ✅ |

### Storage Limits

| Storage | Typical Limit | Notes |
|---------|--------------|-------|
| localStorage | 5MB | Per origin |
| IndexedDB | 50%+ of disk | Browser manages quota |
| Total web storage | Varies | Check with `navigator.storage.estimate()` |

## References

- [Zustand Persist Documentation](https://zustand.docs.pmnd.rs/integrations/persisting-store-data)
- [idb-keyval GitHub](https://github.com/jakearchibald/idb-keyval)
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [MDN: Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API)
- [Zustand with IndexedDB Discussion](https://github.com/pmndrs/zustand/discussions/1721)

---

## Related Documentation

- [Configuration Hierarchy](./configuration-hierarchy.md) - Config loading and precedence
- [External Data Sources](./external-data-sources.md) - Data fetching and caching
- [System Security](./system-security.md) - Secure storage patterns

---

**Applies to**: Itemdeck v0.1.0+
