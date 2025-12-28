# F-072: Settings Panel Redesign

## Problem Statement

Settings panel has 5 tabs with 15+ sub-tabs and 50+ settings. It's overwhelming and difficult to navigate.

## Design Approach

1. **Research first**: Create R-010 UX research document
2. **Reduce to 4 tabs**: Quick, System, Appearance, Data
3. **Add settings search**: Filter settings by keyword
4. **Progressive disclosure**: Quick settings for common options

## Research Document

**File**: `docs/development/research/R-010-settings-ux-patterns.md`

Covers:
- VS Code, Figma, Notion, Discord patterns
- Progressive disclosure principles
- Command palette patterns
- Recommendations for Itemdeck

## New Tab Structure

| Tab | Contents | Settings Count |
|-----|----------|----------------|
| Quick | Most-used settings (theme, card size, view mode, shuffle) | 6-8 |
| System | Dark mode, accessibility, UI visibility | ~8 |
| Appearance | Theme + Cards + Animations (merged) | ~25 |
| Data | Sources + Cache + Import/Export | ~10 |

## Files to Create

| File | Purpose |
|------|---------|
| `docs/development/research/R-010-settings-ux-patterns.md` | UX research |
| `src/components/SettingsPanel/QuickSettings.tsx` | Quick settings tab |
| `src/components/SettingsPanel/AppearanceSettings.tsx` | Merged appearance |
| `src/components/SettingsPanel/DataSettings.tsx` | Renamed storage |
| `src/components/SettingsPanel/SettingsSearch.tsx` | Search filter |
| `src/hooks/useSettingsSearch.ts` | Fuzzy search logic |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/SettingsPanel/SettingsPanel.tsx` | 3-tab structure, add search |
| `src/components/SearchBar/SearchBar.tsx` | Simplify, remove ViewModeToggle |
| `src/App.tsx` | Add ViewModeToggle to toolbar |

## SearchBar Simplification

Current:
```
[ViewMode] [GroupBy] [Minimise]
[Search input] [Scope toggle]
[FilterChips] [Count]
```

Proposed:
```
[Search input] [GroupBy v]
[FilterChips] [Count]
```

ViewModeToggle moves to toolbar near Settings button.

## Implementation Tasks

- [x] Create R-010 settings UX research document
- [x] Design QuickSettings component
- [x] Create SystemSettings component (dark mode, accessibility, UI visibility)
- [x] Create AppearanceSettings (merge Theme + Cards + Animations)
- [x] Create DataSettings (rename Storage)
- [x] Implement SettingsSearch component
- [x] Create useSettingsSearch hook with fuzzy matching
- [x] Restructure SettingsPanel to 4 tabs
- [x] Move ViewModeToggle to floating toolbar
- [x] Simplify SearchBar layout
- [x] Test keyboard navigation in new structure
- [x] Update any settings documentation

## Success Criteria

- [x] R-010 research document created
- [x] 4-tab structure implemented (Quick, System, Appearance, Data)
- [x] Settings search functional with fuzzy matching
- [x] ViewModeToggle moved to floating toolbar (bottom-left)
- [x] SearchBar simplified
- [x] All existing settings still accessible

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Large** - Significant restructuring of settings UI.

---

## Related Documentation

- [v0.11.1 Milestone](../../milestones/v0.11.1.md)
- [Settings Panel](../../../../src/components/SettingsPanel/)
