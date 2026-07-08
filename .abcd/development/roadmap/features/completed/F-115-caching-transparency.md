# F-115: Caching Policy Transparency

## Problem Statement

Users don't understand the caching behaviour:
- When is data cached?
- How old is the cache?
- Is the displayed data fresh or stale?

User feedback indicates confusion about caching.

## Design Approach

Add simple, non-intrusive cache state indicators:
1. Visual indicator showing cache status
2. Tooltip with human-readable cache age
3. No complex controls (user preference: simple indicators)

**User preference:** Simple indicators only, not complex controls.

## Cache States

| State | Colour | Meaning |
|-------|--------|---------|
| Fresh | Green | Cached within last hour |
| Stale | Yellow | Cached > 1 hour ago |
| None | Grey | No cache / loading from source |

## Implementation Tasks

- [x] Create CacheIndicator component
- [x] Create useCacheState hook
- [x] Expose cache metadata from cardCache.ts
- [x] Add indicator near collection title
- [x] Implement tooltips with cache age
- [x] Test all cache states

## CacheIndicator Design

- Small dot/badge indicator
- Tooltip: "Cached 2 hours ago" or "No cache"
- Placed near collection title or source indicator
- Non-intrusive visual design

## Success Criteria

- [x] Cache status visually indicated
- [x] Three states clearly distinguishable
- [x] Tooltip shows human-readable age
- [x] Simple, non-intrusive design
- [x] No complex settings or controls

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Small** - UI component and hook.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-c1-caching.md)
- [R-012: Caching UX Patterns](../../research/R-012-caching-ux-patterns.md)

---

**Status**: ✅ Complete
