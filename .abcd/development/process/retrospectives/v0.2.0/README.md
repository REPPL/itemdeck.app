# v0.2.0 Retrospective - External Data

## Overview

This retrospective reflects on the v0.2.0 milestone which established the external data fetching infrastructure with 4 features: TanStack Query Setup, GitHub Data Source, Card Data Schema, and Offline Caching.

---

## What Went Well

### 1. Schema-First Development

Implementing F-008 Card Data Schema before F-007 GitHub Data Source was the right dependency order. Having validated schemas meant data fetching could be tested with confidence from the start.

### 2. TanStack Query Integration

TanStack Query v5 provided excellent developer experience:
- DevTools for debugging queries in development
- Automatic cache management reduced state complexity
- Query key factory pattern enables precise cache invalidation
- Error boundaries integrate naturally with React patterns

### 3. Type System Evolution

Creating the `DisplayCard` type solved the optional/required imageUrl problem elegantly. The pattern of separating raw data types from display-ready types is reusable across future schemas.

### 4. Offline-First Architecture

The Workbox caching strategies provide a solid foundation:
- StaleWhileRevalidate for data freshness
- CacheFirst for static assets and images
- IndexedDB for structured data persistence

### 5. Incremental Migration

Migrating from mock data to TanStack Query was smooth because:
- The hook interface remained similar
- Tests verified behaviour at each step
- LoadingSkeleton provided visual feedback during transition

---

## What Could Improve

### 1. Zod v4 Syntax Changes

The `z.record()` syntax change from Zod v3 to v4 caused test failures that required investigation.

```typescript
// Zod v3 (failed)
z.record(z.string())

// Zod v4 (required)
z.record(z.string(), z.string())
```

**Improvement:** Create a Zod v4 migration checklist for future projects.

### 2. Deferred Features

Two F-009 features were deferred to v0.3.0:
- Manual refresh button
- E2E tests for offline mode

These are nice-to-haves rather than blockers, but worth tracking.

### 3. Service Worker Development Testing

Service workers are challenging to test locally due to HTTPS requirements and caching behaviour.

**Improvement:** Consider mock service worker (msw) for integration testing.

---

## Lessons Learned

### 1. useSyncExternalStore is the Modern Pattern

For subscribing to external sources (like `navigator.onLine`), `useSyncExternalStore` is more robust than `useState + useEffect`:
- Avoids tearing in concurrent rendering
- Cleaner separation of subscribe/getSnapshot

### 2. Query Key Factories Scale Well

The `collectionKeys` factory pattern:
```typescript
export const collectionKeys = {
  all: ["collections"] as const,
  lists: () => [...collectionKeys.all, "list"] as const,
  list: (sourceId: string) => [...collectionKeys.lists(), sourceId] as const,
}
```

This makes cache invalidation predictable and refactoring safe.

### 3. PWA Configuration Complexity

VitePWA with Workbox has many options. Starting with sensible defaults and iterating is better than trying to configure everything upfront.

### 4. GitHub Raw URLs vs API

Using raw.githubusercontent.com URLs instead of the GitHub API was a good choice:
- No rate limiting for public repos
- Simpler authentication story
- Direct JSON fetching without API abstraction

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| TanStack Query v5 | Latest version with best TypeScript support |
| GitHub raw URLs over API | Simpler, no rate limits for public repos |
| idb-keyval for IndexedDB | Minimal API, handles serialisation |
| StaleWhileRevalidate for data | Balance freshness with offline availability |
| DisplayCard type separation | Clear boundary between raw and display data |

---

## Metrics

| Metric | Value |
|--------|-------|
| Features completed | 4/4 |
| Tests written | 49 new |
| Total tests | 211 |
| Tests passing | 211 (100%) |
| New files | 19 |
| Modified files | 7 |
| Bundle size (JS) | 365 KB |
| Bundle size (CSS) | 7 KB |
| Dependencies added | 5 |

---

## Recommendations for v0.3.0

1. **Implement manual refresh button** - Deferred from F-009, user-requested feature
2. **Add E2E tests** - Service worker behaviour needs browser-level testing
3. **Consider bundle size** - 365 KB is growing; code splitting may help
4. **Theme system planning** - v0.3.0 focuses on customisation; design system work ahead
5. **Monitor cache performance** - Track cache hit rates in production

---

## Related Documentation

- [v0.2.0 Milestone](../../../roadmap/milestones/v0.2.0.md)
- [v0.2.0 Devlog](../../devlogs/v0.2.0/README.md)
- [Features Index](../../../roadmap/features/README.md)
- [ADR-003: Data Fetching](../../../decisions/adrs/ADR-003-data-fetching.md)
