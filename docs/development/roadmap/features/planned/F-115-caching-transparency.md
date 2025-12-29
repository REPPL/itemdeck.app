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

- [ ] Create CacheIndicator component
- [ ] Create useCacheState hook
- [ ] Expose cache metadata from cardCache.ts
- [ ] Add indicator near collection title
- [ ] Implement tooltips with cache age
- [ ] Test all cache states

## CacheIndicator Design

- Small dot/badge indicator
- Tooltip: "Cached 2 hours ago" or "No cache"
- Placed near collection title or source indicator
- Non-intrusive visual design

## Success Criteria

- [ ] Cache status visually indicated
- [ ] Three states clearly distinguishable
- [ ] Tooltip shows human-readable age
- [ ] Simple, non-intrusive design
- [ ] No complex settings or controls

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
