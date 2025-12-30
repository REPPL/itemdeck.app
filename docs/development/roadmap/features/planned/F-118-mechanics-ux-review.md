# F-118: Mechanics UX Review

## Problem Statement

The gaming mechanics in itemdeck have been developed incrementally across multiple milestones, resulting in:

1. **Inconsistent navigation** - Exit buttons in different positions across mechanics
2. **Scattered settings** - Mechanic configuration split between Quick Settings and mechanic-specific UI
3. **Unclear requirements** - Users don't know which fields a mechanic needs before activating
4. **Discoverability issues** - New users may not understand what each mechanic does
5. **Scalability concerns** - Current patterns don't scale well for additional mechanics

### Current Mechanics Inventory

| Mechanic | Description | Requirements | Settings Location |
|----------|-------------|--------------|-------------------|
| **Memory** | Flip-and-match pairs | Images | Quick Settings |
| **Quiz** | Multiple-choice questions | Text fields | In-game only |
| **Competing** | Top Trumps stat battles | Numeric fields | In-game config |
| **Snap Ranking** | Badge value prediction | Numeric field | None |
| **Collection** | Track ownership status | None | Persistent per card |

### Known UX Issues

1. **Memory**: Exit button top-left; status bar relocated in v0.11.1
2. **Quiz**: Settings only accessible after starting game
3. **Competing**: Field selection happens during gameplay, not before
4. **Snap Ranking**: No settings, no explanation of how scoring works
5. **Collection**: Always active (toggle per card), different interaction model

## Design Approach

### 1. Unified Mechanic Selection UI

Move all mechanic selection and configuration to the new "Play" tab in Settings (F-116):

```
┌─────────────────────────────────────────────────────────────┐
│ Play Settings                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Active Mode: ○ Browse  ● Memory  ○ Quiz  ○ Competing  ○ ... │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Memory Game                                               │ │
│ │                                                           │ │
│ │ Match pairs of cards by remembering their positions.      │ │
│ │                                                           │ │
│ │ Requirements:                                             │ │
│ │ ✓ Collection loaded (minimum 4 cards)                     │ │
│ │ ✓ Cards have images                                       │ │
│ │                                                           │ │
│ │ Settings:                                                 │ │
│ │ ├── Pairs: [4] [8] [12] [16]                             │ │
│ │ ├── Time limit: ○ None  ● 60s  ○ 120s  ○ Custom          │ │
│ │ └── Show hints: ☐                                         │ │
│ │                                                           │ │
│ │               [Start Game]                                │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2. Consistent In-Game Navigation

Standardise navigation elements across all mechanics:

```
┌─────────────────────────────────────────────────────────────┐
│ [← Exit]  Memory Game                    Score: 12  ⏱ 0:45  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                     [Game Content]                           │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ [Pause]  [Restart]  [Help]                         [⚙️]     │
└─────────────────────────────────────────────────────────────┘
```

**Header:** Exit button (always top-left), game name, score/progress, timer
**Footer:** Pause, Restart, Help, Settings (in-game adjustments)

### 3. Mechanic Requirements System

Each mechanic declares its requirements in the manifest:

```typescript
interface MechanicRequirements {
  minCards: number;
  requiredFields: FieldRequirement[];
  recommendedFields?: FieldRequirement[];
}

interface FieldRequirement {
  type: 'image' | 'numeric' | 'text' | 'category';
  description: string;
}
```

The UI checks requirements before allowing activation:
- ✅ Met: Green checkmark, enabled
- ⚠️ Partial: Yellow warning, enabled with notice
- ❌ Not met: Red cross, disabled with explanation

### 4. Help/Instructions Pattern

Each mechanic has:
1. **Pre-game description** in Play settings
2. **In-game help** accessible via Help button
3. **Completion summary** explaining scoring

## Implementation Tasks

### Phase 1: UX Audit (~2 hours)

- [ ] Document current exit button positions for all mechanics
- [ ] Document current settings locations for all mechanics
- [ ] Document navigation patterns (Escape, click, buttons)
- [ ] Identify accessibility gaps
- [ ] Create UX audit report

### Phase 2: Manifest Enhancement (~2 hours)

- [ ] Add `requirements` field to `MechanicManifest` type
- [ ] Add `description` field to manifests
- [ ] Add `helpContent` field for in-game help
- [ ] Update all 5 mechanic manifests with requirements
- [ ] Create requirements checker utility

### Phase 3: Play Tab Integration (~4 hours)

- [ ] Create mechanic card component for Play tab
- [ ] Show requirements status with visual indicators
- [ ] Show mechanic description
- [ ] Show configurable settings
- [ ] Add "Start Game" action button
- [ ] Handle disabled state for unmet requirements

### Phase 4: Navigation Standardisation (~4 hours)

- [ ] Create shared `MechanicHeader` component
- [ ] Create shared `MechanicFooter` component
- [ ] Update Memory to use shared components
- [ ] Update Quiz to use shared components
- [ ] Update Competing to use shared components
- [ ] Update Snap Ranking to use shared components
- [ ] Collection mechanic - review if navigation applies

### Phase 5: Settings Consolidation (~3 hours)

- [ ] Move Memory settings to Play tab
- [ ] Move Quiz settings to Play tab (field selection)
- [ ] Move Competing settings to Play tab (stat selection)
- [ ] Add Snap Ranking settings (if applicable)
- [ ] Ensure in-game settings are subset of Play tab settings
- [ ] Settings persist between sessions

### Phase 6: Help System (~2 hours)

- [ ] Create `MechanicHelp` component
- [ ] Add help content to each mechanic manifest
- [ ] Wire up Help button in footer
- [ ] Ensure keyboard accessible (? shortcut)

### Phase 7: Documentation (~2 hours)

- [ ] Document mechanic development guide
- [ ] Document requirements system
- [ ] Update user-facing mechanic guides
- [ ] Add mechanic selection to keyboard shortcuts

## Success Criteria

- [ ] All mechanics have exit button in consistent position (top-left)
- [ ] All mechanics accessible from unified Play settings tab
- [ ] Each mechanic shows clear requirements before activation
- [ ] Escape key exits all mechanics consistently
- [ ] Help accessible from within each mechanic
- [ ] Settings persist and work consistently
- [ ] Pattern documented for creating new mechanics
- [ ] No regression in existing mechanic functionality

## Dependencies

- **F-116**: Settings Reorganisation - Play tab must exist
- **F-102**: Mechanic Display Preferences (complete) - Per-mechanic display settings

## Complexity

**Medium-Large** - Touches all 5 mechanics with UI and manifest changes.

## Estimated Effort

**12-16 hours**

## Testing Strategy

- Test each mechanic activation from Play tab
- Test exit behaviour consistency
- Test settings persistence
- Test requirements checking
- E2E test for mechanic workflow
- Keyboard navigation testing
- Screen reader testing for mechanic selection

## Risk Mitigation

1. **Breaking existing mechanics** - Comprehensive testing before release
2. **User confusion** - Clear documentation of new patterns
3. **Scope creep** - Focus on standardisation, not new features

---

## Related Documentation

- [F-116: Settings Reorganisation](./F-116-settings-reorganisation.md)
- [F-102: Mechanic Display Preferences](../completed/F-102-mechanic-display-preferences.md)
- [F-053: Mechanic Plugin Registry](../completed/F-053-mechanic-plugin-registry.md)
- [Mechanics System Explanation](../../../explanation/mechanics-system.md)

---

**Status**: Planned
