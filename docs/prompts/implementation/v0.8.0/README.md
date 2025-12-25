# v0.8.0 Implementation Prompt - Visual Overhaul, Configuration & Caching

**Version:** v0.8.0
**Codename:** Visual Overhaul, Configuration & Caching
**Branch:** `feature/v0.8.0-config-caching`

---

## Overview

This release implements five major capability areas:

1. **Visual Polish** - Drag handle animation fix + adaptive text contrast for light backgrounds
2. **Configuration Externalisation** - UI labels and defaults configurable per collection
3. **External Theme System** - Load themes from local folder or curated remote sources
4. **Full IndexedDB Caching** - Collection data + image blob caching with progress UI
5. **Storage Management** - Export/import/clear cache functionality

---

## Context

- v0.7.x completed visual polish and settings verification
- Hardcoded UI labels should be configurable per collection
- Themes are built-in only; users can't create custom themes
- IndexedDB caching exists (`cardCache.ts`) but isn't activated
- No offline support for images
- Yellow/light card backgrounds have invisible white drag icons
- Drag handle remains visible during card flip animation (jarring)

---

## Design Decisions (Pre-Approved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme sources | Local + curated remotes | Balance flexibility with security |
| Image caching | Eager + skip option | Fast offline access, user can skip for quick start |
| Config defaults | New users only | Preserve existing user settings |

---

## Implementation Phases

### Phase 0: Visual Polish Fixes

**Goal:** Fix two visual issues before main feature work

#### Issue 1: Drag Handle Visibility During Flip

**Problem:** When a card flips, the drag handle overlay at the bottom remains visible during the animation.

**Solution:** Track flip animation state and hide drag handle during animation.

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/Card/CardInner.tsx` | Add `onAnimationStart`/`onAnimationComplete` callbacks |
| `src/components/Card/CardBack.tsx` | Accept `isFlipping` prop, conditionally hide drag handle |
| `src/components/Card/CardFront.tsx` | Accept `isFlipping` prop, conditionally hide drag overlay |
| `src/components/Card/Card.tsx` | Track `isFlipping` state, pass to card faces |

**Implementation:**

```tsx
// Card.tsx - Track flip animation state
const [isFlipping, setIsFlipping] = useState(false);

// Pass callbacks to CardInner
<CardInner
  isFlipped={isFlipped}
  flipDuration={config.animation.flipDuration}
  onFlipStart={() => setIsFlipping(true)}
  onFlipComplete={() => setIsFlipping(false)}
  back={
    <CardBack
      // ... existing props
      isFlipping={isFlipping}
    />
  }
  front={
    <CardFront
      // ... existing props
      isFlipping={isFlipping}
    />
  }
/>
```

```tsx
// CardInner.tsx - Trigger callbacks on animation
<motion.div
  onAnimationStart={() => onFlipStart?.()}
  onAnimationComplete={() => onFlipComplete?.()}
  // ...
>
```

```tsx
// CardBack.tsx - Hide drag handle during flip
{showDragHandle && !isFlipping && (
  <div className={styles.dragHandle} {...dragHandleProps}>
    <DragGripIcon />
  </div>
)}
```

#### Issue 2: Adaptive Text Contrast for Light Backgrounds

**Problem:** Card backgrounds can be light colours (e.g., yellow `#ffff00`), making white text and drag icons nearly invisible.

**Solution:** Calculate luminance of background colour and switch to dark text/icons.

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/utils/colourContrast.ts` | Luminance calculation and contrast utilities |

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/components/Card/CardBack.tsx` | Apply `data-light-bg` based on background luminance |
| `src/components/Card/Card.module.css` | Styles for `[data-light-bg="true"]` |
| `src/hooks/useVisualTheme.ts` | Expose `isLightBackground` based on `cardBackgroundColour` |

**New File: `src/utils/colourContrast.ts`**

