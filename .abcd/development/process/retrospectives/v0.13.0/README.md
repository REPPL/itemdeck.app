# v0.13.0 Retrospective: Modular Plugin Architecture

## Overview

v0.13.0 implemented the foundational modular plugin architecture for itemdeck, transforming the application into an extensible platform. This milestone focused on WP-A (Plugin Core) and WP-B (Plugin Migration), deferring WP-C through WP-E to future releases.

---

## What Went Well

### Solid Foundation
- Clean separation of concerns between plugin system components
- Capability-based security model provides granular permission control
- Schema validation with Zod ensures type safety throughout
- Lazy loading with deduplication prevents redundant module loads

### Game Mechanics Polish
- Card count filtering now shows only selected cards, improving player experience
- Guess options computed from entire collection, maintaining consistent difficulty
- Close guess feedback (yellow) properly distinguished from wrong (red)
- Mobile-responsive completion screens work well on iPhone

### Architectural Decisions
- Using adapters to bridge plugins with existing systems avoided large-scale refactoring
- Zustand for plugin state management integrates seamlessly with existing stores
- IndexedDB caching provides offline support for plugin manifests

### Schema Design
- Contribution schemas (theme, mechanic, settings, source) provide clear contracts
- Capability tiers (builtin, official, community) enable differentiated trust levels
- Manifest validation catches errors early in the plugin lifecycle

---

## What Could Improve

### CSS Specificity Challenges
The "Different Game" button in Snap Ranking results proved unexpectedly difficult to style. Multiple attempts with different CSS approaches (box-shadow inset, !important, removing base styles) all failed to produce the desired border styling. Decision was made to remove the button rather than ship with broken styling. Future work should investigate the CSS module specificity chain for these button classes.

### Schema-Manifest Alignment
The existing mechanic and source manifests in the codebase use different field names than the new contribution schemas:
- `entry` vs `entrypoint`
- `type` vs `category`
- Nested vs flattened structures for theme tokens

This required `as unknown as Type` casts in plugin index files, which is not ideal. Future work should align these schemas.

### Store Method Documentation
Initial adapter implementations assumed store methods like `setActiveMechanics()` existed when the actual methods were `addActiveMechanic()`. Better documentation of store interfaces would prevent this.

### JSON Import Type Inference
TypeScript infers JSON imports with literal string types as `string`, not the specific union types expected by Zod schemas. The workaround with double casts works but is verbose.

---

## Lessons Learned

1. **Adapters First**: Creating adapters before migrating existing features proved essential. The adapter pattern isolated the new plugin system from existing code.

2. **Schema Validation**: Zod validation caught numerous type mismatches during development that would have been runtime errors otherwise.

3. **Incremental Migration**: Migrating themes, mechanics, and sources one at a time allowed focused debugging of each adapter type.

4. **Generic Game Initialisation**: The fix to initialise any mechanic with `initGame()` (not just memory) showed the importance of designing generic interfaces. Snap Ranking wasn't working because the CardGrid only initialised memory games.

5. **Display vs Game State Separation**: The card count filtering issue highlighted the distinction between game state (which cards are in the game) and display state (which cards are shown). Both need explicit management.

6. **Consistent Difficulty**: Computing guess options from the entire collection rather than selected cards ensures the game difficulty remains constant regardless of card count settings.

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use adapters over direct refactoring | Minimises risk and allows gradual migration |
| IndexedDB for plugin cache | Native offline support, no additional dependencies |
| Capability-based permissions | Industry-standard approach for sandboxed extensions |
| Defer Web Worker sandbox | Community plugins not yet supported; core system first |
| Type assertions for JSON imports | Pragmatic solution for TypeScript limitation |
| Remove "Different Game" button from Snap Ranking | CSS styling issues unresolved; simpler UX to exit and re-select |
| Remove "Copy Results" button | No clear destination for copied results in current UX |
| Compute guess options from all cards | Maintains consistent difficulty regardless of card count |

---

## Metrics

### Files Created

| Category | Count |
|----------|-------|
| Plugin schemas | 6 |
| Plugin infrastructure | 9 |
| Plugin adapters | 5 |
| Built-in plugins | 9 directories |
| **Total** | ~29 files |

### Code Quality

- TypeScript strict mode: Pass
- All type errors resolved
- No new dependencies added

### Game Mechanics Changes

| Change | Impact |
|--------|--------|
| Card filtering for snap-ranking | Players see only selected number of cards |
| Guess options from full collection | Consistent difficulty at all card counts |
| Close guess yellow styling | Visual feedback matches feedback type |
| Mobile responsive modals | Completion screens work on iPhone |

### Test Coverage

- Deferred to future milestone (manual testing performed)

---

## Deferred Work

The following work packages were deferred to future milestones:

| Work Package | Contents | Reason for Deferral |
|--------------|----------|---------------------|
| WP-C | User documentation (tutorials, guides) | Focus on core infrastructure first |
| WP-D | Plugin discovery UI (browser, manager) | Requires core plugins working |
| WP-E | Developer documentation | Core system needed first |

---

## Next Steps

1. **v0.14.0**: Focus on WP-D (Plugin Discovery UI) - users need to see and manage plugins
2. **Schema Alignment**: Align existing manifests with new contribution schemas
3. **Test Suite**: Add unit tests for plugin validation and loading
4. **User Documentation**: Create tutorials for using themes and mechanics

---

## Related Documentation

- [v0.13.0 Devlog](../../devlogs/v0.13.0/README.md) - Implementation narrative
- [v0.13.0 Milestone](../../../roadmap/milestones/v0.13.0.md) - Milestone document
- [Mechanic Settings ADR](../../../decisions/adrs/ADR-020-mechanic-settings-isolation.md) - Related architecture decision

