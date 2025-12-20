# F-019: Accessibility Audit

## Problem Statement

WCAG 2.2 AA compliance has not been formally verified:

1. No systematic accessibility testing
2. Keyboard navigation not verified across components
3. Screen reader support not tested
4. Colour contrast not validated
5. Reduced motion preferences may not be consistently respected

## Design Approach

Conduct a comprehensive **WCAG 2.2 AA audit** with automated and manual testing:

### Automated Testing with axe-core

```typescript
// e2e/accessibility-audit.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 AA Compliance', () => {
  const pages = [
    { name: 'Home', path: '/' },
    { name: 'Settings', path: '/settings' },
    { name: 'Credits', path: '/credits' },
  ];

  for (const { name, path } of pages) {
    test(`${name} page has no violations`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }

  test('Card grid passes accessibility checks', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="card-grid"]');

    const results = await new AxeBuilder({ page })
      .include('[data-testid="card-grid"]')
      .withTags(['wcag2aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('Modal dialogs are accessible', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[role="dialog"]');

    const results = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Keyboard Navigation Testing

```typescript
// e2e/keyboard-navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
  test('can navigate entire page with keyboard', async ({ page }) => {
    await page.goto('/');

    // Tab through all focusable elements
    const focusableElements: string[] = [];
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName + (el?.getAttribute('data-testid') || '');
      });
      focusableElements.push(focused);
    }

    // Verify focus order is logical
    expect(focusableElements.length).toBeGreaterThan(5);
  });

  test('card grid uses arrow key navigation', async ({ page }) => {
    await page.goto('/');

    // Focus first card
    await page.keyboard.press('Tab');
    const firstCard = page.locator('[data-testid="card"]').first();
    await expect(firstCard).toBeFocused();

    // Navigate right
    await page.keyboard.press('ArrowRight');
    const secondCard = page.locator('[data-testid="card"]').nth(1);
    await expect(secondCard).toBeFocused();

    // Navigate down
    await page.keyboard.press('ArrowDown');

    // Navigate left
    await page.keyboard.press('ArrowLeft');

    // Navigate up
    await page.keyboard.press('ArrowUp');
    await expect(secondCard).toBeFocused();
  });

  test('Escape closes modal dialogs', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[role="dialog"]');

    // Press Escape
    await page.keyboard.press('Escape');

    // Dialog should be closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('focus is trapped in modal dialogs', async ({ page }) => {
    await page.goto('/');

    await page.click('[data-testid="settings-button"]');
    await page.waitForSelector('[role="dialog"]');

    const dialog = page.locator('[role="dialog"]');

    // Tab multiple times
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focusedInDialog = await dialog.evaluate((el) => {
        return el.contains(document.activeElement);
      });
      expect(focusedInDialog).toBe(true);
    }
  });
});
```

### Screen Reader Announcements

```typescript
// e2e/screen-reader.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Screen Reader Support', () => {
  test('live regions announce dynamic content', async ({ page }) => {
    await page.goto('/');

    // Check for live region
    const liveRegion = page.locator('[aria-live]');
    expect(await liveRegion.count()).toBeGreaterThan(0);
  });

  test('card flip announces state change', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[data-testid="card"]').first();

    // Before flip
    await expect(card).toHaveAttribute('aria-pressed', 'false');

    // Flip card
    await card.click();

    // After flip
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('loading states are announced', async ({ page }) => {
    await page.goto('/');

    // Check for loading indicator with proper ARIA
    const loading = page.locator('[aria-busy="true"]');
    // Loading should appear and then disappear
  });

  test('error messages are announced', async ({ page }) => {
    // Trigger an error state
    await page.goto('/?source=invalid');

    // Check for alert role
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
  });
});
```

### Colour Contrast Verification

```typescript
// e2e/colour-contrast.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Colour Contrast', () => {
  test('light theme meets AA contrast', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('dark theme meets AA contrast', async ({ page }) => {
    await page.goto('/');

    // Switch to dark theme
    await page.click('[data-testid="theme-toggle-dark"]');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('high contrast mode available', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.click('[data-testid="settings-button"]');

    // Enable high contrast
    await page.click('[data-testid="high-contrast-toggle"]');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Reduced Motion Testing

```typescript
// e2e/reduced-motion.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Check that animations are disabled
    const card = page.locator('[data-testid="card"]').first();

    // Get computed styles
    const transitionDuration = await card.evaluate((el) => {
      return window.getComputedStyle(el).transitionDuration;
    });

    // Should be instant or very fast
    expect(transitionDuration).toMatch(/^0(\.0+)?s$/);
  });

  test('user can override reduced motion setting', async ({ page }) => {
    await page.goto('/');

    // Open settings
    await page.click('[data-testid="settings-button"]');

    // Set to reduce motion
    await page.selectOption('[data-testid="motion-preference"]', 'reduce');

    // Close settings
    await page.keyboard.press('Escape');

    // Card flip should be instant
    const card = page.locator('[data-testid="card"]').first();
    await card.click();

    // Animation should complete instantly
    await expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});
```

### Manual Testing Checklist Component

```tsx
// src/components/AccessibilityChecklist/AccessibilityChecklist.tsx
// Development-only component for manual verification

export function AccessibilityChecklist() {
  if (!import.meta.env.DEV) return null;

  return (
    <details className={styles.checklist}>
      <summary>Accessibility Checklist (Dev Only)</summary>

      <h3>Keyboard Navigation</h3>
      <ul>
        <li>
          <label>
            <input type="checkbox" /> Tab order is logical
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> All interactive elements are focusable
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Focus indicator is visible
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Escape closes modals
          </label>
        </li>
      </ul>

      <h3>Screen Reader</h3>
      <ul>
        <li>
          <label>
            <input type="checkbox" /> Page has logical heading structure
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Images have alt text
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Form inputs have labels
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Dynamic content announced
          </label>
        </li>
      </ul>

      <h3>Visual</h3>
      <ul>
        <li>
          <label>
            <input type="checkbox" /> Colour contrast ≥ 4.5:1 (text)
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Colour contrast ≥ 3:1 (UI)
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Text resizes to 200%
          </label>
        </li>
        <li>
          <label>
            <input type="checkbox" /> Reduced motion respected
          </label>
        </li>
      </ul>
    </details>
  );
}
```

## Implementation Tasks

- [ ] Install axe-core Playwright plugin
- [ ] Create comprehensive E2E accessibility tests
- [ ] Create keyboard navigation tests
- [ ] Create screen reader announcement tests
- [ ] Create colour contrast tests for all themes
- [ ] Create reduced motion tests
- [ ] Add manual testing checklist component (dev only)
- [ ] Run automated audit on all pages
- [ ] Fix all axe-core violations
- [ ] Verify keyboard navigation on all interactive elements
- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] Verify 200% text zoom doesn't break layout
- [ ] Document any accessibility considerations
- [ ] Create accessibility statement page

## Success Criteria

- [ ] Zero axe-core violations on all pages
- [ ] All interactive elements keyboard accessible
- [ ] Focus visible on all focusable elements
- [ ] Logical tab order throughout application
- [ ] Modal focus trapping works correctly
- [ ] Colour contrast meets AA requirements in all themes
- [ ] Reduced motion preference respected
- [ ] Screen reader navigation tested and verified
- [ ] 200% zoom tested and functional
- [ ] Accessibility statement published

## Dependencies

- **Requires**: F-017 Testing Infrastructure, F-018 Security Hardening
- **Blocks**: None

## Complexity

**Medium** - Automated testing straightforward, manual verification time-consuming.

---

## Related Documentation

- [Accessibility Research](../../../../research/accessibility.md)
- [ADR-011: WCAG 2.2 AA Compliance](../../../decisions/adrs/ADR-011-accessibility-standard.md)
- [v0.5.0 Milestone](../../milestones/v0.5.0.md)
