# Track A: Onboarding & First Impressions

## Features

- F-107: Empty Collection Handling
- F-109: Launch Screen with Logo
- F-112: MyPlausibleMe Example Loading

## Implementation Prompt

```
Implement the launch screen with logo and empty collection handling for itemdeck.

## F-109: Launch Screen with Logo

1. Move logo from `docs/assets/img/logo.png` to `src/assets/img/logo.png`
2. Update `src/components/LoadingScreen/LoadingScreen.tsx`:
   - Import logo: `import logo from '@/assets/img/logo.png'`
   - Replace the inline SVG card-deck icon (lines 341-346) with:
     `<img src={logo} alt="itemdeck" className={styles.logoImage} />`
3. Add CSS in `LoadingScreen.module.css`:
   - `.logoImage { width: 128px; height: auto; animation: fadeIn 0.3s ease-out; }`
   - Add `@keyframes fadeIn` animation

## F-107: Empty Collection Handling

1. Update `src/components/CollectionPicker/CollectionPicker.tsx`:
   - Add empty state UI when no collections exist
   - Auto-focus "Add Source" functionality
   - Show friendly guidance message
2. Update `src/components/SettingsPanel/SettingsPanel.tsx`:
   - Disable "Sources" tab when empty (greyed out)
   - Auto-switch to "Add Source" tab

## F-112: MyPlausibleMe Example Loading

1. Create `src/config/devSources.ts`:
   - Define test collections from MyPlausibleMe/data/examples/
   - Only enable in development mode
2. Add "Load Example Collection" option in CollectionPicker (dev only)
3. Configure sources with lazy loading enabled

## Files to Modify

- src/components/LoadingScreen/LoadingScreen.tsx
- src/components/LoadingScreen/LoadingScreen.module.css
- src/components/CollectionPicker/CollectionPicker.tsx
- src/components/SettingsPanel/SettingsPanel.tsx
- src/config/devSources.ts (new)
- src/assets/img/logo.png (copy from docs/assets/img/)

## Success Criteria

- [ ] Launch screen shows itemdeck logo with fade animation
- [ ] Empty state shows friendly message (not error)
- [ ] Settings panel auto-opens Add Source tab when no collections
- [ ] Example collections loadable in development mode
- [ ] Lazy loading enabled for example sources
```

---

## Related Documentation

- [F-107 Feature Spec](../../../development/roadmap/features/planned/F-107-empty-collection-handling.md)
- [F-109 Feature Spec](../../../development/roadmap/features/planned/F-109-launch-screen.md)
- [F-112 Feature Spec](../../../development/roadmap/features/planned/F-112-example-loading.md)
