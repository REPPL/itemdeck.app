# v0.1.0 Retrospective - Animation Foundation

## Overview

This retrospective reflects on the v0.1.0 milestone which established the core card interaction system with 5 features: Card Flip Animation, Configuration System, Image Fallback, Keyboard Navigation, and Reduced Motion Support.

---

## What Went Well

### 1. Test-Driven Development

Establishing the test infrastructure early (Vitest + Testing Library) enabled confident refactoring throughout the milestone. Every feature was developed with tests, resulting in 90 tests covering all functionality.

### 2. Compound Component Pattern

The Card compound component architecture (`Card`, `Card.Back`, `Card.Front`, `Card.Inner`) provides excellent flexibility for future customisation while keeping the API clean.

### 3. Zod v4 Schema Validation

Using Zod for configuration validation provided:
- Runtime type safety
- Automatic TypeScript inference
- Graceful fallback to defaults
- Clear error messages for debugging

### 4. Accessibility First

Building keyboard navigation and reduced motion support into the foundation means accessibility is inherent, not bolted on. The roving tabindex pattern and Framer Motion integration work seamlessly.

### 5. Feature Documentation

Moving completed features to `completed/` directory with updated checkboxes provides a clear audit trail of what was implemented.

---

## What Could Improve

### 1. Documentation Drift

Feature specs drifted from implementation during development. The `/sync-docs` command was essential for catching:
- Features still in `planned/` when already complete
- Implementation tasks/success criteria not updated
- Missing implementation details (e.g., `whileHover`/`whileTap`)

**Improvement:** Update feature specs immediately after completing each feature, not at milestone end.

### 2. Zod v4 Migration Friction

Several Zod v3 patterns broke in v4:
- `.default({})` for nested objects
- `.format()` for error formatting

**Improvement:** Check migration guides before adopting major version upgrades.

### 3. Type Inference Complexity

The `DeepPartialAppConfig` interface was needed because TypeScript's `Partial<>` doesn't recurse. This added complexity to the config system.

**Improvement:** Consider using a library like `type-fest` for utility types.

---

## Lessons Learned

### 1. CSS 3D Transforms Require Browser Prefixes

`-webkit-backface-visibility: hidden` is still needed for Safari support alongside the unprefixed version.

### 2. Framer Motion's MotionConfig is Powerful

Wrapping the app with `MotionConfig reducedMotion="always"` instantly disables all Framer animations system-wide. This is much cleaner than per-component logic.

### 3. Set Iteration Order is Insertion Order

Using `Set<string>` for flipped card IDs means `set.values().next().value` reliably returns the oldest entry - perfect for the "unflip oldest" behaviour.

### 4. Template Literal Strictness Matters

ESLint's strict template literal rules caught potential `undefined` issues early. Using array `.join(" ")` for class names is safer than template literals.

---

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Compound component for Card | Flexibility for future card variants |
| Zod v4 over v3 | Latest features, better tree-shaking |
| localStorage for config | Simple persistence without backend |
| Set for flip state | O(1) lookup, maintains insertion order |
| MotionProvider wrapper | Centralised motion preference handling |

---

## Metrics

| Metric | Value |
|--------|-------|
| Features completed | 5/5 |
| Tests written | 90 |
| Tests passing | 90 (100%) |
| New files | 18 |
| Modified files | 6 |
| Bundle size (JS) | 333 KB |
| Bundle size (CSS) | 7 KB |

---

## Recommendations for v0.2.0

1. **Update docs alongside code** - Run `/sync-docs` during development, not just at end
2. **Consider integration tests** - Unit tests are comprehensive; E2E tests would add confidence
3. **Bundle size monitoring** - 333 KB is reasonable now, but worth watching as features grow
4. **Type utility library** - Evaluate `type-fest` for complex TypeScript patterns

---

## Related Documentation

- [v0.1.0 Milestone](../../../roadmap/milestones/v0.1.0.md)
- [v0.1.0 Devlog](../../devlogs/v0.1.0/README.md)
- [Features Index](../../../roadmap/features/README.md)
