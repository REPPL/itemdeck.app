# Track B1: Keyboard Shortcuts Review

## Features

- F-110: Keyboard Shortcuts Review

## Implementation Prompt

```
Review and standardise keyboard shortcuts in itemdeck.

## F-110: Keyboard Shortcuts Review

Goal: Separate navigation (single keys) from actions (Ctrl+X)

### 1. Create centralised config

Create `src/config/keyboardShortcuts.ts`:

```typescript
export const NAVIGATION_KEYS = {
  left: ['ArrowLeft', 'KeyH'],
  right: ['ArrowRight', 'KeyL'],
  up: ['ArrowUp', 'KeyK'],
  down: ['ArrowDown', 'KeyJ'],
  select: ['Enter', 'Space'],
  back: ['Escape', 'Backspace'],
  search: ['Slash'],
} as const;

export const ACTION_KEYS = {
  settings: { key: 'KeyS', ctrl: true, description: 'Open settings' },
  shuffle: { key: 'KeyR', ctrl: true, description: 'Shuffle cards' },
  editMode: { key: 'KeyE', ctrl: true, description: 'Toggle edit mode' },
  help: { key: 'Slash', shift: true, description: 'Show help (?)' },
  refresh: { key: 'KeyR', ctrl: true, shift: true, description: 'Refresh data' },
} as const;

export const SHORTCUT_CATEGORIES = {
  navigation: { label: 'Navigation', shortcuts: [...] },
  actions: { label: 'Actions', shortcuts: [...] },
  cards: { label: 'Card Interaction', shortcuts: [...] },
} as const;
```

### 2. Update App.tsx

Change single-key shortcuts to require Ctrl:
- `S` → `Ctrl+S` (settings)
- `R` → `Ctrl+R` (shuffle)
- `E` → `Ctrl+E` (edit mode)

### 3. Add vim-style navigation

Update `src/hooks/useGridNavigation.ts` to support j/k/h/l keys.

### 4. Update HelpModal

Update `src/components/HelpModal/HelpModal.tsx`:
- Group shortcuts by category
- Show modifier keys clearly
- Import from centralised config

## Files to Modify

- src/config/keyboardShortcuts.ts (new)
- src/App.tsx
- src/hooks/useGlobalKeyboard.ts
- src/hooks/useGridNavigation.ts
- src/components/HelpModal/HelpModal.tsx

## Success Criteria

- [ ] All action shortcuts use Ctrl modifier
- [ ] Navigation uses single keys (arrows, j/k/h/l)
- [ ] HelpModal groups shortcuts by category
- [ ] Centralised config is single source of truth
- [ ] Vim-style navigation works
```

---

## Related Documentation

- [F-110 Feature Spec](../../../development/roadmap/features/planned/F-110-keyboard-shortcuts-review.md)
