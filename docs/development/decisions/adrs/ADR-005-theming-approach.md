# ADR-005: Use CSS Custom Properties for Theming

## Status

Accepted

## Context

Itemdeck needs a theming system for:
- Light/dark mode switching
- System preference detection (`prefers-color-scheme`)
- User preference override
- Potential custom accent colours

We evaluated several theming approaches:

| Approach | Bundle Impact | Dynamic | Type Safety |
|----------|---------------|---------|-------------|
| CSS Custom Properties | 0KB | Yes | CSS-level |
| styled-components Theme | 15KB | Yes | TypeScript |
| Tailwind CSS | JIT | Build-time | Class-based |
| CSS-in-JS (Emotion) | 10KB | Yes | TypeScript |

Key requirements:
1. Zero JavaScript overhead for static theming
2. Runtime theme switching
3. Respect system preferences
4. Support future customisation

## Decision

Use **CSS custom properties** (CSS variables) for theming.

## Consequences

### Positive

- **Zero JS overhead** - Theme values in CSS, no runtime computation
- **Native browser support** - Works without JavaScript
- **Simple switching** - `data-theme` attribute on root element
- **Media query support** - `prefers-color-scheme` integration
- **No build step** - Changes visible immediately
- **Composable** - Variables can reference other variables

### Negative

- **No TypeScript** - CSS variables aren't type-checked
- **Limited transforms** - Can't compute values (use `calc()`)
- **Browser DevTools** - Slightly harder to inspect than component styles

### Mitigations

- Define design tokens in TypeScript for documentation
- Create utility functions for theme values in JS
- Use CSS-in-JS for complex dynamic styles if needed

## Theme Structure

```css
:root {
  --colour-background: #ffffff;
  --colour-primary: #6366f1;
  --colour-text-primary: #1e293b;
}

[data-theme="dark"] {
  --colour-background: #0f172a;
  --colour-primary: #818cf8;
  --colour-text-primary: #f1f5f9;
}

@media (prefers-color-scheme: dark) {
  [data-theme="auto"] {
    --colour-background: #0f172a;
    /* ... dark values */
  }
}
```

## Alternatives Considered

### styled-components Theme
- TypeScript support
- **Rejected**: Bundle overhead, CSS variables sufficient

### Tailwind CSS
- Utility classes
- **Rejected**: Different paradigm from CSS Modules

### CSS-in-JS (Emotion)
- Dynamic theming
- **Rejected**: Additional runtime overhead

---

## Related Documentation

- [Customisation Options Research](../../../research/customisation-options.md)
- [F-010: Theme System](../../roadmap/features/planned/F-010-theme-system.md)
