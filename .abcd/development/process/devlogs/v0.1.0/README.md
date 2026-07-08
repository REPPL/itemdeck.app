# v0.1.0 Development Log - Animation Foundation

## Overview

This milestone established the core card interaction system for Itemdeck, implementing five features that provide the foundation for a "memory game" style card interface.

## Implementation Narrative

### Phase 1: Foundation Setup

The milestone began with setting up the testing infrastructure and core dependencies:

- **Vitest** configured with jsdom for component testing
- **Framer Motion** installed for animations
- **Zod v4** for schema validation

Test setup established early to ensure TDD approach throughout.

### Phase 2: Configuration System (F-002)

Implemented a cascade configuration system using Zod v4 schemas:

**Key Files Created:**
- `src/schemas/config.schema.ts` - Zod schemas for card, animation, and behaviour config
- `src/context/ConfigContext.tsx` - React context with localStorage persistence
- `src/hooks/useConfig.ts` - Hook for accessing configuration
- `src/utils/deepMerge.ts` - Deep merge utility for config sources

**Technical Highlights:**
- Used `DeepPartialAppConfig` interface to handle nested partial updates
- Changed from deprecated `.format()` to `z.treeifyError()` for Zod v4 compatibility
- Config persists to localStorage with validation on load

### Phase 3: Card Flip Animation (F-001)

Refactored the Card component into a compound component pattern:

**Component Architecture:**
```
Card (motion.article with whileHover/whileTap)
├── CardInner (3D transform container)
│   ├── CardBack (logo + year)
│   └── CardFront (image + title overlay)
```

**Key Implementation Details:**
- CSS 3D transforms: `perspective`, `transform-style: preserve-3d`, `backface-visibility`
- Framer Motion for `whileHover` (scale 1.02) and `whileTap` (scale 0.98)
- Flip state managed in CardGrid via `Set<string>` for flipped card IDs
- `maxVisibleCards` enforcement - auto-unflips oldest card when limit exceeded

### Phase 4: Image Fallback System (F-003)

Created a multi-tier fallback system for card images:

**Fallback Chain:**
1. Primary image URL
2. SVG placeholder with generated initials

**Components Created:**
- `ImageWithFallback` - Main wrapper with state machine
- `SVGPlaceholder` - Generates initials from title with deterministic HSL colour
- `ImageSkeleton` - Shimmer loading animation

The `generateColour()` function creates consistent colours for the same title using a hash-based hue calculation.

### Phase 5: Keyboard Navigation (F-004)

Implemented roving tabindex pattern for grid navigation:

**Hook: `useGridNavigation`**
- Arrow keys for grid navigation (respects column count)
- Home/End for first/last card
- Enter/Space to flip focused card
- Returns `getTabIndex()` for roving tabindex pattern

**Accessibility Features:**
- `role="button"` and `aria-pressed` on cards
- `aria-label` with flip state information
- Focus-visible styles with high contrast mode support

### Phase 6: Reduced Motion Support (F-005)

Implemented system motion preference detection:

**Components:**
- `useReducedMotion` hook - Detects `prefers-reduced-motion` media query
- `MotionProvider` - Wraps Framer Motion's `MotionConfig`

When reduced motion is preferred, Framer Motion animations are disabled system-wide.

## Challenges Encountered

### Zod v4 Compatibility

Zod v4 introduced breaking changes:
- `.default({})` no longer works for nested objects
- `.format()` deprecated in favour of `z.treeifyError()`

**Solution:** Created explicit default constants and updated error formatting.

### TypeScript Partial Types

`Partial<AppConfig>` didn't work correctly for nested updates.

**Solution:** Created `DeepPartialAppConfig` interface with explicit nested partials.

### Template Literal Strictness

ESLint flagged `String(undefined)` in template literals.

**Solution:** Changed to `.join(" ")` pattern for className concatenation.

## Code Highlights

### Flip State Management

```typescript
const handleFlip = (cardId: string) => {
  setFlippedCardIds((prev) => {
    const next = new Set(prev);
    if (next.has(cardId)) {
      next.delete(cardId);
    } else {
      next.add(cardId);
      // Enforce maxVisibleCards
      while (next.size > config.behaviour.maxVisibleCards) {
        const oldest = next.values().next().value;
        if (oldest !== undefined) {
          next.delete(oldest);
        }
      }
    }
    return next;
  });
};
```

### Deterministic Colour Generation

```typescript
function generateColour(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${String(hue)}, 45%, 35%)`;
}
```

## Files Summary

### New Files (18)

| Directory | Files |
|-----------|-------|
| `src/schemas/` | `config.schema.ts` |
| `src/context/` | `ConfigContext.tsx`, `MotionContext.tsx` |
| `src/hooks/` | `useConfig.ts`, `useGridNavigation.ts`, `useReducedMotion.ts` |
| `src/utils/` | `deepMerge.ts` |
| `src/components/Card/` | `CardBack.tsx`, `CardFront.tsx`, `CardInner.tsx` |
| `src/components/ImageWithFallback/` | `ImageWithFallback.tsx`, `SVGPlaceholder.tsx`, `ImageSkeleton.tsx`, `ImageWithFallback.module.css`, `index.ts` |
| `tests/` | `config.test.ts`, `Card.test.tsx`, `ImageWithFallback.test.tsx`, `useGridNavigation.test.ts`, `useReducedMotion.test.ts` |

### Modified Files

- `src/components/Card/Card.tsx` - Refactored to compound component with motion
- `src/components/Card/Card.module.css` - Added 3D flip styles
- `src/components/CardGrid/CardGrid.tsx` - Added flip state and keyboard nav
- `src/App.tsx` - Wrapped with MotionProvider
- `package.json` - Added dependencies

## Test Summary

| Suite | Tests |
|-------|-------|
| Configuration | 28 |
| Card | 15 |
| ImageWithFallback | 21 |
| useGridNavigation | 21 |
| useReducedMotion | 5 |
| **Total** | **90** |

All 90 tests passing.

## Build Output

```
dist/assets/index-[hash].js    333.06 kB (gzip: 103.72 kB)
dist/assets/index-[hash].css     6.65 kB (gzip: 2.15 kB)
```

---

## Related Documentation

- [v0.1.0 Milestone](../../../roadmap/milestones/v0.1.0.md)
- [v0.1.0 Retrospective](../../retrospectives/v0.1.0/README.md)
- [Features Index](../../../roadmap/features/README.md)
