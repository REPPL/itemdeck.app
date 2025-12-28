# F-068: Memory Game Status Bar Relocation

## Problem Statement

The status bar during Memory Game gameplay appears at the top of the screen, making it difficult to read game cards. The bar obscures content and creates visual clutter during play.

## Design Approach

1. **Hide status bar during active gameplay** (pure focus mode)
2. **Show stats in bottom-left footer** (same position as SearchBar) only when game is complete
3. **Include all final stats** in the completion modal

## Files to Modify

| File | Changes |
|------|---------|
| `src/mechanics/memory/components.tsx` | Remove top overlay during play, add bottom stats on completion |
| `src/mechanics/memory/memory.module.css` | Add `.bottomStatsBar` matching SearchBar position |

## Implementation Tasks

- [ ] Remove top overlay rendering during active play
- [ ] Add bottom stats bar component for completion state
- [ ] Style bottom bar to match SearchBar position
- [ ] Ensure smooth animation on appear
- [ ] Test with different card counts

## Success Criteria

- [ ] No overlay during active gameplay
- [ ] Stats appear in bottom-left after game completion
- [ ] Position matches SearchBar styling
- [ ] Smooth animation on appear

## Dependencies

- **Requires**: v0.11.0 (Mechanics Foundation)
- **Blocks**: None

## Complexity

**Small** - UI positioning changes only.

---

## Related Documentation

- [v0.11.1 Milestone](../../milestones/v0.11.1.md)
- [Memory Game Mechanic](../../../research/R-005-gaming-mechanics-state.md)
