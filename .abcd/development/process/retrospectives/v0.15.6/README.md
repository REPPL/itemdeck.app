# v0.15.6 Retrospective

## Overview

| Metric | Value |
|--------|-------|
| **Version** | v0.15.6 |
| **Theme** | Settings Consistency & Bug Fixes |
| **Bugs Fixed** | 5 |
| **Modified Files** | 8 |
| **Tests** | 722 passing |

---

## What Went Well

- **Quick Root Cause Identification** - The draft pattern inconsistency was identified quickly by comparing working components (QuickSettings) with broken ones (AppearanceSettingsTabs)

- **Systematic Migration** - All affected components were migrated to the correct pattern in a single pass, preventing partial fixes

- **Minimal Footprint** - Fixes were targeted and surgical, modifying only what was necessary without introducing new dependencies or architectural changes

- **User-Reported Bug Triage** - Real user testing caught issues that unit tests couldn't (Settings UI update issue, card flip on drag)

- **Documentation Trail** - The implementation prompt was created before coding and updated with additional fixes discovered during implementation

---

## What Could Improve

- **Draft Pattern Enforcement** - No automated check ensures new settings components use the draft pattern correctly. A lint rule or code review checklist would prevent this regression.

- **Settings Panel Tests** - The Settings dialogue lacks integration tests that verify the full Accept/Cancel flow. Such tests would have caught the draft pattern inconsistency.

- **Zustand Subscription Documentation** - The `getEffective()` + `_draft` subscription pattern is non-obvious. Internal documentation should explain when and why this pattern is needed.

- **Regression Prevention** - The card flip on drag bug was a subtle interaction between the flip state effect and the drag-drop library. Edge case testing for state interactions would help.

---

## Lessons Learned

1. **Stable Function References Don't Create Subscriptions**

   When using Zustand, subscribing to a function like `getEffective` only re-renders if the function reference changes. If the function uses `get()` internally, state changes won't trigger re-renders. Explicit subscription to the underlying state (`_draft`) is required.

2. **Order Matters in Set Comparisons**

   Using `array.join(',')` for identity comparison is order-sensitive. When order should be ignored (e.g., detecting set membership changes vs. reordering), sort the array first.

3. **Orphaned Code is Technical Debt**

   The `showDragIcon` setting was implemented in the store and UI but never connected to the component that should consume it. This created user confusion ("the toggle does nothing"). Code reviews should verify the full data flow from setting to consumer.

4. **Draft Patterns Require Consistent Adoption**

   Mixing direct setters with draft patterns in the same dialogue creates subtle bugs. The pattern must be applied uniformly across all settings components.

5. **User Testing Catches Integration Bugs**

   Automated tests verified individual components worked, but user testing revealed that the integration between Settings dialogue and the main app had issues. Both testing approaches are necessary.

---

## Decisions Made

1. **Subscription Over Selector Composition**

   **Context:** Components needed to re-render when draft changes

   **Options:**
   - Create a custom `useEffectiveSetting(key)` hook that subscribes to both the key and `_draft`
   - Add explicit `_draft` subscription in each component

   **Outcome:** Chose explicit subscription to keep the pattern visible and avoid introducing new abstractions. The comment explains why the subscription exists.

2. **Sorted ID Comparison**

   **Context:** Need to detect card set changes without triggering on reorder

   **Options:**
   - Use a `Set` and compare size + membership
   - Sort IDs and compare as string
   - Track a separate "card set version" counter

   **Outcome:** Chose sorted ID comparison for simplicity and readability. No need to track additional state.

3. **Remove Behaviour Sub-tab**

   **Context:** After removing duplicates, the Behaviour tab only contained settings available elsewhere

   **Options:**
   - Keep empty tab with "Settings moved to..." message
   - Remove tab entirely

   **Outcome:** Removed tab entirely to avoid confusion. Users don't need to see an empty tab.

4. **Conditional Drag Settings UI**

   **Context:** Show Drag Icon and Drag Face are only relevant when Drag Mode is enabled

   **Options:**
   - Show all settings always (with disabled state)
   - Show conditionally based on Drag Mode

   **Outcome:** Chose conditional rendering to reduce visual complexity. Settings appear when relevant.

---

## Deferred Items

| Item | Reason | Target |
|------|--------|--------|
| Custom `useEffectiveSetting` hook | Over-engineering for current scope | If pattern recurs |
| Settings Panel integration tests | Time constraints | v0.16.0 |
| ESLint rule for draft pattern | Requires custom plugin | Future |
| Sorting preview during editing | Architectural change | Future |

---

## Metrics

### Code Changes

| Metric | Value |
|--------|-------|
| Files Modified | 8 |
| Lines Added | ~80 |
| Lines Removed | ~120 |
| Net Change | ~-40 (simplification) |

### Test Results

| Suite | Count |
|-------|-------|
| Unit Tests | 722 |
| New Tests | 0 (bug fixes) |
| Manual Tests | 5 scenarios |
| Build | Pass |

---

## Technical Debt Addressed

- **Orphaned Setting** - `showDragIcon` now connected to UI
- **Draft Pattern Inconsistency** - All settings components now use consistent pattern
- **Duplicate Settings** - Removed 2 duplicate settings and 1 empty sub-tab

---

## Technical Debt Introduced

- **Explicit `_draft` Subscription** - Each settings component now has a "magic" line that subscribes to `_draft` for side effects. This pattern is non-obvious and could be forgotten in future components.

---

## Related Documentation

- [v0.15.6 Devlog](../../devlogs/v0.15.6/README.md)
- [v0.15.6 Implementation Prompt](../../../prompts/implementation/v0.15.6/README.md)
- [F-090 Draft State Pattern](../../../roadmap/features/completed/F-090-settings-draft-state.md)
