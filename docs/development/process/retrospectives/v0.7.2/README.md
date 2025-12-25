# v0.7.2 Retrospective

**Version:** 0.7.2
**Codename:** Visual Polish & Animation Refinements
**Date:** 2025-12-25

---

## What Went Well

### 1. Incremental Visual Polish Pays Off

Systematically addressing visual inconsistencies (close button sizes, text alignment, border consistency) creates a more polished user experience. Small details matter - users notice when elements don't quite match, even if they can't articulate why.

### 2. Defensive Programming for External Resources

Adding `onError` handlers for external images was a valuable robustness improvement. External URLs can fail for many reasons (hotlink protection, CDN issues, rate limiting), and graceful fallbacks prevent broken UI states.

### 3. Settings System Maturity

The Zustand store with versioned migrations continues to prove its worth. Adding `verdictAnimationStyle` required only:
- Type definition
- Interface extension
- Default values per theme
- Migration function
- Version bump

This pattern is now well-established and low-friction.

### 4. CSS Variable Architecture

Using CSS custom properties (`--card-border-width`) for styling made it trivial to extend border styling to the detail panel. The investment in a CSS variable system continues to provide returns.

### 5. Real-Time User Feedback Loop

Working with immediate visual feedback (screenshots showing issues) enabled rapid iteration. The rating display issue was quickly identified and resolved because the problem was visible.

---

## What Could Improve

### 1. Data Schema Assumptions

The rating display bug stemmed from implicit assumptions about score scales. The code assumed `max: 10` when not specified, but most data used 5-point scales.

**Learning:** Data schemas should be explicit. Either:
- Require `max` field for all ratings
- Document the default clearly
- Validate during data loading

### 2. Unicode Character Testing

The half-star character (⯨) looked correct in the code editor but rendered incorrectly in the actual UI. Font support for obscure Unicode characters varies widely.

**Learning:** Test special characters in the actual rendering context, not just the editor. Consider using SVG or emoji for symbols that need universal support.

### 3. External Image Dependencies

Multiple platform logos failed to load because:
- SVG files from Wikimedia don't always render in `<img>` tags
- Some URLs required PNG thumbnail conversion
- Hotlink protection blocked some requests

**Learning:** External image dependencies are fragile. Consider:
- Bundling critical images locally
- Using a proxy/CDN for external images
- Having robust fallback chains

### 4. Animation Complexity Trade-offs

The flip animation required:
- New setting type
- Store migration
- Conditional animation variants
- CSS for 3D transforms
- Panel perspective changes

This was significant complexity for a visual effect.

**Learning:** Evaluate animation features against their implementation cost. The flip animation is visually interesting but required substantial work.

### 5. Overlay Height Logic

Getting overlay height "just right" (content-driven but bounded) required understanding the interaction between:
- `position: absolute`
- `top`/`bottom` constraints
- `max-height`
- `overflow-y: auto`

**Learning:** CSS layout for overlays has many edge cases. Document the intended behaviour clearly and test with varying content lengths.

---

## Lessons Learned

### 1. Score Normalisation is Non-Trivial

Different rating systems (5-star, 10-point, 100-point) need explicit handling. A "4" could be excellent (4/5), good (4/10), or terrible (4/100). Always store the scale alongside the value.

### 2. Visual Consistency Requires Audit

Similar UI elements (buttons, close icons, badges) tend to drift in styling over time. Periodic visual audits help maintain consistency. Consider creating a component library or design tokens to enforce uniformity.

### 3. Fallback Chains for External Resources

When depending on external resources, implement multi-level fallbacks:
1. Primary source
2. Alternative format/URL
3. Bundled default

This session added error handling but could go further with retry logic or alternative URL generation.

### 4. State Machine Thinking for UI

The image loading logic (`logoUrl provided → try to load → error → fallback`) is effectively a state machine. Making this explicit (perhaps with XState or explicit state types) would make the logic clearer and more testable.

### 5. Typography Baseline Alignment Matters

When mixing font sizes in flex containers, `align-items: baseline` is almost always the right choice for text elements. Default flex alignment (`stretch` or `center`) creates visual misalignment.

---

## Decisions Made

| Decision | Rationale | Alternative Considered |
|----------|-----------|----------------------|
| Round to whole stars | Universal font support | Half-star SVG icons |
| Default max to 5 | Matches most existing data | Require explicit max in schema |
| State-based image fallback | Clean React integration | CSS onerror attribute |
| Flip animation as setting | User preference varies | Hardcoded per theme |
| Border via CSS variable | Consistent with card styling | Separate detail panel border setting |

---

## Metrics

| Metric | Value |
|--------|-------|
| Files modified | 10 |
| Lines changed | ~1,000 |
| New settings added | 1 (verdictAnimationStyle) |
| Store migrations | 1 (v9 → v10) |
| CSS classes added | 2 (.hasDragHandle, .moreOverlayFlip) |
| Bugs fixed | 3 (rating display, text alignment, image fallback) |

---

## Follow-up Items

1. **Image Caching Strategy** - Consider IndexedDB caching for external images to improve reliability and performance

2. **Visual Regression Testing** - Implement screenshot-based tests to catch visual inconsistencies automatically

3. **Rating Schema Documentation** - Document the expected rating format with examples

4. **Design Token Audit** - Review all button/icon sizes for consistency opportunities

5. **Animation Performance Profiling** - Measure flip animation performance on lower-end devices

---

## Related Documentation

- [v0.7.2 Devlog](../../devlogs/v0.7.2/README.md) - Implementation details
- [v0.7.1 Retrospective](../v0.7.1/README.md) - Previous retrospective

---

**Status**: Complete
