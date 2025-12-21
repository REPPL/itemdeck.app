# v0.2.0 Development Log - External Data

## Overview

This milestone transformed Itemdeck from a static mock-data application to a dynamic data-driven application, implementing four features that establish the external data fetching and caching infrastructure.

## Implementation Narrative

### Phase 1: Schema Foundation (F-008)

Started with the Card Data Schema as it serves as the foundation for all data validation:

**Key Files Created:**
- `src/schemas/cardData.schema.ts` - Core Zod schema for card validation
- `src/schemas/category.schema.ts` - Category schema with optional fields
- `src/schemas/collection.schema.ts` - Combined collection schema with join utilities
- `src/schemas/registry.ts` - Schema registry for ranked-collection, simple-list, timeline types
- `src/errors/SchemaNotSupportedError.ts` - Custom error for unsupported schemas
- `src/types/collection.ts` - TypeScript type definitions

**Technical Highlights:**
- Used Zod v4 syntax: `z.record(z.string(), z.string())` for metadata maps
- Created `CardWithCategory` interface for joining items with their categories
- Schema registry pattern allows easy addition of new data formats
- `joinCardsWithCategories()` utility performs case-insensitive category matching

### Phase 2: TanStack Query Setup (F-006)

Established the data fetching layer with TanStack Query v5:

**Key Files Created:**
- `src/lib/queryClient.ts` - QueryClient with sensible defaults
- `src/hooks/queryKeys.ts` - Query key factory pattern
- `src/hooks/useCollection.ts` - Local collection fetching hook
- `src/components/QueryErrorBoundary/` - Error boundary with retry capability
- `src/components/LoadingSkeleton/` - Shimmer loading animation

**Configuration Decisions:**
```typescript
{
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 30 * 60 * 1000,        // 30 minutes
  retry: 3,
  retryDelay: exponentialBackoff,
  refetchOnWindowFocus: false,
}
```

**Type System Enhancement:**
Created `DisplayCard` interface to guarantee `imageUrl` is always present:
```typescript
export interface DisplayCard extends Omit<CardWithCategory, "imageUrl"> {
  imageUrl: string;
}
```
This solved the type mismatch between optional source data and required display data.

### Phase 3: GitHub Data Source (F-007)

Implemented GitHub raw URL fetching for external data:

**Key Files Created:**
- `src/config/dataSource.ts` - Data source configuration and URL building
- `src/hooks/useGitHubCollection.ts` - GitHub collection fetching hook
- `src/hooks/useGitHubManifest.ts` - Manifest discovery hook

**Design Decisions:**
- Used raw.githubusercontent.com URLs instead of GitHub API (avoids rate limiting)
- Default data source points to REPPL/MyPlausibleMe repository
- Supports configurable branch, owner, repo, and collection path
- Parallel fetching of items.json and categories.json for performance

### Phase 4: Offline Caching (F-009)

Added Progressive Web App (PWA) capabilities and offline support:

**Key Files Created:**
- `src/hooks/useOnlineStatus.ts` - Online/offline detection with useSyncExternalStore
- `src/components/OfflineIndicator/` - Visual indicator when offline
- `src/lib/cardCache.ts` - IndexedDB caching using idb-keyval

**Updated:**
- `vite.config.ts` - Added VitePWA plugin with Workbox runtime caching
- `src/App.tsx` - Added OfflineIndicator and QueryErrorBoundary

**Caching Strategies:**
| Resource Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| Static assets | CacheFirst | Precached |
| GitHub raw content | StaleWhileRevalidate | 1 hour |
| Images | CacheFirst | 30 days |

## Challenges Encountered

### Zod v4 Record Syntax

Tests failed with "Cannot read properties of undefined (reading '_zod')":

```typescript
// Old syntax (failed in Zod v4)
metadata: z.record(z.string()).optional()

// New syntax (works)
metadata: z.record(z.string(), z.string()).optional()
```

### Type Compatibility Between Schemas and Components

The original `CardData` type from v0.1.0 required `imageUrl` to always be present, but external data sources have optional image URLs.

**Solution:** Created a two-tier type system:
1. `CardWithCategory` - Raw data from schemas (optional imageUrl)
2. `DisplayCard` - Display-ready data (required imageUrl with placeholder fallback)

### useSyncExternalStore for Online Status

