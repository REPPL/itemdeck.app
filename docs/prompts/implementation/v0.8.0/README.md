# v0.8.0 Implementation Prompt - Configuration & Offline

**Version:** v0.8.0
**Codename:** Configuration Externalisation
**Branch:** `feature/v0.8.0-config-offline`

---

## Overview

Externalise all configuration to collection.json, implement external theme loading, and add full IndexedDB caching with progress UI.

---

## Context

- v0.7.x completed visual polish and settings verification
- Hardcoded UI labels should be configurable per collection
- Themes are built-in only; users can't create custom themes
- IndexedDB caching exists (`cardCache.ts`) but isn't activated
- No offline support for images

---

## Scope

### In Scope (v0.8.0)

1. **UI Labels in collection.json** - Configurable strings (B.1)
2. **External Themes** - Load themes from public/themes/ (B.3)
3. **Full Config Externalisation** - All defaults in collection.json (B.4)
4. **IndexedDB Caching** - Activate existing cardCache.ts (D.1)
5. **Image Blob Caching** - True offline support (D.2)
6. **Loading Screen** - Progress indicator during cache (D.3)
7. **Storage Management UI** - Export/import/clear cache (D.4)

### Optional Additions (User to approve)

- F-025: Bundle Size Monitoring
- Migration guide v1→v2

---

## Phase 1: UI Labels Configuration (B.1)

**Schema Extension:**
```json
{
  "ui": {
    "labels": {
      "moreButton": "Verdict",
      "platformLabel": "Platform",
      "acknowledgementButton": "Acknowledgement",
      "imageSourceLabel": "Image Source",
      "sourceButtonDefault": "Source",
      "rankPlaceholder": "The one that got away!"
    }
  }
}
```

**Files to Create:**
- `src/context/CollectionUIContext.tsx` - Context for UI labels

**Files to Modify:**
- `src/schemas/v2/collection.schema.ts` - Add UIConfigSchema
- `src/loaders/collectionLoader.ts` - Extract UI config
- `src/components/CardExpanded/CardExpanded.tsx` - Use `useUILabels()` hook
- `src/components/RankBadge/RankBadge.tsx` - Use `useUILabels()` hook
- `src/App.tsx` - Wrap with `CollectionUIProvider`

**Implementation:**
```typescript
// src/context/CollectionUIContext.tsx
interface UILabels {
  moreButton: string;
  platformLabel: string;
  acknowledgementButton: string;
  imageSourceLabel: string;
  sourceButtonDefault: string;
  rankPlaceholder: string;
}

const defaultLabels: UILabels = {
  moreButton: "Verdict",
  platformLabel: "Platform",
  acknowledgementButton: "Acknowledgement",
  imageSourceLabel: "Image Source",
  sourceButtonDefault: "Source",
  rankPlaceholder: "The one that got away!",
};

export function useUILabels(): UILabels {
  const context = useContext(CollectionUIContext);
  return { ...defaultLabels, ...context?.labels };
}
```

---

## Phase 2: External Themes (B.3)

**Structure:**
```
public/themes/
├── README.md           # Theme creation guide
├── retro.json          # Example theme
└── modern.json         # Example theme
```

**Theme JSON Format:**
```json
{
  "name": "Retro Custom",
  "version": "1.0.0",
  "description": "A retro-inspired theme",
  "colours": {
    "accent": "#ff6b6b",
    "hover": "#ff8787",
    "cardBackground": "#1a1a2e"
  },
  "animations": {
    "flip": { "duration": 0.6, "easing": "ease-in-out" },
    "detail": { "duration": 0.3, "easing": "ease-out" },
    "overlay": { "duration": 0.2, "easing": "ease-out" }
  },
  "borders": {
    "radius": "medium",
    "width": "small"
  },
  "shadows": {
    "intensity": "medium"
  }
}
```

**Files to Create:**
- `src/schemas/theme.schema.ts` - Zod schema for theme validation
- `src/loaders/themeLoader.ts` - Fetch and validate themes from URL
- `src/hooks/useThemeLoader.ts` - React hook with caching

**Files to Modify:**
- `src/components/SettingsPanel/ThemeSettingsTabs.tsx` - Add "Custom" option
- `src/stores/settingsStore.ts` - Add `customThemeUrl` setting

---

## Phase 3: Full Config Externalisation (B.4)

**Collection Config:**
```json
{
  "config": {
    "defaults": {
      "theme": "retro",
      "cardSize": "medium"
    },
    "cards": {
      "aspectRatio": "5:7",
      "maxVisibleCards": 2,
      "shuffleOnLoad": true
    },
    "fieldMapping": {
      "titleField": "title",
      "subtitleField": "year",
      "footerBadgeField": "categoryShort"
    }
  }
}
```

