# v0.11.1 Development Log

## Overview

**Version**: v0.11.1 - UX Polish, Video Support & Documentation
**Date**: 28 December 2025
**Theme**: Settings redesign, YouTube integration, navigation improvements, and user documentation

This milestone focused on polishing the user experience following the mechanics foundation work in v0.11.0. Major areas included redesigning the settings panel, adding YouTube video support, creating navigation components, and establishing user documentation.

---

## Implementation Narrative

### Phase 1: Core UX Fixes

#### Memory Game Status Bar (F-068)

The memory game overlay from v0.11.0 obscured the playing area. Solution:
- Hide overlay entirely during active gameplay (pure focus mode)
- Show completion stats in a footer element positioned bottom-left
- Styling consistent with SearchBar for visual harmony

#### Image Retrieval Validation (F-070)

Some collections had broken image URLs causing failed loads. Implementation:
- `useImageValidation` hook validates images before display
- Cache validation results to avoid repeated network requests
- Filter invalid images from gallery display
- Show loading state during validation

#### Destructive Action Styling (F-074)

Delete and reset buttons needed clearer visual distinction:
- Added `--colour-destructive-*` CSS variables to theme
- Red colour palette for dangerous actions
- Hover states intensify the warning
- Consistent across all delete/reset buttons in settings

### Phase 2: YouTube Video Support (F-069)

Collection data can now include YouTube videos alongside images.

**YouTubeEmbed Component:**
```typescript
// Privacy-first design
const YouTubeEmbed: React.FC<Props> = ({ videoId, title }) => {
  const [loaded, setLoaded] = useState(false);

  // Show thumbnail until user clicks
  if (!loaded) {
    return (
      <button onClick={() => setLoaded(true)}>
        <img src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} />
        <PlayIcon />
      </button>
    );
  }

  // Only then load iframe from youtube-nocookie.com
  return <iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} />;
};
```

**Integration:**
- ImageGallery detects YouTube URLs in `videos` array
- Displays video indicators on thumbnails
- Seamless switching between images and videos

### Phase 3: Research (R-010)

Before redesigning settings, conducted UX research on patterns:
- Analysed VS Code, Figma, and Chrome settings
- Identified best practices: search, categories, quick access
- Documented findings in `R-010-settings-ux-patterns.md`

### Phase 4: MyPlausibleMe Integration (F-071)

Simplified data hosting with strict URL format:

**Pattern:**
```
github.com/{username}/MyPlausibleMe/data/{collection-folder}
```

**Implementation:**
- `useMyPlausibleMeDiscovery` hook discovers collections
- AddMyPlausibleMeForm provides simplified input (username + folder)
- Automatic URL construction and validation

**Companion Work:**
Created new collection in MyPlausibleMe: "Retro Adverts" with 5 iconic commercials:
1. Apple Think Different (1997)
2. Apple iMac Colors (1999)
3. Nike Air Revolution (1987)
4. Levi's Creek (1994)
5. Windows 95 Start Me Up (1995)

### Phase 5: Settings Panel Redesign (F-072)

Complete overhaul of the settings panel:

**Before:**
- 5 tabs: Appearance, Cards, Storage, Sources, System
- No search functionality
- Overwhelming number of options visible

**After:**
- 4 tabs: Quick, System, Appearance, Data
- Settings search with fuzzy matching
- Quick Settings for one-click common actions
- Cleaner visual hierarchy

**New Components:**
- `SettingsSearch` - Fuzzy search across all settings
- `QuickSettings` - Common actions (refresh, clear cache, etc.)
- `SystemSettings` - App-level configuration
- `AppearanceSettingsTabs` - Theme and visual options

### Phase 6: Navigation Components

Needed better collection switching mechanism:

**NavigationHub:**
- Positioned bottom-centre of screen
- Shows current collection with switch button
- Opens CollectionPicker modal

**CollectionPicker:**
- Full modal with collection cards
- Visual previews of each collection
- One-click switching

**Additional Components:**
- `CacheConsentDialog` - Storage permission request
- `SourcesOverlay` - Data source management
- `ViewPopover` - View mode options (grid/list/compact)

### Phase 7: User Documentation (F-073)

Established documentation structure using Diataxis framework:

**Created:**
- `docs/tutorials/getting-started.md` - First-time user guide
- `docs/guides/keyboard-shortcuts.md` - Reference for power users
- `docs/guides/search-and-filters.md` - Discovery features
- `docs/explanation/README.md` - Conceptual docs hub
- `docs/reference/` - API and configuration docs (placeholder)

---

## Key Files Created

### Components

