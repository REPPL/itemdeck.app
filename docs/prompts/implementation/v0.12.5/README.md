# v0.12.5 Implementation Prompt

## Executive Summary

**Version:** 0.12.5
**Theme:** URL Simplification, Plugin-Ready Architecture & Snap Ranking

This release addresses:
1. Simplified URL formats for collection loading
2. README accuracy fixes (remove licence SSOT violation, fix false claims)
3. Fit-to-Viewport view integration
4. **Plugin-ready mechanic architecture** (manifest.json for all mechanics)
5. New gaming mechanic: Snap Ranking (F-061)
6. Documentation sync and verification

**Architecture Decision:** Option C (Hybrid) - Build Snap Ranking internally with plugin-compatible structure, preparing for full external plugin extraction in v0.13.0.

---

## Phase 1: Documentation & Configuration Fixes

### 1.1 Update package.json
- **File:** `/package.json`
- **Change:** `"version": "0.11.1"` → `"version": "0.12.5"`

### 1.2 Fix README.md
- **File:** `/README.md`
- **Changes:**
  - **REMOVE lines 85-87** (Licence section) - SSOT violation, LICENSE file is canonical
  - **Line 37:** Change "with more mechanics coming soon" → "with multiple game mechanics"
  - **Line 39:** Remove "customisable" from keyboard shortcuts
  - **Lines 60-62:** Update URL example to show simplified format

### 1.3 Fix Broken Documentation Links
- **File:** `/docs/tutorials/getting-started.md` line 71
- **File:** `/docs/guides/search-and-filters.md` line 130
- **Action:** Create missing target files OR update links to existing content

---

## Phase 2: URL Format Simplification

### 2.1 Add Simplified URL Patterns
- **File:** `/src/hooks/useUrlCollection.ts`
- **Changes:**
  - Add regex: `/^\/gh\/([^/]+)\/c\/(.+?)\/?$/` for `/gh/USER/c/PATH` (supports nested folders)
  - Add query param alias: `c` as shorthand for `collection` (supports nested paths like `retro/my_games`)
  - Keep backwards compatibility with existing formats

### Supported Formats (after implementation):
```
/gh?u=REPPL&c=my_games          # New: short query params
/gh?u=REPPL&c=retro/my_games    # New: nested folder support
/gh?u=REPPL&collection=retro    # Existing: full query params
/gh/REPPL/c/my_games            # New: clean path with type indicator
/gh/REPPL/c/retro/my_games      # New: nested path support
/gh/REPPL/collection/retro/     # Existing: legacy path
?collection=https://cdn...      # Existing: full URL
```

**Path Type Indicators:**
- `/c/` = collection (current)
- `/m/` = mechanic (future v0.13.0+)
- `/t/` = theme (future)

**Note:** The `c` parameter and `/c/` path segment support nested folders (e.g., `retro/my_games` maps to `MyPlausibleMe/data/collections/retro/my_games/`).

---

## Phase 3: Fit-to-Viewport View Integration

### 3.1 Add Layout Type
- **File:** `/src/stores/settingsStore.ts`
- **Change line 40:** `"grid" | "list" | "compact"` → `"grid" | "list" | "compact" | "fit"`

### 3.2 Add UI Option
- **File:** `/src/components/SettingsPanel/QuickSettings.tsx`
- **Change:** Add "Fit" option to `layoutOptions` array

### 3.3 Integrate in CardGrid
- **File:** `/src/components/CardGrid/CardGrid.tsx`
- **Change:** Use `useFitToViewport()` hook when layout is "fit"

---

## Phase 4: Plugin-Ready Mechanic Architecture

### 4.1 Create Mechanic Manifest Schema
- **New file:** `/src/schemas/mechanic-manifest.schema.ts`
- **Purpose:** Zod schema for validating mechanic manifests

```typescript
// Schema structure
{
  id: string,           // e.g., "snap-ranking"
  name: string,         // e.g., "Snap Ranking"
  version: string,      // semver, e.g., "1.0.0"
  description: string,
  entrypoint: string,   // relative path, e.g., "./index.tsx"
  theme?: string,       // optional scoped theme
  sampleCollection?: string,
  minCards?: number,
  maxCards?: number,
  requiredFields?: string[],
  minAppVersion?: string,
  author?: { name, url }
}
```

### 4.2 Add Manifest to Memory Mechanic
- **New file:** `/src/mechanics/memory/manifest.json`
- **Purpose:** Make Memory plugin-ready for future extraction

### 4.3 Update Registry to Use Manifests
- **File:** `/src/mechanics/registry.ts`
- **Change:** Registry reads manifests for metadata display

---

## Phase 5: Snap Ranking Mechanic (F-061)

Build with plugin-ready structure (manifest.json, scoped theme, self-contained).

### New Files to Create:

