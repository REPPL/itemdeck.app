# v0.12.0 Implementation Prompt

## Milestone Overview

**Theme:** Core Mechanics & Public Release Preparation

**Goals:**
1. Implement gaming mechanics (Collection Tracking, Snap Ranking)
2. Prepare itemdeck for public release
3. Fix iPhone compatibility issues
4. Add modular URL routing system

---

## Pre-Implementation: Architecture Refinement

Before implementing new mechanics, fix architectural gaps in the mechanic plugin system.

### Current Architecture Assessment

**Strengths (Keep):**
- Registry pattern with lazy loading (ADR-016)
- Per-mechanic Zustand stores (ADR-017)
- Slot-based overlays (ADR-018)
- Clean mechanic interface with lifecycle hooks

**Gaps to Fix:**

| Gap | Current Code | Problem |
|-----|--------------|---------|
| Direct store import | `CardGrid.tsx:14` imports `useMemoryStore` | Core coupled to Memory mechanic |
| No settings accessor | `Mechanic.Settings` has no props | Can't control settings from parent |
| No `getSettings()` | Missing from `Mechanic` interface | No generic settings access |
| Fragmented persistence | Each store persists separately | No unified strategy |

### Required Architectural Changes

1. **Create ADR-020** - Document mechanic settings isolation pattern
2. **Update `src/mechanics/types.ts`** - Add `getSettings()` method and `MechanicSettingsProps`
3. **Remove direct imports** - `CardGrid.tsx` should not import `useMemoryStore`
4. **Create Settings components** - Each mechanic provides its own settings UI

---

## Implementation Phases

### Phase 0: README Updates

Update `/README.md` for public release:
- Remove status badge (line 13) - violates SSOT
- Update Key Features section with current capabilities
- Replace AI setup prompts with user documentation links

### Phase 0.4: Modular Domain Providers

Implement extensible URL routing via JSON config files:

```
/gh?u=REPPL&collection=commercials
  ↓
Loads: src/providers/gh.json
  ↓
Builds CDN URL from pattern
```

**Files to create:**
- `src/providers/gh.json` - GitHub provider config
- `src/providers/index.ts` - Provider registry
- `src/utils/urlBuilder.ts` - URL construction

**Provider schema:**
```json
{
  "id": "gh",
  "cdn": { "baseUrl": "...", "pattern": "{user}/{repo}@{branch}/..." },
  "defaults": { "repo": "MyPlausibleMe", "branch": "main" },
  "params": { "required": ["u", "collection"], "mapping": {...} }
}
```

### Phase 0.45: Collection Settings Override

Load optional `settings.json` from collection directory to override user settings.

**Supported overrides:**
- `cardSizePreset`, `viewMode`, `theme`
- `shuffleOnLoad`, `randomSelection`, `selectionCount`
- `cardBackDisplay`, `defaultMechanic`

### Phase 0.5: iPhone Compatibility

**Card sizes (device-optimised):**
- Small: 150px (iPhone - 2 cards per row)
- Medium: 260px (iPad horizontal)
- Large: 360px (Studio Display)

**Toast fix:** Reduce padding, fix max-width calculation for mobile.

**Auto-detect:** Default to "Small" on mobile devices.

### Phase 1: Bug Fixes & Enhancements

1. **Caching screen improvements:**
   - Show collection name: "Caching Retro Games... 66%"
   - Different message for cache load vs first-time cache
   - Show cached status in Collection Browser

2. **Smart selection count default:** 50% of cards, minimum 8

3. **Cache notification:** Include collection name in toast

### Phase 2-6: Feature Implementation

- **Phase 2:** F-037 Card Sorting (expanded sort options)
- **Phase 3:** F-067 Statistics Dashboard (CSS bar charts)
- **Phase 4:** F-091 Entity Auto-Discovery (GitHub API fallback)
- **Phase 5:** F-058 Collection Mechanic (owned/wishlist tracking)
- **Phase 6:** F-061 Snap Ranking Mechanic (tier-list creation)

---

## Testing URLs

**Commercials (14 items with YouTube videos):**
```
http://localhost:5173/gh?u=REPPL&collection=commercials
```

**Retro Games (81 items):**
```
http://localhost:5173/gh?u=REPPL&collection=retro-games
```

**Legacy format (still supported):**
```
http://localhost:5173/?collection=https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/commercials
```

---

## Key Files

| Feature | Files |
|---------|-------|
| Domain Providers | `src/providers/gh.json`, `src/providers/index.ts` |
| Collection Settings | `src/types/collectionSettings.ts`, `src/loaders/settingsLoader.ts` |
| iPhone Fixes | `src/stores/settingsStore.ts`, `CollectionToast.module.css` |
| Caching Screen | `CachingProgress.tsx`, `CollectionBrowser.tsx` |
| Collection Mechanic | `src/mechanics/collection/` |
| Snap Ranking | `src/mechanics/snap-ranking/` |

---

## Success Criteria

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `/gh?u=REPPL&collection=commercials` loads directly
- [ ] 2 cards visible per row on iPhone (Small size)
- [ ] Collection Browser shows cached collections
- [ ] New mechanics work with existing Memory Game
- [ ] All tests pass

---

## Related Documentation

- [Roadmap: v0.12.0 Milestone](../../development/roadmap/milestones/v0.12.0.md)
- [ADR-016: Mechanic Plugin Registry](../../development/decisions/adrs/ADR-016-mechanic-plugin-registry.md)
- [ADR-017: Mechanic State Management](../../development/decisions/adrs/ADR-017-mechanic-state-management.md)
- [ADR-018: Mechanic Overlay System](../../development/decisions/adrs/ADR-018-mechanic-overlay-system.md)
- [ADR-020: Mechanic Settings Isolation](../../development/decisions/adrs/ADR-020-mechanic-settings-isolation.md) (new)

---

**Status**: Ready for implementation
