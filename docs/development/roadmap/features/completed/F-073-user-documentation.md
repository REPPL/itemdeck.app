# F-073: User Documentation Suite

## Problem Statement

No user-facing documentation exists. Users have no tutorials, guides, or reference docs.

## Design Approach

Create comprehensive documentation following Diataxis framework:
- **Tutorials**: Learning-oriented, step-by-step
- **Guides**: Task-oriented, how-to
- **Explanation**: Conceptual understanding
- **Reference**: Technical specifications

## Directory Structure

```
docs/
+-- tutorials/              # Learning-oriented (NEW)
|   +-- README.md
|   +-- getting-started.md
|   +-- first-collection.md
|   +-- playing-memory-game.md
|   +-- customising-themes.md
+-- guides/                 # Task-oriented (NEW)
|   +-- README.md
|   +-- adding-remote-source.md
|   +-- creating-collection.md
|   +-- search-and-filters.md
|   +-- exporting-data.md
|   +-- edit-mode.md
|   +-- keyboard-shortcuts.md
|   +-- accessibility-options.md
|   +-- view-modes.md
+-- explanation/            # Conceptual (NEW)
|   +-- README.md
|   +-- mechanics-system.md
|   +-- theme-architecture.md
|   +-- data-sources.md
+-- reference/              # Existing + updates
    +-- settings.md         # NEW: All settings reference
    +-- keyboard-shortcuts-reference.md  # NEW
```

## Priority Order

1. `docs/tutorials/getting-started.md` - Critical for new users
2. `docs/guides/keyboard-shortcuts.md` - Quick reference
3. `docs/guides/search-and-filters.md` - v0.11.0 feature
4. `docs/tutorials/playing-memory-game.md` - v0.11.0 feature
5. `docs/guides/view-modes.md` - v0.11.0 feature
6. Remaining tutorials and guides
7. Reference documentation
8. Explanation documentation

## Implementation Tasks

- [x] Create docs/tutorials/ directory structure
- [x] Create docs/guides/ directory structure
- [x] Create docs/explanation/ directory structure
- [x] Write getting-started.md tutorial
- [x] Write keyboard-shortcuts.md guide
- [x] Write search-and-filters.md guide
- [ ] Write playing-memory-game.md tutorial
- [ ] Write view-modes.md guide
- [ ] Write remaining tutorials
- [ ] Write remaining guides
- [ ] Create reference documentation
- [ ] Create explanation documentation
- [x] Update docs/README.md hub
- [ ] Add screenshots as needed

## Screenshots Needed

1. Main interface with card grid
2. Card front and back
3. Card expanded detail view
4. Settings panel tabs
5. Search bar with filters
6. View modes (Grid, List, Compact)
7. Memory game in progress
8. Memory game completion
9. Edit form modal
10. Theme browser

## Success Criteria

- [x] tutorials/ directory created (1 of 4 tutorials written)
- [x] guides/ directory created (2 of 8 guides written)
- [x] explanation/ directory created (0 of 3 docs written)
- [ ] Reference docs updated
- [x] docs/README.md hub updated
- [ ] Key screenshots captured

**Note:** Directory structure complete but content incomplete. See [v0.12.5 Milestone](../../milestones/v0.12.5.md) for remaining tasks.

## Dependencies

- **Requires**: None (can document existing features)
- **Blocks**: None

## Complexity

**Large** - Significant content creation effort.

---

## Related Documentation

- [v0.11.1 Milestone](../../milestones/v0.11.1.md)
- [Documentation Hub](../../../../docs/README.md)
