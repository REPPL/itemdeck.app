# R-010: Settings UX Patterns Research

## Executive Summary

Research into settings panel UX patterns from leading applications reveals a clear trend towards progressive disclosure, search-first navigation, and minimal tab structures. For Itemdeck, consolidating from 5 tabs to 3 (Quick, Appearance, Data) with fuzzy search will significantly improve the user experience.

## Current State Analysis

### Itemdeck's Current Settings

| Tab | Sub-tabs | Settings Count | Issues |
|-----|----------|----------------|--------|
| System | None | 7 | Core settings mixed with dev tools |
| Theme | Colours, Typography, Spacing | ~15 | Granular but overwhelming |
| Cards | Layout, Animation, Display | ~12 | Related to Theme |
| Config | Fields, Sorting | ~8 | Technical, rarely changed |
| Storage | Sources, Cache, Import/Export, About | ~8 | Well-organised |

**Total: 5 tabs, 15 sub-tabs, 50+ settings**

### User Pain Points

1. **Discoverability**: Settings hidden 2 levels deep
2. **Cognitive load**: Too many options presented simultaneously
3. **Common actions**: Dark mode toggle requires opening panel, navigating to System
4. **Mental model**: Theme vs Cards distinction unclear

## Industry Analysis

### VS Code Settings

**Approach**: Flat list with powerful search

- Single searchable settings view
- Settings grouped by category (collapsed by default)
- Search highlights matching settings
- Commonly changed settings surfaced in "Commonly Used" group

**Key insight**: Search is primary navigation, not tabs.

### Figma Preferences

**Approach**: Minimal tabs, quick access

- 4 tabs: Account, General, Interface, Plugins
- Most settings in "General" (single screen)
- No nested levels
- Tooltip descriptions for each setting

**Key insight**: Fewer tabs, more scrolling is acceptable.

### Notion Settings

**Approach**: Sidebar navigation, flat structure

- Left sidebar with icons
- Single column of settings per section
- No sub-tabs
- Clean visual hierarchy

**Key insight**: Visual organisation reduces cognitive load.

### Discord Settings

**Approach**: Progressive disclosure

- Most-used settings at top
- Advanced options collapsed
- In-line toggles for quick changes
- Escape key closes immediately

**Key insight**: Prioritise frequent actions.

## Design Principles Identified

### 1. Progressive Disclosure

Show less, reveal more on demand.

- **Quick settings**: 80% of users only change 20% of settings
- **Advanced section**: Collapsed by default, expandable
- **Power user access**: Search for anything

### 2. Search-First Navigation

For applications with many settings, search beats browsing.

- **Fuzzy matching**: "drk" matches "Dark Mode"
- **Instant filter**: Settings filter as you type
- **Context preservation**: Back button returns to filtered view

### 3. Spatial Consistency

Group related settings visually.

- **Visual themes**: Appearance-related settings together
- **Data operations**: Import/export/cache together
- **Quick access**: Most-changed settings surfaced

### 4. Keyboard Accessibility

Power users expect keyboard navigation.

- **Tab focus**: Move between settings
- **Arrow keys**: Navigate within groups
- **Escape**: Close panel
- **Enter**: Activate toggles

## Recommendations for Itemdeck

### New 4-Tab Structure (Implemented in v0.11.1)

| Tab | Contents | Rationale |
|-----|----------|-----------|
| **Quick** | Theme preset, card size, view mode, shuffle, random selection, mechanics | Most-changed settings |
| **System** | Dark mode, accessibility, UI visibility, developer tools | System-level settings |
| **Appearance** | Theme colours, typography, cards layout, animations, field mapping | All visual settings merged |
| **Data** | Sources, cache, import/export, themes | All data operations |

> **Note**: The original 3-tab recommendation was revised to 4 tabs during implementation to maintain clear separation between system-level settings (dark mode, accessibility) and appearance customisation.

### Search Implementation

```
┌─────────────────────────────────────┐
│ 🔍 Search settings...               │
├─────────────────────────────────────┤
│ [Quick] [Appearance] [Data]         │
├─────────────────────────────────────┤
│                                     │
│ Settings content here               │
│                                     │
└─────────────────────────────────────┘
```

