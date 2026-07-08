import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E accessibility testing.
 *
 * Tests WCAG 2.2 AA compliance using axe-core integration.
 *
 * @see F-019: Accessibility Audit
 * @see ADR-011: Accessibility Standard
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    // The app is served from /demo/ (see base in vite.config.ts).
    baseURL: 'http://localhost:5173/demo/',
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
    url: 'http://localhost:5173/demo/',
    reuseExistingServer: !process.env.CI,
  },
});