```typescript
/**
 * Colour contrast utilities using WCAG 2.1 relative luminance.
 */

/**
 * Calculate relative luminance of a colour.
 * @param hex - Hex colour string (e.g., "#ff6b6b")
 * @returns Luminance value between 0 (black) and 1 (white)
 */
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

/**
 * Determine if a colour is "light" (needs dark text for contrast).
 * @param hex - Hex colour string
 * @param threshold - Luminance threshold (default 0.5)
 */
export function isLightColour(hex: string, threshold = 0.5): boolean {
  return getLuminance(hex) > threshold;
}

/**
 * Get optimal text colour for a background.
 * @param backgroundHex - Background colour hex
 * @returns "#000000" for light backgrounds, "#ffffff" for dark
 */
export function getContrastTextColour(backgroundHex: string): string {
  return isLightColour(backgroundHex) ? "#000000" : "#ffffff";
}
```

**CSS Additions: `Card.module.css`**

```css
/* Light background: dark text/icons */
.cardBack[data-light-bg="true"] .dragHandle {
  background: rgba(0, 0, 0, 0.08);
  border-top-color: rgba(0, 0, 0, 0.1);
}

.cardBack[data-light-bg="true"] .dragGripIcon {
  color: rgba(0, 0, 0, 0.5);
}

.cardBack[data-light-bg="true"]:hover .dragGripIcon {
  color: rgba(0, 0, 0, 0.8);
}
```

**Success Criteria (Phase 0):**

- [ ] Drag handle hidden during card flip animation
- [ ] Drag handle reappears after flip completes
- [ ] Light background colours trigger dark text/icons
- [ ] Yellow (#ffff00) background shows black drag icons
- [ ] Dark backgrounds continue using white text/icons

---

### Phase 1: UI Labels Configuration (B.1)

**Goal:** Allow collection.json to specify custom UI labels

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

| File | Purpose |
|------|---------|
| `src/context/CollectionUIContext.tsx` | Context provider for UI labels |

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/schemas/v2/collection.schema.ts` | Add `UILabelsSchema` |
| `src/loaders/collectionLoader.ts` | Extract UI labels from collection |
| `src/components/CardExpanded/CardExpanded.tsx` | Use `useUILabels()` hook |
| `src/components/RankBadge/RankBadge.tsx` | Use `useUILabels()` hook |
| `src/App.tsx` | Wrap with `CollectionUIProvider` |

**Implementation:**

```typescript
// src/context/CollectionUIContext.tsx
import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface UILabels {
  moreButton: string;
  platformLabel: string;
  acknowledgementButton: string;
  imageSourceLabel: string;
  sourceButtonDefault: string;
  rankPlaceholder: string;
}

const DEFAULT_LABELS: UILabels = {
  moreButton: "Verdict",
  platformLabel: "Platform",
  acknowledgementButton: "Acknowledgement",
  imageSourceLabel: "Image Source",
  sourceButtonDefault: "Source",
  rankPlaceholder: "The one that got away!",
};

const CollectionUIContext = createContext<UILabels>(DEFAULT_LABELS);

export function CollectionUIProvider({
  labels,
  children,
}: {
  labels?: Partial<UILabels>;
  children: ReactNode;
}) {
  const mergedLabels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels]
  );
  return (
    <CollectionUIContext.Provider value={mergedLabels}>
      {children}
    </CollectionUIContext.Provider>
  );
}

