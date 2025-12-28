# v0.11.1 Implementation Prompt

## Overview

**Milestone**: v0.11.1 - UX Polish, Video Support & Documentation
**Theme**: Improve gameplay UX, add video support, simplify data hosting, redesign settings, and create user documentation

## Features Summary

| ID | Feature | Complexity | Priority |
|----|---------|------------|----------|
| F-068 | Memory Game Status Bar Relocation | Small | High |
| F-069 | YouTube Video Gallery Support | Medium | High |
| F-070 | Image Retrieval Validation | Small | High |
| F-071 | MyPlausibleMe Strict URL Format | Medium | Medium |
| F-072 | Settings Panel Redesign | Large | Medium |
| F-073 | User Documentation Suite | Large | Medium |
| F-074 | Destructive Action Button Styling | Small | High |

---

## F-068: Memory Game Status Bar Relocation

### Problem

The status bar during Memory Game gameplay appears at the top of the screen, making it difficult to read game cards. The bar obscures content and creates visual clutter during play.

### Solution

1. **Hide status bar during active gameplay** (pure focus mode)
2. **Show stats in bottom-left footer** (same position as SearchBar) only when game is complete
3. **Include all final stats** in the completion modal

### Files to Modify

| File | Changes |
|------|---------|
| `src/mechanics/memory/components.tsx` | Remove top overlay during play, add bottom stats on completion |
| `src/mechanics/memory/memory.module.css` | Add `.bottomStatsBar` matching SearchBar position |

### Implementation

```typescript
// components.tsx - MemoryGridOverlay
if (position === "top") {
  return null; // No overlay during play - pure focus mode
}

// position === "bottom"
return (
  <>
    {/* Stats bar appears after completion */}
    {isComplete && (
      <motion.div className={styles.bottomStatsBar}>
        <span>Pairs: {foundPairs}/{totalPairs}</span>
        <span>Attempts: {attempts}</span>
        <span>Score: {score}</span>
        <span>Time: {timeString}</span>
        <button onClick={handleExit}>Exit</button>
      </motion.div>
    )}

    {/* Completion modal */}
    <AnimatePresence>
      {isComplete && <CompletionModal ... />}
    </AnimatePresence>
  </>
);
```

### CSS

```css
.bottomStatsBar {
  position: fixed;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
  left: calc(1rem + env(safe-area-inset-left, 0px));
  right: calc(1rem + env(safe-area-inset-right, 0px));
  z-index: 110; /* Same as SearchBar */
  /* Match SearchBar styling */
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.75rem;
}
```

---

## F-069: YouTube Video Gallery Support

### Problem

Users want to embed YouTube videos alongside images in the card gallery.

### Solution

1. **Auto-detect YouTube URLs** in the images array
2. **Inline iframe embed** with thumbnail preview (click to play)
3. **No autoplay** - respects user interaction

### Files to Create

| File | Purpose |
|------|---------|
| `src/types/media.ts` | Media type definitions, YouTube helpers |
| `src/components/ImageGallery/YouTubeEmbed.tsx` | YouTube player component |
| `src/components/ImageGallery/YouTubeEmbed.module.css` | Video styles |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ImageGallery/ImageGallery.tsx` | Detect YouTube URLs, render YouTubeEmbed |
| `src/components/ImageGallery/ImageGallery.module.css` | Add `.videoContainer` styles |

### YouTube Detection

```typescript
// src/types/media.ts
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(url);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
```

### YouTubeEmbed Component

- Shows thumbnail by default (lazy load)
- Loads iframe on click (user-initiated)
- Play button overlay with YouTube branding
- 16:9 aspect ratio container
- Keyboard accessible (Enter/Space to play)

### Data Format

No schema changes required. YouTube URLs are auto-detected:

```json
{
  "images": [
    "https://example.com/cover.jpg",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://example.com/screenshot.jpg"
  ]
}
```

---

## F-070: Image Retrieval Validation

### Problem

Images that cannot be retrieved or cached should not be displayed. Currently, broken images may show placeholder errors.

### Solution

1. **Validate image URLs** before displaying
2. **Filter out unretrievable images** from gallery
3. **Cache validation results** to avoid repeated failed requests

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ImageGallery/ImageGallery.tsx` | Filter images based on validation |
| `src/hooks/useImageValidation.ts` | NEW: Hook to validate image URLs |
| `src/services/imageCache.ts` | Add validation tracking |

