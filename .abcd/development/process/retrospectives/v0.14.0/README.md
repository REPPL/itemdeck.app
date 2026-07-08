# v0.14.0 Retrospective

## Overview

| Metric | Value |
|--------|-------|
| **Version** | v0.14.0 |
| **Theme** | Advanced Mechanics (Plugin-Based) |
| **Features** | 7 completed |
| **New Files** | ~40 |
| **Modified Files** | ~15 |
| **Tests** | 595 passing |

---

## What Went Well

- **Parallel Work Packages** - The four work packages (WP-A through WP-D) were successfully implemented in parallel by separate agents. This pattern, established in v0.13.0, proved highly effective for maximising throughput on independent features.

- **Plugin Architecture Validation** - All three new mechanics (Competing, Quiz, Collection) followed the plugin-compatible structure from v0.13.0. The manifest.json, store.ts, types.ts pattern made implementation predictable and consistent.

- **Draft State Pattern** - The settings draft/commit pattern was cleanly implemented with proper separation of concerns. The `getEffective()` selector pattern provides a clean API for components to access the right value.

- **Question Generator Design** - The Quiz mechanic's question generators produce genuinely plausible wrong answers by sampling from the same collection, making the game challenging and educational.

- **Per-Source Isolation** - Collection mechanic correctly isolates ownership data per collection source, allowing users to track multiple collections independently.

---

## What Could Improve

- **Pre-existing Lint Errors** - The codebase has accumulated lint warnings (Zod deprecation, plugin security module) that should be addressed in a focused cleanup milestone.

- **Deferred Quiz Features** - Sound effects and share results were deferred. These would enhance the quiz experience but require additional infrastructure (audio system, clipboard API).

- **AI Strategy Testing** - While the AI has three difficulty levels, the hard mode pattern tracking could benefit from more sophisticated testing to verify it's actually learning patterns.

- **Test-Implementation Drift** - Collection component tests were written against a specification that the component didn't fully implement (showUnownedBadge setting). Tests should be written alongside implementation to catch this earlier.

- **Mobile Responsive Design** - Top Trumps overlay required significant post-implementation polish for mobile devices. Future mechanics should include mobile layouts in initial design phase.

---

## Lessons Learned

1. **Parallel Agent Execution Works**

   Running four agents simultaneously on independent work packages is an effective pattern. Clear boundaries (no shared new code between packages) are essential for success.

2. **Draft State Pattern is Reusable**

   The draft/commit pattern implemented for settings could be applied to other areas (card edits, collection configuration) in future milestones.

3. **Mechanic Plugin Structure is Mature**

   With five mechanics now following the same pattern (Memory, Snap Ranking, Competing, Quiz, Collection), the plugin structure has proven robust and maintainable.

4. **Accessibility Exceptions are Valid**

   Excluding Dark Mode and High Contrast from the draft pattern was the right call - these settings genuinely need to apply immediately for users who depend on them.

5. **Post-Implementation Polish is Valuable**

   The revision pass (REV-010, REV-011) caught genuine UX issues: duplicate overlays, card position instability, missing mobile layouts. Treating polish as a distinct phase rather than "done when code works" improves quality.

6. **Difficulty Settings Should Affect Gameplay**

   Adding similar distractors for Expert/Extreme quiz difficulties made those modes genuinely harder. Difficulty should change gameplay mechanics, not just numerical values.

---

## Decisions Made

1. **Draft State Scope**

   **Context:** Not all settings make sense in a draft pattern.

   **Outcome:** Accessibility settings (Dark Mode, High Contrast) apply immediately; all other settings use draft pattern. This balances consistency with accessibility needs.

2. **Question Types for Quiz**

   **Context:** Many possible question formats were considered.

   **Outcome:** Implemented three core types (image-to-name, name-to-image, fill-the-blank) that work with any collection. More specialised types deferred for future.

3. **AI Difficulty Levels**

   **Context:** Competing mechanic needed balanced AI opponents.

   **Outcome:** Three levels: Simple (random), Medium (best stat), Hard (pattern tracking). Each has distinct behaviour that's observable to players.

4. **Collection Per-Source Isolation**

   **Context:** Users may have multiple collections with overlapping card IDs.

   **Outcome:** Ownership data keyed by source ID, ensuring complete isolation between collections.

5. **CPU Card Back in Hard Mode Only**

   **Context:** Top Trumps needed to differentiate difficulty beyond AI strategy.

   **Outcome:** Hard mode hides CPU card values until battle reveal, adding strategic uncertainty. Easy/Medium show CPU cards for accessibility.

6. **Mechanic Display Preferences (F-102)**

   **Context:** Each mechanic may need different display settings (card size, grid visibility).

   **Outcome:** Designed hybrid approach with manifest defaults + optional settings.json/theme.json overrides. Deferred to v0.14.5 for implementation.

---

## Deferred Items

| Item | Reason | Target |
|------|--------|--------|
| Quiz Sound Effects | Requires audio system infrastructure | v0.15.0+ |
| Share Quiz Results | Requires clipboard API integration | v0.15.0+ |
| Lint Cleanup | Pre-existing debt, not v0.14.0 scope | v0.14.5 |
| Mechanic Component Extraction | Technical debt from duplicated UI | v0.14.5 |
| F-102 Mechanic Display Preferences | Design complete, needs implementation | v0.14.5 |

---

## Metrics

| Category | Count |
|----------|-------|
| Lines Added | ~3,800 |
| New Components | ~25 |
| New Tests | ~107 |
| Test Coverage | 595/595 passing |
| Work Packages | 4 (all complete) |
| Post-Polish Fixes | 5 |

---

## Related Documentation

- [v0.14.0 Milestone](../../roadmap/milestones/v0.14.0.md)
- [v0.14.0 Devlog](../../devlogs/v0.14.0/README.md)
- [v0.14.5: Shared Mechanics Components](../../roadmap/milestones/v0.14.5.md)
- [F-102: Mechanic Display Preferences](../../roadmap/features/planned/F-102-mechanic-display-preferences.md)
- [Implementation Prompts](../../../prompts/implementation/v0.14.0/)
