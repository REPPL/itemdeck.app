# v0.10.1 Retrospective

## Summary

v0.10.1 was a polish release following the v0.10.0 edit mode implementation. While the scope was small (bug fixes), the session yielded valuable insights about CSS inheritance, event handling in portals, and data model design.

## What Went Well

### 1. Systematic Bug Investigation

The spacebar issue required methodical investigation across multiple files. Rather than guessing, we traced the keyboard event flow from input to parent handlers, identifying the exact point where events were escaping.

**Files checked systematically:**
- `useGlobalKeyboard.ts`
- `App.tsx`
- `CardExpanded.tsx`
- `ImageGallery.tsx`
- `Card.tsx`, `CardCarousel.tsx`, `CardStack.tsx`, `VirtualCardGrid.tsx`
- `useGridNavigation.ts`

### 2. Data Model Simplification

The edit tracking discussion led to a cleaner design. Initial implementation had:
- `_hasEdits: boolean`
- `_editedAt: number`

Simplified to just:
- `_editedAt: number` (presence indicates edits, value is timestamp)

This reduces redundancy and makes the intent clearer.

### 3. CSS Solutions Over JavaScript

The gallery rounded corners issue was solved purely with CSS (`border-radius: inherit`) rather than JavaScript calculations. This is more performant and maintainable.

### 4. Defensive Input Handling

Added input element detection to `ImageGallery.tsx` keyboard handler even though it wasn't the root cause. This prevents future issues if the component is used in different contexts.

## What Could Improve

### 1. Test Drift Detection

The test expecting "retro" as default theme was a pre-existing bug. Tests should be run more frequently during development to catch such drift early.

**Action:** Consider adding CI check that runs tests before any merge.

### 2. Visual Bug Reproduction

The gallery rounded corners issue was difficult to describe in text. Screenshots were essential for understanding the exact visual artefact.

**Learning:** For visual bugs, always request or provide screenshots. Text descriptions often miss subtle details.

### 3. Event Propagation Documentation

The spacebar bug revealed a gap in understanding React Portal event behaviour. While portals render outside the DOM tree, they maintain React's synthetic event bubbling.

**Action:** Document this behaviour in a development guide for future reference.

## Lessons Learned

### 1. CSS `inherit` for Nested Border Radius

When child elements need to respect parent border configurations (especially partial configurations like top-corners-only), use `inherit` rather than duplicating values.

```css
/* Parent */
.container {
  border-radius: 12px 12px 0 0;  /* Top corners only */
}

/* Child - GOOD */
.child {
  border-radius: inherit;
}

/* Child - BAD (overrides parent's specific config) */
.child {
  border-radius: 12px;
}
```

### 2. React Portals and Event Bubbling

Portals create a DOM subtree outside the parent hierarchy, but React's synthetic event system still bubbles events through the React component tree.

```tsx
// Modal rendered via portal - events still bubble to App
<Portal>
  <div onKeyDown={handleKeyDown}>  {/* Need stopPropagation here */}
    <input />
  </div>
</Portal>
```

### 3. Single-Purpose Fields Are Better

Avoid boolean flags when a timestamp or presence check serves the same purpose:

```typescript
// Redundant
{ hasEdits: true, editedAt: 1735234567890 }

// Simpler - editedAt presence implies hasEdits
{ editedAt: 1735234567890 }
```

### 4. Skip Lists for Auto-Discovery

When using field auto-discovery utilities, maintain a comprehensive skip list for internal/display fields. This prevents implementation details from leaking into the UI.

## Metrics

| Metric | Value |
|--------|-------|
| Files Modified | 10 |
| Tests Passing | 450/450 |
| TypeScript Errors | 0 |
| Lint Errors | 0 |
| Lint Warnings | 8 (pre-existing) |
| Bugs Fixed | 5 |
| Data Enrichments | 1 (Hall of Light resources) |

## Decisions Made

1. **Use `border-radius: inherit` for gallery** - Cleanest CSS solution
2. **Stop event propagation in EditForm** - Prevents keyboard conflicts
3. **Single `_editedAt` field** - Simpler than separate boolean + timestamp
4. **Line clamping for verdict text** - CSS-only overflow handling
5. **Defensive input checks** - Added to ImageGallery even if not root cause

## Follow-up Items

- [ ] Document React Portal event behaviour in development guide
- [ ] Consider adding visual regression testing for CSS issues
- [ ] Review other field auto-discovery skips for completeness

---

## Related Documentation

- [v0.10.1 Devlog](../../devlogs/v0.10.1/README.md)
- [v0.10.0 Milestone](../../../../roadmap/milestones/v0.10.md) - Parent milestone
