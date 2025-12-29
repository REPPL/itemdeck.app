# F-102: Mechanic Display Preferences

## Problem Statement

Game mechanics like Top Trumps, Quiz, and other full-screen games need specific display settings (smaller cards, hidden grid, custom themes) but currently have no way to declare or apply these preferences. Each mechanic must implement its own responsive CSS, leading to duplicated effort and inconsistent behaviour across mechanics.

## Design Approach

**Hybrid Solution (Option C)**: Extend `MechanicManifest` with display preferences that can be declared in code or overridden via per-mechanic config files.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Mechanic Activation                                          │
├─────────────────────────────────────────────────────────────┤
│ 1. Load manifest.displayPreferences (code defaults)          │
│ 2. Load {mechanic}/settings.json (optional overrides)        │
│ 3. Load {mechanic}/theme.json (optional theme overrides)     │
│ 4. Apply merged preferences to settings store                │
│ 5. On deactivation, restore previous settings                │
└─────────────────────────────────────────────────────────────┘
```

### Display Preferences Interface

```typescript
interface MechanicDisplayPreferences {
  /** Preferred card size when mechanic is active */
  cardSizePreset?: "small" | "medium" | "large";

  /** Preferred aspect ratio */
  cardAspectRatio?: "3:4" | "5:7" | "1:1";

  /** Hide the main card grid when active (for full-screen games) */
  hideCardGrid?: boolean;

  /** UI mode determining overlay behaviour */
  uiMode?: "overlay" | "fullscreen" | "inline" | "panel";

  /** Maximum visible cards (for performance) */
  maxVisibleCards?: number;

  /** Force landscape orientation hint */
  suggestLandscape?: boolean;
}
```

### Per-Mechanic Config Files

Each mechanic folder can optionally contain:

```
src/mechanics/competing/
├── index.tsx              # Mechanic entry point
├── store.ts               # Zustand store
├── settings.json          # Display preferences (optional)
└── theme.json             # Theme overrides (optional)
```

**settings.json example:**
```json
{
  "displayPreferences": {
    "cardSizePreset": "small",
    "hideCardGrid": true,
    "uiMode": "fullscreen"
  },
  "defaults": {
    "difficulty": "medium",
    "roundLimit": 0
  }
}
```

**theme.json example:**
```json
{
  "extends": "modern",
  "colours": {
    "player": "#2ecc71",
    "cpu": "#e74c3c",
    "tie": "#f1c40f"
  }
}
```

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/mechanics/types.ts` | Add `MechanicDisplayPreferences` interface |
| `src/mechanics/types.ts` | Add `displayPreferences` to `MechanicManifest` |
| `src/stores/settingsStore.ts` | Add `applyMechanicOverrides()` and `restoreMechanicOverrides()` |
| `src/loaders/mechanicConfigLoader.ts` | New: Load per-mechanic settings.json and theme.json |
| `src/mechanics/context.tsx` | Apply/restore overrides in activation lifecycle |
| `src/mechanics/competing/index.tsx` | Add display preferences to manifest |
| `src/mechanics/quiz/index.tsx` | Add display preferences to manifest |
| `src/mechanics/memory/index.tsx` | Add display preferences to manifest |
| `src/mechanics/snap-ranking/index.tsx` | Add display preferences to manifest |

## Implementation Tasks

### Phase 1: Core Infrastructure

- [ ] Add `MechanicDisplayPreferences` interface to `src/mechanics/types.ts`
- [ ] Add `displayPreferences?: MechanicDisplayPreferences` to `MechanicManifest`
- [ ] Add `mechanicOverrides` transient state to settings store
- [ ] Implement `applyMechanicOverrides(prefs: MechanicDisplayPreferences)` action
- [ ] Implement `restoreMechanicOverrides()` action
- [ ] Create `getEffectiveSettings()` selector that merges overrides

### Phase 2: Lifecycle Integration

- [ ] Update `MechanicContext.activateMechanic()` to apply display preferences
- [ ] Update `MechanicContext.deactivateMechanic()` to restore original settings
- [ ] Ensure settings are restored on page unload/refresh

### Phase 3: Config File Loader

- [ ] Create `src/loaders/mechanicConfigLoader.ts`
- [ ] Implement `loadMechanicSettings(mechanicId: string)` function
- [ ] Implement `loadMechanicTheme(mechanicId: string)` function
- [ ] Add schema validation for mechanic config files
- [ ] Merge file config with manifest defaults (file takes precedence)

### Phase 4: Mechanic Updates

- [ ] Add display preferences to Top Trumps (competing) manifest
- [ ] Add display preferences to Quiz manifest
- [ ] Add display preferences to Memory manifest
- [ ] Add display preferences to Snap Ranking manifest
- [ ] Remove hardcoded responsive CSS overrides (use system instead)

### Phase 5: Documentation

- [ ] Document display preferences in mechanic development guide
- [ ] Add examples of settings.json and theme.json
- [ ] Update plugin contribution schema documentation

## Technical Considerations

### Settings Restoration

Settings must be restored when:
1. Mechanic is deactivated
2. User navigates away
3. Page is refreshed
4. Browser tab is closed

Use `beforeunload` event and store previous settings in sessionStorage as backup.

### Performance

- Config files loaded lazily on mechanic activation
- Cached after first load
- Small file sizes (< 1KB each)

### Backwards Compatibility

- All fields in `MechanicDisplayPreferences` are optional
- Mechanics without preferences continue to work unchanged
- Config files are optional (manifest defaults used if missing)

## Success Criteria

- [ ] Mechanics can declare display preferences in manifest
- [ ] Display preferences are applied when mechanic activates
- [ ] Original settings are restored when mechanic deactivates
- [ ] Optional settings.json can override manifest preferences
- [ ] Optional theme.json can apply custom colours
- [ ] All existing mechanics continue to work unchanged
- [ ] Top Trumps uses small cards and full-screen mode automatically

## Dependencies

- **Requires**: v0.13.0 (Plugin Architecture)
- **Blocks**: None

## Complexity

**Medium** - Extends existing patterns, multiple integration points.

## Target Version

**v0.14.5** - Post-Advanced Mechanics polish

---

## Related Documentation

- [Mechanic Types](../../../../src/mechanics/types.ts)
- [Settings Store](../../../../src/stores/settingsStore.ts)
- [Plugin Contribution Schema](../../../../src/plugins/schemas/contributions/)
- [v0.14.5 Milestone](../../milestones/v0.14.5.md)

---

**Status**: Planned
