# F-035: Card Quick Actions

## Problem Statement

Users may want to perform actions on cards beyond flipping (favourite, share, delete, external link). Currently, extended actions require opening the info modal. Quick action buttons on hover/focus would improve efficiency.

## Design Approach

Add a floating action bar that appears on card hover/focus, providing quick access to common actions. Actions slide in from the edge with a subtle animation.

### Action Bar Layout

```
┌─────────────────────────┐
│ [♡] [↗️] [⋮]            │  ← Top action bar (on hover)
├─────────────────────────┤
│                         │
│        [Image]          │
│                         │
└─────────────────────────┘
```

### Available Actions

| Action | Icon | Keyboard | Description |
|--------|------|----------|-------------|
| Favourite | ♡/♥ | F | Toggle favourite state |
| Share | ↗️ | S | Copy link / share sheet |
| External | 🔗 | E | Open source URL |
| More | ⋮ | M | Show action menu |

### Reveal Animation

- Actions slide in from top on hover
- Staggered animation (each icon 50ms apart)
- Fade out when hover ends
- Stay visible while any action is focused

## Implementation Tasks

- [ ] Create `CardQuickActions` component
- [ ] Position action bar at card top
- [ ] Implement hover reveal with animation
- [ ] Add favourite toggle action
- [ ] Add share action (Web Share API / clipboard)
- [ ] Add external link action
- [ ] Create overflow menu for additional actions
- [ ] Add keyboard shortcuts for actions
- [ ] Ensure actions focusable and announced
- [ ] Persist favourites to state
- [ ] Coordinate with info button (F-029)
- [ ] Write tests for action interactions

## Success Criteria

- [ ] Action bar appears on hover/focus
- [ ] Actions animate in smoothly
- [ ] Favourite state toggles and persists
- [ ] Share works (Web Share API with fallback)
- [ ] External links open in new tab
- [ ] Keyboard shortcuts work when card focused
- [ ] Screen readers announce actions
- [ ] Actions don't trigger card flip

## Dependencies

- **Requires**: v0.1.0 complete
- **Recommends**: F-012 State Persistence (for favourites)
- **Related**: F-029 Card Info Button

## Complexity

Medium

## Milestone

v0.4.0

---

---

## Implementation Notes

**Milestone**: v0.10.6 (recognised as complete - originally planned for v0.4.0)

### Component Path

`src/components/CardQuickActions/`

### Key Files

- `CardQuickActions.tsx` - Floating action bar component
- `CardQuickActions.module.css` - Reveal animation and positioning styles
- `index.ts` - Module exports

### Integration

- Appears on card hover/focus with staggered animation
- Actions include: favourite, share, external link, more menu
- Keyboard shortcuts available when card is focused
- Coordinates with info button (F-029) placement
- Favourite state persisted to settings store

---

## Related Documentation

- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
- [Card Info Button](../completed/F-029-card-info-button.md)
- [State Persistence](../completed/F-012-state-persistence.md)
- [v0.10.6 Milestone](../../milestones/v0.10.6.md)

---

**Status**: Complete
