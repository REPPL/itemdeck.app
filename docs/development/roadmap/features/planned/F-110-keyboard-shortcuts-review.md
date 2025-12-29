# F-110: Keyboard Shortcuts Review

## Problem Statement

Current keyboard shortcuts mix navigation (single keys) with actions (also single keys). This creates potential conflicts and doesn't follow standard conventions where modifier keys (Ctrl, Cmd) are used for actions.

Current issues:
- `S` opens settings (should be `Ctrl+S`)
- `R` shuffles cards (should be `Ctrl+R`)
- `E` toggles edit mode (should be `Ctrl+E`)
- No vim-style navigation (j/k/h/l)

## Design Approach

1. **Separate navigation from actions**:
   - Navigation: Single keys (arrows, j/k/h/l, /, Escape)
   - Actions: Modifier keys (Ctrl+S, Ctrl+R, Ctrl+E)

2. **Centralise configuration**:
   - Single source of truth in `src/config/keyboardShortcuts.ts`
   - HelpModal reads from config

3. **Add vim-style navigation**:
   - `j`/`k` for up/down
   - `h`/`l` for left/right

## Implementation Tasks

- [ ] Create `src/config/keyboardShortcuts.ts`
- [ ] Define NAVIGATION_KEYS and ACTION_KEYS
- [ ] Update App.tsx to use Ctrl modifier for actions
- [ ] Add vim-style keys to useGridNavigation
- [ ] Update HelpModal to group shortcuts by category
- [ ] Update useGlobalKeyboard to use centralised config
- [ ] Test all shortcuts work correctly

## Keyboard Shortcut Convention

### Navigation (Single Keys)
| Key | Action |
|-----|--------|
| Arrow keys | Grid navigation |
| j/k | Up/Down (vim-style) |
| h/l | Left/Right (vim-style) |
| / | Focus search |
| Escape | Close overlay / Go back |
| Enter/Space | Select / Flip card |

### Actions (Modifier Keys)
| Key | Action |
|-----|--------|
| Ctrl+S | Open settings |
| Ctrl+R | Shuffle cards |
| Ctrl+E | Toggle edit mode |
| Shift+/ (?) | Show help |
| Ctrl+Shift+R | Refresh data |

## Success Criteria

- [ ] All action shortcuts require Ctrl modifier
- [ ] Vim-style navigation works (j/k/h/l)
- [ ] HelpModal displays grouped shortcuts
- [ ] Centralised config is single source of truth
- [ ] No conflicts between navigation and actions

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Medium** - Multiple files to update, requires testing.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-b1-keyboard.md)