**Files to Create:**
- `src/hooks/useCollectionConfig.ts` - Merge collection + user settings

**Files to Modify:**
- `src/schemas/v2/collection.schema.ts` - Add ConfigSchema
- `src/loaders/collectionLoader.ts` - Extract config section
- `src/stores/settingsStore.ts` - Use collection defaults as base

**Logic:**
```typescript
// Priority: User settings > Collection defaults > App defaults
export function useMergedSettings() {
  const collectionConfig = useCollectionConfig();
  const userSettings = useSettingsStore();

  return {
    ...appDefaults,
    ...collectionConfig,
    ...userSettings,
  };
}
```

---

## Phase 4: IndexedDB Caching (D.1-D.2)

**Files to Create:**
- `src/stores/cacheStore.ts` - Zustand store for cache state

**Files to Modify:**
- `src/lib/cardCache.ts` - Add image blob caching functions
- `src/hooks/useCollection.ts` - Check cache first, cache after fetch

**Image Caching Implementation:**
```typescript
// src/lib/cardCache.ts
export async function cacheImage(imageUrl: string): Promise<void> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  const db = await openDB();
  await db.put("images", {
    url: imageUrl,
    blob,
    cachedAt: Date.now(),
  });
}

export async function getCachedImage(imageUrl: string): Promise<string | null> {
  const db = await openDB();
  const cached = await db.get("images", imageUrl);
  if (!cached) return null;
  return URL.createObjectURL(cached.blob);
}

export async function cacheAllImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < imageUrls.length; i++) {
    await cacheImage(imageUrls[i]);
    onProgress?.(i + 1, imageUrls.length);
  }
}
```

---

## Phase 5: Loading Screen (D.3)

**Files to Create:**
- `src/components/LoadingScreen/LoadingScreen.tsx`
- `src/components/LoadingScreen/LoadingScreen.module.css`
- `src/components/LoadingScreen/index.ts`

**Features:**
- Progress bar with percentage
- Phase indicator: "Loading collection..." → "Caching images..."
- Lock screen during load (pointer-events: none)
- Smooth fade-out when complete

**Implementation:**
```tsx
interface LoadingScreenProps {
  phase: "collection" | "images";
  current: number;
  total: number;
}

export function LoadingScreen({ phase, current, total }: LoadingScreenProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.spinner} />
        <p className={styles.phase}>
          {phase === "collection" ? "Loading collection..." : "Caching images..."}
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: `${percentage}%` }} />
        </div>
        <p className={styles.count}>{current} of {total}</p>
      </div>
    </div>
  );
}
```

---

## Phase 6: Storage Management UI (D.4)

**Files to Create:**
- `src/lib/collectionExport.ts` - Export/import functions

**Files to Modify:**
- `src/components/SettingsPanel/SettingsPanel.tsx` - Add Storage section

**UI Elements:**
- Cache status display (size, item count)
- "Clear Cache" button
- "Export Collection" button (downloads JSON)
- "Import Collection" button (loads from file)

**Implementation:**
```typescript
// src/lib/collectionExport.ts
export async function exportCollection(): Promise<string> {
  const db = await openDB();
  const collection = await db.get("collections", "current");
  return JSON.stringify(collection, null, 2);
}

export async function importCollection(json: string): Promise<void> {
  const data = JSON.parse(json);
  // Validate with Zod schema
  const validated = CollectionSchema.parse(data);

  const db = await openDB();
  await db.put("collections", validated);
}

export async function getCacheStats(): Promise<{ size: number; items: number }> {
  const db = await openDB();
  const images = await db.getAll("images");
  const totalSize = images.reduce((sum, img) => sum + img.blob.size, 0);
  return { size: totalSize, items: images.length };
}
```

---

## Success Criteria

- [ ] UI labels configurable in collection.json
- [ ] Custom themes load from public/themes/
- [ ] Collection defaults apply correctly
- [ ] User settings override collection defaults
- [ ] IndexedDB caching works for collection data
- [ ] Images cached as blobs for offline use
- [ ] Progress bar shows during initial load
- [ ] Export/import/clear cache UI works
- [ ] Cache statistics display correctly

---

## Post-Implementation

1. Create devlog: `docs/development/process/devlogs/v0.8.0/README.md`
2. Create retrospective: `docs/development/process/retrospectives/v0.8.0/README.md`
3. Create theme creation guide: `public/themes/README.md`
4. Run verification: `/verify-docs`, `/sync-docs`, `/pii-scan`
5. Create git tag: `v0.8.0`

---

## Related Documentation

- [v0.7.3 Implementation Prompt](../v0.7.3/README.md)
- [v0.7.1 Plan - Deferred Items](../../../../.claude/plans/happy-percolating-island.md)
- [Schema v2 Reference](../../reference/schemas/v2/README.md)

---

**Status**: Ready for Implementation
