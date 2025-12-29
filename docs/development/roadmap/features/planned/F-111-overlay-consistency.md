# F-111: Overlay Consistency Review

## Problem Statement

Multiple overlay components exist with inconsistent behaviour:
- Some trap focus, others don't
- Animation approaches vary (Framer Motion vs CSS)
- ARIA attributes inconsistently applied
- Click-outside behaviour varies

Overlays to audit:
- Modal (reference implementation)
- SettingsPanel
- HelpModal
- MechanicPanel
- ConfirmDialog
- ViewPopover
- ImageGallery

## Design Approach

1. **Create shared overlay utilities**:
   - `useOverlay` hook for common behaviour
   - `useFocusTrap` hook extracted from Modal

2. **Establish consistent patterns**:
   - Escape to close
   - Click outside to close (where appropriate)
   - Focus trapping
   - ARIA role="dialog" and aria-modal="true"

3. **Standardise animation**:
   - Choose one approach (Framer Motion or CSS)
   - Apply consistently

## Implementation Tasks

- [ ] Create `src/hooks/useOverlay.ts`
- [ ] Create `src/hooks/useFocusTrap.ts`
- [ ] Audit Modal.tsx as reference implementation
- [ ] Update SettingsPanel to use shared hooks
- [ ] Update HelpModal to use shared hooks
- [ ] Update MechanicPanel to use shared hooks
- [ ] Update ConfirmDialog to use shared hooks
- [ ] Update ViewPopover to use shared hooks
- [ ] Update ImageGallery to use shared hooks
- [ ] Add missing ARIA attributes
- [ ] Standardise animation approach

## Overlay Consistency Checklist

| Feature | Required |
|---------|----------|
| Escape to close | Yes |
| Click outside to close | Context-dependent |
| Focus trapping | Yes |
| ARIA role="dialog" | Yes |
| aria-modal="true" | Yes |
| Consistent animation | Yes |

## Success Criteria

- [ ] Shared useOverlay hook created
- [ ] useFocusTrap hook extracted
- [ ] All overlays close with Escape
- [ ] All overlays have proper ARIA attributes
- [ ] Animation approach consistent
- [ ] Focus management consistent

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Medium** - Multiple components to audit and update.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-b2-overlays.md)
