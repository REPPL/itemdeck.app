# v0.14.5 Retrospective

## Shared Mechanics Components & Standardisation

**Date:** 2025-12-29

---

## What Went Well

### 1. Clear Technical Debt Analysis

The pre-implementation analysis accurately identified:
- ~1,557 lines of duplicated code
- Specific patterns to extract (ErrorOverlay, FloatingTimer, GameCompletionModal)
- Architectural inconsistencies (monolithic vs modular)

This clarity enabled focused, efficient implementation.

### 2. Shared Component Architecture

The `src/mechanics/shared/` structure provides:
- Clean separation of concerns
- Easy imports via barrel exports
- Consistent patterns for future mechanics

### 3. JSON Configuration Foundation

The configuration system establishes groundwork for:
- Responsive display settings
- User customisation (future)
- Mobile/tablet support improvements

### 4. Scope Management

Successfully reduced scope mid-milestone:
- Core refactoring completed (F-095 to F-104, F-106)
- Deferred features properly moved to v0.15.0
- No rushed or incomplete implementations

### 5. Emergency Fix Integration

Smoothly merged emergency fixes from main:
- `sourceStore.ts` auto-activate behaviour
- F-108 feature spec addition
- No merge conflicts

---

## What Could Improve

### 1. Line Count Targets

Original estimates were optimistic:
- Memory target: < 100 lines, achieved: 117 lines
- Snap-Ranking target: < 150 lines, achieved: 366 lines

**Lesson:** Account for JSDoc, error handling, and edge cases in estimates.

### 2. CSS Property Naming in Documentation

Documentation used British `colour:` for CSS properties, causing confusion.

**Fix implemented:** Updated to use `color:` (CSS syntax) while keeping `--colour-*` (custom properties) British.

**Lesson:** Document CSS exceptions explicitly in project standards.

### 3. Net Line Increase

Despite removing duplicates, net lines increased due to:
- Comprehensive type definitions
- Full JSDoc documentation
- JSON configuration files

**Lesson:** Refactoring for maintainability may increase total lines while improving quality.

### 4. Missing Directory READMEs

Implementation prompt directories lacked README files.

**Fix implemented:** Created READMEs for v0.13.0 and v0.14.5 directories.

**Lesson:** Include README creation in standard milestone checklist.

---

## Lessons Learned

### 1. Shared Components Pay Off Quickly

Once extracted, shared components immediately simplified:
- Bug fixes (fix once, applies everywhere)
- Style consistency (single source of truth)
- New mechanic development (reuse existing patterns)

### 2. Configuration-Driven Architecture

JSON configuration enables:
- Non-code customisation
- Easy A/B testing
- User preferences (future)

### 3. Documentation Sync is Critical

The `/sync-docs` and `/verify-docs` checks caught:
- Status inconsistencies in roadmap
- Missing README files
- CSS property naming errors

**Always run verification before release.**

### 4. Deferred Features Need Clear Tracking

Moving features to future milestones requires:
- Explicit documentation of deferral reason
- Updated milestone documents
- Feature IDs preserved for traceability

---

## Decisions Made

### 1. Keep Mechanic-Specific Logic Separate

**Decision:** Shared components handle UI patterns only; game logic stays in mechanic directories.

**Rationale:** Each mechanic has unique rules that shouldn't be abstracted prematurely.

### 2. JSON for Configuration, Not Logic

**Decision:** Configuration files contain settings and display options, not game rules.

**Rationale:** Game logic in JSON becomes hard to test and maintain.

### 3. Defer Statistics Export/Import

**Decision:** F-105 (Game Statistics Export/Import) moved to v0.15.0.

**Rationale:** Requires design decisions about format, storage, and privacy that deserve dedicated focus.

### 4. Standardise Button Labels

**Decision:** All mechanics use consistent labels: "Start", "Play Again", "Exit", "Back".

**Rationale:** User experience consistency across all game modes.

---

## Metrics

| Metric | Value |
|--------|-------|
| Features completed | 11 (F-095 to F-104, F-106) |
| Features deferred | 7 (to v0.15.0) |
| New files created | 17 |
| Files modified | 6 |
| Tests passing | 595 |
| TypeScript errors | 0 |
| Documentation issues fixed | 5 |

---

## Action Items for Future

### For v0.15.0

1. [ ] Implement F-105 (Game Statistics Export/Import)
2. [ ] Complete deferred accessibility audit (F-019)
3. [ ] Review Top Trumps mechanic (F-108)

### For Project Standards

1. [ ] Add CSS British English exception to CLAUDE.md
2. [ ] Add README creation to milestone checklist
3. [ ] Update line count estimation guidelines

### For Architecture

1. [ ] Consider extracting more shared patterns as mechanics mature
2. [ ] Evaluate useDisplayConfig for actual responsive improvements
3. [ ] Monitor shared component usage patterns

---

## Related Documentation

- [v0.14.5 Milestone](../../../roadmap/milestones/v0.14.5.md)
- [v0.14.5 Devlog](../../devlogs/v0.14.5/README.md)
- [v0.15.0 Milestone](../../../roadmap/milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.14.5/v0.14.5-shared-components.md)
