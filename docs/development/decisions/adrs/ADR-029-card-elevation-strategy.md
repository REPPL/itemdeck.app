# ADR-029: Use Tonal Elevation with Shadow Fallback

## Status

Accepted

## Context

itemdeck currently uses shadow-based elevation for cards (F-033), following Material Design 2 conventions. Material Design 3 (2024-2025) introduces a new recommendation: **tonal elevation** as the default, with shadow elevation reserved for elements requiring strong visual separation.

Research findings from [Card UI Design Patterns](../../research/card-ui-design-patterns.md#depth-and-elevation) show:

| Type | Description | Use Case |
|------|-------------|----------|
| **Tonal Elevation** | Adjusts surface colour by blending with a tint; no shadows | Default for most components |
| **Shadow Elevation** | Traditional drop shadows for depth perception | Elements needing strong focus |

Key insight: "Tonal = depth through colour. Shadow = depth through light. Both are valid tools — the key is knowing when to use each."

### Options Evaluated

| Option | Visual Impact | Performance | Accessibility | Complexity |
|--------|---------------|-------------|---------------|------------|
| Shadow Only (current) | Strong depth | Minimal | Depends on contrast | Low |
| Tonal Only (M3 default) | Subtle depth | Minimal | Good | Low |
| Hybrid (recommended) | Flexible depth | Minimal | Best | Medium |

## Decision

Adopt a **hybrid elevation strategy**:

1. **Tonal elevation** as default for cards in grid view
2. **Shadow elevation** for:
   - Cards on hover/focus (interactive feedback)
   - Expanded card modal
   - Card stack view (overlapping elements)
   - Mechanic overlays
3. **Reduced elevation mode** for reduced motion/high contrast preferences

## Consequences

### Positive

- **Modern appearance** - Aligns with Material Design 3 recommendations
- **Improved accessibility** - Tonal elevation doesn't rely solely on shadows
- **Performance** - Fewer shadow calculations in grid view
- **Flexibility** - Both approaches available per context

### Negative

- **Implementation work** - Requires updating elevation CSS variables
- **Theme complexity** - Need tonal variants per theme colour
- **Testing** - More states to verify visually

### Mitigations

- Define tonal elevation scale in CSS custom properties
- Create elevation utility classes for consistent application
- Add visual regression tests for elevation states

## Implementation

### CSS Custom Properties

```css
:root {
  /* Tonal elevation levels (colour overlay) */
  --elevation-tonal-0: transparent;
  --elevation-tonal-1: rgba(var(--colour-primary-rgb), 0.05);
  --elevation-tonal-2: rgba(var(--colour-primary-rgb), 0.08);
  --elevation-tonal-3: rgba(var(--colour-primary-rgb), 0.11);

  /* Shadow elevation levels (for interactive states) */
  --elevation-shadow-0: none;
  --elevation-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.1);
  --elevation-shadow-2: 0 2px 4px rgba(0, 0, 0, 0.15);
  --elevation-shadow-3: 0 4px 8px rgba(0, 0, 0, 0.2);
}
```

### Application

```css
.card {
  /* Default: tonal elevation */
  background-color: var(--colour-surface);
  background-image: linear-gradient(var(--elevation-tonal-1), var(--elevation-tonal-1));
  box-shadow: var(--elevation-shadow-0);
  transition: background-image 200ms, box-shadow 200ms;
}

.card:hover,
.card:focus-visible {
  /* Interactive: add shadow */
  background-image: linear-gradient(var(--elevation-tonal-2), var(--elevation-tonal-2));
  box-shadow: var(--elevation-shadow-2);
}

.card--expanded {
  /* Modal: strong shadow */
  background-image: linear-gradient(var(--elevation-tonal-3), var(--elevation-tonal-3));
  box-shadow: var(--elevation-shadow-3);
}
```

### Reduced Motion / High Contrast

```css
@media (prefers-reduced-motion: reduce), (prefers-contrast: more) {
  .card {
    /* Use borders instead of elevation for separation */
    border: 1px solid var(--colour-border);
    background-image: none;
  }
}
```

## Alternatives Considered

### Shadow Only (status quo)

- Current implementation
- **Rejected**: Material Design 3 recommends tonal as default; shadow-only can be heavy

### Tonal Only (pure M3)

- No shadows at all
- **Rejected**: Interactive states and overlapping elements need shadow for clear separation

### Neumorphism

- Soft shadows on both sides
- **Rejected**: Accessibility concerns; poor contrast in many contexts

---

## Related Documentation

- [Card UI Design Patterns Research](../../research/card-ui-design-patterns.md)
- [F-033: Card Elevation System](../../roadmap/features/completed/F-033-card-elevation-system.md)
- [ADR-005: Theming Approach](./ADR-005-theming-approach.md)
- [v1.0.0 Milestone](../../roadmap/milestones/v1.0.0.md)
- [Material Design 3 - Elevation](https://m3.material.io/styles/elevation/applying-elevation)
