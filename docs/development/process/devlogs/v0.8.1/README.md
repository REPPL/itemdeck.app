# v0.8.1 Development Log

## Overview

v0.8.1 was a focused release addressing user-requested features and closing gaps identified in the v0.8.0 implementation. The milestone combined what was originally planned as three separate patch releases (v0.8.1, v0.8.2, v0.8.3) into a single cohesive release.

## Implementation Narrative

### Context

Following the v0.8.0 release, a gap analysis revealed several features that were specified but not fully integrated:

1. LoadingScreen existed but wasn't wired into App.tsx
2. cardCache.ts existed but wasn't used by useCollection
3. Collection export functionality was missing
4. ARIA live regions needed enhancement

Additionally, a user requested a "random selection" feature to limit displayed cards.

### Decision: Combine Releases

Rather than three separate patch releases, we combined all work into v0.8.1:
- Original v0.8.1: Random Selection feature
- Original v0.8.2: LoadingScreen integration + caching
- Original v0.8.3: Accessibility + storage enhancements

This reduced release overhead and delivered a more complete update.

### Phase 1: Random Selection Feature

**Settings Store Changes** (`settingsStore.ts`):
- Added `randomSelectionEnabled: boolean` (default: false)
- Added `randomSelectionCount: number` (default: 10)
- Created migration from version 13 to 14
- Added actions: `setRandomSelectionEnabled`, `setRandomSelectionCount`

**CardGrid Logic** (`CardGrid.tsx`):
- Imported the existing `shuffle` utility
- Added selection logic before the existing shuffle/sort:

```typescript
const selectedCards = useMemo(() => {
  if (!randomSelectionEnabled || randomSelectionCount <= 0 || sourceCards.length === 0) {
    return sourceCards;
  }
  const count = Math.min(randomSelectionCount, sourceCards.length);
  const shuffled = shuffle([...sourceCards]);
  return shuffled.slice(0, count);
}, [sourceCards, randomSelectionEnabled, randomSelectionCount]);
```

**UI Implementation** (`CardSettingsTabs.tsx`):
- Added toggle in Layout sub-tab (after Aspect Ratio)
- Conditional slider appears when enabled
- Shows "X of Y cards" label
- Used existing slider styles for consistency

### Phase 2: Accessibility Improvements

**Skip-to-Content Link** (`App.tsx` + `App.module.css`):
- Added `<a href="#main-content">` before all content
- Visually hidden by default (positioned off-screen)
- Becomes visible on Tab focus
- Styled to match theme

**ARIA Live Region** (`LoadingScreen.tsx`):
- Added `role="status"` and `aria-live="polite"` to status text
- Added `aria-atomic="true"` for full announcement updates
- Screen readers now announce loading progress

### Phase 3: Storage Enhancements

**Collection Export** (`collectionExport.ts` - new file):
- `exportCollection()`: Creates Blob, generates download via programmatic anchor click
- `importCollection()`: Parses JSON, validates structure (placeholder for full implementation)

**Storage UI** (`StorageSettingsTabs.tsx`):
- Added Export Collection button to Images sub-tab
- Added Import Collection button (shows placeholder alert)
- Added Re-cache Images button to Cache sub-tab
- Wired `useImagePreloader` hook for re-caching

**Context Update** (`CollectionDataContext.tsx`):
- Added `collection` property to interface
- Exposed raw collection data for export functionality

**Collection Caching** (`useCollection.ts`):
- Added `cacheCollection()` call after successful fetch
- Fire-and-forget pattern (non-blocking)

## Challenges Encountered

### TypeScript Error: Missing Property

After adding export functionality, TypeScript complained:
```
Property 'collection' does not exist on type 'CollectionData'
```

**Solution**: Updated `CollectionDataContext.tsx` to:
1. Add `collection?: CollectionResult["collection"]` to interface
2. Include `collection: data?.collection` in provider value

### Feature Spec Drift

The original F-044 spec described a dropdown UI, but we implemented a toggle + slider for better UX. Required updating the spec to match implementation.

## Files Modified

| File | Changes |
|------|---------|
| `package.json` | Version 0.8.0 → 0.8.1 |
| `src/stores/settingsStore.ts` | Random selection state + migration v14 |
| `src/components/CardGrid/CardGrid.tsx` | Selection logic before shuffle |
| `src/components/SettingsPanel/CardSettingsTabs.tsx` | Toggle + slider UI |
| `src/hooks/useCollection.ts` | Collection caching |
| `src/components/LoadingScreen/LoadingScreen.tsx` | ARIA attributes |
| `src/App.tsx` | Skip-to-content link |
| `src/App.module.css` | Skip link styles |
| `src/context/CollectionDataContext.tsx` | Expose collection for export |
| `src/components/SettingsPanel/StorageSettingsTabs.tsx` | Export/Import/Re-cache UI |

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/collectionExport.ts` | Export/import utilities |
| `docs/prompts/implementation/v0.8.1/README.md` | Implementation prompt |

## Code Highlights

### Fisher-Yates Before Existing Shuffle

The random selection applies *before* the existing shuffle/sort logic, meaning:
1. Random subset selected from source cards
2. Then existing shuffle (if enabled) randomises order
3. Then sort (if enabled) orders by field

This preserves existing behaviour while adding the new capability.

### Skip Link CSS Pattern

```css
.skipLink {
  position: absolute;
  left: -9999px;  /* Visually hidden */
}
.skipLink:focus {
  left: var(--spacing-md);  /* Visible when focused */
}
```

This is the standard accessibility pattern for skip links.

---

## Related Documentation

- [v0.8.1 Milestone](../../roadmap/milestones/v0.8.1.md)
- [v0.8.1 Retrospective](../../process/retrospectives/v0.8.1/README.md)
- [F-044 Random Card Sampling](../../roadmap/features/completed/F-044-random-card-sampling.md)
- [Implementation Prompt](../../../prompts/implementation/v0.8.1/README.md)
