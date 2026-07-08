# F-056: Settings Panel Mechanic Selector

## Problem Statement

Users need a way to discover and activate gaming mechanics. The selector must:

1. **Show available mechanics** - List all registered mechanics
2. **Enable activation** - User can select one mechanic to activate
3. **Show current state** - Clear indication of which mechanic is active
4. **Support "None"** - Allow turning off all mechanics

## Design Approach

Add a "Mechanics" tab to the Settings Panel with radio-button selection.

### Settings UI

```
Settings Panel → Mechanics Tab
┌─────────────────────────────────────────────────────────────┐
│ Gaming Mechanics                                            │
│                                                             │
│ Select a mechanic to enable interactive features.          │
│                                                             │
│ ○ None (default)                                            │
│   View cards without any game mechanics                     │
│                                                             │
│ ● Memory Game                                               │
│   Match pairs of cards by flipping them                     │
│                                                             │
│ ○ Collection                                                │
│   Track owned cards and wishlist                            │
│                                                             │
│ ○ Competing (Top Trumps)                                    │
│   Compare card stats head-to-head                           │
│                                                             │
│ ○ Quiz                                                      │
│   Guess the card from clues                                 │
│                                                             │
│ ○ Snap Ranking                                              │
│   Rate cards one at a time for instant tier list            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mechanic Item Display

Each mechanic shows:
- Icon (from manifest)
- Name (from manifest)
- Description (from manifest)
- Optional: Requirements warning if collection lacks required fields

## Implementation Tasks

### Phase 1: Settings Tab Creation

- [ ] Add "Mechanics" tab to Settings Panel
- [ ] Create `MechanicsTab.tsx` component
- [ ] Style tab content with mechanic list

### Phase 2: Mechanic List

- [ ] Use `useMechanicList()` hook to get available mechanics
- [ ] Render radio button for each mechanic
- [ ] Add "None" option at top
- [ ] Show mechanic icon, name, description

### Phase 3: Selection Handling

- [ ] Wire radio buttons to `activateMechanic(id)` / `deactivateMechanic()`
- [ ] Show loading state during activation
- [ ] Handle activation errors with toast

### Phase 4: Requirements Validation

- [ ] Check if collection has required fields for each mechanic
- [ ] Show warning icon for mechanics with missing requirements
- [ ] Tooltip explains what fields are needed
- [ ] Disable activation for incompatible mechanics

## Success Criteria

- [ ] Mechanics tab visible in Settings Panel
- [ ] All registered mechanics appear in list
- [ ] Selecting mechanic activates it
- [ ] Selecting "None" deactivates current mechanic
- [ ] Requirements warnings shown for incompatible mechanics
- [ ] Loading state shown during activation

## Dependencies

- **F-053**: Mechanic Plugin Registry (`mechanicRegistry.list()`)
- **F-054**: Mechanic Context Provider (`useMechanicList`, `activateMechanic`)

## Complexity

**Small** - UI component with hook integration.

## Testing Strategy

- Component tests for tab rendering
- Test mechanic selection
- Test requirements validation display
- Test loading states

---

## Related Documentation

- [F-053: Mechanic Plugin Registry](./F-053-mechanic-plugin-registry.md)
- [F-054: Mechanic Context Provider](./F-054-mechanic-context-provider.md)
- [ADR-016: Gaming Mechanics Plugin Architecture](../../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md)

---

**Status**: Complete
