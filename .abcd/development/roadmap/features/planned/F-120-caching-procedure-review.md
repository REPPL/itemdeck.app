# F-120: Caching Procedure Review

## Problem Statement

The caching system has inconsistencies that confuse users:

1. **Status indicators shown incorrectly** - Cache status displayed even when caching disabled
2. **Settings not respected** - "Don't cache" setting may not fully disable caching
3. **Unclear behaviour** - Users unsure when data is fresh vs cached
4. **State synchronisation** - UI may not reflect actual cache state

## Background

This feature addresses user-reported issue: cache status indicators appear when the user has explicitly disabled caching. A thorough review of the entire caching procedure is required to ensure:

- Settings are correctly applied
- Cache operations respect user preferences
- UI accurately reflects cache state
- No residual caching when disabled

## Design Approach

Conduct a comprehensive audit and fix of the caching system:

### Audit Scope

1. **Settings Flow**
   - How caching settings are stored
   - How settings propagate to cache modules
   - When settings take effect (immediate vs restart)

2. **Cache Operations**
   - Image caching (IndexedDB)
   - Collection data caching (React Query)
   - Source metadata caching
   - Service Worker caching

3. **UI Indicators**
   - When cache status icons appear
   - What triggers "fresh" vs "stale" vs "cached" states
   - How disabled caching affects UI

4. **Edge Cases**
   - Switching caching on/off mid-session
   - Multiple collections with different cache settings
   - Offline mode behaviour
   - Cache invalidation triggers

### Files to Review

```
src/
├── hooks/
│   ├── useImageCache.ts           # Image caching logic
│   ├── useCollection.ts           # Collection data fetching
│   └── useCollectionCache.ts      # Cache state management
├── stores/
│   └── settingsStore.ts           # Cache settings storage
├── services/
│   └── cacheService.ts            # Cache operations
├── components/
│   ├── CacheStatusIndicator/      # Cache status UI
│   └── SourcesOverlay/            # Source cache display
├── lib/
│   └── queryClient.ts             # React Query configuration
└── db/
    └── imageCache.ts              # IndexedDB operations
```

## Implementation Tasks

### Phase 1: Audit Current State

- [ ] Document current caching behaviour
- [ ] Map settings to cache operations
- [ ] Identify all cache storage locations
- [ ] List all cache status UI components

### Phase 2: Fix Settings Propagation

- [ ] Ensure "disable caching" fully disables all caching
- [ ] Propagate settings changes immediately (no restart)
- [ ] Clear existing cache when caching disabled
- [ ] Verify settings persist correctly

### Phase 3: Fix UI Indicators

- [ ] Hide cache indicators when caching disabled
- [ ] Ensure indicators reflect actual cache state
- [ ] Fix any stale UI state issues
- [ ] Add clear "caching disabled" indicator if needed

### Phase 4: Fix Cache Operations

- [ ] Ensure React Query respects cache settings
- [ ] Ensure image cache respects settings
- [ ] Ensure Service Worker respects settings
- [ ] Test all cache invalidation scenarios

### Phase 5: Testing

- [ ] Add unit tests for cache settings
- [ ] Add integration tests for cache operations
- [ ] Add E2E test for caching toggle
- [ ] Test offline mode with caching disabled

## Success Criteria

- [ ] Caching indicators hidden when caching disabled
- [ ] No cache operations when caching disabled
- [ ] Settings changes take effect immediately
- [ ] Cache cleared when switching to disabled
- [ ] UI accurately reflects cache state
- [ ] All cache-related tests pass

## Dependencies

- **F-115**: Caching Transparency - Related cache UI work (completed)

## Complexity

**Medium** - Requires thorough investigation but changes likely localised.

## Estimated Effort

**8-12 hours**

---

## Related Documentation

- [F-115: Caching Transparency](../completed/F-115-caching-transparency.md)
- [R-012: Caching UX Patterns](../../research/R-012-caching-ux.md)
- [Offline Caching](../completed/F-009-offline-caching.md)
- [v1.0.0 Milestone](../../milestones/v1.0.0.md)

---

**Status**: Planned
