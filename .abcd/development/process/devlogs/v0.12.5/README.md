# v0.12.5 Development Log

## Overview

**Theme:** URL Simplification, Plugin-Ready Architecture & Snap Ranking

This milestone delivered simplified URL formats for collection loading, a plugin-ready mechanic architecture with manifest.json files, the new Snap Ranking game mechanic, and Fit-to-Viewport view integration.

---

## Implementation Narrative

### Phase 1: Documentation & Configuration

Started with housekeeping tasks:
- Updated `package.json` version to 0.12.5
- Fixed README.md by removing the Licence section (SSOT violation - LICENSE file is canonical)
- Corrected false claims: "mechanics coming soon" → "multiple game mechanics", removed "customisable shortcuts"
- Updated URL examples to show the new simplified formats
- Fixed broken documentation links in tutorials and guides

### Phase 2: URL Format Simplification

Implemented cleaner URL patterns in `useUrlCollection.ts`:
- Added `/gh?u=USER&c=COLLECTION` short query format
- Added `/gh/USER/c/COLLECTION` clean path format
- Supported nested folders (e.g., `retro/my_games`)
- Maintained backwards compatibility with existing formats

The path type indicator `/c/` was chosen to allow future expansion:
- `/c/` = collection (current)
- `/m/` = mechanic (future v0.13.0+)
- `/t/` = theme (future)

### Phase 3: Fit-to-Viewport Integration

Integrated the existing `useFitToViewport` hook into the main CardGrid:
- Added "fit" to the `LayoutType` union in settingsStore
- Added "Fit" option to QuickSettings layout selector
- Created `fitContainerRef` and `effectiveDimensions` pattern in CardGrid
- Added `.fitContainer` CSS for viewport-aware sizing

The fit mode calculates optimal card sizes to display all cards without scrolling.

### Phase 4: Plugin-Ready Architecture

Created the foundation for external mechanic plugins:

1. **Mechanic Manifest Schema** (`mechanic-manifest.schema.ts`)
   - Zod schema for validating manifest.json files
   - Supports id, name, version, description, entrypoint, minCards, maxCards, author, etc.
   - Includes registry schema for listing available mechanics

2. **Memory Mechanic Manifest** (`mechanics/memory/manifest.json`)
   - Made the existing Memory mechanic plugin-ready
   - Added all required metadata fields

### Phase 5: Snap Ranking Mechanic (F-061)

Built a complete new game mechanic with plugin-compatible structure:

**Files Created:**
- `manifest.json` - Mechanic metadata
- `types.ts` - TierRating, TIER_ORDER, TIER_INFO, CardRating, SnapRankingState
- `store.ts` - Zustand store with game actions
- `components.tsx` - SnapRankingCardOverlay, RatingButtons, StatsBar, ResultsModal
- `Settings.tsx` - SnapRankingSettingsPanel
- `index.tsx` - snapRankingMechanic implementation
- `SnapRanking.module.css` - Scoped styles

**Features:**
- Cards presented one at a time (shuffled)
- S/A/B/C/D/F tier rating buttons
- Keyboard shortcuts (S/A/B/C/D/F keys)
- No going back - ratings are final
- Progress indicator (card X of Y)
- Timer tracking
- Tier list results display
- Copy results to clipboard

---

## Challenges Encountered

### TypeScript Interface Extension

**Issue:** SnapRankingStore was not assignable to MechanicState due to missing index signature.

**Solution:** Made SnapRankingState extend MechanicState:
```typescript
export interface SnapRankingState extends MechanicState {
  // ... state fields
}
```

### Fit-to-Viewport Integration

**Issue:** Needed to conditionally use fit dimensions vs standard card dimensions without breaking existing layouts.

**Solution:** Created `effectiveDimensions` pattern:
```typescript
const effectiveDimensions = useMemo(() => {
  if (isFitMode && fitResult.cardWidth > 0) {
    return { width: fitResult.cardWidth, height: fitResult.cardHeight };
  }
  return cardDimensions;
}, [isFitMode, fitResult, cardDimensions]);
```

