# v0.8.1 Implementation Prompt - Random Selection & Gap Fixes

**Version:** v0.8.1
**Codename:** Random Selection & Gap Fixes
**Branch:** `feature/v0.8.1-random-selection`

---

## Overview

This release completes v0.8.0 gaps and adds a new Random Selection feature:

1. **Random Selection** - New feature to limit displayed cards to a random subset
2. **LoadingScreen Integration** - Wire existing component into App.tsx
3. **Collection Caching** - Wire existing cardCache.ts into useCollection
4. **Accessibility** - ARIA live regions, skip-to-content link
5. **Storage Enhancements** - Export/Import collection, Re-cache button

---

## Context

- v0.8.0 completed visual polish, themes, and image caching
- LoadingScreen component exists (`src/components/LoadingScreen/`) but is NOT used
- cardCache.ts exists (`src/lib/cardCache.ts`) but is NOT wired into data flow
- Users requested ability to randomly select a subset of cards
- No way to export/import collection data
- No skip-to-content accessibility link

---

## Design Decisions (Pre-Approved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Random selection | Toggle + slider | Simple UX, clear control |
| Selection timing | Before shuffle | Consistent experience |
| Collection cache | 24-hour expiry | Balance freshness with offline |
| Skip link | Visually hidden | Standard accessibility pattern |

---

## Implementation Phases

### Phase 0: Random Selection Feature

**Goal:** Add ability to randomly select X cards from the collection

#### 0.1: Settings Store Changes

**File:** `src/stores/settingsStore.ts`

**Add to SettingsState interface:**

```typescript
/** Whether random selection is enabled */
randomSelectionEnabled: boolean;

/** Number of cards to randomly select (when enabled) */
randomSelectionCount: number;
```

**Add actions:**

```typescript
setRandomSelectionEnabled: (enabled: boolean) => void;
setRandomSelectionCount: (count: number) => void;
```

**Add to DEFAULT_SETTINGS:**

```typescript
randomSelectionEnabled: false,
randomSelectionCount: 10,
```

**Add to partialize():**

```typescript
randomSelectionEnabled: state.randomSelectionEnabled,
randomSelectionCount: state.randomSelectionCount,
```

**Update version and add migration:**

```typescript
// version: 13 → 14

// In migrate function:
if (version < 14) {
  state = {
    ...state,
    randomSelectionEnabled: false,
    randomSelectionCount: 10,
  };
}
```

#### 0.2: CardGrid Selection Logic

**File:** `src/components/CardGrid/CardGrid.tsx`

**Add imports:**

```typescript
import { shuffle } from "@/utils/shuffle";
```

**Add settings subscriptions:**

```typescript
const randomSelectionEnabled = useSettingsStore((state) => state.randomSelectionEnabled);
const randomSelectionCount = useSettingsStore((state) => state.randomSelectionCount);
```

**Add selection logic (before useShuffledCards):**

```typescript
// Apply random selection before shuffle/sort
const selectedCards = useMemo(() => {
  if (!randomSelectionEnabled || randomSelectionCount <= 0 || sourceCards.length === 0) {
    return sourceCards;
  }
  // Limit to available cards
  const count = Math.min(randomSelectionCount, sourceCards.length);
  // Shuffle and take first N
  const shuffled = shuffle([...sourceCards]);
  return shuffled.slice(0, count);
}, [sourceCards, randomSelectionEnabled, randomSelectionCount]);

// Then use selectedCards instead of sourceCards
const { cards: shuffledCards } = useShuffledCards(selectedCards, {
  enabled: true,
  shuffleOnLoad,
});
```

#### 0.3: UI in CardSettingsTabs

**File:** `src/components/SettingsPanel/CardSettingsTabs.tsx`

**Add imports:**

```typescript
import { useCollectionData } from "@/context/CollectionDataContext";
```

**Add to component:**

```typescript
const { cards: allCards } = useCollectionData();
const totalCards = allCards.length;

const {
  // ... existing
  randomSelectionEnabled,
  randomSelectionCount,
  setRandomSelectionEnabled,
  setRandomSelectionCount,
} = useSettingsStore();
```

**Add to Layout tab content (after Aspect Ratio):**

