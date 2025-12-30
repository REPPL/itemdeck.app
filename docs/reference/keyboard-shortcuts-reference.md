# Keyboard Shortcuts Reference

Complete lookup table of all keyboard shortcuts in itemdeck.

## Global Shortcuts

Work anywhere in the application when not typing in an input field.

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl+S` / `Cmd+S` | Toggle Settings panel | Opens/closes settings |
| `?` (Shift + /) | Show keyboard help | Displays shortcut overlay |
| `Ctrl+E` / `Cmd+E` | Toggle Edit Mode | Enables card editing |
| `Ctrl+R` / `Cmd+R` | Shuffle cards | Randomise card order |
| `Ctrl+A` / `Cmd+A` | Toggle Admin Mode | Opens admin panel |
| `/` | Focus search bar | Jump to search input |
| `Escape` | Close overlay/panel | Closes topmost UI element |

## Card Navigation

Navigate through cards in the grid.

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Arrow Left` | Previous card | Move focus left |
| `Arrow Right` | Next card | Move focus right |
| `Arrow Up` | Card above | Move focus up one row |
| `Arrow Down` | Card below | Move focus down one row |
| `Home` | First card | Jump to start |
| `End` | Last card | Jump to end |
| `Page Up` | Skip up 5 cards | Fast navigation |
| `Page Down` | Skip down 5 cards | Fast navigation |

## Card Actions

Interact with the currently focused card.

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Space` | Flip card | Toggle front/back |
| `Enter` | Open detail view | Full card information |
| `Escape` | Close detail view | Return to grid |

## Search Bar

When the search bar is focused.

| Shortcut | Action | Notes |
|----------|--------|-------|
| `/` | Focus search input | From anywhere |
| `Escape` | Clear and blur | Clear search, return to grid |
| `Enter` | Submit search | Apply search filter |
| `Arrow Down` | Open suggestions | If suggestions available |

## Settings Panel

When the Settings panel is open.

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Escape` | Close Settings | Return to main view |
| `Tab` | Navigate controls | Move between settings |
| `Shift + Tab` | Navigate backwards | Move backwards |
| `Enter` | Activate control | Confirm selection |

## Mechanics Shortcuts

### Memory Game

When Memory Game mechanic is active.

| Shortcut | Action | Notes |
|----------|--------|-------|
| Arrow Keys | Navigate cards | Move between face-down cards |
| `Space` | Flip selected card | Reveal card face |
| `Enter` | Flip selected card | Alternative to Space |
| `Escape` | Exit game | End and deactivate mechanic |

### Knowledge Quiz

When Quiz mechanic is active.

| Shortcut | Action | Notes |
|----------|--------|-------|
| `1` - `4` | Select answer | Choose answer by number |
| `Enter` | Confirm answer | Submit selected answer |
| `Escape` | Exit quiz | End and deactivate mechanic |

### Top Trumps

When Top Trumps mechanic is active.

| Shortcut | Action | Notes |
|----------|--------|-------|
| Arrow Keys | Navigate stats | Move between stat options |
| `Enter` | Select stat | Choose stat for comparison |
| `Space` | Advance round | Continue after result |
| `Escape` | Exit game | End and deactivate mechanic |

### Guess the Value

When Guess the Value mechanic is active.

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Space` | Flip/reveal card | Show card face |
| Arrow Keys | Adjust guess | Increment/decrement value |
| `Enter` | Submit guess | Confirm current guess |
| `Escape` | Exit game | End and deactivate mechanic |

### Collection Tracker

When Collection Tracker is active.

| Shortcut | Action | Notes |
|----------|--------|-------|
| Arrow Keys | Navigate cards | Move between cards |
| `O` | Toggle owned | Mark as owned |
| `W` | Toggle wishlist | Mark as wanted |
| `Escape` | Exit tracker | Deactivate mechanic |

## Modifier Keys

### General Notes

- Most shortcuts work without modifiers
- `?` requires Shift (it's Shift + /)
- Ctrl/Cmd shortcuts are reserved for browser functions
- Alt shortcuts may conflict with browser menus

### Platform Differences

| Windows/Linux | macOS | Action |
|---------------|-------|--------|
| Ctrl + A | Cmd + A | (Reserved - browser) |
| Ctrl + F | Cmd + F | (Reserved - browser find) |
| Ctrl + S | Cmd + S | (Reserved - browser save) |

## Focus States

### When Shortcuts Work

| Focus Location | Global Shortcuts | Navigation |
|----------------|------------------|------------|
| Card grid | Yes | Yes |
| Detail view | Limited | No |
| Settings panel | Limited | No |
| Search input | No | No |
| Any input field | No | No |

### Focus Indicators

- Focused cards show visible outline
- Tab order follows logical reading order
- Skip links available for screen readers

## Accessibility Notes

### Visual Equivalents

All keyboard shortcuts have clickable equivalents:
- Settings button for `S`
- Help button for `?`
- Click cards to flip (Space equivalent)
- Double-click for detail (Enter equivalent)

### Screen Readers

- All actions announced
- Landmark regions for navigation
- ARIA labels on controls

### Customisation

Keyboard shortcuts cannot be customised in the current version. This may change in future releases.

---

## Quick Reference Card

```
Navigation                    Actions
-----------                   -------
Arrow Keys: Move focus        Space: Flip card
Home/End: First/Last          Enter: Detail view
PgUp/PgDn: Skip 5             Escape: Close
H/J/K/L: Vim navigation

Global                        Search
------                        ------
Ctrl+S: Settings              /: Focus search
?: Help                       Escape: Clear
Ctrl+E: Edit mode             Enter: Submit
Ctrl+R: Shuffle
Ctrl+A: Admin mode
```

---

## Related Documentation

- [Keyboard Shortcuts Guide](../guides/keyboard-shortcuts.md) - Detailed guide
- [Accessibility Options](../guides/accessibility-options.md) - Keyboard navigation
- [Settings Reference](settings.md) - All settings