export function useUILabels(): UILabels {
  return useContext(CollectionUIContext);
}
```

**Success Criteria (Phase 1):**

- [ ] UI labels configurable in collection.json
- [ ] Labels merge with defaults (partial override supported)
- [ ] CardExpanded uses `useUILabels()` for all button text
- [ ] RankBadge uses `useUILabels()` for placeholder

---

### Phase 2: External Themes (B.3)

**Goal:** Allow custom themes from local folder and curated remote registries

**Theme JSON Format:**

```json
{
  "name": "Retro Custom",
  "version": "1.0.0",
  "description": "A retro-inspired theme with warm colours",
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
  },
  "verdict": {
    "animationStyle": "flip"
  }
}
```

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/schemas/theme.schema.ts` | Zod schema for theme validation |
| `src/loaders/themeLoader.ts` | Load themes from URL, validate, cache |
| `src/hooks/useThemeLoader.ts` | React hook with TanStack Query |
| `src/config/themeRegistry.ts` | Curated list of remote theme sources |
| `public/themes/README.md` | Theme creation guide |
| `public/themes/retro-warm.json` | Example custom theme |

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/stores/settingsStore.ts` | Add `customThemeUrl: string \| null` |
| `src/components/SettingsPanel/ThemeSettingsTabs.tsx` | Add theme selector |
| `src/hooks/useVisualTheme.ts` | Apply custom theme when selected |

**Success Criteria (Phase 2):**

- [ ] Theme schema validates theme JSON structure
- [ ] Themes load from `public/themes/*.json`
- [ ] Theme selector shows built-in + custom themes
- [ ] Invalid themes show error, fall back to built-in

---

### Phase 3: Full Configuration Externalisation (B.4)

**Goal:** Allow collection.json to specify default settings

**Collection Config Schema:**

```json
{
  "config": {
    "defaults": {
      "theme": "retro",
      "cardSize": "medium",
      "cardAspectRatio": "5:7"
    },
    "cards": {
      "maxVisibleCards": 2,
      "shuffleOnLoad": true
    },
    "fieldMapping": {
      "titleField": "title",
      "subtitleField": "year",
      "footerBadgeField": "categoryShort",
      "logoField": "platform.logoUrl"
    }
  }
}
```

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/hooks/useCollectionConfig.ts` | Merge collection + user settings |
| `src/context/CollectionConfigContext.tsx` | Provide merged config |

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/schemas/v2/collection.schema.ts` | Add `CollectionConfigSchema` |
| `src/loaders/collectionLoader.ts` | Extract config section |
| `src/stores/settingsStore.ts` | Add `hasAppliedDefaults` flag |

**Merging Logic:**

```
Priority: User Settings > Collection Defaults > App Defaults

For new users (no localStorage):
  1. Load collection config defaults
  2. Apply as initial settings
  3. Set hasAppliedDefaults = true

For existing users:
  1. Ignore collection defaults
  2. Use existing user settings
```

**Success Criteria (Phase 3):**

- [ ] Collection config schema validates structure
- [ ] New users get collection defaults applied
- [ ] Existing users keep their settings
- [ ] Field mapping configurable per collection

---

### Phase 4: IndexedDB Activation & Image Caching (D.1, D.2)

**Goal:** Enable full offline support with collection + image caching

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/stores/cacheStore.ts` | Zustand store for cache state |
| `src/lib/imageCache.ts` | Image blob caching functions |
| `src/hooks/useCacheStatus.ts` | Hook for cache statistics |

**Files to Modify:**

| File | Changes |
|------|---------|
| `src/lib/cardCache.ts` | Add image blob caching functions |
| `src/hooks/useCollection.ts` | Check cache first, cache after fetch |

**Image Caching Implementation:**

```typescript
// src/lib/imageCache.ts
import { get, set, del, keys } from "idb-keyval";

const IMAGE_CACHE_PREFIX = "itemdeck-image-";

export async function cacheImage(imageUrl: string): Promise<void> {
  const response = await fetch(imageUrl, { mode: "cors" });
  if (!response.ok) throw new Error(`Failed to fetch ${imageUrl}`);

  const blob = await response.blob();
  const hash = btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);

  await set(`${IMAGE_CACHE_PREFIX}${hash}`, {
    url: imageUrl,
    blob,
    cachedAt: Date.now(),
    size: blob.size,
  });
}

export async function getCachedImage(imageUrl: string): Promise<string | null> {
  const hash = btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
  const cached = await get(`${IMAGE_CACHE_PREFIX}${hash}`);

  if (!cached) return null;
  return URL.createObjectURL(cached.blob);
}

export async function cacheAllImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      await cacheImage(imageUrls[i]);
      success++;
    } catch {
      failed++;
    }
    onProgress?.(i + 1, imageUrls.length);
  }

  return { success, failed };
}

export async function clearImageCache(): Promise<void> {
  const allKeys = await keys();
  const imageKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(IMAGE_CACHE_PREFIX)
  );
  await Promise.all(imageKeys.map((k) => del(k)));
}
```

**Success Criteria (Phase 4):**

- [ ] Collection data cached on first load
- [ ] Images cached with progress indicator
- [ ] Cached images used when available
- [ ] Skip option for quick start
- [ ] Offline mode works

---

### Phase 5: Loading Screen with Progress (D.3)

**Goal:** Show visual progress during initial load and caching

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/components/LoadingScreen/LoadingScreen.tsx` | Progress overlay |
| `src/components/LoadingScreen/LoadingScreen.module.css` | Styles |
| `src/components/LoadingScreen/index.ts` | Barrel export |

**Component Design:**

```tsx
interface LoadingScreenProps {
  phase: "collection" | "images";
  current: number;
  total: number;
  canSkip: boolean;
  onSkip: () => void;
}

export function LoadingScreen({
  phase,
  current,
  total,
  canSkip,
  onSkip,
}: LoadingScreenProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <img src="/logo.svg" alt="Itemdeck" />
        </div>

        <div className={styles.status}>
          <div className={styles.spinner} />
          <p className={styles.phase}>
            {phase === "collection"
              ? "Loading collection..."
              : "Caching images for offline use..."}
          </p>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progress}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className={styles.count}>{current} / {total}</span>
        </div>

        {canSkip && phase === "images" && (
          <button className={styles.skipButton} onClick={onSkip}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
```

**Success Criteria (Phase 5):**

- [ ] Loading screen appears during initial load
- [ ] Progress bar shows accurate percentage
- [ ] Phase indicator (collection vs images)
- [ ] Skip button available during image caching
- [ ] Smooth fade-out when complete

---

### Phase 6: Storage Management UI (D.4)

**Goal:** Allow users to manage cached data

**Files to Create:**

| File | Purpose |
|------|---------|
| `src/lib/collectionExport.ts` | Export/import functions |
| `src/components/SettingsPanel/StorageSettings.tsx` | Storage UI |

**UI Layout:**

```
Storage Settings Tab:
├── Cache Status
│   ├── Collection data: 256 KB
│   ├── Cached images: 12.4 MB (45 images)
│   └── Total: 12.7 MB
├── Actions
│   ├── [Clear Image Cache]
│   ├── [Clear All Cache]
│   └── [Re-cache Images]
└── Collection Data
    ├── [Export Collection] → Downloads JSON
    └── [Import Collection] → File picker
```

**Success Criteria (Phase 6):**

- [ ] Cache statistics display correctly
- [ ] Clear cache buttons work
- [ ] Export downloads valid JSON
- [ ] Import validates and stores collection

---

### Phase 7: Testing & Quality

**Test Coverage Targets:**

| Area | Target |
|------|--------|
| Colour Contrast Utilities | 100% |
| UI Labels Context | 90% |
| Theme Schema | 100% |
| Theme Loader | 85% |
| Collection Config | 90% |
| Image Cache | 80% |
| Storage Management | 75% |

**Test Files to Create:**

| File | Tests |
|------|-------|
| `src/utils/__tests__/colourContrast.test.ts` | Luminance, isLight, contrast |
| `src/context/__tests__/CollectionUIContext.test.tsx` | Label merging, defaults |
| `src/schemas/__tests__/theme.schema.test.ts` | Validation, error handling |
| `src/lib/__tests__/imageCache.test.ts` | Blob storage, retrieval |

---

### Phase 8: Documentation & Verification

**Documentation to Create/Update:**

| Document | Purpose |
|----------|---------|
| `docs/development/roadmap/milestones/v0.8.0.md` | Milestone document |
| `public/themes/README.md` | Theme creation guide |
| `docs/reference/collection-config.md` | Configuration reference |

**Verification Checklist:**

- [ ] Run `/verify-docs` - fix all issues
- [ ] Run `/sync-docs` - verify consistency
- [ ] Run `/pii-scan` - no personal info
- [ ] Run `/check-british` - British English compliance
- [ ] All tests pass (`npm test`)
- [ ] TypeScript clean (`npm run typecheck`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

---

### Phase 9: Devlog & Retrospective

**Create:**

- `docs/development/process/devlogs/v0.8.0/README.md`
- `docs/development/process/retrospectives/v0.8.0/README.md`

**Devlog Content:**
- Implementation narrative
- Technical decisions made
- Challenges encountered
- Files created/modified
- Code highlights

**Retrospective Content:**
- What went well
- What could improve
- Lessons learned
- Decisions made (table)
- Metrics (files, lines, tests)
- Follow-up items

---

### Phase 10: Release

**Pre-Release Checklist:**

- [ ] All phases complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Devlog written
- [ ] Retrospective written
- [ ] Time logs updated
- [ ] PII scan passed

**Release Steps:**

1. Update `package.json` version to `0.8.0`
2. Final `/verify-docs` check
3. Final `/pii-scan` check
4. Create commit with all changes
5. Create annotated tag: `git tag -a v0.8.0 -m "v0.8.0: Visual Overhaul, Configuration & Caching"`
6. Push to remote: `git push && git push --tags`

---

## File Summary

### New Files (18)

| File | Purpose |
|------|---------|
| `src/utils/colourContrast.ts` | Luminance and contrast utilities |
| `src/context/CollectionUIContext.tsx` | UI labels context |
| `src/schemas/theme.schema.ts` | Theme validation |
| `src/loaders/themeLoader.ts` | Theme loading |
| `src/hooks/useThemeLoader.ts` | Theme hook |
| `src/config/themeRegistry.ts` | Curated theme sources |
| `src/hooks/useCollectionConfig.ts` | Merged config |
| `src/context/CollectionConfigContext.tsx` | Config context |
| `src/stores/cacheStore.ts` | Cache state |
| `src/lib/imageCache.ts` | Image blob caching |
| `src/hooks/useCacheStatus.ts` | Cache statistics |
| `src/components/LoadingScreen/LoadingScreen.tsx` | Progress UI |
| `src/components/LoadingScreen/LoadingScreen.module.css` | Styles |
| `src/components/LoadingScreen/index.ts` | Barrel |
| `src/lib/collectionExport.ts` | Export/import |
| `src/components/SettingsPanel/StorageSettings.tsx` | Storage UI |
| `public/themes/README.md` | Theme guide |
| `public/themes/retro-warm.json` | Example theme |

### Modified Files (15)

| File | Changes |
|------|---------|
| `src/components/Card/Card.tsx` | Flip animation state |
| `src/components/Card/CardInner.tsx` | Animation callbacks |
| `src/components/Card/CardBack.tsx` | isFlipping prop, light-bg |
| `src/components/Card/CardFront.tsx` | isFlipping prop |
| `src/components/Card/Card.module.css` | Light background styles |
| `src/hooks/useVisualTheme.ts` | isLightBackground |
| `src/schemas/v2/collection.schema.ts` | UI, Config schemas |
| `src/loaders/collectionLoader.ts` | Extract UI, config |
| `src/components/CardExpanded/CardExpanded.tsx` | useUILabels |
| `src/components/RankBadge/RankBadge.tsx` | useUILabels |
| `src/stores/settingsStore.ts` | customThemeUrl, hasAppliedDefaults |
| `src/components/SettingsPanel/ThemeSettingsTabs.tsx` | Theme selector |
| `src/lib/cardCache.ts` | Image caching |
| `src/hooks/useCollection.ts` | Cache integration |
| `src/App.tsx` | Providers, loading screen |

---

## Success Criteria Summary

### Visual Polish (Phase 0)
- [ ] Drag handle hidden during flip animation
- [ ] Light backgrounds trigger dark text/icons

### Configuration (Phases 1, 3)
- [ ] UI labels configurable in collection.json
- [ ] Collection defaults apply for new users only
- [ ] Field mapping configurable per collection

### Themes (Phase 2)
- [ ] Custom themes load from public/themes/
- [ ] Theme selector shows all options
- [ ] Invalid themes handled gracefully

### Caching (Phases 4-6)
- [ ] Collection data cached in IndexedDB
- [ ] Images cached as blobs
- [ ] Eager caching with skip option
- [ ] Loading screen with progress
- [ ] Storage management UI works

### Quality (Phases 7-10)
- [ ] All tests pass
- [ ] Documentation complete
- [ ] PII scan passed
- [ ] Release tagged and pushed

---

## Related Documentation

- [v0.7.2 Implementation Prompt](../v0.7.2/README.md)
- [Comprehensive Plan](~/.claude/plans/v0.8.0-implementation-plan.md)
- [Schema v2 Reference](../../reference/schemas/v2/README.md)

---

**Status**: Ready for Implementation