```tsx
{/* Divider */}
<div className={styles.divider} />

{/* Random Selection Toggle */}
<div className={styles.row}>
  <span className={styles.label}>Random Selection</span>
  <label className={styles.toggle}>
    <input
      type="checkbox"
      checked={randomSelectionEnabled}
      onChange={(e) => { setRandomSelectionEnabled(e.target.checked); }}
    />
    <span className={styles.toggleSlider} />
  </label>
</div>

{/* Selection Count (when enabled) */}
{randomSelectionEnabled && (
  <>
    <div className={styles.row}>
      <span className={styles.label}>Show</span>
      <div className={styles.sliderGroup}>
        <input
          type="range"
          min={1}
          max={Math.max(totalCards, 1)}
          value={Math.min(randomSelectionCount, totalCards)}
          onChange={(e) => { setRandomSelectionCount(Number(e.target.value)); }}
          className={styles.slider}
        />
        <span className={styles.sliderValue}>
          {Math.min(randomSelectionCount, totalCards)} of {totalCards}
        </span>
      </div>
    </div>
    <div className={styles.helpText}>
      A random subset will be selected each time the page loads.
    </div>
  </>
)}
```

**Success Criteria (Phase 0):**

- [ ] Toggle enables/disables random selection
- [ ] Slider controls number of cards (1 to total)
- [ ] Display shows "X of Y" cards
- [ ] Random selection applies on each page load
- [ ] Settings persist across sessions
- [ ] Works with shuffle on/off

---

### Phase 1: LoadingScreen Integration

**Goal:** Wire existing LoadingScreen component into App.tsx

#### 1.1: Update App.tsx

**File:** `src/App.tsx`

**Add import:**

```typescript
import { LoadingScreen } from "@/components/LoadingScreen";
```

**Add state in AppContent:**

```typescript
const [loadingComplete, setLoadingComplete] = useState(false);

const handleLoadingComplete = useCallback(() => {
  setLoadingComplete(true);
}, []);
```

**Update render:**

```tsx
return (
  <div className={styles.app}>
    {/* Loading screen (shows during initial load) */}
    {!loadingComplete && (
      <LoadingScreen onComplete={handleLoadingComplete} />
    )}

    {/* Sidebar (Explorer) */}
    <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

    {/* Main content */}
    <main className={styles.main}>
      <QueryErrorBoundary>
        <CardGrid />
      </QueryErrorBoundary>
    </main>

    {/* ... rest unchanged */}
  </div>
);
```

#### 1.2: Add ARIA Live Region to LoadingScreen

**File:** `src/components/LoadingScreen/LoadingScreen.tsx`

**Update progress container:**

```tsx
<div className={styles.progressContainer}>
  <div className={styles.progressBar}>
    <div
      className={styles.progressFill}
      style={{ width: `${String(overallProgress)}%` }}
    />
  </div>
  {/* ARIA live region for screen readers */}
  <p
    className={styles.status}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {statusText}
  </p>
</div>
```

**Success Criteria (Phase 1):**

- [ ] LoadingScreen appears during initial load
- [ ] Progress bar shows collection → images phases
- [ ] Screen readers announce loading progress
- [ ] Smooth fade-out when complete

---

### Phase 2: Collection Caching

**Goal:** Wire existing cardCache.ts into data fetching flow

#### 2.1: Update useCollection.ts

**File:** `src/hooks/useCollection.ts`

**Add imports:**

```typescript
import {
  cacheCollection,
  getCachedCollection,
} from "@/lib/cardCache";
```

**Update fetchCollection function:**

```typescript
async function fetchCollection(basePath: string): Promise<CollectionResult> {
  // Check cache first
  const sourceId = basePath.replace(/\//g, "-");
  const cached = await getCachedCollection(sourceId);

  if (cached) {
    // Return cached data (convert to CollectionResult format)
    // Note: For full offline support, we'd need to cache CollectionResult
    // For now, just skip caching to avoid complexity
    console.debug("Collection cache hit for", sourceId);
  }

  // Fetch fresh data
  const loaded = await loadCollection(basePath);
  // ... existing processing ...

  // Cache the result
  try {
    await cacheCollection(sourceId, legacyCollection);
  } catch (error) {
    console.warn("Failed to cache collection:", error);
  }

  return {
    cards,
    collection: legacyCollection,
    displayConfig: loaded.definition.display,
    uiLabels: loaded.definition.uiLabels,
    config: loaded.definition.config,
  };
}
```

**Note:** Full offline support would require caching the complete CollectionResult including cards. The current cardCache.ts only caches the Collection type. Consider extending if full offline is needed.

**Success Criteria (Phase 2):**

- [ ] Collection data cached after first fetch
- [ ] Cache checked before network fetch
- [ ] 24-hour expiry works correctly
- [ ] No errors on cache miss/failure

---

### Phase 3: Skip-to-Content Link

