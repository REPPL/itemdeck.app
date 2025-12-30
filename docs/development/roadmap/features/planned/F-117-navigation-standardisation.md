# F-117: Navigation Pattern Standardisation

## Problem Statement

The application has evolved to include multiple overlay and navigation patterns that behave inconsistently:

1. **Inconsistent overlay types** - Settings uses modal, mechanics uses panel, search uses inline
2. **Different close behaviours** - Some close on Escape, some don't; some close on backdrop click
3. **Inconsistent focus management** - Some trap focus, some don't return focus on close
4. **Animation variety** - Different entry/exit animations across overlays
5. **User confusion** - Unpredictable behaviour reduces user confidence

### Current Navigation Inventory

| Component | Type | Escape | Backdrop Click | Focus Trap | Animation |
|-----------|------|--------|----------------|------------|-----------|
| SettingsPanel | Modal | ✅ | ✅ | ✅ | Fade+Scale |
| MechanicPanel | Panel | ⚠️ | ❌ | ❌ | Slide |
| CollectionPicker | Panel | ✅ | ✅ | ❌ | Slide |
| HelpOverlay | Modal | ✅ | ✅ | ✅ | Fade |
| SearchBar | Inline | ❌ | ❌ | ❌ | Expand |
| ViewPopover | Inline | ⚠️ | ✅ | ❌ | Fade |
| EditForm | Modal | ✅ | ✅ | ✅ | Fade |
| ConfirmDialog | Modal | ✅ | ❌ | ✅ | Scale |

## Design Approach

Standardise to 3 distinct navigation patterns with consistent behaviour:

### Pattern 1: Modal (Blocking)

**Use for:** Settings, Help, Export dialogs, Edit forms, Confirmation dialogs

**Behaviour:**
- Centred in viewport
- Full backdrop (semi-transparent)
- Focus trapped within modal
- Escape closes
- Backdrop click closes (except destructive actions)
- Focus returns to trigger on close
- Animation: Fade backdrop + scale content

**CSS Variables:**
```css
--modal-backdrop-colour: rgba(0, 0, 0, 0.6);
--modal-animation-duration: 200ms;
--modal-animation-easing: ease-out;
```

### Pattern 2: Panel (Contextual)

**Use for:** Mechanic selection, Collection picker, Sidebar content

**Behaviour:**
- Slides in from edge (right or bottom)
- Partial backdrop (lighter)
- Focus NOT trapped (user may need to interact with main content)
- Escape closes
- Backdrop click closes
- Focus returns to trigger on close
- Animation: Slide from edge

**CSS Variables:**
```css
--panel-backdrop-colour: rgba(0, 0, 0, 0.3);
--panel-animation-duration: 250ms;
--panel-slide-distance: 320px;
```

### Pattern 3: Inline (Non-blocking)

**Use for:** Search, View mode selector, Filter chips

**Behaviour:**
- Expands in-place (no overlay)
- No backdrop
- No focus trap
- Escape closes (when focused)
- Click outside closes
- Maintains scroll position
- Animation: Height/width expansion

**CSS Variables:**
```css
--inline-animation-duration: 150ms;
--inline-easing: cubic-bezier(0.4, 0, 0.2, 1);
```

## Implementation Tasks

### Phase 1: useOverlay Hook Enhancement (~3 hours)

- [ ] Review existing `src/hooks/useOverlay.ts`
- [ ] Add pattern type parameter: `"modal" | "panel" | "inline"`
- [ ] Standardise focus trap implementation
- [ ] Standardise focus return behaviour
- [ ] Add escape key handling per pattern
- [ ] Add backdrop click handling per pattern

### Phase 2: Animation Standardisation (~2 hours)

- [ ] Create `src/styles/overlays.css` with shared CSS variables
- [ ] Define modal animation keyframes
- [ ] Define panel slide animation keyframes
- [ ] Define inline expansion animation
- [ ] Ensure reduced motion support for all patterns

### Phase 3: Component Updates (~6 hours)

- [ ] Update `SettingsPanel` → Modal pattern
- [ ] Update `MechanicPanel` → Panel pattern
- [ ] Update `CollectionPicker` → Panel pattern
- [ ] Update `HelpOverlay` → Modal pattern
- [ ] Update `SearchBar` → Inline pattern
- [ ] Update `ViewPopover` → Inline pattern
- [ ] Update `EditForm` → Modal pattern
- [ ] Update `ConfirmDialog` → Modal pattern (no backdrop close)

### Phase 4: Testing (~3 hours)

- [ ] Verify Escape closes all overlays consistently
- [ ] Verify focus trap for modals
- [ ] Verify focus returns to trigger element
- [ ] Test keyboard navigation through all patterns
- [ ] Test with screen reader (ARIA announcements)
- [ ] Test reduced motion mode

### Phase 5: Documentation (~2 hours)

- [ ] Document patterns in code comments
- [ ] Create `docs/development/patterns/navigation.md`
- [ ] Add pattern selection guide for new components
- [ ] Update component stories in Storybook

## Success Criteria

- [ ] All overlays use one of three standardised patterns
- [ ] Escape key closes ALL overlays consistently
- [ ] Focus trap implemented for all modals
- [ ] Focus returns to trigger element on close
- [ ] Animation patterns unified per type
- [ ] Reduced motion mode works for all overlays
- [ ] Behaviour documented for future development

## Dependencies

- **F-111**: Overlay Consistency Review (complete) - Established `useOverlay` hook
- **F-116**: Settings Reorganisation - May affect Settings overlay

## Complexity

**Medium** - Requires updating multiple components but with clear patterns.

## Estimated Effort

**12-16 hours**

## Testing Strategy

- E2E tests for each overlay pattern
- Keyboard navigation tests
- Screen reader testing (VoiceOver, NVDA)
- Animation testing with reduced motion
- Focus management verification

## Risk Mitigation

1. **Behaviour regression** - Test thoroughly before deployment
2. **Muscle memory disruption** - Changes are standardisation, not removal
3. **Performance** - Ensure animations don't cause jank

---

## Related Documentation

- [F-111: Overlay Consistency](../completed/F-111-overlay-consistency.md)
- [F-116: Settings Reorganisation](./F-116-settings-reorganisation.md)
- [useOverlay Hook](../../../src/hooks/useOverlay.ts)

---

**Status**: Planned
