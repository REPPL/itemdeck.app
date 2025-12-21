# F-010: Theme System

## Problem Statement

Users have different visual preferences and accessibility needs. Currently:

1. No dark/light mode switching
2. Hard-coded colours throughout the codebase
3. System preference (prefers-color-scheme) not respected
4. No way to customise appearance

## Design Approach

Implement a **CSS custom properties-based theming** system with three modes: light, dark, and auto (system).

For complete implementation patterns including design token interfaces, CSS custom properties, ThemeContext, and ThemeToggle component, see:

- [Customisation Options Research](../../../../research/customisation-options.md) - Canonical source for design tokens and theme definitions
- [ADR-005: CSS Custom Properties for Theming](../../../decisions/adrs/ADR-005-theming-approach.md) - Decision rationale

### Key Implementation Points

1. **Design Tokens**: TypeScript interfaces for colours, spacing, border radius, shadows, transitions
2. **CSS Custom Properties**: `:root` variables with `[data-theme="dark"]` overrides
3. **System Detection**: `@media (prefers-color-scheme: dark)` for auto mode
4. **ThemeContext**: React context with `mode`, `resolvedTheme`, `setMode`, `toggleMode`
5. **Persistence**: localStorage with key `itemdeck-theme`

## Implementation Tasks

- [ ] Create `src/design-tokens/tokens.ts` with TypeScript interfaces
- [ ] Create `src/design-tokens/themes.ts` with light/dark definitions
- [ ] Create `src/styles/theme.css` with CSS custom properties
- [ ] Create `ThemeContext` and `ThemeProvider` components
- [ ] Create `useTheme` hook
- [ ] Create `ThemeToggle` component with icons
- [ ] Add `ThemeProvider` to main.tsx
- [ ] Persist theme preference to localStorage
- [ ] Listen for system preference changes
- [ ] Update existing components to use CSS variables
- [ ] Ensure WCAG contrast compliance in both themes
- [ ] Write unit tests for ThemeContext
- [ ] Write visual regression tests for themes

## Success Criteria

- [ ] Three-way theme toggle works (light/dark/auto)
- [ ] Auto mode respects system preference
- [ ] System preference changes detected in real-time
- [ ] Theme persists across page reloads
- [ ] All colours use CSS custom properties
- [ ] Smooth transitions between themes
- [ ] WCAG 2.1 AA contrast requirements met
- [ ] Screen readers announce theme changes
- [ ] Tests pass

## Dependencies

- **Requires**: v0.2.0 complete
- **Blocks**: F-013 Settings Panel

## Complexity

**Medium** - Requires systematic replacement of hard-coded colours and careful accessibility testing.

---

## Related Documentation

- [Customisation Options Research](../../../../research/customisation-options.md)
- [Accessibility Research](../../../../research/accessibility.md)
- [ADR-005: CSS Custom Properties for Theming](../../../decisions/adrs/ADR-005-theming-approach.md)
- [v0.3.0 Milestone](../../milestones/v0.3.0.md)