### Implementation

```typescript
// src/hooks/useImageValidation.ts
export function useValidatedImages(urls: string[]): {
  validImages: string[];
  isLoading: boolean;
} {
  const [validImages, setValidImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function validateImages() {
      const results = await Promise.all(
        urls.map(async (url) => {
          // Skip YouTube URLs - they're validated differently
          if (isYouTubeUrl(url)) return { url, valid: true };

          try {
            // Check cache first
            const cached = await imageCache.get(url);
            if (cached) return { url, valid: true };

            // HEAD request to check availability
            const response = await fetch(url, { method: 'HEAD' });
            const valid = response.ok &&
              response.headers.get('content-type')?.startsWith('image/');

            if (valid) {
              // Pre-cache the image
              await imageCache.prefetch(url);
            }

            return { url, valid };
          } catch {
            return { url, valid: false };
          }
        })
      );

      setValidImages(results.filter(r => r.valid).map(r => r.url));
      setIsLoading(false);
    }

    validateImages();
  }, [urls]);

  return { validImages, isLoading };
}
```

### Integration

```typescript
// ImageGallery.tsx
export function ImageGallery({ images, ...props }) {
  const { validImages, isLoading } = useValidatedImages(images);

  if (isLoading) {
    return <div className={styles.loading}>Loading images...</div>;
  }

  if (validImages.length === 0) {
    return <div className={styles.noImages}>No images available</div>;
  }

  // Render gallery with validImages instead of images
  return <Gallery images={validImages} {...props} />;
}
```

---

## F-071: MyPlausibleMe Strict URL Format

### Problem

Current source management allows arbitrary GitHub URLs, which is complex and error-prone.

### Solution

1. **Strict URL format**: `github.com/{username}/MyPlausibleMe/data/{folder}`
2. **Simplified input**: User provides only username + folder name
3. **Auto-discovery**: Fetch manifest to populate folder dropdown
4. **Legacy support**: Existing non-conforming sources marked as legacy with warning

### URL Format

```
Input: username = "REPPL", folder = "retro-games"
Output: https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/retro-games
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/config/allowedSources.ts` | Restrict to MyPlausibleMe pattern only |
| `src/config/dataSource.ts` | Add `buildMyPlausibleMeUrl()` |
| `src/stores/sourceStore.ts` | Add migration, legacy flag, version bump |
| `src/components/SettingsPanel/StorageSettingsTabs.tsx` | Replace AddSourceForm |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/SettingsPanel/AddMyPlausibleMeForm.tsx` | Simplified form |
| `src/hooks/useMyPlausibleMeDiscovery.ts` | Discover collections from username |

### New UI

```
┌─────────────────────────────────────────────────────────────┐
│  Add MyPlausibleMe Collection                               │
├─────────────────────────────────────────────────────────────┤
│  GitHub Username:  [________________]                       │
│                                                             │
│  Collection:       [Select collection ▼]                    │
│                    (populated after username entered)       │
│                                                             │
│  Preview: github.com/{user}/MyPlausibleMe/data/{folder}     │
│                                                             │
│  [Add Collection]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Migration

```typescript
// sourceStore.ts migration
migrate: (persisted, version) => {
  if (version < 2) {
    const sources = persisted.sources.map(source => {
      if (isMyPlausibleMeUrl(source.url)) {
        const { username, folder } = parseMyPlausibleMeUrl(source.url);
        return { ...source, username, folder };
      }
      return { ...source, isLegacy: true };
    });
    return { ...persisted, sources };
  }
}
```

---

## F-072: Settings Panel Redesign

### Problem

Settings panel has 5 tabs with 15+ sub-tabs and 50+ settings. It's overwhelming and difficult to navigate.

### Solution

