# F-027: Shuffle by Default

## Problem Statement

Cards currently display in their source order, which can be predictable and less engaging. Users expect a randomised experience similar to shuffling a physical deck of cards, making each session feel fresh and discovery-oriented.

## Design Approach

Add a `shuffle` configuration option to the behaviour settings with `true` as the default. Implement Fisher-Yates shuffle algorithm for unbiased randomisation. Provide UI controls to toggle shuffle on/off and trigger manual re-shuffle.

### Configuration Extension

```typescript
// Addition to BehaviourConfigSchema
shuffle: z.boolean().default(true),
shuffleOnLoad: z.boolean().default(true),
```

### Shuffle Algorithm

Use Fisher-Yates (Knuth) shuffle for O(n) unbiased randomisation:

```typescript
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

## Implementation Tasks

- [ ] Add `shuffle` and `shuffleOnLoad` to `BehaviourConfigSchema`
- [ ] Create `useShuffledCards` hook that wraps card data
- [ ] Implement Fisher-Yates shuffle utility function
- [ ] Add shuffle toggle to settings panel (when available)
- [ ] Add manual re-shuffle button to toolbar
- [ ] Persist shuffle preference to localStorage
- [ ] Animate card position changes on shuffle
- [ ] Write unit tests for shuffle algorithm uniformity

## Success Criteria

- [ ] Cards display in random order by default
- [ ] Shuffle algorithm produces uniform distribution
- [ ] Users can toggle shuffle on/off
- [ ] Manual re-shuffle animates cards to new positions
- [ ] Preference persists across sessions
- [ ] Accessibility: shuffle action announced to screen readers

## Dependencies

- **Requires**: F-002 Configuration System (complete)
- **Optional**: F-013 Settings Panel (for UI toggle)
- **Related**: F-024 ARIA Live Regions (for announcements)

## Complexity

Small

## Milestone

v0.3.0

---

## Related Documentation

- [Configuration System](../completed/F-002-configuration-system.md)
- [Settings Panel](./F-013-settings-panel.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)

---

**Status**: Planned
