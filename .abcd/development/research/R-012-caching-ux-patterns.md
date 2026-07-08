# R-012: Caching UX Patterns

## Executive Summary

This research examines industry patterns for communicating cache state to users, informing F-115 (Caching Policy Transparency).

**Key finding:** Simple visual indicators with tooltips are preferred over complex controls.

---

## Current itemdeck Implementation

### Components

| Component | Purpose |
|-----------|---------|
| CacheConsentDialog | Initial consent for caching |
| ImageCacheTab | Settings panel cache controls |
| OfflineIndicator | Shows offline status |

### Cache Types

1. **Card cache**: IndexedDB, 24hr expiration
2. **Image cache**: IndexedDB, LRU eviction
3. **React Query cache**: In-memory, configurable

---

## Industry Patterns

### 1. Sync Status Indicators

**Examples:**
- Google Docs: "Saving...", "Saved", "Offline"
- Notion: Sync spinner in header
- Figma: Cloud icon with status

**Pattern:**
```
[Icon] [Status text] [Optional timestamp]
```

### 2. PWA Patterns

**Examples:**
- Twitter (X): "Offline - Viewing cached content"
- Spotify: Downloaded indicator on songs
- Netflix: Download badges

**Pattern:**
- Clear offline/online distinction
- Badge indicators for cached content
- Toast notifications for sync events

### 3. Cache Age Indicators

**Examples:**
- Browser DevTools: Cache timestamps
- CDN dashboards: TTL displays
- Email clients: "Last synced X minutes ago"

**Pattern:**
- Human-readable relative time
- Colour coding (fresh = green, stale = yellow/red)

---

## User Preference Analysis

Based on user feedback for itemdeck:

| Approach | User Preference |
|----------|----------------|
| Complex controls | **Rejected** - too confusing |
| Simple indicators | **Preferred** - clear and non-intrusive |
| Automatic caching | **Preferred** - just work |
| Manual cache clear | **Optional** - advanced setting |

---

## Recommended Pattern for itemdeck

### Cache State Indicator

```
[Dot] [Tooltip on hover]
```

**States:**
| State | Visual | Tooltip |
|-------|--------|---------|
| Fresh | Green dot | "Cached 5 minutes ago" |
| Stale | Yellow dot | "Cached 3 hours ago" |
| None | Grey dot | "Loading from source" |

### Placement

Options:
1. **Near collection title**: Most visible
2. **In source list**: Per-source status
3. **In footer/status bar**: Consistent location

**Recommendation:** Near collection title for main view, per-source in Settings.

### Tooltip Format

```
[Status] · [Relative time]

Examples:
"Cached · 5 minutes ago"
"Stale · Last updated 3 hours ago"
"Loading from source..."
```

---

## Implementation Recommendations

### 1. CacheIndicator Component

```tsx
interface CacheIndicatorProps {
  status: 'fresh' | 'stale' | 'none' | 'loading';
  cachedAt?: Date;
  showTooltip?: boolean;
}
```

### 2. useCacheState Hook

```tsx
function useCacheState(sourceId: string): {
  status: CacheStatus;
  cachedAt: Date | null;
  ageMs: number | null;
  refresh: () => void;
}
```

### 3. Human-Readable Time

```typescript
function formatCacheAge(ageMs: number): string {
  if (ageMs < 60000) return 'Just now';
  if (ageMs < 3600000) return `${Math.floor(ageMs / 60000)} minutes ago`;
  if (ageMs < 86400000) return `${Math.floor(ageMs / 3600000)} hours ago`;
  return `${Math.floor(ageMs / 86400000)} days ago`;
}
```

---

## What NOT to Do

Based on user feedback:

1. **Don't**: Complex cache settings panels
2. **Don't**: Technical jargon (TTL, IndexedDB, LRU)
3. **Don't**: Intrusive banners or modals
4. **Don't**: Automatic prompts to refresh
5. **Don't**: Cache size displays (users don't care)

---

## Success Metrics

- Users understand when data is cached
- No increase in support requests about "stale data"
- Simple, non-intrusive indicators
- Clear path to refresh when needed

---

## Related Documentation

- [F-115: Caching Transparency](../roadmap/features/planned/F-115-caching-transparency.md) - Feature implementing these patterns
- [F-114: Remote Collection Update Checking](../roadmap/features/planned/F-114-update-checking.md) - Related update checking feature
- [State-of-the-Art Visual Consistency](./state-of-the-art-visual-consistency.md) - Visual indicator patterns