1. **Research first**: Create R-010 UX research document
2. **Reduce to 3 tabs**: Quick, Appearance, Data
3. **Add settings search**: Filter settings by keyword
4. **Progressive disclosure**: Quick settings for common options

### Research Document

**File**: `docs/development/research/R-010-settings-ux-patterns.md`

Covers:
- VS Code, Figma, Notion, Discord patterns
- Progressive disclosure principles
- Command palette patterns
- Recommendations for Itemdeck

### New Tab Structure

| Tab | Contents | Settings Count |
|-----|----------|----------------|
| Quick | Most-used settings (dark mode, theme, card size, shuffle) | 6-8 |
| Appearance | Theme + Cards + Animations (merged) | ~25 |
| Data | Sources + Cache + Import/Export | ~10 |

### Files to Create

| File | Purpose |
|------|---------|
| `docs/development/research/R-010-settings-ux-patterns.md` | UX research |
| `src/components/SettingsPanel/QuickSettings.tsx` | Quick settings tab |
| `src/components/SettingsPanel/AppearanceSettings.tsx` | Merged appearance |
| `src/components/SettingsPanel/DataSettings.tsx` | Renamed storage |
| `src/components/SettingsPanel/SettingsSearch.tsx` | Search filter |
| `src/hooks/useSettingsSearch.ts` | Fuzzy search logic |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/SettingsPanel/SettingsPanel.tsx` | 3-tab structure, add search |
| `src/components/SearchBar/SearchBar.tsx` | Simplify, move ViewModeToggle |
| `src/App.tsx` | Add ViewModeToggle to toolbar |

### SearchBar Simplification

Current:
```
[ViewMode] [GroupBy] [Minimise]
[Search input] [Scope toggle]
[FilterChips] [Count]
```

Proposed:
```
[Search input] [GroupBy ▼]
[FilterChips] [Count]
```

ViewModeToggle moves to toolbar near Settings button.

---

## F-073: User Documentation Suite

### Problem

No user-facing documentation exists. Users have no tutorials, guides, or reference docs.

### Solution

Create comprehensive documentation following Diataxis framework.

### Directory Structure

```
docs/
├── tutorials/              # Learning-oriented (NEW)
│   ├── README.md
│   ├── getting-started.md
│   ├── first-collection.md
│   ├── playing-memory-game.md
│   └── customising-themes.md
├── guides/                 # Task-oriented (NEW)
│   ├── README.md
│   ├── adding-remote-source.md
│   ├── creating-collection.md
│   ├── search-and-filters.md
│   ├── exporting-data.md
│   ├── edit-mode.md
│   ├── keyboard-shortcuts.md
│   ├── accessibility-options.md
│   └── view-modes.md
├── explanation/            # Conceptual (NEW)
│   ├── README.md
│   ├── mechanics-system.md
│   ├── theme-architecture.md
│   └── data-sources.md
└── reference/              # Existing + updates
    ├── settings.md         # NEW: All settings reference
    └── keyboard-shortcuts-reference.md  # NEW