| File | Purpose |
|------|---------|
| `/src/mechanics/snap-ranking/manifest.json` | Machine-readable metadata |
| `/src/mechanics/snap-ranking/index.ts` | Mechanic definition |
| `/src/mechanics/snap-ranking/store.ts` | Zustand state management |
| `/src/mechanics/snap-ranking/types.ts` | TypeScript interfaces |
| `/src/mechanics/snap-ranking/components.tsx` | Rating UI overlay and results |
| `/src/mechanics/snap-ranking/Settings.tsx` | Configuration UI |
| `/src/mechanics/snap-ranking/SnapRanking.module.css` | Scoped styles |

### Files to Modify:

| File | Changes |
|------|---------|
| `/src/mechanics/index.ts` | Register snap-ranking mechanic |

### Manifest Structure:
```json
{
  "id": "snap-ranking",
  "name": "Snap Ranking",
  "version": "1.0.0",
  "description": "Rate cards instantly with quick tier decisions",
  "entrypoint": "./index.ts",
  "minCards": 5,
  "author": {
    "name": "itemdeck",
    "url": "https://github.com/itemdeck"
  }
}
```

### Mechanic Features:
- Present cards one at a time (shuffled)
- Rating input: S/A/B/C/D/F tier buttons
- Keyboard shortcuts (S/A/B/C/D/F keys)
- No going back - ratings are final
- Progress indicator (doesn't reveal content)
- Generate tier list from ratings
- Copy results to clipboard
- Statistics: time per card, total time

---

## Phase 6: Deferred to v0.13.0

### External Plugin Loader
- `MechanicLoader` for loading mechanics from URLs
- Trusted source registry (official + user-added)
- Security validation (manifest check before code execution)
- Extract Memory and Snap Ranking to external repos

### Customisable Keyboard Shortcuts
- New Zustand store for shortcut configuration
- Settings UI for editing shortcuts
- Conflict detection

---

## Implementation Order

```
1.  package.json version update
2.  README.md fixes (licence removal, claims correction)
3.  Documentation link fixes
4.  URL format simplification
5.  Fit-to-Viewport integration
6.  Mechanic manifest schema creation
7.  Add manifest.json to Memory mechanic
8.  Build Snap Ranking mechanic (with manifest)
9.  Update registry for manifest support
10. Run /sync-docs
11. Run /verify-docs
12. Run PII scan
13. Store implementation prompt at prompts/implementation/v0.12.5.md
```

---

## Critical Files

| File | Purpose |
|------|---------|
| `/package.json` | Version update |
| `/README.md` | Remove licence, fix claims |
| `/src/hooks/useUrlCollection.ts` | URL parsing |
| `/src/stores/settingsStore.ts` | Add fit layout type |
| `/src/components/SettingsPanel/QuickSettings.tsx` | Fit view option |
| `/src/schemas/mechanic-manifest.schema.ts` | NEW: Manifest validation |
| `/src/mechanics/memory/manifest.json` | NEW: Memory metadata |
| `/src/mechanics/snap-ranking/` | NEW: Entire directory |
| `/src/mechanics/index.ts` | Mechanic registration |
| `/src/mechanics/registry.ts` | Manifest support |

---

## Verification Criteria

### README Accuracy:
- [x] No licence section (SSOT - LICENSE file is canonical)
- [x] No "coming soon" language
- [x] No "customisable shortcuts" claim
- [x] Updated URL example shows simplified format

### URL Loading:
- [x] `/gh?u=REPPL&c=my_games` works
- [x] `/gh?u=REPPL&c=retro/my_games` works (nested folder)
- [x] `/gh/REPPL/c/my_games` works
- [x] `/gh/REPPL/c/retro/my_games` works (nested folder)
- [x] Existing formats still work (backwards compatible)

### Fit-to-Viewport:
- [x] "Fit" appears in layout options
- [x] Selecting "Fit" uses viewport calculation
- [x] Works on mobile and desktop

### Mechanic Architecture:
- [x] Memory has manifest.json
- [x] Snap Ranking has manifest.json
- [x] Registry reads manifests for display
- [x] Schema validates manifests

### Snap Ranking:
- [x] Cards presented one at a time
- [x] Cannot preview or go back
- [x] Rating input works (tier buttons + keyboard)
- [x] Results show tier list
- [x] Copy to clipboard works

---

## Architecture Notes (for v0.13.0 reference)

**Plugin Discovery Model:** Central registry (mechanics.itemdeck.app) + URL sharing for community

**Theme Scope:** Scoped only - mechanic themes affect only mechanic UI, not whole app

**Security Model:** Trusted sources + manifest validation before code execution

---

## Related Documentation

- [v0.12.5 Milestone](../../roadmap/milestones/v0.12.5.md)
- [F-061 Snap Ranking](../../roadmap/features/completed/F-061-snap-ranking-mechanic.md)
- [F-031 Fit-to-Viewport](../../roadmap/features/completed/F-031-fit-to-viewport.md)
- [Mechanic Manifest Schema](/src/schemas/mechanic-manifest.schema.ts)

---

**Status**: Completed