**Goal:** Add accessibility skip link

#### 3.1: Update App.tsx

**File:** `src/App.tsx`

**Update main element:**

```tsx
<main id="main-content" className={styles.main}>
```

**Add skip link (first child of app div):**

```tsx
return (
  <div className={styles.app}>
    {/* Skip to main content link (accessibility) */}
    <a href="#main-content" className={styles.skipLink}>
      Skip to content
    </a>

    {/* Loading screen */}
    {!loadingComplete && (
      <LoadingScreen onComplete={handleLoadingComplete} />
    )}

    {/* ... rest */}
  </div>
);
```

#### 3.2: Add Skip Link Styles

**File:** `src/App.module.css`

**Add styles:**

```css
/* Skip to content link - visually hidden until focused */
.skipLink {
  position: absolute;
  left: -9999px;
  top: var(--spacing-md);
  z-index: 9999;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--colour-background);
  color: var(--colour-text);
  border: 2px solid var(--colour-accent);
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-weight: 500;
}

.skipLink:focus {
  left: var(--spacing-md);
  outline: 2px solid var(--colour-accent);
  outline-offset: 2px;
}
```

**Success Criteria (Phase 3):**

- [ ] Skip link hidden by default
- [ ] Skip link visible on keyboard focus
- [ ] Link jumps to main content
- [ ] Works with screen readers

---

### Phase 4: Storage Enhancements

**Goal:** Add Export/Import and Re-cache functionality

#### 4.1: Create Collection Export Module

**New File:** `src/lib/collectionExport.ts`

```typescript
/**
 * Collection export/import utilities.
 *
 * Provides functions to export and import collection data as JSON files.
 */

import type { Collection } from "@/schemas";

/**
 * Export collection data as a downloadable JSON file.
 *
 * @param collection - Collection to export
 * @param filename - Download filename (default: "itemdeck-collection.json")
 */
export function exportCollection(
  collection: Collection,
  filename = "itemdeck-collection.json"
): void {
  const json = JSON.stringify(collection, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import collection data from a JSON file.
 *
 * @param file - File to import
 * @returns Parsed collection data
 * @throws Error if file is invalid JSON or doesn't match schema
 */
export async function importCollection(file: File): Promise<Collection> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = reader.result as string;
        const data = JSON.parse(text) as Collection;

        // Basic validation
        if (!data.items || !Array.isArray(data.items)) {
          throw new Error("Invalid collection: missing items array");
        }

        resolve(data);
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error("Failed to parse collection file")
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}
```

#### 4.2: Update StorageSettingsTabs

**File:** `src/components/SettingsPanel/StorageSettingsTabs.tsx`

**Add imports:**

```typescript
import { useRef } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import { exportCollection } from "@/lib/collectionExport";
import { useImagePreloader } from "@/hooks/useImageCache";
```

**Add to component:**

```typescript
const { cards, collection } = useCollectionData();
const { preload, isPreloading, progressPercent } = useImagePreloader();
const fileInputRef = useRef<HTMLInputElement>(null);

// Get all image URLs for re-caching
const imageUrls = useMemo(() => {
  return cards.flatMap((card) => card.imageUrls).filter(Boolean);
}, [cards]);

const handleExport = () => {
  if (collection) {
    exportCollection(collection);
  }
};

const handleImportClick = () => {
  fileInputRef.current?.click();
};

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // TODO: Import and store collection
    // const imported = await importCollection(file);
    alert("Import functionality coming soon");
  } catch (error) {
    alert(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Reset input
  e.target.value = "";
};

const handleRecache = () => {
  if (imageUrls.length > 0) {
    void preload(imageUrls);
  }
};
```

**Update "images" tab content:**

```tsx
case "images":
  return (
    <>
      {/* ... existing stats ... */}

      <div className={styles.divider} />

      {/* Export */}
      <div className={styles.row}>
        <span className={styles.label}>Export Collection</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleExport}
          disabled={!collection || cards.length === 0}
        >
          Export JSON
        </button>
      </div>

      {/* Import */}
      <div className={styles.row}>
        <span className={styles.label}>Import Collection</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleImportClick}
        >
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <div className={styles.helpText}>
        Export saves the current collection. Import loads a previously exported collection.
      </div>
    </>
  );
```

**Update "cache" tab content:**