```

### Priority Order

1. `docs/tutorials/getting-started.md` - Critical for new users
2. `docs/guides/keyboard-shortcuts.md` - Quick reference
3. `docs/guides/search-and-filters.md` - v0.11.0 feature
4. `docs/tutorials/playing-memory-game.md` - v0.11.0 feature
5. `docs/guides/view-modes.md` - v0.11.0 feature
6. Remaining tutorials and guides
7. Reference documentation
8. Explanation documentation

### Screenshots Needed (21)

1. Main interface with card grid
2. Card front and back
3. Card expanded detail view
4. Settings panel tabs
5. Search bar with filters
6. View modes (Grid, List, Compact)
7. Memory game in progress
8. Memory game completion
9. Edit form modal
10. Theme browser
11. Source health indicators
12-21. Additional UI elements as needed

---

## F-074: Destructive Action Button Styling

### Problem

Buttons that perform destructive actions (data loss, irreversible operations) are not visually distinct, which could lead to accidental clicks.

### Solution

Create a consistent "danger" button style for all destructive actions:
- **Default state**: Red thin border, transparent background, red text
- **Hover state**: Red background, white text
- **Focus state**: Red outline for accessibility

### Destructive Actions to Style

| Location | Button | Action |
|----------|--------|--------|
| Settings > System | Reset to Defaults | Resets all settings |
| Settings > Storage > Cache | Clear Cache | Deletes cached images |
| Settings > Storage > Import/Export | Revert All Edits | Removes all local edits |
| Memory Game | Exit | Abandons current game |
| Source list | Remove | Removes data source |

### Files to Modify

| File | Changes |
|------|---------|
| `src/styles/theme.css` | Add `.btn-danger` CSS class |
| `src/components/SettingsPanel/*.tsx` | Apply `.btn-danger` to destructive buttons |
| `src/mechanics/memory/components.tsx` | Style Exit button |
| `src/components/SettingsPanel/StorageSettingsTabs.tsx` | Style Remove/Clear/Revert buttons |

### CSS Implementation

```css
/* src/styles/theme.css */
.btn-danger {
  --danger-colour: #dc2626;

  background: transparent;
  border: 1px solid var(--danger-colour);
  color: var(--danger-colour);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.btn-danger:hover {
  background: var(--danger-colour);
  color: white;
}

.btn-danger:focus-visible {
  outline: 2px solid var(--danger-colour);
  outline-offset: 2px;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Success Criteria

- [ ] All destructive buttons have red border by default
- [ ] Hover shows red background with white text
- [ ] Focus state is accessible (visible outline)
- [ ] Consistent across all panels and modals
- [ ] Works in both light and dark modes

---

## Implementation Sequence

### Phase 0: Setup & Roadmap Audit
1. **Roadmap Audit** - Comprehensive review:
   - Verify all features in `features/completed/` have status "✅ Complete" in README tables
   - Verify all features in `features/planned/` have status "📋 Planned" in README tables
   - Check milestone assignments match actual implementation status
   - Move unimplemented features from earlier milestones to appropriate future versions
   - Ensure feature index (`features/README.md`) matches file locations
   - Ensure roadmap README matches milestone documents
   - Fix any cross-reference inconsistencies

2. Create implementation prompt: `docs/prompts/implementation/v0.11.1/README.md`
3. Create milestone document: `docs/development/roadmap/milestones/v0.11.1.md`
4. Create feature specs for F-068 through F-074

### Roadmap Audit Checklist

**Files to verify:**
- `docs/development/roadmap/README.md` - Main feature table
- `docs/development/roadmap/features/README.md` - Feature index by milestone
- `docs/development/roadmap/milestones/*.md` - Each milestone document
- All files in `features/completed/` and `features/planned/`

**Known issues to check:**
- Features marked as planned in older milestones (v0.4.0, v0.6.0) that were never implemented
- Features listed in wrong milestone
- Missing features not in any milestone
- Duplicate feature entries

**Features likely needing reassignment:**
| Feature | Current Milestone | Actual Status | Action |
|---------|-------------------|---------------|--------|
| F-016 Bundle Optimisation | v0.4.0 | Not implemented | Move to v0.14+ or backlog |
| F-017 Testing Infrastructure | v0.6.0 | Not implemented | Move to v0.14+ or backlog |
| F-018 Security Hardening | v0.6.0 | Not implemented | Move to v0.14+ or backlog |
| F-019 Accessibility Audit | v0.6.0 | Not implemented | Move to v0.14+ or backlog |
| F-025 Bundle Size Monitoring | v0.4.0 | Not implemented | Move to v0.14+ or backlog |
| F-026 Component Storybook | v0.6.0 | Not implemented | Move to v0.14+ or backlog |
| F-031 Fit to Viewport | v0.4.0 | Not implemented | Move to v0.14+ or backlog |
| F-040 Touch Gestures | v0.4.0 | Not implemented | Move to v0.14+ or backlog |
| F-041 Card Animation Polish | v0.6.0 | Not implemented | Move to v0.14+ or backlog |

**Recommended structure:**
- v0.12.0: Core Mechanics (F-037, F-057, F-058, F-061, F-067) - already planned
- v0.13.0: Advanced Mechanics (F-059, F-060) - already planned
- v0.14.0: Quality & Polish (bundle optimisation, testing, accessibility)
- v1.0.0: Multi-Collection + remaining features

### Phase 1: Core UX Fixes (F-068, F-070, F-074)
1. Memory game status bar relocation
2. Image validation and filtering
3. Destructive action button styling

### Phase 2: Video Support (F-069)
1. Create media types and YouTube helpers
2. Create YouTubeEmbed component
3. Update ImageGallery

### Phase 3: Research (F-072 preparation)
1. Create R-010 settings UX research

### Phase 4: Data Hosting (F-071)
1. Update dataSource.ts with MyPlausibleMe builders
2. Create AddMyPlausibleMeForm
3. Update sourceStore with migration
4. Update allowedSources.ts

### Phase 5: Settings Redesign (F-072)
1. Create new settings components
2. Restructure SettingsPanel to 3 tabs
3. Add settings search
4. Simplify SearchBar

### Phase 6: Documentation (F-073)
1. Create directory structure
2. Write priority tutorials and guides
3. Create reference documentation
4. Update docs/README.md hub

---

## Critical Files Reference

### Memory Game
- `src/mechanics/memory/components.tsx:55-144` - Grid overlay rendering
- `src/mechanics/memory/memory.module.css:38-94` - Stats bar styles
- `src/mechanics/memory/store.ts:162-207` - Game completion logic

### Image Gallery
- `src/components/ImageGallery/ImageGallery.tsx` - Gallery component
- `src/types/image.ts` - Image type definitions

### Data Sources
- `src/config/dataSource.ts` - URL building functions
- `src/config/allowedSources.ts` - Domain allowlist
- `src/stores/sourceStore.ts` - Source management

### Settings
- `src/components/SettingsPanel/SettingsPanel.tsx` - Main panel
- `src/stores/settingsStore.ts` - All settings state
- `src/components/SearchBar/SearchBar.tsx` - Search controls

---

## Success Criteria

### F-068: Memory Game Status Bar
- [ ] No overlay during active gameplay
- [ ] Stats appear in bottom-left after game completion
- [ ] Position matches SearchBar styling
- [ ] Smooth animation on appear

### F-069: YouTube Video Support
- [ ] YouTube URLs auto-detected in images array
- [ ] Thumbnail preview shown by default
- [ ] Click to play loads iframe
- [ ] Gallery navigation works with mixed content
- [ ] Keyboard accessible

### F-070: Image Validation
- [ ] Unretrievable images filtered from gallery
- [ ] Validation results cached
- [ ] Loading state shown during validation
- [ ] Empty state when no valid images

### F-071: MyPlausibleMe Format
- [ ] Only MyPlausibleMe URLs accepted
- [ ] Username + folder input UI
- [ ] Auto-discovery from manifest
- [ ] Legacy sources marked with warning
- [ ] Migration preserves existing sources

### F-072: Settings Redesign
- [ ] R-010 research document created
- [ ] 3-tab structure implemented
- [ ] Settings search functional
- [ ] ViewModeToggle moved to toolbar
- [ ] SearchBar simplified

### F-073: Documentation
- [ ] tutorials/ directory created with 4 tutorials
- [ ] guides/ directory created with 8 guides
- [ ] explanation/ directory created
- [ ] Reference docs updated
- [ ] docs/README.md hub updated

### F-074: Destructive Button Styling
- [ ] `.btn-danger` class added to theme.css
- [ ] All Reset/Clear/Revert/Remove buttons styled
- [ ] Red border default, red background on hover
- [ ] Consistent across settings, memory game, modals

---

## Dependencies

- **v0.11.0** complete (mechanics foundation)
- No external library additions required
- YouTube embed uses native iframe (no API key needed)

---

---

## Implementation Prompt Location

This plan should be saved as the official implementation prompt at:

**File**: `docs/prompts/implementation/v0.11.1/README.md`

The prompt file should be created before implementation begins, following the pattern established by v0.10.0, v0.10.1, and v0.11.0.

---

**Status**: Ready for implementation
