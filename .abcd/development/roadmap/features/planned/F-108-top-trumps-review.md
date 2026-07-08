# F-108: Top Trumps (Competing) Mechanic Review

## Problem Statement

The Top Trumps (Competing) mechanic is functional but needs a comprehensive review and polish. Users report it feels "odd" despite working correctly. Issues may include:

1. **Visual Polish**
   - Card comparison layout needs refinement
   - Battle animations may feel jarring or unclear
   - Status indicators and feedback need improvement

2. **Game Mechanics**
   - AI behaviour may need tuning
   - Round progression feedback unclear
   - Win/lose conditions may not be intuitive

3. **User Experience**
   - Instructions/onboarding may be insufficient
   - Controls may not be intuitive
   - Game state may be confusing

## Design Approach

### Phase 1: Audit

- [ ] Review all user feedback and bug reports
- [ ] Document specific UX issues with screenshots
- [ ] Compare against reference Top Trumps implementations
- [ ] Identify accessibility concerns

### Phase 2: Visual Polish

- [ ] Refine card comparison overlay layout
- [ ] Improve battle result animations
- [ ] Add clearer status indicators (whose turn, deck counts)
- [ ] Ensure consistent styling with other mechanics

### Phase 3: Mechanics Review

- [ ] Audit AI difficulty levels (easy/medium/hard)
- [ ] Review stat selection feedback
- [ ] Improve round transition clarity
- [ ] Add optional tutorial/instructions

### Phase 4: UX Improvements

- [ ] Add game state indicators (rounds won, cards remaining)
- [ ] Improve end-game summary
- [ ] Add keyboard shortcuts if missing
- [ ] Consider adding undo/restart options

## Success Criteria

- [ ] Card comparison is visually clear and intuitive
- [ ] Battle outcomes are clearly communicated
- [ ] AI feels appropriately challenging at each level
- [ ] Game flow feels natural and engaging
- [ ] Consistent with other mechanic UX patterns
- [ ] Accessibility requirements met

## Dependencies

- None (uses existing Competing mechanic infrastructure)

## Complexity

**Medium** - Review and polish of existing functionality.

## Target Version

**v0.15.0**

---

## Related Documentation

- [Competing Mechanic (F-059)](../completed/F-059-competing-mechanic.md)
- [v0.15.0 Milestone](../../milestones/v0.15.0.md)

---

**Status**: Planned
