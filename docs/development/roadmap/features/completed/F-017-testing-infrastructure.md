# F-017: Testing Infrastructure

## Problem Statement

The codebase lacks automated testing, making it difficult to:

1. Verify component behaviour before release
2. Catch regressions during development
3. Ensure accessibility compliance
4. Validate visual consistency across changes

## Design Approach

Implement a comprehensive **testing pyramid** with Vitest, React Testing Library, Playwright, and axe-core:

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock ResizeObserver
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Component Test Example

```typescript
// src/components/Card/Card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';

const mockCard = {
  id: 'test-card-1',
  name: 'Test Card',
  description: 'A test card description',
  imageUrl: 'https://example.com/image.jpg',
  category: 'test',
};

describe('Card', () => {
  it('renders card name', () => {
    render(<Card card={mockCard} />);
    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('renders card image with alt text', () => {
    render(<Card card={mockCard} />);
    const image = screen.getByRole('img', { name: /test card/i });
    expect(image).toHaveAttribute('src', mockCard.imageUrl);
  });

  it('calls onFlip when clicked', async () => {
    const user = userEvent.setup();
    const handleFlip = vi.fn();

    render(<Card card={mockCard} onFlip={handleFlip} />);
    await user.click(screen.getByRole('article'));

    expect(handleFlip).toHaveBeenCalledWith('test-card-1');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleFlip = vi.fn();

    render(<Card card={mockCard} onFlip={handleFlip} />);
    const card = screen.getByRole('article');

    await user.tab();
    expect(card).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(handleFlip).toHaveBeenCalled();
  });
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
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
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Example

```typescript
// e2e/card-grid.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Card Grid', () => {
  test('displays cards in grid layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="card-grid"]');

    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-default.png',
      { animations: 'disabled' }
    );
  });

  test('card grid is responsive', async ({ page }) => {
    await page.goto('/');

    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-desktop.png'
    );

    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-tablet.png'
    );

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-mobile.png'
    );
  });
});
```

### Accessibility Testing

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage has no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('card grid is keyboard navigable', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const firstCard = page.locator('[data-testid="card"]').first();
    await expect(firstCard).toBeFocused();

    await page.keyboard.press('ArrowRight');
    const secondCard = page.locator('[data-testid="card"]').nth(1);
    await expect(secondCard).toBeFocused();
  });

  test('respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const card = page.locator('[data-testid="card"]').first();
    await card.click();

    // Card should flip instantly without animation
    await expect(card).toHaveScreenshot('card-back-reduced-motion.png');
  });
});
```

### Test Fixtures

```typescript
// src/test/fixtures/cards.ts
import type { CardData } from '../../types/card';

export const mockCards: CardData[] = [
  {
    id: 'card-1',
    name: 'Alpha Card',
    description: 'First test card',
    imageUrl: 'https://example.com/alpha.jpg',
    category: 'test',
    tags: ['alpha', 'test'],
  },
  {
    id: 'card-2',
    name: 'Beta Card',
    description: 'Second test card',
    imageUrl: 'https://example.com/beta.jpg',
    category: 'test',
    tags: ['beta', 'test'],
  },
];

export function createCard(overrides: Partial<CardData> = {}): CardData {
  return {
    id: `card-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Card',
    description: 'Test description',
    imageUrl: 'https://example.com/test.jpg',
    category: 'test',
    tags: [],
    ...overrides,
  };
}

export function createCards(count: number): CardData[] {
  return Array.from({ length: count }, (_, i) =>
    createCard({ id: `card-${i}`, name: `Card ${i}` })
  );
}
```

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  a11y-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:a11y
```

## Implementation Tasks

- [ ] Install Vitest: `npm install -D vitest @vitest/coverage-v8 @vitest/ui`
- [ ] Install RTL: `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [ ] Install Playwright: `npm install -D @playwright/test @axe-core/playwright`
- [ ] Create `vitest.config.ts`
- [ ] Create `src/test/setup.ts` with mocks
- [ ] Create `playwright.config.ts`
- [ ] Create test fixtures in `src/test/fixtures/`
- [ ] Write tests for Card component
- [ ] Write tests for CardGrid component
- [ ] Write tests for hooks (useSettings, useCardGrid)
- [ ] Write E2E tests for card interactions
- [ ] Write visual regression tests
- [ ] Write accessibility tests with axe-core
- [ ] Add npm scripts for test commands
- [ ] Configure GitHub Actions workflow
- [ ] Set up Codecov for coverage reporting

## Success Criteria

- [ ] Unit test coverage ≥ 80%
- [ ] All component tests pass
- [ ] E2E tests cover core user flows
- [ ] Visual regression tests for layouts
- [ ] axe-core reports zero violations
- [ ] Tests run in CI on every PR
- [ ] Coverage reports generated and tracked
- [ ] Playwright reports available on failure

## Dependencies

- **Requires**: v0.4.0 complete
- **Blocks**: None (enables other v0.6.0 features)

## Complexity

**Medium** - Well-documented tools but significant initial setup.

---

## Related Documentation

- [Testing Strategies Research](../../../../research/testing-strategies.md)
- [ADR-007: Vitest for Unit Testing](../../../decisions/adrs/ADR-007-unit-testing.md)
- [ADR-008: Playwright for E2E Testing](../../../decisions/adrs/ADR-008-e2e-testing.md)
- [v0.6.0 Milestone](../../milestones/v0.6.0.md)