| File | Purpose |
|------|---------|
| `src/components/ImageGallery/YouTubeEmbed.tsx` | Privacy-conscious video player |
| `src/components/CacheConsentDialog/` | Storage permission UI |
| `src/components/CollectionPicker/` | Collection switching modal |
| `src/components/NavigationHub/` | Bottom navigation bar |
| `src/components/SourcesOverlay/` | Data source manager |
| `src/components/ViewPopover/` | View mode selector |
| `src/components/SettingsPanel/SettingsSearch.tsx` | Fuzzy settings search |
| `src/components/SettingsPanel/QuickSettings.tsx` | One-click actions |

### Hooks

| File | Purpose |
|------|---------|
| `src/hooks/useImageValidation.ts` | Validate image URLs |
| `src/hooks/useMyPlausibleMeDiscovery.ts` | Discover collections |
| `src/hooks/useSettingsSearch.ts` | Settings search logic |
| `src/hooks/useViewportSize.ts` | Responsive breakpoints |

### Documentation

| File | Purpose |
|------|---------|
| `docs/tutorials/getting-started.md` | User onboarding |
| `docs/guides/keyboard-shortcuts.md` | Keyboard reference |
| `docs/guides/search-and-filters.md` | Discovery guide |
| `docs/development/research/R-010-settings-ux-patterns.md` | UX research |

### Feature Specs

| File | Status |
|------|--------|
| `F-068-memory-status-bar-relocation.md` | Complete |
| `F-069-youtube-video-support.md` | Complete |
| `F-070-image-retrieval-validation.md` | Complete |
| `F-071-myplausibleme-url-format.md` | Complete |
| `F-072-settings-panel-redesign.md` | Complete |
| `F-073-user-documentation.md` | In Progress |
| `F-074-destructive-action-styling.md` | Complete |

---

## Challenges Encountered

### 1. PII in Git Commits

**Problem:** During MyPlausibleMe work, commits were made with local git config exposing username, email, and machine name.

**Solution:**
1. Force pushed to remove PII commits
2. Reset to safe state
3. Set repo-specific git config
4. Recovered lost files from reflog
5. Recommitted with clean identity

**Prevention:** Always verify git identity before first commit in any repository.

### 2. Image Recovery After Reset

**Problem:** Hard reset removed uncommitted logo files.

**Solution:** Used git reflog to find commit with files, then:
```bash
git checkout 7ce7bb1 -- docs/assets/img/logo.png
```

### 3. Documentation Status Drift

**Problem:** Roadmap README showed features as "Planned" when they were actually complete.

**Solution:** Updated roadmap README to reflect actual status. Need automated verification.

---

## Code Highlights

### Privacy-First YouTube Embed

```typescript
// YouTubeEmbed.tsx
const YouTubeEmbed: React.FC<Props> = ({ videoId, title }) => {
  const [consented, setConsented] = useState(false);

  // Show thumbnail with play button until explicit consent
  if (!consented) {
    return (
      <div className={styles.thumbnail}>
        <img
          src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
        />
        <button
          onClick={() => setConsented(true)}
          aria-label="Play video"
        >
          <PlayIcon />
        </button>
      </div>
    );
  }

  // Use youtube-nocookie.com for enhanced privacy
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
      title={title}
      allow="accelerometer; autoplay; encrypted-media"
      allowFullScreen
    />
  );
};
```

### Settings Search with Fuzzy Matching

```typescript
// useSettingsSearch.ts
export const useSettingsSearch = (settings: Setting[]) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return settings;

    const fuse = new Fuse(settings, {
      keys: ['label', 'description', 'category'],
      threshold: 0.4,
      ignoreLocation: true,
    });

    return fuse.search(query).map(r => r.item);
  }, [settings, query]);

  return { query, setQuery, results };
};
```

### Destructive Button Theming

```css
/* theme.css */
:root {
  --colour-destructive: #dc2626;
  --colour-destructive-hover: #b91c1c;
  --colour-destructive-active: #991b1b;
  --colour-destructive-text: #ffffff;
}

.destructive {
  background-color: var(--colour-destructive);
  color: var(--colour-destructive-text);
}

.destructive:hover {
  background-color: var(--colour-destructive-hover);
}
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Files changed | 80 |
| Lines added | 9,222 |
| Lines removed | 767 |
| New components | 9 |
| New hooks | 4 |
| Features completed | 6 |
| Features in progress | 1 |

---

## Related Documentation

- [v0.11.1 Milestone](../../roadmap/milestones/v0.11.1.md)
- [v0.11.1 Retrospective](../../retrospectives/v0.11.1/README.md)
- [R-010: Settings UX Patterns](../../research/R-010-settings-ux-patterns.md)
- [v0.11.0 Devlog](../v0.11.0/README.md)
