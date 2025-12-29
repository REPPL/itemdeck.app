# Track C1: Caching Transparency

## Features

- F-113: Lazy Loading Visual Indicator
- F-115: Caching Policy Transparency

## Implementation Prompt

```
Implement simple cache state indicators in itemdeck.

## F-115: Caching Policy Transparency

### 1. Create CacheIndicator component

Create `src/components/CacheIndicator/CacheIndicator.tsx`:

```typescript
interface CacheIndicatorProps {
  sourceId: string;
}

// Shows: Fresh (green dot), Stale (yellow dot), None (grey dot)
// Tooltip shows: "Cached 2 hours ago" or "No cache"
```

### 2. Create useCacheState hook

Create `src/hooks/useCacheState.ts`:

```typescript
interface CacheState {
  status: 'fresh' | 'stale' | 'none';
  cachedAt?: Date;
  ageMs?: number;
}

export function useCacheState(sourceId: string): CacheState
```

### 3. Expose cache metadata

Update `src/lib/cardCache.ts`:
- Export `getCacheMetadata(sourceId)` function
- Return timestamp and age information

### 4. Add indicator to UI

Add CacheIndicator near collection title in main view.

## F-113: Lazy Loading Visual Indicator

### 1. Enhance LazyImage

Update `src/components/LazyImage/LazyImage.tsx`:
- Make shimmer animation more visible (slower pulse)
- Add optional loading spinner overlay
- Add `aria-busy="true"` during loading

### 2. Update CSS

Update `src/components/LazyImage/LazyImage.module.css`:
- Enhance shimmer animation
- Add optional spinner styles

## Files to Modify

- src/components/CacheIndicator/CacheIndicator.tsx (new)
- src/components/CacheIndicator/CacheIndicator.module.css (new)
- src/components/CacheIndicator/index.ts (new)
- src/hooks/useCacheState.ts (new)
- src/lib/cardCache.ts
- src/components/LazyImage/LazyImage.tsx
- src/components/LazyImage/LazyImage.module.css

## Success Criteria

- [ ] Cache indicator shows fresh/stale/none status
- [ ] Tooltip shows human-readable cache age
- [ ] Lazy loading shimmer is more visible
- [ ] aria-busy attribute set during loading
- [ ] Simple, non-intrusive indicators
```

---

## Related Documentation

- [F-113 Feature Spec](../../../development/roadmap/features/planned/F-113-lazy-loading-indicator.md)
- [F-115 Feature Spec](../../../development/roadmap/features/planned/F-115-caching-transparency.md)
