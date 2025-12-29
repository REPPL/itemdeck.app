# Track A: Accessibility Audit (F-019)

## Features

- F-019: Accessibility Audit

## Implementation Prompt

```
Implement WCAG 2.2 AA accessibility audit for itemdeck.

## Phase 1: Install Dependencies

1. Run: npm install -D @playwright/test @axe-core/playwright
2. Run: npx playwright install
3. Add scripts to package.json:
   ```json
   {
     "scripts": {
       "e2e": "playwright test",
       "e2e:ui": "playwright test --ui",
       "e2e:headed": "playwright test --headed"
     }
   }
   ```

## Phase 2: Configure Playwright

Create playwright.config.ts:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Phase 3: Create E2E Test Files

### e2e/accessibility-audit.spec.ts

WCAG 2.2 AA automated checks using axe-core:
- Test home page, settings panel, help modal
- Use tags: wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa
- Include card grid component specific tests
- Include modal dialogue accessibility tests

### e2e/keyboard-navigation.spec.ts

Keyboard navigation tests:
- Tab through all focusable elements
- Arrow key navigation in card grid (uses useGridNavigation hook)
- Enter/Space to flip cards
- Escape closes modals
- Focus trap in dialogues (uses useFocusTrap hook)

### e2e/screen-reader.spec.ts

Screen reader support tests:
- Verify aria-live regions exist (Toast, LoadingScreen)
- Card flip announces state change (aria-pressed)
- Loading states use aria-busy="true"
- Error messages use role="alert"

### e2e/colour-contrast.spec.ts

Colour contrast verification:
- Light theme meets AA contrast
- Dark theme meets AA contrast
- High contrast mode available and meets requirements

### e2e/reduced-motion.spec.ts

Reduced motion tests:
- prefers-reduced-motion: reduce disables animations
- User can override via settings
- Verify useReducedMotion hook is respected

## Phase 4: Create Dev-Only Checklist Component

Create src/components/AccessibilityChecklist/:
- AccessibilityChecklist.tsx
- AccessibilityChecklist.module.css

Component should:
- Only render in development mode (import.meta.env.DEV)
- Provide collapsible checklist for manual verification
- Include sections: Keyboard Navigation, Screen Reader, Visual

## Phase 5: Fix Violations and Document

1. Run all E2E tests: npm run e2e
2. Fix any axe-core violations found
3. Test with VoiceOver (macOS) or NVDA (Windows)
4. Verify 200% zoom doesn't break layout
5. Create accessibility statement (in HelpModal or standalone page)

## Files to Create

- playwright.config.ts
- e2e/accessibility-audit.spec.ts
- e2e/keyboard-navigation.spec.ts
- e2e/screen-reader.spec.ts
- e2e/colour-contrast.spec.ts
- e2e/reduced-motion.spec.ts
- src/components/AccessibilityChecklist/AccessibilityChecklist.tsx
- src/components/AccessibilityChecklist/AccessibilityChecklist.module.css
- src/components/AccessibilityChecklist/index.ts

## Files to Modify

- package.json (add scripts and dependencies)

## Success Criteria

- [ ] @playwright/test and @axe-core/playwright installed
- [ ] playwright.config.ts configured
- [ ] E2E test directory structure created
- [ ] accessibility-audit.spec.ts - Zero axe-core violations on all pages
- [ ] keyboard-navigation.spec.ts - All interactive elements keyboard accessible
- [ ] screen-reader.spec.ts - Live regions and ARIA attributes verified
- [ ] colour-contrast.spec.ts - AA contrast in all themes
- [ ] reduced-motion.spec.ts - prefers-reduced-motion respected
- [ ] AccessibilityChecklist component created (dev-only)
- [ ] Accessibility statement page/section created
- [ ] All E2E tests passing
- [ ] Manual VoiceOver testing completed
- [ ] 200% zoom tested and functional
```

---

## Related Documentation

- [F-019 Feature Spec](../../../development/roadmap/features/planned/F-019-accessibility-audit.md)
- [ADR-011: Accessibility Standard](../../../development/decisions/adrs/ADR-011-accessibility-standard.md)
- [Accessibility Research](../../../development/research/accessibility.md)
