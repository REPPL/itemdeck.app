# Accessibility Options

Learn how to customise itemdeck for your accessibility needs.

## Motion Preferences

### Reduce Motion

Control animation and motion effects throughout the application.

**Location**: Settings > System > Accessibility

| Option | Behaviour |
|--------|-----------|
| System | Respects your OS preference (`prefers-reduced-motion`) |
| On | Disables all animations |
| Off | Enables all animations |

**What's affected:**
- Card flip animations
- Detail view transitions
- Hover lift effects
- Overlay slide/fade animations
- Loading transitions

**Note**: Changes apply immediately for accessibility.

### Per-Animation Control

For finer control, go to Settings > Appearance > Theme:

| Setting | Controls |
|---------|----------|
| Flip Animation | Card flip effect |
| Detail Animation | Opening/closing detail view |
| Overlay Animation | "More" and attribution overlays |
| Animation Style | Hover lift intensity (none/subtle/smooth/bouncy) |

## High Contrast Mode

Increase visual contrast for better visibility.

**Location**: Settings > System > Accessibility

**Effects:**
- Enhanced border visibility
- Stronger shadow contrast
- Increased text/background contrast
- More prominent focus indicators

**Note**: Changes apply immediately.

## Keyboard Navigation

All itemdeck features are accessible via keyboard.

### Global Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between interactive elements |
| `Shift + Tab` | Move backwards |
| `Enter` / `Space` | Activate focused element |
| `Escape` | Close overlay/panel |

### Card Navigation

| Key | Action |
|-----|--------|
| Arrow keys | Navigate between cards |
| `Home` | First card |
| `End` | Last card |
| `Page Up` / `Page Down` | Skip 5 cards |
| `Space` | Flip current card |
| `Enter` | Open detail view |

### Quick Access

| Key | Action |
|-----|--------|
| `/` | Focus search bar |
| `S` | Toggle settings |
| `E` | Toggle edit mode |
| `?` | Show keyboard help |

## Screen Reader Support

Itemdeck includes ARIA attributes for screen reader compatibility.

### Announcements

- Card focus announces title and position
- State changes are announced (flipped, selected)
- Overlays announce when opened/closed
- Error messages use live regions

### Labels

- All interactive elements have accessible labels
- Images include alt text from card titles
- Icons have aria-label descriptions
- Form inputs have associated labels

### Navigation Regions

The page uses landmark regions:
- Main content area (card grid)
- Navigation (floating buttons)
- Complementary (settings panel)

## Customising for Your Needs

### Visual Impairment

| Need | Solution |
|------|----------|
| Low vision | Use Large card size, High Contrast mode |
| Colour blindness | Adjust theme colours in Appearance settings |
| Light sensitivity | Enable Dark Mode in System settings |

### Motor Impairment

| Need | Solution |
|------|----------|
| Limited mobility | Use keyboard navigation exclusively |
| Tremor | Disable drag mode, use larger click targets |
| Fatigue | Reduce animations, use keyboard shortcuts |

### Cognitive

| Need | Solution |
|------|----------|
| Overwhelm | Use Minimal theme, reduce visible cards |
| Motion sensitivity | Enable Reduce Motion |
| Focus difficulty | Use Fit view mode for single-card focus |

## Settings Quick Reference

| Setting | Location | Purpose |
|---------|----------|---------|
| Reduce Motion | System > Accessibility | Disable animations |
| High Contrast | System > Accessibility | Increase visibility |
| Dark Mode | System | Reduce light emission |
| Card Size | Quick | Adjust target size |
| View Mode | Quick | Change layout density |
| Animation Style | Appearance > Theme | Control hover effects |

## Browser Settings

Itemdeck respects several browser/OS settings:

| System Setting | Itemdeck Behaviour |
|----------------|-------------------|
| `prefers-reduced-motion` | Detected when Reduce Motion = System |
| `prefers-color-scheme` | Affects Dark Mode default |
| Browser zoom | Cards and UI scale proportionally |
| Text scaling | Text respects browser settings |

## Reporting Issues

If you encounter accessibility barriers:

1. Note the specific issue and what you were trying to do
2. Include your browser and any assistive technology used
3. Report via the project's issue tracker

We aim to meet WCAG 2.1 AA guidelines.

---

## Related Documentation

- [Keyboard Shortcuts](keyboard-shortcuts.md) - Complete shortcut reference
- [Settings Reference](../reference/settings.md) - All accessibility settings
- [View Modes](view-modes.md) - Display layout options