### Pre-existing Test Failures

**Issue:** 3 tests in ImageWithFallback.test.tsx were failing - they expected title text but component uses colour-only placeholders.

**Solution:** Updated tests to check for coloured background elements instead of title text.

---

## Code Highlights

### Tier Rating System

```typescript
export const TIER_INFO: Record<TierRating, { label: string; colour: string; bgColour: string; shortcut: string }> = {
  S: { label: "S Tier", colour: "#ffd700", bgColour: "#ffd70033", shortcut: "S" },
  A: { label: "A Tier", colour: "#90ee90", bgColour: "#90ee9033", shortcut: "A" },
  B: { label: "B Tier", colour: "#87ceeb", bgColour: "#87ceeb33", shortcut: "B" },
  C: { label: "C Tier", colour: "#dda0dd", bgColour: "#dda0dd33", shortcut: "C" },
  D: { label: "D Tier", colour: "#f4a460", bgColour: "#f4a46033", shortcut: "D" },
  F: { label: "F Tier", colour: "#cd5c5c", bgColour: "#cd5c5c33", shortcut: "F" },
};
```

### Mechanic Manifest Validation

```typescript
export const mechanicManifestSchema = z.object({
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  entrypoint: z.string().default("./index.ts"),
  minCards: z.number().int().positive().optional(),
  maxCards: z.number().int().nonnegative().optional(),
  author: mechanicAuthorSchema.optional(),
  // ...
});
```

---

## Files Created/Modified

### New Files (13)

| File | Purpose |
|------|---------|
| `src/schemas/mechanic-manifest.schema.ts` | Zod schema for mechanic manifests |
| `src/mechanics/memory/manifest.json` | Memory mechanic metadata |
| `src/mechanics/snap-ranking/manifest.json` | Snap Ranking metadata |
| `src/mechanics/snap-ranking/types.ts` | TypeScript interfaces |
| `src/mechanics/snap-ranking/store.ts` | Zustand state management |
| `src/mechanics/snap-ranking/components.tsx` | UI components |
| `src/mechanics/snap-ranking/Settings.tsx` | Settings panel |
| `src/mechanics/snap-ranking/index.tsx` | Mechanic definition |
| `src/mechanics/snap-ranking/SnapRanking.module.css` | Scoped styles |
| `docs/prompts/implementation/v0.12.5/README.md` | Implementation prompt |
| `tests/hooks/useUrlCollection.test.ts` | URL parsing tests |

### Modified Files (15)

| File | Changes |
|------|---------|
| `package.json` | Version 0.12.5 |
| `README.md` | Remove licence, fix claims, update URL examples |
| `src/hooks/useUrlCollection.ts` | Add simplified URL patterns |
| `src/stores/settingsStore.ts` | Add "fit" layout type |
| `src/components/SettingsPanel/QuickSettings.tsx` | Add Fit option |
| `src/components/CardGrid/CardGrid.tsx` | Integrate fit-to-viewport |
| `src/components/CardGrid/CardGrid.module.css` | Add fitContainer styles |
| `src/mechanics/index.ts` | Register snap-ranking |
| `src/schemas/index.ts` | Export manifest schema |
| `docs/tutorials/getting-started.md` | Fix broken links |
| `docs/guides/search-and-filters.md` | Fix broken links |
| Feature specs | Move F-057, F-061 to completed/ |

---

## Related Documentation

- [v0.12.5 Milestone](../../roadmap/milestones/v0.12.5.md)
- [v0.12.5 Retrospective](../../process/retrospectives/v0.12.5/README.md)
- [F-061 Snap Ranking](../../roadmap/features/completed/F-061-snap-ranking-mechanic.md)
- [F-031 Fit-to-Viewport](../../roadmap/features/completed/F-031-fit-to-viewport.md)
- [Implementation Prompt](../../../prompts/implementation/v0.12.5/README.md)
