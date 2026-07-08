# ADR-011: Implement WCAG 2.2 AA Compliance

## Status

Accepted

## Context

Itemdeck should be accessible to users with disabilities:
- Visual impairments (screen readers, low vision)
- Motor impairments (keyboard-only navigation)
- Vestibular disorders (motion sensitivity)
- Cognitive considerations (clear UI)

We need to choose an accessibility standard:

| Standard | Level | Coverage |
|----------|-------|----------|
| WCAG 2.1 A | Minimum | Basic requirements |
| WCAG 2.1 AA | Recommended | Industry standard |
| WCAG 2.2 AA | Latest | Enhanced requirements |
| WCAG AAA | Maximum | May conflict with design |

## Decision

Target **WCAG 2.2 AA compliance** as the accessibility standard.

## Consequences

### Positive

- **Industry standard** - AA is the expected baseline
- **Legal compliance** - Meets most accessibility laws
- **Inclusive** - Supports majority of users with disabilities
- **Clear criteria** - Testable success criteria
- **2.2 additions** - Focus, dragging, consistent help

### Negative

- **Development overhead** - Extra testing and implementation
- **Design constraints** - Colour contrast minimums
- **Not AAA** - Some edge cases not covered

### Mitigations

- Integrate a11y testing into CI (axe-core)
- Document accessibility patterns for developers
- Include keyboard navigation from the start

## Key Requirements

### WCAG 2.2 AA Highlights

| Criterion | Requirement | Itemdeck Impact |
|-----------|-------------|-----------------|
| 1.4.3 Contrast | 4.5:1 text, 3:1 UI | Theme colour choices |
| 2.1.1 Keyboard | All functionality | Card navigation, flip |
| 2.4.7 Focus Visible | Clear focus indicator | Grid navigation |
| 2.5.8 Target Size | 24x24px minimum | Card touch targets |
| 3.2.6 Consistent Help | Same location | Settings, help links |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Keyboard Navigation

- Tab: Move between groups
- Arrow keys: Navigate within grid
- Enter/Space: Activate/flip card
- Escape: Close modals

## Testing Strategy

1. **Automated** - axe-core in unit tests and Playwright
2. **Manual** - Screen reader testing (VoiceOver, NVDA)
3. **Visual** - Colour contrast verification
4. **User testing** - If possible, with assistive tech users

## Alternatives Considered

### WCAG 2.1 AA
- Previous version
- **Rejected**: 2.2 is current, small additions

### WCAG AAA
- Highest level
- **Rejected**: Some criteria conflict with design goals

### No formal standard
- Ad-hoc accessibility
- **Rejected**: Inconsistent, legal risk

---

## Related Documentation

- [Accessibility Research](../../../research/accessibility.md)
- [F-004: Keyboard Navigation](../../roadmap/features/planned/F-004-keyboard-navigation.md)
- [F-005: Reduced Motion Support](../../roadmap/features/planned/F-005-reduced-motion-support.md)
- [F-019: Accessibility Audit](../../roadmap/features/planned/F-019-accessibility-audit.md)
