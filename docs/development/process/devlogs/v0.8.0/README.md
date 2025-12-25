# v0.8.0 Development Log - Visual Overhaul, Configuration & Caching

## Implementation Narrative

This milestone represented a significant expansion of itemdeck's capabilities, implementing five major feature areas: visual polish fixes, UI labels configuration, external theme system, full configuration externalisation, and IndexedDB image caching with storage management.

### Phase 0: Visual Polish Fixes

The first phase addressed two visual issues:

1. **Drag Handle Flip Animation** - The drag handle at the bottom of cards remained visible during the card flip animation, creating a jarring visual effect. This was fixed by tracking flip animation state and hiding the drag handle during transitions.

2. **Adaptive Text Contrast** - Cards with light background colours (e.g., yellow) made white text and icons nearly invisible. Implemented WCAG 2.1 relative luminance calculation to automatically switch to dark text/icons for light backgrounds.

Additionally, extra colour settings were added:
- Card back extra colours 1/2/3
- Card back text colour override
- Rank badge text colour

### Phase 1: UI Labels Configuration

Created a context-based system for customisable UI labels:

```typescript
// CollectionUIContext.tsx
export interface UILabels {
  moreButton: string;
  platformLabel: string;
  acknowledgementButton: string;
  imageSourceLabel: string;
  sourceButtonDefault: string;
  rankPlaceholder: string;
}
```

Components now use `useUILabels()` hook, allowing collections to override default labels via `uiLabels` in collection.json.

### Phase 2: External Theme System

Implemented comprehensive theme loading from external JSON files:

- **Schema** (`theme.schema.ts`) - Zod validation for theme structure
- **Loader** (`themeLoader.ts`) - Fetches and validates theme JSON
- **Hook** (`useThemeLoader.ts`) - TanStack Query integration
- **Registry** (`themeRegistry.ts`) - Curated theme sources

Themes can be loaded from `public/themes/` or remote URLs. The settings panel now includes a theme selector with custom theme URL input.

### Phase 3: Full Config Externalisation

Extended the collection schema to support configuration defaults:

```typescript
interface CollectionConfigForDefaults {
  defaults?: {
    theme?: "retro" | "modern" | "minimal";
    cardSize?: "small" | "medium" | "large";
    cardAspectRatio?: "3:4" | "5:7" | "1:1";
  };
  cards?: {
    maxVisibleCards?: number;
    shuffleOnLoad?: boolean;
    cardBackDisplay?: "year" | "logo" | "both" | "none";
  };
  fieldMapping?: { ... };
}
```

New users get collection defaults applied automatically. Existing users (detected via store migration to version 13) keep their settings.

### Phase 4: IndexedDB Image Caching

Built a complete image caching system using the `idb` library:

- **Database** (`src/db/index.ts`) - IndexedDB schema with `images` and `metadata` stores
- **Service** (`src/services/imageCache.ts`) - CRUD operations with LRU eviction
- **Hooks** (`src/hooks/useImageCache.ts`) - React integration with TanStack Query

Key features:
- 50MB default cache limit
- LRU eviction when limit reached
- Last-accessed tracking for intelligent eviction
- Cache statistics and management APIs

### Phase 5: Loading Screen with Progress

Created a themed loading screen component:

- Collection loading phase
- Image preloading phase with progress bar
- Minimum display time to prevent flash
- Theme-aware styling

### Phase 6: Storage Management UI

Added storage tab to settings panel:

- Cache statistics display (image count, storage used, percentage)
- Clear cache button with confirmation dialog
- Information about automatic LRU eviction

## Challenges Encountered

### TypeScript Strict Mode Challenges

The codebase uses strict TypeScript settings. Several patterns required careful handling:

1. **Non-null assertions** - Replaced `url!` patterns with explicit null checks or variable captures
2. **Template literal types** - Wrapped numbers with `String()` in template literals
3. **Promise rejection types** - Used `new Error()` instead of raw error objects

### IndexedDB Testing

Testing IndexedDB required `fake-indexeddb` library. One test for `getAsObjectURL` was skipped because fake-indexeddb returns plain objects rather than proper Blob instances.

### Store Migration

The settings store migration from version 12 to 13 required careful handling to preserve existing user settings while adding the new `hasAppliedCollectionDefaults` flag.

## Files Created

| File | Purpose |
|------|---------|
| `src/db/index.ts` | IndexedDB database module |
| `src/services/imageCache.ts` | Image caching service |
| `src/hooks/useImageCache.ts` | React cache hooks |
| `src/hooks/useThemeLoader.ts` | Theme loading hook |
| `src/loaders/themeLoader.ts` | Theme loader functions |
| `src/schemas/theme.schema.ts` | Theme schema validation |
| `src/config/themeRegistry.ts` | Curated theme sources |
| `src/context/CollectionUIContext.tsx` | UI labels context |
| `src/context/CollectionDataContext.tsx` | Collection data context |
| `src/utils/colourContrast.ts` | Luminance utilities |
| `src/components/LoadingScreen/` | Loading screen component |
| `src/components/SettingsPanel/StorageSettingsTabs.tsx` | Storage settings UI |
| `public/themes/*.json` | Example theme files |
| `tests/services/imageCache.test.ts` | Image cache tests |
| `tests/stores/settingsStore.config.test.ts` | Config tests |

## Files Modified

| File | Changes |
|------|---------|
| `src/App.tsx` | Added context providers |
| `src/components/Card/*.tsx` | Flip animation state, light background handling |
| `src/components/CardExpanded/CardExpanded.tsx` | UI labels integration |
| `src/components/RankBadge/RankBadge.tsx` | UI labels integration |
| `src/components/SettingsPanel/SettingsPanel.tsx` | Storage tab |
| `src/hooks/useCollection.ts` | Config extraction |
| `src/schemas/v2/collection.schema.ts` | UI labels and config schemas |
| `src/stores/settingsStore.ts` | Config defaults, version 13 |

## Code Highlights

### Luminance Calculation (WCAG 2.1)

```typescript
export function getLuminance(hex: string): number {
  const cleanHex = hex.replace(/^#/, "");
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const [rL, gL, bL] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );

  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}
```

### LRU Eviction

```typescript
async evictLRU(requiredSpace: number, maxSize: number): Promise<void> {
  const index = tx.objectStore("images").index("by-last-accessed");

  for await (const cursor of index) {
    if (currentSize <= targetSize) break;
    imagesToDelete.push(cursor.value.url);
    currentSize -= cursor.value.size;
  }
}
```

---

## Related Documentation

- [v0.8.0 Milestone](../../roadmap/milestones/v0.8.0.md)
- [v0.8.0 Retrospective](../../retrospectives/v0.8.0/README.md)
- [Implementation Prompt](../../../prompts/implementation/v0.8.0/README.md)

---