Initial implementation used `useState` + `useEffect`, but this pattern can cause tearing in concurrent rendering.

**Solution:** Implemented both patterns:
- `useOnlineStatus()` - Modern implementation using `useSyncExternalStore`
- `useOnlineStatusLegacy()` - Traditional implementation for testing/comparison

## Code Highlights

### Query Key Factory Pattern

```typescript
export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
  list: (sourceId: string) => [...collectionKeys.lists(), sourceId] as const,
  details: () => [...collectionKeys.all, "detail"] as const,
  detail: (id: string) => [...collectionKeys.details(), id] as const,
};
```

### Placeholder Image Fallback

```typescript
function ensureImageUrl(card: CardWithCategory): DisplayCard {
  return {
    ...card,
    imageUrl: card.imageUrl ?? PLACEHOLDER_IMAGE_URL,
  };
}
```

### Service Worker Caching Configuration

```typescript
runtimeCaching: [
  {
    urlPattern: /^https:\/\/raw\.githubusercontent\.com\/.*/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "github-raw-cache",
      expiration: { maxEntries: 100, maxAgeSeconds: 3600 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
]
```

## Files Summary

### New Files (19)

| Directory | Files |
|-----------|-------|
| `src/schemas/` | `cardData.schema.ts`, `category.schema.ts`, `collection.schema.ts`, `registry.ts`, `index.ts` |
| `src/errors/` | `SchemaNotSupportedError.ts` |
| `src/types/` | `collection.ts` |
| `src/lib/` | `queryClient.ts`, `cardCache.ts` |
| `src/config/` | `dataSource.ts` |
| `src/hooks/` | `queryKeys.ts`, `useCollection.ts`, `useGitHubCollection.ts`, `useGitHubManifest.ts`, `useOnlineStatus.ts` |
| `src/components/QueryErrorBoundary/` | `QueryErrorBoundary.tsx`, `index.ts` |
| `src/components/LoadingSkeleton/` | `LoadingSkeleton.tsx`, `LoadingSkeleton.module.css`, `index.ts` |
| `src/components/OfflineIndicator/` | `OfflineIndicator.tsx`, `OfflineIndicator.module.css`, `index.ts` |
| `tests/` | `cardData.test.ts`, `collection.test.ts`, `registry.test.ts`, `SchemaNotSupportedError.test.ts`, `queryClient.test.ts`, `queryKeys.test.ts`, `dataSource.test.ts`, `useOnlineStatus.test.ts` |

### Modified Files

- `src/main.tsx` - Added QueryClientProvider and ReactQueryDevtools
- `src/App.tsx` - Added QueryErrorBoundary and OfflineIndicator
- `src/components/CardGrid/CardGrid.tsx` - Migrated from useCardData to useDefaultCollection
- `src/components/Card/Card.tsx` - Updated to use CardDisplayData interface
- `vite.config.ts` - Added VitePWA plugin configuration
- `package.json` - Added new dependencies

## Dependencies Added

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.62.16",
    "idb-keyval": "^6.2.1",
    "zod": "^3.25.23"
  },
  "devDependencies": {
    "@tanstack/react-query-devtools": "^5.62.16",
    "vite-plugin-pwa": "^0.21.1"
  }
}
```

## Test Summary

| Suite | Tests |
|-------|-------|
| Schema (cardData, collection, registry) | 24 |
| SchemaNotSupportedError | 3 |
| QueryClient | 3 |
| QueryKeys | 5 |
| DataSource | 6 |
| useOnlineStatus | 8 |
| Previous v0.1.0 tests | 162 |
| **Total** | **211** |

All 211 tests passing.

## Build Output

```
dist/assets/index-[hash].js     365.21 kB (gzip: 114.38 kB)
dist/assets/index-[hash].css      6.85 kB (gzip: 2.21 kB)
dist/sw.js                        1.2 kB (service worker)
dist/manifest.webmanifest         0.3 kB (PWA manifest)
```

---

## Related Documentation

- [v0.2.0 Milestone](../../../roadmap/milestones/v0.2.0.md)
- [v0.2.0 Retrospective](../../retrospectives/v0.2.0/README.md)
- [Features Index](../../../roadmap/features/README.md)
- [ADR-003: Data Fetching](../../../decisions/adrs/ADR-003-data-fetching.md)
