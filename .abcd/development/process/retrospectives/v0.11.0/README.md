# v0.11.0 Retrospective

## Overview

**Version**: v0.11.0 - Mechanics Foundation & Discovery
**Date**: 27 December 2025
**Theme**: Gaming mechanics plugin architecture and card discovery features

---

## What Went Well

### 1. Plugin Architecture Design

The mechanic plugin architecture is clean and extensible:
- Central registry with lazy loading works exactly as designed
- Mutual exclusivity prevents conflicts between mechanics
- Overlay system allows mechanics to inject UI without modifying core components
- Adding new mechanics requires only implementing the `Mechanic` interface

### 2. Memory Game as Proof-of-Concept

The Memory Game successfully validates the architecture:
- Complete gameplay loop implemented
- Settings integration (difficulty, pair count)
- Visual feedback for all states
- Smooth animations

### 3. Discovery Features

Search, filtering, and grouping significantly improve UX:
- Debounced search is responsive yet performant
- Keyboard shortcut (`/`) feels natural
- Grouping with collapsible sections organises large collections well

### 4. Bug Detection Through Testing

Manual testing on iPad Safari caught the button interaction bug early, before it could frustrate users.

---

## What Could Improve

### 1. Zustand Selector Pattern

The Zustand selector bug (calling methods instead of accessing state) cost significant debugging time.

**Action**: Document this pattern in a coding standards guide.

### 2. CSS Variable Consistency

Overlay transparency required updating multiple CSS files because they used hardcoded values.

**Action**: Audit all CSS for hardcoded values that should use variables.

### 3. Feature Scope Management

Two features (F-037, F-067) were deferred. The milestone was ambitious.

**Action**: Plan milestones with 20% buffer for unexpected complexity.

### 4. Cross-Browser Testing

iPad Safari issues weren't caught until late in development.

**Action**: Test on mobile devices earlier in the cycle.

---

## Lessons Learned

### Technical Lessons

1. **Zustand selectors must access state properties, not call methods**
   - Methods don't create subscriptions
   - Always select raw state and derive values in component

2. **CSS variables need fallback values**
   - Don't assume variables are set before component renders
   - Always provide: `var(--my-var, fallback-value)`

3. **Touch events differ from click events**
   - Button elements on iOS capture touches from children
   - Use non-semantic elements with handlers when nesting is needed

4. **Plugin architecture patterns**
   - Lazy loading with dynamic imports keeps bundle small
   - Factory pattern enables async initialisation
   - Context providers bridge plugin state with React

### Process Lessons

1. **Test on multiple devices early**
   - Mobile quirks are easier to fix when discovered early

2. **Document unusual patterns**
   - The Zustand selector issue should be in project docs

3. **Keep milestones focused**
   - Seven features is near the upper limit for one milestone

---

## Decisions Made

### Architecture Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Central MechanicRegistry | Single point of control for activation | Works well |
| Isolated Zustand stores per mechanic | Prevents cross-contamination | Clean separation |
| Overlay system for mechanic UI | Avoids modifying core components | Extensible |
| Separate MechanicPanel from Settings | Emphasises behaviour change | Good UX signal |

### Implementation Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Debounce search at 300ms | Balance responsiveness and performance | Natural feel |
| Group by field path | Leverage existing fieldPathResolver | Consistent |
| Three view modes (grid/list/compact) | Cover common use cases | Sufficient options |

---

## Metrics

### Features

| Metric | Value |
|--------|-------|
| Features planned | 9 |
| Features implemented | 7 |
| Features deferred | 2 |
| Completion rate | 78% |

### Code

| Metric | Value |
|--------|-------|
| Files created | ~35 |
| Files modified | ~15 |
| New components | 10 |
| Lines of TypeScript | ~2000 (estimated) |

### Bugs

| Metric | Value |
|--------|-------|
| Bugs discovered | 4 |
| Bugs fixed | 4 |
| Bugs outstanding | 0 |

### Quality

| Metric | Value |
|--------|-------|
| TypeScript errors | 0 |
| ESLint warnings | 0 |
| Manual tests passed | 14/14 |

---

## Action Items

### Immediate (v0.12.0)

- [ ] Implement F-037 (Card Sorting Expanded)
- [ ] Implement F-067 (Statistics Dashboard)
- [ ] Audit CSS for hardcoded values that should be variables

### Near Term

- [ ] Add Zustand pattern guidance to coding standards
- [ ] Create cross-browser testing checklist
- [ ] Consider automated mobile testing

### Long Term

- [ ] Additional mechanic implementations (Quiz, Flashcard)
- [ ] Theme creation guide for community themes
- [ ] Performance profiling for large collections

---

## Deferred Features

The following features were originally planned for v0.11.0 but deferred:

| Feature | Reason | New Target |
|---------|--------|------------|
| F-037: Card Sorting (Expanded) | Scope reduction | v0.12.0 |
| F-067: Statistics Dashboard | Scope reduction | v0.12.0 |

---

## Related Documentation

- [v0.11.0 Milestone](../../roadmap/milestones/v0.11.0.md)
- [v0.11.0 Devlog](../devlogs/v0.11.0/README.md)
- [v0.11.0 Implementation Prompt](../../../prompts/implementation/v0.11.0-full/README.md)
