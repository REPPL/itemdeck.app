# State of the Art: Visual Consistency in Web Applications

## Executive Summary

This research document examines current best practices for ensuring visual consistency in web-based applications, focusing on terminology, buttons, icons, and their consistent usage. The findings inform itemdeck's v0.15.0 UX polish efforts.

**Key findings:**
1. Design systems with semantic tokens are the industry standard
2. Button hierarchies (primary/secondary/tertiary) create visual clarity
3. Centralised icon libraries with consistent sizing improve usability
4. Terminology glossaries prevent inconsistent naming

---

## 1. Design System Fundamentals

### 1.1 What Constitutes a Design System

A design system consists of:
- **Design tokens**: Semantic naming for colours, typography, spacing
- **Component library**: Reusable UI components with consistent APIs
- **Patterns**: Documented solutions for common UX problems
- **Guidelines**: Rules for when and how to use elements

### 1.2 Token Architecture

**Best practice:** Three-tier token system

| Tier | Example | Purpose |
|------|---------|---------|
| Primitive | `blue-500` | Raw values |
| Semantic | `--colour-primary` | Meaning-based names |
| Component | `--button-bg` | Component-specific |

**itemdeck current state:** Uses semantic tokens in `theme.css` (good foundation).

### 1.3 CSS Custom Properties Patterns

```css
/* Recommended approach */
:root {
  /* Primitive tokens */
  --blue-500: #3b82f6;

  /* Semantic tokens */
  --colour-primary: var(--blue-500);
  --colour-interactive: var(--colour-primary);

  /* Component tokens */
  --button-primary-bg: var(--colour-interactive);
}
```

---

## 2. Button Component Patterns

### 2.1 Industry Approaches

| Library | Approach | Bundle Size | Customisation |
|---------|----------|-------------|---------------|
| Material UI | Opinionated variants | 30KB+ | Theme system |
| Chakra UI | Style props | 45KB+ | Flexible |
| Radix Primitives | Headless | 5KB | Full control |
| Shadcn/ui | Copy-paste | 0KB base | Tailwind |

**Recommendation for itemdeck:** Radix-style headless approach aligns with existing CSS Modules architecture.

### 2.2 Button Taxonomy

Standard button hierarchy:
1. **Primary**: Main action (one per section)
2. **Secondary**: Alternative actions
3. **Tertiary/Ghost**: Low-emphasis actions
4. **Danger**: Destructive actions

**itemdeck current state:**
- 7+ button implementations
- No unified hierarchy
- Mixed approaches (some use Framer Motion, others CSS-only)

### 2.3 Button API Best Practices

```typescript
// Recommended unified API
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  disabled?: boolean;
}
```

### 2.4 itemdeck Button Analysis

| Button | Location | Style Approach | Animation |
|--------|----------|----------------|-----------|
| RefreshButton | Toolbar | CSS Modules | Spin on hover |
| SettingsButton | Header | CSS Modules | Rotate on hover |
| HelpButton | FAB | Framer Motion | Scale |
| AdminButton | FAB | Framer Motion | Scale |
| MechanicButton | Panel | Unknown | Unknown |

**Recommendation:** Extract common patterns to shared Button component.

---

## 3. Icon Usage Standards

### 3.1 Icon Library Approaches

| Approach | Pros | Cons |
|----------|------|------|
| Centralised SVG library | Tree-shakeable, consistent | Manual management |
| Icon font | Easy CDN | Large bundle, accessibility issues |
| React icon library | Developer experience | Bundle size |
| Inline SVGs | Component-specific | Duplication |

**itemdeck current state:**
- Centralised `Icons.tsx` with 17 icons
- 40+ inline SVGs scattered in components
- Mixed approaches

### 3.2 Icon Sizing Guidelines

| Size | Use Case | Touch Target |
|------|----------|--------------|
| 16px | Inline with text | 24px minimum |
| 20px | Small buttons | 36px minimum |
| 24px | Standard buttons | 44px minimum |
| 32px | Large buttons | 48px minimum |

### 3.3 Icon Accessibility

```tsx
// Decorative icon (hidden from screen readers)
<Icon aria-hidden="true" />

// Informative icon (announced)
<Icon aria-label="Settings" role="img" />

// Icon with adjacent text (hidden)
<Icon aria-hidden="true" /> <span>Settings</span>
```

---

## 4. Terminology Consistency

### 4.1 Audit Methodology

1. **Inventory**: List all user-facing labels
2. **Categorise**: Group by function (actions, navigation, status)
3. **Standardise**: Choose canonical terms
4. **Document**: Create glossary

### 4.2 Common Inconsistency Patterns

| Inconsistent | Standardised |
|--------------|--------------|
| View Mode / Layout / Display | **View Mode** |
| Settings / Preferences / Options | **Settings** |
| Refresh / Reload / Sync | **Refresh** |
| Close / Cancel / Dismiss | Context-dependent |

### 4.3 itemdeck Terminology Audit

Current findings:
- "View Mode" used consistently (good)
- Button labels vary ("Start", "Play", "Begin")
- v0.14.5 standardised mechanic buttons (good)

---

## 5. Design System Tools

### 5.1 Component Documentation

| Tool | Purpose | Effort |
|------|---------|--------|
| Storybook | Component playground | Medium |
| Docz | MDX-based docs | Low |
| Styleguidist | Auto-generated docs | Low |

**itemdeck status:** F-026 (Storybook) deferred to v0.15.5.

### 5.2 Visual Regression Testing

- Chromatic (Storybook integration)
- Percy (CI/CD snapshots)
- BackstopJS (Self-hosted)

---

## 6. Recommendations for itemdeck

### 6.1 Immediate Actions (v0.15.0)

1. **Create shared overlay hook**: F-111 standardises overlay behaviour
2. **Centralise keyboard config**: F-110 creates single source of truth
3. **Document token usage**: Reference existing `theme.css` tokens

### 6.2 Medium-term Actions (v0.15.5)

1. **Create Button component**: Consolidate 7 implementations
2. **Implement Storybook**: F-026 for component documentation
3. **Icon consolidation**: Move inline SVGs to Icons.tsx

### 6.3 Token Documentation

Create `docs/reference/design-tokens.md`:
- Typography scale with usage examples
- Spacing system with grid basis
- Colour palette with accessibility notes
- Animation tokens with reduced motion guidance

---

## 7. References

- [Material Design 3](https://m3.material.io/)
- [Chakra UI Documentation](https://chakra-ui.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS](https://tailwindcss.com/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

---

## Related Documentation

- [v0.15.0 Milestone](../roadmap/milestones/v0.15.0.md) - UX polish and overlay consistency work
- [F-111: Overlay Consistency](../roadmap/features/planned/F-111-overlay-consistency.md) - Standardised overlay behaviour
- [F-110: Keyboard Shortcuts](../roadmap/features/planned/F-110-keyboard-shortcuts-review.md) - Keyboard configuration
- [R-011: Button Component Strategy](./R-011-button-component-strategy.md) - Button consolidation research
- [ADR-010: Component Patterns](../decisions/adrs/ADR-010-component-patterns.md) - Component architecture
