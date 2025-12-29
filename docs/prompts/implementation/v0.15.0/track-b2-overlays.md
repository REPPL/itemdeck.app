# Track B2: Overlay Consistency

## Features

- F-111: Overlay Consistency Review

## Implementation Prompt

```
Audit and standardise all overlay components in itemdeck.

## F-111: Overlay Consistency Review

### 1. Create shared overlay hook

Create `src/hooks/useOverlay.ts`:

```typescript
interface UseOverlayOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  trapFocus?: boolean;
}

export function useOverlay(options: UseOverlayOptions) {
  // Handle Escape key
  // Handle click outside
  // Return props for overlay and content elements
}
```

### 2. Extract focus trap

Create `src/hooks/useFocusTrap.ts`:
- Extract focus trap logic from Modal.tsx
- Make reusable across all overlays

### 3. Audit and update overlays

Apply consistent patterns to:
- `src/components/Modal/Modal.tsx` - Reference implementation
- `src/components/SettingsPanel/SettingsPanel.tsx`
- `src/components/HelpModal/HelpModal.tsx`
- `src/components/MechanicPanel/MechanicPanel.tsx`
- `src/components/ConfirmDialog/ConfirmDialog.tsx`
- `src/components/ViewPopover/ViewPopover.tsx`
- `src/components/ImageGallery/ImageGallery.tsx`

Ensure each has:
- [ ] Escape to close
- [ ] Click outside to close (where appropriate)
- [ ] Focus trapping
- [ ] ARIA role="dialog" and aria-modal="true"
- [ ] Consistent animation (use Framer Motion or CSS)

## Files to Modify

- src/hooks/useOverlay.ts (new)
- src/hooks/useFocusTrap.ts (new)
- All overlay components listed above

## Success Criteria

- [ ] Shared useOverlay hook created
- [ ] Focus trap extracted to reusable hook
- [ ] All overlays close with Escape
- [ ] All overlays have proper ARIA attributes
- [ ] Animation approach consistent across overlays
```

---

## Related Documentation

- [F-111 Feature Spec](../../../development/roadmap/features/planned/F-111-overlay-consistency.md)
