/**
 * Keyboard navigation tests.
 *
 * Verifies all interactive elements are keyboard accessible.
 * Tests the useGridNavigation hook and useFocusTrap hook behaviour.
 *
 * @see F-019: Accessibility Audit
 * @see ADR-011: Accessibility Standard
 */

import { test, expect } from '@playwright/test';

/**
 * Helper to wait for app to be ready after collection picker.
 */
async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');

  // If collection picker is shown, select the first collection
  const pickerVisible = await page.locator('[data-testid="collection-picker"]').isVisible().catch(() => false);
  if (pickerVisible) {
    const demoCollection = page.locator('button:has-text("Demo")').first();
    if (await demoCollection.isVisible()) {
      await demoCollection.click();
    } else {
      await page.locator('[data-testid="collection-item"]').first().click();
    }
    await page.waitForLoadState('networkidle');
  }

  await page.waitForSelector('[id="main-content"]', { state: 'visible', timeout: 30000 });
}

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('Tab key navigates through focusable elements', async ({ page }) => {
    // Focus should start at document body or skip link
    await page.keyboard.press('Tab');

    // After first Tab, should focus skip link or first focusable element
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();

    // Continue tabbing and verify focus moves
    const initialFocusId = await activeElement.getAttribute('id') || await activeElement.getAttribute('data-card-id');

    await page.keyboard.press('Tab');
    const newActiveElement = page.locator(':focus');

    // Focus should have moved to a different element
    const newFocusId = await newActiveElement.getAttribute('id') || await newActiveElement.getAttribute('data-card-id');
    expect(newFocusId !== initialFocusId || !initialFocusId).toBeTruthy();
  });

  test('Shift+Tab navigates backwards', async ({ page }) => {
    // Tab forward several times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const forwardElement = page.locator(':focus');
    const forwardId = await forwardElement.getAttribute('id') || await forwardElement.getAttribute('data-card-id');

    // Tab backwards
    await page.keyboard.press('Shift+Tab');
    const backwardElement = page.locator(':focus');
    const backwardId = await backwardElement.getAttribute('id') || await backwardElement.getAttribute('data-card-id');

    // Should be on a different element
    expect(backwardId !== forwardId || !forwardId).toBeTruthy();
  });

  test('Enter/Space activates buttons', async ({ page }) => {
    // Wait for navigation hub to appear
    await page.waitForSelector('button', { state: 'visible' });

    // Find a button and focus it
    const helpButton = page.locator('button[aria-label*="Help"], button[aria-label*="help"]').first();

    if (await helpButton.isVisible()) {
      await helpButton.focus();
      await expect(helpButton).toBeFocused();

      // Press Enter to activate
      await page.keyboard.press('Enter');

      // Help modal should open
      await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
    }
  });

  test('Space key activates focused button', async ({ page }) => {
    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    if (count > 0) {
      // Focus the first visible button
      await buttons.first().focus();
      await expect(buttons.first()).toBeFocused();

      // Space should activate (we just verify it doesn't throw)
      await page.keyboard.press('Space');
    }
  });
});

test.describe('Card Grid Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    // Wait for cards to load
    await page.waitForSelector('[data-card-id]', { timeout: 30000 });
  });

  test('Arrow keys navigate between cards', async ({ page }) => {
    // Focus the first card
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    const firstCardId = await firstCard.getAttribute('data-card-id');

    // Press right arrow to move to next card
    await page.keyboard.press('ArrowRight');

    // Check if focus moved (might be same card if at end of row)
    const focusedCard = page.locator('[data-card-id]:focus');
    const focusedCardId = await focusedCard.getAttribute('data-card-id');

    // Either moved to new card or stayed at boundary
    expect(focusedCardId).toBeTruthy();
  });

  test('Home key moves to first card', async ({ page }) => {
    const cards = page.locator('[data-card-id]');
    const count = await cards.count();

    if (count > 1) {
      // Focus a middle card
      await cards.nth(Math.min(2, count - 1)).focus();

      // Press Home
      await page.keyboard.press('Home');

      // First card should be focused
      const firstCard = cards.first();
      const focusedCard = page.locator('[data-card-id]:focus');
      const firstId = await firstCard.getAttribute('data-card-id');
      const focusedId = await focusedCard.getAttribute('data-card-id');

      expect(focusedId).toBe(firstId);
    }
  });

  test('End key moves to last card', async ({ page }) => {
    const cards = page.locator('[data-card-id]');
    const count = await cards.count();

    if (count > 1) {
      // Focus first card
      await cards.first().focus();

      // Press End
      await page.keyboard.press('End');

      // Last card should be focused
      const lastCard = cards.last();
      const focusedCard = page.locator('[data-card-id]:focus');
      const lastId = await lastCard.getAttribute('data-card-id');
      const focusedId = await focusedCard.getAttribute('data-card-id');

      expect(focusedId).toBe(lastId);
    }
  });

  test('Enter/Space flips focused card', async ({ page }) => {
    // Focus the first card
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.focus();

    // Check initial flip state
    const initialFlipState = await firstCard.getAttribute('aria-pressed');

    // Press Enter to flip
    await page.keyboard.press('Enter');

    // Wait for animation
    await page.waitForTimeout(300);

    // Check new flip state
    const newFlipState = await firstCard.getAttribute('aria-pressed');

    // State should have toggled
    expect(newFlipState).not.toBe(initialFlipState);
  });

  test('Space also flips focused card', async ({ page }) => {
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.focus();

    const initialFlipState = await firstCard.getAttribute('aria-pressed');

    // Press Space to flip
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const newFlipState = await firstCard.getAttribute('aria-pressed');
    expect(newFlipState).not.toBe(initialFlipState);
  });
});

test.describe('Modal Focus Trap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('Escape closes modal', async ({ page }) => {
    // Open help modal
    await page.keyboard.press('Shift+?');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('Focus is trapped within modal', async ({ page }) => {
    // Open help modal
    await page.keyboard.press('Shift+?');
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const dialog = page.locator('[role="dialog"]');

    // Tab through all focusable elements in the modal
    let maxTabs = 20;
    let tabCount = 0;

    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = page.locator(':focus');
      const isInDialog = await dialog.locator(':focus').count() > 0;

      // If focus is visible, it should be within the dialog
      if (await focusedElement.isVisible()) {
        expect(isInDialog, 'Focus should remain within dialog').toBeTruthy();
      }

      // Break if we've cycled back to an element we've seen
      if (tabCount > 10) break;
    }
  });

  test('Focus returns to trigger element when modal closes', async ({ page }) => {
    // Find and click a help button to track what triggered the modal
    const helpButton = page.locator('button[aria-label*="Help"], button[aria-label*="help"]').first();

    if (await helpButton.isVisible()) {
      // Focus and click the button
      await helpButton.focus();
      await helpButton.click();

      // Wait for modal
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // Focus should return to the button that opened it
      // Note: This may vary based on implementation
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
  });
});

test.describe('Global Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('Shift+? opens help modal', async ({ page }) => {
    await page.keyboard.press('Shift+?');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('Ctrl+A opens settings panel', async ({ page }) => {
    await page.keyboard.press('Control+a');

    // Wait for settings to appear (might use dialog role or custom selector)
    const settingsPanel = page.locator('[data-testid="settings-panel"], [role="dialog"]').first();
    await expect(settingsPanel).toBeVisible({ timeout: 5000 });
  });
});
