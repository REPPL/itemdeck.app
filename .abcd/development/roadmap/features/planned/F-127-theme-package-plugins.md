# F-127: Theme Package Plugins

## Problem Statement

Themes are currently built into the application:

1. **No custom themes** - Users cannot install additional themes
2. **No theme sharing** - Cannot share themes with others
3. **Limited customisation** - Only preset themes available
4. **No theme variants** - Cannot have light/dark variants of same theme

## Design Approach

Package themes as distributable plugins:

- Theme plugins contain CSS, fonts, and preview images
- Support light/dark mode variants
- Include preview thumbnails for theme picker
- Allow themes to extend base themes

### Theme Package Structure

```
my-theme/
├── manifest.json           # Plugin manifest
├── index.js                # Theme registration
├── theme.css               # CSS variables and overrides
├── preview.png             # Theme picker preview
├── fonts/
│   └── custom-font.woff2   # Custom fonts (optional)
└── images/
    └── pattern.svg         # Background patterns (optional)
```

### Theme CSS Structure

```css
/* theme.css */
:root[data-theme="my-theme"] {
  /* Colour palette */
  --colour-primary: #6366f1;
  --colour-secondary: #8b5cf6;
  --colour-background: #0f172a;
  --colour-surface: #1e293b;
  --colour-text: #f1f5f9;

  /* Card styling */
  --card-border-radius: 12px;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  /* Typography */
  --font-family: 'Custom Font', sans-serif;

  /* Animations */
  --animation-duration: 200ms;
}

/* Dark mode variant */
:root[data-theme="my-theme"][data-mode="dark"] {
  --colour-background: #030712;
}

/* Light mode variant */
:root[data-theme="my-theme"][data-mode="light"] {
  --colour-background: #f8fafc;
  --colour-text: #0f172a;
}
```

### Theme Registration

```typescript
// index.js
export default {
  id: 'my-theme',
  name: 'My Custom Theme',
  modes: ['light', 'dark'],
  defaultMode: 'dark',
  extends: 'minimal', // Optional base theme

  async activate(api) {
    await api.theme.loadCSS('./theme.css');
    await api.theme.loadFont('Custom Font', './fonts/custom-font.woff2');
  },

  async deactivate(api) {
    api.theme.unloadCSS('./theme.css');
    api.theme.unloadFont('Custom Font');
  }
};
```

## Implementation Tasks

### Phase 1: Theme Plugin Interface

- [ ] Create `src/plugins/themes/types.ts`
- [ ] Define theme plugin interface
- [ ] Define CSS variable contract
- [ ] Create theme validation schema

### Phase 2: Theme Loader

- [ ] Create `src/plugins/themes/loader.ts`
- [ ] Implement CSS loading and scoping
- [ ] Implement font loading
- [ ] Handle theme inheritance (extends)

### Phase 3: Convert Built-in Themes

- [ ] Convert Minimal theme to plugin format
- [ ] Convert Retro theme to plugin format
- [ ] Convert Modern theme to plugin format
- [ ] Create High Contrast theme plugin

### Phase 4: Theme Picker Integration

- [ ] Update theme picker to show plugin themes
- [ ] Display theme preview images
- [ ] Show mode variants (light/dark)
- [ ] Indicate plugin source (built-in/curated/community)

### Phase 5: Theme Export

- [ ] Export current theme customisations
- [ ] Create shareable theme package
- [ ] Import theme packages

## Success Criteria

- [ ] Built-in themes converted to plugin format
- [ ] Custom themes loadable from URL
- [ ] Theme picker shows all available themes
- [ ] CSS properly scoped (no leakage)
- [ ] Font loading works correctly
- [ ] Light/dark mode variants supported

## Dependencies

- **F-122**: Plugin Manifest Schema - Theme manifest structure
- **F-123**: Plugin Loader & Registry - Theme loading
- **F-124**: Plugin Security Sandbox - CSS isolation

## Complexity

**Medium** - CSS scoping and font loading require careful implementation.

## Estimated Effort

**8-12 hours**

---

## Related Documentation

- [Theme Export Feature](../completed/F-082-theme-export.md)
- [ADR-005: Theming Approach](../../decisions/adrs/ADR-005-theming-approach.md)
- [F-122: Plugin Manifest Schema](./F-122-plugin-manifest-schema.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