**Fuzzy matching algorithm**: Use Levenshtein distance or simple substring matching.

**Search scope**:
- Setting labels ("Dark Mode", "Card Size")
- Setting descriptions (if present)
- Tab names (searching "appearance" shows Appearance tab)

### Quick Settings Design

```
┌─ Quick Settings ────────────────────┐
│                                     │
│ Dark Mode           [🌙 ☀️]         │
│ Theme               [▼ Modern   ]   │
│ Card Size           [▼ Medium   ]   │
│ Shuffle Mode        [  |========]   │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Mechanics           [  Active   ]   │
│ View Mode           [Grid] [List]   │
│                                     │
└─────────────────────────────────────┘
```

**Settings included in Quick tab**:
1. Dark Mode toggle
2. Theme preset dropdown
3. Card size slider
4. Shuffle toggle
5. Mechanics on/off
6. View mode (moved from toolbar)

### Appearance Tab Consolidation

Merge Theme + Cards + Animations into single scrollable view:

```
┌─ Appearance ────────────────────────┐
│                                     │
│ ▼ COLOURS                           │
│   Background, Card, Accent...       │
│                                     │
│ ▼ TYPOGRAPHY                        │
│   Font, Size, Spacing...            │
│                                     │
│ ▼ CARDS                             │
│   Border radius, Shadow, Layout...  │
│                                     │
│ ▼ ANIMATIONS                        │
│   Duration, Easing, Effects...      │
│                                     │
└─────────────────────────────────────┘
```

Sections collapsed by default, expand on click.

### Data Tab Structure

Rename "Storage" to "Data":

```
┌─ Data ──────────────────────────────┐
│                                     │
│ ▼ SOURCES                           │
│   [Source list...]                  │
│   [+ Add MyPlausibleMe Collection]  │
│                                     │
│ ▼ CACHE                             │
│   Image cache: 45MB / 100MB         │
│   [Clear Cache] [Re-cache]          │
│                                     │
│ ▼ IMPORT/EXPORT                     │
│   [Export Collection]               │
│   [Import Collection]               │
│   [Export Edits] [Import Edits]     │
│                                     │
└─────────────────────────────────────┘
```

## Implementation Priority

1. **Phase 1**: Create search component and hook
2. **Phase 2**: Create QuickSettings tab with 6-8 key settings
3. **Phase 3**: Merge Theme + Cards into AppearanceSettings
4. **Phase 4**: Rename Storage to DataSettings
5. **Phase 5**: Restructure SettingsPanel to 3 tabs
6. **Phase 6**: Move ViewModeToggle from SearchBar to toolbar

## Settings Search Algorithm

### Fuzzy Matching Approach

Use simple case-insensitive substring matching with scoring:

```typescript
function matchScore(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact match
  if (t === q) return 100;

  // Starts with
  if (t.startsWith(q)) return 80;

  // Contains
  if (t.includes(q)) return 60;

  // Character sequence match (for "drk" -> "Dark")
  let qIdx = 0;
  for (const char of t) {
    if (char === q[qIdx]) qIdx++;
    if (qIdx === q.length) return 40;
  }

  return 0;
}
```

### Search Data Structure

```typescript
interface SearchableSetting {
  id: string;
  label: string;
  description?: string;
  tab: "quick" | "appearance" | "data";
  section?: string;
  keywords: string[];
}
```

## Migration Considerations

### Settings to Remove

- "Config" tab entirely (move Field Config to Appearance, remove Schema Validation)
- TanStack DevTools (move to About section in Data tab)
- "Show Help Button", "Show Settings Button", "Show Search Bar" (too meta)

### Settings to Merge

| Old Location | New Location |
|--------------|--------------|
| System > Dark Mode | Quick > Dark Mode |
| System > Reduce Motion | Appearance > Animations |
| System > High Contrast | Appearance > Accessibility |
| Theme > * | Appearance > Colours/Typography |
| Cards > * | Appearance > Cards |
| Storage > * | Data > * |

---

## Related Documentation

- [F-072: Settings Panel Redesign](../roadmap/features/completed/F-072-settings-panel-redesign.md) - Implementation of recommendations from this research

---

**Status**: Ready for implementation
