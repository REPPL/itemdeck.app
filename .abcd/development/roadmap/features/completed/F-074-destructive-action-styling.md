# F-074: Destructive Action Button Styling

## Problem Statement

Buttons that perform destructive actions (data loss, irreversible operations) are not visually distinct, which could lead to accidental clicks.

## Design Approach

Create a consistent "danger" button style for all destructive actions:
- **Default state**: Red thin border, transparent background, red text
- **Hover state**: Red background, white text
- **Focus state**: Red outline for accessibility

## Destructive Actions to Style

| Location | Button | Action |
|----------|--------|--------|
| Settings > System | Reset to Defaults | Resets all settings |
| Settings > Storage > Cache | Clear Cache | Deletes cached images |
| Settings > Storage > Import/Export | Revert All Edits | Removes all local edits |
| Memory Game | Exit | Abandons current game |
| Source list | Remove | Removes data source |

## Files to Modify

| File | Changes |
|------|---------|
| `src/styles/theme.css` | Add `.btn-danger` CSS class |
| `src/components/SettingsPanel/*.tsx` | Apply `.btn-danger` to destructive buttons |
| `src/mechanics/memory/components.tsx` | Style Exit button |
| `src/components/SettingsPanel/StorageSettingsTabs.tsx` | Style Remove/Clear/Revert buttons |

## CSS Implementation

```css
/* src/styles/theme.css */
.btn-danger {
  --danger-colour: #dc2626;

  background: transparent;
  border: 1px solid var(--danger-colour);
  color: var(--danger-colour);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.btn-danger:hover {
  background: var(--danger-colour);
  color: white;
}

.btn-danger:focus-visible {
  outline: 2px solid var(--danger-colour);
  outline-offset: 2px;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Implementation Tasks

- [ ] Add `.btn-danger` CSS class to theme.css
- [ ] Identify all destructive buttons in codebase
- [ ] Apply class to Reset to Defaults button
- [ ] Apply class to Clear Cache button
- [ ] Apply class to Revert All Edits button
- [ ] Apply class to Memory Game Exit button
- [ ] Apply class to Remove Source buttons
- [ ] Test in light and dark modes
- [ ] Verify focus state accessibility

## Success Criteria

- [ ] All destructive buttons have red border by default
- [ ] Hover shows red background with white text
- [ ] Focus state is accessible (visible outline)
- [ ] Consistent across all panels and modals
- [ ] Works in both light and dark modes

## Dependencies

- **Requires**: None
- **Blocks**: None

## Complexity

**Small** - CSS styling changes only.

---

## Related Documentation

- [v0.11.1 Milestone](../../milestones/v0.11.1.md)
- [Theme System](../../../../src/styles/theme.css)
