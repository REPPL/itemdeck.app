# v0.14.0 - Advanced Mechanics (Plugin-Based)

## Overview

Implement advanced gaming mechanics using the plugin architecture from v0.13.0. These mechanics serve as the first major validation of the plugin system, plus UI polish improvements.

**Prerequisite:** v0.13.0 (Plugin Architecture) must be complete.

---

## Features

| ID | Feature | Complexity | Work Package |
|----|---------|------------|--------------|
| F-090 | Settings Draft State Pattern | Large | WP-A |
| F-092 | Cache Consent Dialogue UX | Small | WP-A |
| F-093 | Mechanic Panel: Hide Active from List | Small | WP-A |
| F-094 | Button Style Consistency Audit | Medium | WP-A |
| F-059 | Competing Mechanic (Top Trumps) | Large | WP-B |
| F-060 | Quiz Mechanic | Medium | WP-C |
| F-058 | Collection Mechanic | Medium | WP-D |

---

## Work Packages

Implementation is structured as **4 parallel work packages**:

| Package | Description | Dependencies | Estimated |
|---------|-------------|--------------|-----------|
| [WP-A](v0.14.0-wp-a-settings-ui.md) | Settings Draft State + UI Polish | None | ~800 lines |
| [WP-B](v0.14.0-wp-b-competing.md) | Competing Mechanic (Top Trumps) | v0.13.0 | ~1200 lines |
| [WP-C](v0.14.0-wp-c-quiz.md) | Quiz Mechanic | v0.13.0 | ~900 lines |
| [WP-D](v0.14.0-wp-d-collection.md) | Collection Mechanic | v0.13.0 | ~600 lines |

### Dependency Graph

```
v0.13.0 (Complete)
     │
     ├─────────────────────────────────────────┐
     │                                         │
     ▼                                         ▼
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  WP-A   │  │  WP-B   │  │  WP-C   │  │  WP-D   │
│Settings │  │Competing│  │  Quiz   │  │Collect. │
│+UI Polish│  │Top Trumps│  │Mechanic │  │Mechanic │
└─────────┘  └─────────┘  └─────────┘  └─────────┘
     │              │            │            │
     └──────────────┴────────────┴────────────┘
                         │
                         ▼
                    v0.14.0 Release
```

All work packages can be implemented **in parallel** by different agents.

---

## Work Package Summaries

### WP-A: Settings Draft State + UI Polish

**Features:** F-090, F-092, F-093, F-094

Implements the draft/commit pattern for settings and fixes UI inconsistencies:

1. **Settings Draft State (F-090)** - Changes only apply on "Accept", not immediately
2. **Cache Consent Dialogue UX (F-092)** - Clearer messaging about browser-local storage
3. **Mechanic Panel Fix (F-093)** - Don't show active mechanic in alternatives list
4. **Button Style Audit (F-094)** - Ensure consistent button hierarchy across all modals

### WP-B: Competing Mechanic (Top Trumps)

**Feature:** F-059

Card-vs-card stat comparison game:
- Player selects a stat from their card
- Compare against CPU opponent
- Higher stat wins both cards
- AI opponent with 3 difficulty levels (simple, medium, hard)
- Requires collection with numeric fields

### WP-C: Quiz Mechanic

**Feature:** F-060

Test knowledge of the collection:
- Multiple question types: image-to-name, name-to-image, fill-the-blank
- Auto-generated questions from card data
- Plausible wrong answers from same collection
- Score tracking with streaks
- Configurable difficulty and question count

### WP-D: Collection Mechanic

**Feature:** F-058

Track which items you own and want:
- Mark cards as owned or wishlisted
- Progress bar showing collection completion
- Quick toggle from card overlay
- Export/import collection state
- Keyboard shortcuts (O for owned, W for wishlist)

---

## Key Patterns

### Mechanic Implementation

All mechanics must:
1. Implement `Mechanic<TSettings>` interface from `src/mechanics/types.ts`
2. Register factory with mechanic registry
3. Provide `manifest.json` with metadata
4. Use Zustand for state management
5. Follow existing Memory/Snap Ranking patterns

### Plugin-Compatible Structure

```
mechanic-name/
├── manifest.json         # Plugin metadata
├── index.tsx             # Entry point, implements Mechanic interface
├── store.ts              # Zustand state management
├── types.ts              # TypeScript types
├── components.tsx        # UI components
├── Settings.tsx          # Mechanic settings panel
└── *.module.css          # Scoped styles
```

---

## Success Criteria

### Per Work Package

Each work package must:
- [x] All features implemented per specification
- [x] All tests passing
- [x] TypeScript strict mode compliant
- [x] British English in all text
- [x] Feature specs updated

### Release Checklist

- [x] All work packages complete
- [x] All mechanics load and play correctly
- [x] Settings draft state working
- [x] UI consistency verified
- [ ] `/sync-docs` passing
- [ ] `/verify-docs` passing
- [ ] `/pii-scan` passing
- [ ] Devlog created
- [ ] Retrospective written

---

## Related Documentation

- [v0.14.0 Milestone](../../../development/roadmap/milestones/v0.14.0.md)
- [v0.13.0 Plugin Architecture](../v0.13.0-wp-a-plugin-core.md)
- [F-059 Competing Mechanic](../../../development/roadmap/features/completed/F-059-competing-mechanic.md)
- [F-060 Quiz Mechanic](../../../development/roadmap/features/completed/F-060-quiz-mechanic.md)
- [F-058 Collection Mechanic](../../../development/roadmap/features/completed/F-058-collection-mechanic.md)
- [F-090 Settings Draft State](../../../development/roadmap/features/completed/F-090-settings-draft-state.md)
