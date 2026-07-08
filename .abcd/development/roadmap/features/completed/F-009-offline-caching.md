# F-009: Offline Caching

## Problem Statement

Users may want to view card collections without an internet connection. Currently:

1. All data is fetched on each page load
2. No offline support exists
3. Slow connections result in poor UX

## Design Approach

Implement **service worker caching** with **Workbox** for offline support:

### Caching Strategy

| Resource Type | Strategy | Rationale |
|--------------|----------|-----------|
| Static assets (JS, CSS) | Cache First | Rarely changes, fast delivery |
| Card images | Cache First | Large, rarely updated |
| Card data (JSON) | Stale While Revalidate | Fresh data preferred, but cached acceptable |
| API responses | Network First | Always try fresh, fall back to cache |

### Workbox Configuration

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### Offline Detection Hook

```typescript
// src/hooks/useOnlineStatus.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

### Offline Indicator Component

```tsx
// src/components/OfflineIndicator.tsx
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={styles.offlineIndicator}
    >
      You are offline. Showing cached data.
    </div>
  );
}
```

### IndexedDB Cache for Card Data

```typescript
// src/lib/cardCache.ts
import { get, set, del } from 'idb-keyval';
import type { CardCollection } from '../schemas/card';

const CACHE_KEY_PREFIX = 'itemdeck-cards-';

interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
}

export async function cacheCards(
  sourceId: string,
  cards: CardCollection
): Promise<void> {
  const cacheKey = `${CACHE_KEY_PREFIX}${sourceId}`;
  const cached: CachedData<CardCollection> = {
    data: cards,
    timestamp: Date.now(),
    version: '1.0.0',
  };
  await set(cacheKey, cached);
}

export async function getCachedCards(
  sourceId: string,
  maxAge: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<CardCollection | null> {
  const cacheKey = `${CACHE_KEY_PREFIX}${sourceId}`;
  const cached = await get<CachedData<CardCollection>>(cacheKey);

  if (!cached) return null;

  // Check if cache is expired
  if (Date.now() - cached.timestamp > maxAge) {
    await del(cacheKey);
    return null;
  }

  return cached.data;
}

export async function clearCardCache(sourceId?: string): Promise<void> {
  if (sourceId) {
    await del(`${CACHE_KEY_PREFIX}${sourceId}`);
  } else {
    // Clear all card caches - would need to iterate keys
  }
}
```

### TanStack Query Offline Support

```typescript
// src/hooks/useCardsWithCache.ts
import { useQuery } from '@tanstack/react-query';
import { getCachedCards, cacheCards } from '../lib/cardCache';

export function useCardsWithOfflineSupport(sourceId: string, fetchFn: () => Promise<CardCollection>) {
  return useQuery({
    queryKey: ['cards', sourceId],
    queryFn: async () => {
      try {
        const fresh = await fetchFn();
        await cacheCards(sourceId, fresh);
        return fresh;
      } catch (error) {
        // Try to return cached data on network error
        const cached = await getCachedCards(sourceId);
        if (cached) {
          return cached;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: async () => {
      // Use cached data as placeholder while fetching
      return getCachedCards(sourceId);
    },
  });
}
```

## Implementation Tasks

- [x] Install Vite PWA plugin: `npm install -D vite-plugin-pwa`
- [x] Configure Workbox in vite.config.ts
- [x] Create `useOnlineStatus` hook
- [x] Create `OfflineIndicator` component
- [x] Create `cardCache.ts` with IndexedDB caching
- [x] Update query hooks to use offline fallback
- [x] Add cache invalidation on data refresh
- [ ] Create manual refresh button (deferred to v0.3.0)
- [x] Test offline functionality
- [ ] Write E2E tests for offline mode (deferred - unit tests cover core behaviour)

## Success Criteria

- [x] Service worker registered and active
- [x] Static assets cached for offline use
- [x] Images cached after first view
- [x] Card data available offline (from IndexedDB)
- [x] Offline indicator shown when disconnected
- [x] Fresh data fetched when online
- [ ] Cache can be manually refreshed (deferred to v0.3.0)
- [x] Tests verify offline behaviour

## Dependencies

- **Requires**: F-006 TanStack Query Setup
- **Blocks**: None

## Complexity

**Medium** - Service worker configuration and cache management.

---

## Related Documentation

- [External Data Sources Research](../../../../research/external-data-sources.md)
- [State Persistence Research](../../../../research/state-persistence.md)
- [v0.2.0 Milestone](../../milestones/v0.2.0.md)
