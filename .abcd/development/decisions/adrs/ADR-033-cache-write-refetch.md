# ADR-033: Collection cache write via query invalidation

## Status

Accepted (with a documented follow-up)

## Context

In cache-consent "ask" mode, the collection JSON is fetched before the
user has granted consent, so `fetchCollection` skips the IndexedDB write
(consent is read live at fetch time). When the user then grants consent
in the loading screen, the just-loaded collection must still be cached
for offline use.

The collection payload is already in memory at that point — held both by
the resolved React Query cache entry and by the loading screen's
consumers. The only missing step is the IndexedDB write.

Two ways to trigger that write once consent lands:

1. **Re-run the query.** Invalidate the collection query so
   `fetchCollection` executes again; consent now reads `true`, so the
   write happens. Simple and reuses the single cache-write code path,
   but performs a full network round trip purely to persist data that is
   already in memory.
2. **Write directly.** Call `cacheCollection(sourceId, collection)` with
   the in-memory payload from the consent-grant handler. No network
   round trip, but it introduces a second cache-write call site outside
   `fetchCollection` and needs the collection object threaded into the
   loading screen.

## Decision

Use query invalidation (option 1) for now: on consent grant, the loading
screen invalidates the collection query, `fetchCollection` re-runs, and
the collection is cached through its single existing write path.

This keeps one authority for the cache-write rules (consent check +
"already cached" guard live together in `fetchCollection`) at the cost of
one redundant fetch, which happens at most once per source — the first
time consent is granted.

## Consequences

- Granting cache consent triggers a second network fetch of a collection
  already held in memory. Correct, but wasteful of bandwidth and time.
- The waste is bounded: it occurs only on the first consent grant per
  source, never on subsequent loads.

## Follow-up

Replace the invalidation with a direct `cacheCollection` write from the
consent-grant path, threading the in-memory collection payload through
to the loading screen, so no re-fetch is needed. This removes the
redundant round trip while preserving the single set of cache-write
rules.

Touch points: `src/components/LoadingScreen/LoadingScreen.tsx`
(`handleConsentAllow`), `src/hooks/useCollection.ts` (`fetchCollection`
cache-write block), `src/lib/cardCache.ts` (`cacheCollection`).