```tsx
case "cache":
  return (
    <>
      {/* ... existing clear cache ... */}

      <div className={styles.divider} />

      {/* Re-cache Images */}
      <div className={styles.row}>
        <span className={styles.label}>
          {isPreloading ? `Caching... ${Math.round(progressPercent)}%` : "Re-cache Images"}
        </span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleRecache}
          disabled={isPreloading || imageUrls.length === 0}
        >
          {isPreloading ? "Caching..." : "Re-cache"}
        </button>
      </div>

      <div className={styles.helpText}>
        Re-downloads and caches all images. Useful if images appear broken.
      </div>

      {/* ... existing cache limit info ... */}
    </>
  );
```

**Success Criteria (Phase 4):**

- [ ] Export downloads valid JSON file
- [ ] Import button opens file picker
- [ ] Re-cache button triggers image preloading
- [ ] Progress shown during re-caching
- [ ] Buttons disabled appropriately

---

### Phase 5: Testing & Quality

**Test Coverage Targets:**

| Area | Target |
|------|--------|
| Random Selection Logic | 90% |
| Collection Export | 100% |
| Collection Import | 100% |
| LoadingScreen Integration | 80% |

**Manual Testing Checklist:**

- [ ] Random selection toggle works
- [ ] Slider limits cards correctly
- [ ] LoadingScreen shows on first load
- [ ] Skip link focuses main content
- [ ] Export downloads file
- [ ] Re-cache shows progress

---

### Phase 6: Documentation & Verification

**Verification Checklist:**

- [ ] Run `/verify-docs` - fix all issues
- [ ] Run `/pii-scan` - no personal info
- [ ] Run `/check-british` - British English compliance
- [ ] All tests pass (`npm test`)
- [ ] TypeScript clean (`npm run typecheck`)
- [ ] Lint clean (`npm run lint`)
- [ ] Build succeeds (`npm run build`)

---

### Phase 7: Devlog & Retrospective

**Create:**

- `docs/development/process/devlogs/v0.8.1/README.md`
- `docs/development/process/retrospectives/v0.8.1/README.md`

---

### Phase 8: Release

**Pre-Release Checklist:**

- [ ] All phases complete
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Devlog written
- [ ] Retrospective written
- [ ] Time logs updated
- [ ] PII scan passed

**Release Steps:**

1. Update `package.json` version to `0.8.1`
2. Final `/verify-docs` check
3. Final `/pii-scan` check
4. Create commit with all changes
5. Create annotated tag: `git tag -a v0.8.1 -m "v0.8.1: Random Selection & Gap Fixes"`
6. Push to remote: `git push && git push --tags`

---

## File Summary

### New Files (2)

| File | Purpose |
|------|---------|
| `src/lib/collectionExport.ts` | Export/import collection functions |
| `docs/prompts/implementation/v0.8.1/README.md` | This implementation prompt |

### Modified Files (7)

| File | Changes |
|------|---------|
| `src/stores/settingsStore.ts` | Random selection state, actions, migration v14 |
| `src/components/CardGrid/CardGrid.tsx` | Random selection logic before shuffle |
| `src/components/SettingsPanel/CardSettingsTabs.tsx` | Random selection UI in Layout tab |
| `src/App.tsx` | LoadingScreen integration, skip-to-content link |
| `src/App.module.css` | Skip link styles |
| `src/hooks/useCollection.ts` | Collection caching integration |
| `src/components/LoadingScreen/LoadingScreen.tsx` | ARIA live region |
| `src/components/SettingsPanel/StorageSettingsTabs.tsx` | Export/Import/Re-cache buttons |

---

## Success Criteria Summary

### Random Selection (Phase 0)
- [ ] Toggle enables/disables feature
- [ ] Slider controls count (1 to total)
- [ ] Shows "X of Y" cards
- [ ] Applies on each page load

### LoadingScreen (Phase 1)
- [ ] Shows during initial load
- [ ] Progress updates correctly
- [ ] ARIA announces progress

### Collection Caching (Phase 2)
- [ ] Data cached after fetch
- [ ] Cache checked first
- [ ] 24-hour expiry works

### Accessibility (Phase 3)
- [ ] Skip link hidden until focus
- [ ] Skip link jumps to main content

### Storage (Phase 4)
- [ ] Export downloads JSON
- [ ] Import opens file picker
- [ ] Re-cache shows progress

### Quality (Phases 5-8)
- [ ] All tests pass
- [ ] Documentation complete
- [ ] Release tagged and pushed

---

## Related Documentation

- [v0.8.0 Implementation Prompt](../v0.8.0/README.md)
- [Settings Store](../../../../src/stores/settingsStore.ts)
- [CardGrid Component](../../../../src/components/CardGrid/CardGrid.tsx)

---

**Status**: Ready for Implementation
