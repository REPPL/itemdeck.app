# v0.15.7 Development Log

## Overview

Version 0.15.7 significantly expands the research and architectural decision documentation for itemdeck, and fixes Top Trumps and Snap Ranking initialisation bugs. This release adds comprehensive research covering error handling, observability, plugin systems, and collection comparison algorithms, along with three new Architecture Decision Records. It also corrects URL examples in the README.

## Implementation Narrative

### Research Document Creation

The primary work in this release is six new numbered research documents:

1. **R-018: Error Handling Strategies** - Comprehensive research on React error boundary patterns, TanStack Query error handling, user-friendly error messages, and recovery strategies. This document establishes the foundation for the layered error boundary architecture.

2. **R-019: Logging & Observability** - Research on privacy-respecting logging patterns for browser applications, including structured logging, Web Vitals integration, and debug utilities. Emphasises local-first approaches suitable for itemdeck's privacy-focused design.

3. **R-020: Multi-Collection State Patterns** - Investigates React state management patterns for handling multiple data collections simultaneously. Directly supports F-064 (Collection Comparison) with patterns for memory management, lazy loading, and Web Worker integration.

4. **R-021: Plugin Distribution Models** - Compares distribution approaches from npm, Chrome Web Store, WordPress, and VS Code. Recommends a hybrid three-tier model (built-in, curated, community) using static GitHub registry and jsDelivr CDN.

5. **R-022: Plugin Versioning & Breaking Changes** - Examines API versioning strategies including single version, versioned endpoints, capability-based, and adapter patterns. Recommends the API adapter pattern with semantic versioning.

6. **R-023: Collection Matching Algorithms** - Details string similarity algorithms (Levenshtein, Jaro-Winkler, trigrams) and multi-field matching strategies for comparing card collections. Includes performance optimisation techniques like blocking and early termination.

### State-of-the-Art Documents

The release includes two new state-of-the-art analysis documents:

- **state-of-the-art-error-handling.md** - Surveys current best practices (2024-2025) for error handling in React applications, including react-error-boundary library, TanStack Query integration, and accessibility considerations.

- **state-of-the-art-observability.md** - Analyses browser application observability options with focus on privacy-respecting approaches, comparing solutions like Plausible, Sentry, and local-only logging.

### Architecture Decision Records

Three new ADRs document architectural decisions informed by the research:

- **ADR-030: Error Boundary Architecture** - Adopts a four-layer error boundary architecture (Application, Route, Feature, Component) with specific recovery strategies at each level.

- **ADR-031: Logging & Telemetry Strategy** - Establishes local-first structured logging with optional anonymous telemetry, Web Vitals monitoring, and diagnostics export for bug reports.

- **ADR-032: Plugin API Versioning** - Implements the API adapter pattern with semver-based versioning, supporting n-1 major version compatibility and phased deprecation.

### Documentation Sync Fixes

The release fixes three sync issues identified in the documentation audit:

1. **ADR Index** - Adds missing entries for ADR-030, ADR-031, and ADR-032 with links to their research references.

2. **Features README** - Moves F-067 (Statistics Dashboard) from the v1.0.0 Planned section, where a broken link listed it incorrectly, to the v0.15.5 Complete section with the correct path.

3. **Milestones v0.11.0–v0.13.0** - Repairs stale feature links so they point to current feature file locations.

### Feature Enhancement

**F-064: Collection Comparison** gains:
- Matching algorithm summary table referencing R-023
- Performance considerations section referencing R-020
- Additional cross-references to supporting research

### Mechanics Bug Fixes

Two game mechanics initialisation bugs receive fixes:

- **Top Trumps (Competing)** - CardGrid skips its generic initGame call for the competing mechanic, letting CompetingGridOverlay handle its own initialisation with proper config. This resolves a "config.cards.length" error when loading collections.

- **Snap Ranking** - The topBadgeFields dropdown shows only fields that exist in the collection, with automatic fallback to "order" when the configured field is not found. This resolves a "No cards have values for myRank" error on collection switch.

### README URL Fixes

The README's nested folder URL example is corrected, and URL examples use the retro/games/ collection.

## Files Created/Modified

### New Files (14)

```
docs/development/research/
├── R-018-error-handling-strategies.md
├── R-019-logging-observability.md
├── R-020-multi-collection-state-patterns.md
├── R-021-plugin-distribution-models.md
├── R-022-plugin-versioning-breaking-changes.md
├── R-023-collection-matching-algorithms.md
├── state-of-the-art-error-handling.md
└── state-of-the-art-observability.md

docs/development/decisions/adrs/
├── ADR-030-error-boundary-architecture.md
├── ADR-031-logging-telemetry-strategy.md
└── ADR-032-plugin-api-versioning.md

docs/development/process/
├── devlogs/v0.15.7/README.md
└── retrospectives/v0.15.7/README.md

docs/development/roadmap/milestones/
└── v0.15.7.md
```

### Modified Files (17)

```
README.md                                              # URL example fixes
docs/development/research/README.md                    # 8 new entries
docs/development/decisions/adrs/README.md              # 3 new ADR entries
docs/development/process/devlogs/README.md             # v0.15.7 entry
docs/development/process/retrospectives/README.md      # v0.15.7 entry
docs/development/roadmap/README.md                     # v0.15.7 entry
docs/development/roadmap/features/README.md            # F-067 location fix
docs/development/roadmap/features/completed/README.md  # Index updates
docs/development/roadmap/features/planned/README.md    # Index updates
docs/development/roadmap/features/planned/F-064-*.md   # Algorithm refs
docs/development/roadmap/milestones/v0.11.0.md         # Stale link fixes
docs/development/roadmap/milestones/v0.11.5.md         # Stale link fixes
docs/development/roadmap/milestones/v0.12.0.md         # Stale link fixes
docs/development/roadmap/milestones/v0.12.5.md         # Stale link fixes
docs/development/roadmap/milestones/v0.13.0.md         # Stale link fixes
src/components/CardGrid/CardGrid.tsx                   # Top Trumps init fix
src/hooks/useAvailableFields.ts                        # Snap Ranking fields fix
```

## Code Highlights

### Research Document Quality

All research documents follow a consistent structure:
- Executive Summary
- Current State in Itemdeck
- Research Findings with code examples
- Recommendations
- Implementation Considerations
- References and Related Documentation

### Cross-Reference Network

The new documents form a well-connected network:
- R-018 ↔ ADR-030 ↔ state-of-the-art-error-handling
- R-019 ↔ ADR-031 ↔ state-of-the-art-observability
- R-022 ↔ ADR-032
- R-020 + R-023 → F-064

### British English Compliance

All new documents use correct British English spelling:
- "optimisation" not "optimization"
- "sanitise" not "sanitize"
- "initialise" not "initialize"
- "centralised" not "centralized"

## Challenges Encountered

### Documentation Audit Findings

The documentation audit reveals 43 historical files with git-inferable metadata (Last Updated, Created, Author fields). These remain out of scope for this release to keep it focused. A separate housekeeping task is recommended.

### F-067 Misplacement

The audit finds F-067 (Statistics Dashboard) listed under v1.0.0 Planned despite being complete since v0.15.5 — a documentation sync issue where the features README does not reflect the move from `planned/` to `completed/`. This release corrects the listing.

---

## Related Documentation

- [v0.15.7 Retrospective](../../retrospectives/v0.15.7/README.md)
- [v0.15.7 Milestone](../../../roadmap/milestones/v0.15.7.md)
- [Research Index](../../../research/README.md)
- [ADR Index](../../../decisions/adrs/README.md)
