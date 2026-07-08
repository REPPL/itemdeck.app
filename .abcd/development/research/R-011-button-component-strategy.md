# R-011: Button Component Strategy

## Executive Summary

This research investigates the consolidation of itemdeck's 7+ button implementations into a unified component strategy.

**Recommendation:** Create a unified Button component with variants, following the existing compound component pattern (ADR-010).

---

## Current State Analysis

### Button Implementations

| Button | File | Style | Animation | Props |
|--------|------|-------|-----------|-------|
| RefreshButton | `RefreshButton.tsx` | CSS Modules | Spin on loading | size, loading |
| SettingsButton | `SettingsButton.tsx` | CSS Modules | Rotate hover | onClick |
| HelpButton | `HelpButton.tsx` | CSS Modules + Framer | Scale | - |
| AdminButton | `AdminButton.tsx` | CSS Modules + Framer | Scale | position |
| MechanicButton | `MechanicButton.tsx` | CSS Modules | Unknown | - |
| SearchButton | `SearchButton.tsx` | CSS Modules | Unknown | - |
| MenuButton | `MenuButton.tsx` | CSS Modules | Unknown | - |

### CSS Differences

- **Sizing**: Some use fixed sizes, others responsive
- **Border radius**: Varies (full, md, lg)
- **Padding**: Inconsistent spacing values
- **Focus states**: Different implementations

### Animation Approaches

1. **CSS-only**: RefreshButton, SettingsButton
2. **Framer Motion**: HelpButton, AdminButton
3. **None**: Some buttons lack hover animations

---

## Consolidation Options

### Option 1: Single Button Component with Variants

```typescript
<Button variant="primary" size="md" icon={<SettingsIcon />}>
  Settings
</Button>

<Button variant="ghost" size="sm" loading>
  Refresh
</Button>
```

**Pros:**
- Unified API
- Consistent styling
- Easy to maintain

**Cons:**
- May not cover all edge cases
- Could become bloated

### Option 2: Base Button + Specialised Wrappers

```typescript
// Base
<Button.Root variant="primary">
  <Button.Icon><SettingsIcon /></Button.Icon>
  <Button.Label>Settings</Button.Label>
</Button.Root>

// Wrapper
<RefreshButton loading onRefresh={fn} />
```

**Pros:**
- Flexibility for complex buttons
- Keeps simple API for common cases
- Follows compound component pattern (ADR-010)

**Cons:**
- More components to manage
- Learning curve

### Option 3: Headless Button Hook

```typescript
const { buttonProps, labelProps, iconProps } = useButton({
  variant: 'primary',
  loading: true,
});

<button {...buttonProps}>
  <span {...iconProps}><Icon /></span>
  <span {...labelProps}>Label</span>
</button>
```

**Pros:**
- Maximum flexibility
- Style-agnostic

**Cons:**
- More verbose usage
- Requires styling for each use

---

## Recommendation

**Option 2: Base Button + Specialised Wrappers**

Rationale:
1. Aligns with ADR-010 compound component pattern
2. Provides unified base with specialisation flexibility
3. Maintains backwards compatibility
4. Supports both simple and complex use cases

---

## Proposed Button API

### Base Button

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}
```

### Icon Button (FAB variant)

```typescript
interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  'aria-label': string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

### Specialised Buttons

Keep existing wrappers but use base component internally:

```typescript
// RefreshButton wraps Button
export function RefreshButton({ loading, onRefresh }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={loading}
      onClick={onRefresh}
      icon={<RefreshIcon />}
    >
      Refresh
    </Button>
  );
}
```

---

## Migration Path

### Phase 1: Create Base Component (v0.15.5)

1. Create `src/components/Button/Button.tsx`
2. Create `src/components/Button/Button.module.css`
3. Define variants and sizes
4. Add to Storybook (F-026)

### Phase 2: Migrate Wrappers (v0.16.0)

1. Update RefreshButton to use base
2. Update SettingsButton to use base
3. Update HelpButton to use base
4. Update AdminButton to use base

### Phase 3: Deprecate Old Implementations (v0.17.0)

1. Remove duplicate styles
2. Consolidate animation approach
3. Update documentation

---

## Implementation Timeline

| Phase | Target | Tasks |
|-------|--------|-------|
| 1 | v0.15.5 | Create base Button, add to Storybook |
| 2 | v0.16.0 | Migrate specialised buttons |
| 3 | v0.17.0 | Cleanup and documentation |

---

## Related Documentation

- [v0.15.0 Milestone](../roadmap/milestones/v0.15.0.md) - UX polish milestone related to button strategy
- [State-of-the-Art Visual Consistency](./state-of-the-art-visual-consistency.md) - Visual consistency research
- [ADR-010: Component Patterns](../decisions/adrs/ADR-010-component-patterns.md) - Component architecture decisions
- [F-026: Component Storybook](../roadmap/features/planned/F-026-component-storybook.md) - Component documentation
