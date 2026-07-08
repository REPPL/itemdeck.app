# F-116: Settings Panel Reorganisation

## Problem Statement

The current Settings panel has evolved organically over 15+ milestones, resulting in:

1. **Unclear organisation** - 5 tabs (Quick | Appearance | Collections | Data | System) with overlapping concerns
2. **Difficult discovery** - Users struggle to find specific settings
3. **No dedicated mechanics section** - Game mechanics settings scattered across tabs
4. **Scalability concerns** - Current structure doesn't accommodate future growth (plugins, more mechanics)

### Current Tab Analysis

| Tab | Contents | Issues |
|-----|----------|--------|
| Quick | Mechanic selector, shuffle, view mode | Mix of frequent and infrequent settings |
| Appearance | Theme, card size, animations | Well-organised |
| Collections | Sources, filters | Good |
| Data | Storage, exports, cache | Mix of user data and system |
| System | Devtools, accessibility | Should include all system/storage |

## Design Approach

Reorganise to 4 user-centric tabs based on user intent:

```
Display | Collection | Play | System
```

### New Tab Structure

| New Tab | Purpose | Contains |
|---------|---------|----------|
| **Display** | "How it looks" | View mode, card size, theme, animations, visual settings |
| **Collection** | "What data I see" | Sources, filters, sorting, grouping, statistics, export |
| **Play** | "How I interact with games" | Mechanic selection, per-mechanic settings, game preferences |
| **System** | "App behaviour" | Storage, cache, accessibility, devtools, performance |

### Tab Details

#### Display Tab
```
Visual Settings
├── Theme (Light/Dark/High Contrast)
├── Visual Theme (Modern/Retro/Minimal)
├── Card Size Preset
├── Card Aspect Ratio
└── Animation Settings
    ├── Motion Preference
    └── Flip Animation Style

View Settings
├── Default View Mode (Grid/Stack/Carousel/Fit)
├── Cards Per Row
└── Show Badges
```

#### Collection Tab
```
Sources
├── Active Source Selector
├── Add/Remove Sources
└── Source Health Indicators

Display Options
├── Filter by Category
├── Grouping Options
├── Sort Order
└── Random Sample Size

Data
├── Export Collection
├── Export Edits
└── Statistics Panel
```

#### Play Tab (NEW)
```
Active Mechanic
├── Mechanic Selector (Memory/Quiz/Competing/etc.)
└── None (Browse Mode)

Per-Mechanic Settings
├── Memory Settings
│   ├── Pairs Count
│   └── Time Limit
├── Quiz Settings
│   ├── Question Count
│   └── Field Selection
├── Competing Settings
│   ├── Rounds
│   └── Stat Selection
└── [Expandable for future mechanics]

Display Preferences
├── Override Card Size
├── UI Mode (Overlay/Fullscreen/Inline)
└── Sound Effects (future)
```

#### System Tab
```
Storage
├── Cache Status
├── Clear Cache
└── Storage Usage

Accessibility
├── Reduced Motion
├── High Contrast
├── Font Size
└── Keyboard Shortcuts

Developer
├── Show Devtools
├── Debug Mode
└── Version Info
```

## Implementation Tasks

### Phase 1: Component Structure (~3 hours)

- [ ] Create `src/components/SettingsPanel/DisplayTab.tsx`
- [ ] Create `src/components/SettingsPanel/PlayTab.tsx`
- [ ] Rename `CollectionsTab.tsx` → `CollectionTab.tsx`
- [ ] Rename `SystemSettings.tsx` → `SystemTab.tsx`
- [ ] Update `SettingsPanel.tsx` with new tab structure

### Phase 2: Settings Migration (~4 hours)

- [ ] Move theme settings from Appearance → Display
- [ ] Move view mode from Quick → Display
- [ ] Move mechanic selector from Quick → Play
- [ ] Move storage settings from Data → System
- [ ] Move accessibility from System → System (consolidate)
- [ ] Move exports from Data → Collection

### Phase 3: Play Tab Development (~5 hours)

- [ ] Create mechanic selector component
- [ ] Create per-mechanic settings sections
- [ ] Integrate display preferences (F-102)
- [ ] Add mechanic descriptions/requirements
- [ ] Test mechanic activation from Play tab

### Phase 4: Search Index Update (~2 hours)

- [ ] Update `SettingsSearch.tsx` with new tab locations
- [ ] Add redirects for moved settings
- [ ] Test search functionality
- [ ] Add "moved" indicators for frequently accessed settings

### Phase 5: Documentation (~2 hours)

- [ ] Update `docs/guides/settings.md`
- [ ] Update `docs/reference/settings.md`
- [ ] Add screenshots of new layout
- [ ] Update user tutorials

## Success Criteria

- [ ] All existing settings accessible in new structure
- [ ] Search index updated and functional
- [ ] User documentation updated with new tab names
- [ ] No functionality lost during migration
- [ ] Settings persistence works correctly
- [ ] Keyboard navigation works across all tabs
- [ ] Play tab shows all 5 mechanics with settings

## Dependencies

- **F-102**: Mechanic Display Preferences (complete) - Provides per-mechanic settings infrastructure
- **F-118**: Mechanics UX Review - Influences Play tab design

## Complexity

**Medium** - Primarily UI reorganisation with some component restructuring.

## Estimated Effort

**12-16 hours**

## Testing Strategy

- Verify all settings persist correctly after reorganisation
- Test search finds settings in new locations
- Verify keyboard navigation order
- Test mechanic activation from Play tab
- E2E test for settings workflow
- Verify no regressions in existing functionality

## Risk Mitigation

1. **User confusion** - Add "moved" notices for first few visits
2. **Settings loss** - Ensure store migration handles tab changes
3. **Search breakage** - Update search index before deployment

---

## Related Documentation

- [F-102: Mechanic Display Preferences](../completed/F-102-mechanic-display-preferences.md)
- [F-118: Mechanics UX Review](./F-118-mechanics-ux-review.md)
- [Settings Panel Redesign (F-072)](../completed/F-072-settings-panel-redesign.md)

---

**Status**: Planned
