# Testing Strategies

## Executive Summary

For Itemdeck's testing approach, implement a **testing pyramid** with **Vitest** for unit/integration tests, **React Testing Library** for component tests, **Playwright** for E2E and visual regression, and **axe-core** for accessibility testing. Focus on testing user behaviour over implementation details.

Key recommendations:
1. Use Vitest + React Testing Library for component testing (fast, Vite-native)
2. Use Playwright for E2E and visual regression testing
3. Integrate axe-core for automated accessibility testing
4. Run all tests in CI with GitHub Actions
5. Aim for 80% coverage on business logic, visual regression on card layouts

## Current State in Itemdeck

Itemdeck currently has:
- **Vite 6** build system (Vitest-compatible)
- **TypeScript 5** in strict mode
- **React 18** components
- **CSS Modules** for styling
- **No testing infrastructure** yet

Setting up testing now establishes patterns for the entire codebase.

## Research Findings

### Testing Pyramid for Card UI

| Level | Tool | What to Test | Coverage Target |
|-------|------|--------------|-----------------|
| Unit | Vitest | Utility functions, hooks | 90% |
| Component | RTL + Vitest | Card rendering, interactions | 80% |
| Integration | Vitest | Data flow, context providers | 70% |
| Visual | Playwright | Card layouts, animations | Critical paths |
| E2E | Playwright | User journeys | Happy paths |
| A11y | axe-core | WCAG compliance | All components |

### Vitest Setup

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

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver (used by CardGrid)
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock IntersectionObserver (for lazy loading)
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock matchMedia (for responsive tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

### Component Testing with React Testing Library

```typescript
// src/components/Card/Card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Card } from './Card';
import type { CardData } from '../../types/card';

const mockCard: CardData = {
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

  it('has correct ARIA attributes', () => {
    render(<Card card={mockCard} isFlipped={false} />);

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-label', 'Test Card');
  });

  it('indicates flipped state accessibly', () => {
    render(<Card card={mockCard} isFlipped={true} />);

    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-pressed', 'true');
  });
});
```

### Testing Hooks

```typescript
// src/hooks/useCardGrid.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCardGrid } from './useCardGrid';

describe('useCardGrid', () => {
  it('calculates columns based on container width', () => {
    const { result } = renderHook(() =>
      useCardGrid({
        containerWidth: 1200,
        cardWidth: 200,
        gap: 16,
      })
    );

    // (1200 + 16) / (200 + 16) = 5.6 → 5 columns
    expect(result.current.columns).toBe(5);
  });

  it('returns minimum 1 column for narrow containers', () => {
    const { result } = renderHook(() =>
      useCardGrid({
        containerWidth: 100,
        cardWidth: 200,
        gap: 16,
      })
    );

    expect(result.current.columns).toBe(1);
  });

  it('updates when dimensions change', () => {
    const { result, rerender } = renderHook(
      ({ containerWidth }) => useCardGrid({
        containerWidth,
        cardWidth: 200,
        gap: 16,
      }),
      { initialProps: { containerWidth: 1200 } }
    );

    expect(result.current.columns).toBe(5);

    rerender({ containerWidth: 600 });

    expect(result.current.columns).toBe(2);
  });
});
```

### Testing Context Providers

```typescript
// src/contexts/SettingsContext.test.tsx
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { SettingsProvider, useSettings } from './SettingsContext';

function TestComponent() {
  const { cardWidth, setCardWidth } = useSettings();
  return (
    <div>
      <span data-testid="card-width">{cardWidth}</span>
      <button onClick={() => setCardWidth(300)}>Set Width</button>
    </div>
  );
}

describe('SettingsContext', () => {
  it('provides default values', () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    expect(screen.getByTestId('card-width')).toHaveTextContent('200');
  });

  it('updates values through setter', async () => {
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await user.click(screen.getByRole('button', { name: /set width/i }));

    expect(screen.getByTestId('card-width')).toHaveTextContent('300');
  });
});
```

### Visual Regression with Playwright

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
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

```typescript
// e2e/card-grid.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Card Grid', () => {
  test('displays cards in grid layout', async ({ page }) => {
    await page.goto('/');

    // Wait for cards to load
    await page.waitForSelector('[data-testid="card-grid"]');

    // Visual regression test
    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-default.png',
      {
        animations: 'disabled',
        mask: [page.locator('[data-testid="timestamp"]')],
      }
    );
  });

  test('card grid is responsive', async ({ page }) => {
    await page.goto('/');

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-desktop.png',
      { animations: 'disabled' }
    );

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-tablet.png',
      { animations: 'disabled' }
    );

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
      'card-grid-mobile.png',
      { animations: 'disabled' }
    );
  });

  test('card flip animation', async ({ page }) => {
    await page.goto('/');

    const card = page.locator('[data-testid="card"]').first();

    // Before flip
    await expect(card).toHaveScreenshot('card-front.png');

    // Trigger flip
    await card.click();

    // Wait for animation to complete
    await page.waitForTimeout(500);

    // After flip
    await expect(card).toHaveScreenshot('card-back.png');
  });
});
```

### Handling Animations in Tests

```typescript
// e2e/utils/test-helpers.ts
import { Page } from '@playwright/test';

export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
}

export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const animations = document.getAnimations();
      if (animations.length === 0) {
        resolve();
        return;
      }
      Promise.all(animations.map(a => a.finished)).then(() => resolve());
    });
  });
}

// For reduced motion preference
export async function setReducedMotion(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
}
```

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { setReducedMotion } from './utils/test-helpers';

test.describe('Reduced Motion', () => {
  test('respects prefers-reduced-motion', async ({ page }) => {
    await setReducedMotion(page);
    await page.goto('/');

    const card = page.locator('[data-testid="card"]').first();
    await card.click();

    // Card should flip instantly without animation
    // Take screenshot immediately - no waiting for animation
    await expect(card).toHaveScreenshot('card-back-reduced-motion.png');
  });
});
```

### Accessibility Testing with axe-core

```typescript
// src/test/a11y-setup.ts
import { configureAxe, toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

export const axeConfig = configureAxe({
  rules: {
    // Disable rules that don't apply to card UI
    'document-title': { enabled: false },
    'html-has-lang': { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
    'region': { enabled: false },
  },
});
```

```typescript
// src/components/Card/Card.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';
import { axeConfig } from '../../test/a11y-setup';

const mockCard = {
  id: 'test-1',
  name: 'Test Card',
  imageUrl: 'https://example.com/image.jpg',
};

describe('Card Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Card card={mockCard} />);

    const results = await axe(container, axeConfig);

    expect(results).toHaveNoViolations();
  });

  it('has no violations when flipped', async () => {
    const { container } = render(<Card card={mockCard} isFlipped={true} />);

    const results = await axe(container, axeConfig);

    expect(results).toHaveNoViolations();
  });
});
```

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

    // Focus first card
    await page.keyboard.press('Tab');

    const firstCard = page.locator('[data-testid="card"]').first();
    await expect(firstCard).toBeFocused();

    // Navigate to next card
    await page.keyboard.press('ArrowRight');

    const secondCard = page.locator('[data-testid="card"]').nth(1);
    await expect(secondCard).toBeFocused();

    // Flip card with keyboard
    await page.keyboard.press('Enter');
    await expect(secondCard).toHaveAttribute('aria-pressed', 'true');
  });
});
```

### Integration Testing

```typescript
// src/features/CardCollection/CardCollection.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CardCollection } from './CardCollection';
import { mockCards } from '../../test/fixtures/cards';

// Mock API
vi.mock('../../api/cards', () => ({
  fetchCards: vi.fn().mockResolvedValue(mockCards),
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('CardCollection Integration', () => {
  it('loads and displays cards', async () => {
    renderWithProviders(<CardCollection />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Cards loaded
    await waitFor(() => {
      expect(screen.getByText(mockCards[0].name)).toBeInTheDocument();
    });
  });

  it('filters cards by search', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CardCollection />);

    await waitFor(() => {
      expect(screen.getByText(mockCards[0].name)).toBeInTheDocument();
    });

    // Type in search
    await user.type(screen.getByRole('searchbox'), mockCards[0].name);

    // Only matching cards shown
    expect(screen.getByText(mockCards[0].name)).toBeInTheDocument();
    expect(screen.queryByText(mockCards[1].name)).not.toBeInTheDocument();
  });

  it('sorts cards by name', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CardCollection />);

    await waitFor(() => {
      expect(screen.getAllByRole('article')).toHaveLength(mockCards.length);
    });

    // Click sort by name
    await user.click(screen.getByRole('button', { name: /sort by name/i }));

    // Verify order
    const cards = screen.getAllByRole('article');
    const names = cards.map(card => card.getAttribute('aria-label'));
    const sortedNames = [...names].sort();

    expect(names).toEqual(sortedNames);
  });
});
```

### Test Fixtures and Factories

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

// Card factory for custom test data
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

export function createCards(count: number, overrides: Partial<CardData> = {}): CardData[] {
  return Array.from({ length: count }, (_, i) =>
    createCard({
      id: `card-${i}`,
      name: `Card ${i}`,
      ...overrides,
    })
  );
}
```

### Performance Testing

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('initial load is fast', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation'));
    });

    const navigation = JSON.parse(metrics)[0];

    // First Contentful Paint < 1.5s
    expect(navigation.responseEnd - navigation.requestStart).toBeLessThan(1500);
  });

  test('renders 100 cards without jank', async ({ page }) => {
    await page.goto('/?cards=100');

    // Measure scroll performance
    const frames: number[] = [];

    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let lastTime = performance.now();
        let frameCount = 0;

        function measureFrame() {
          const now = performance.now();
          const delta = now - lastTime;
          frames.push(delta);
          lastTime = now;
          frameCount++;

          if (frameCount < 60) {
            requestAnimationFrame(measureFrame);
          } else {
            resolve();
          }
        }

        requestAnimationFrame(measureFrame);
      });
    });

    // Scroll the page
    await page.evaluate(() => {
      window.scrollBy(0, 1000);
    });

    // Check for frame drops (> 16.67ms = < 60fps)
    const droppedFrames = frames.filter(f => f > 20).length;
    expect(droppedFrames).toBeLessThan(10); // Allow some variance
  });
});
```

### CI/CD Configuration

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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run visual regression tests
        run: npm run test:visual

      - name: Upload visual diff
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-diff
          path: test-results/
          retention-days: 7

  a11y-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run accessibility tests
        run: npm run test:a11y
```

### Testing Checklist

```markdown
## Pre-Commit Testing

### Unit Tests
- [ ] All tests pass: `npm test`
- [ ] Coverage meets threshold: 80%+
- [ ] No skipped tests without TODO

### Component Tests
- [ ] New components have tests
- [ ] User interactions tested
- [ ] Edge cases covered (empty, error states)

### Accessibility
- [ ] axe-core passes for new components
- [ ] Keyboard navigation works
- [ ] Screen reader tested (VoiceOver/NVDA)

## Pre-Release Testing

### Visual Regression
- [ ] Baseline images updated if intentional changes
- [ ] All visual tests pass
- [ ] Responsive layouts verified

### E2E Tests
- [ ] Happy path works
- [ ] Error handling works
- [ ] Performance within budget

### Manual Testing
- [ ] Real browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing (iOS, Android)
- [ ] Reduced motion tested
```

## Recommendations for Itemdeck

### Priority 1: Foundation Setup

1. **Install testing dependencies**:
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom \
     @testing-library/user-event jsdom jest-axe @types/jest-axe
   ```

2. **Configure Vitest** with jsdom environment
3. **Set up test utilities** (setup file, mocks, fixtures)
4. **Add npm scripts**:
   ```json
   {
     "test": "vitest",
     "test:coverage": "vitest run --coverage",
     "test:ui": "vitest --ui"
   }
   ```

### Priority 2: Component Test Coverage

1. **Test existing components** (Card, CardGrid, Sidebar)
2. **Test hooks** (useSettings, useCardGrid)
3. **Test context providers**
4. **Aim for 80% coverage** on first pass

### Priority 3: E2E and Visual Testing

1. **Install Playwright**:
   ```bash
   npm install -D @playwright/test @axe-core/playwright
   npx playwright install
   ```

2. **Create E2E tests** for core user journeys
3. **Add visual regression** for card grid layouts
4. **Integrate axe-core** for accessibility

### Priority 4: CI Integration

1. **Set up GitHub Actions** workflow
2. **Configure coverage reporting** (Codecov)
3. **Add visual regression** to PR checks
4. **Run a11y tests** on every commit

## Implementation Considerations

### Dependencies

```json
{
  "devDependencies": {
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/user-event": "^14.x",
    "jsdom": "^25.x",
    "jest-axe": "^9.x",
    "@playwright/test": "^1.x",
    "@axe-core/playwright": "^4.x",
    "@vitest/coverage-v8": "^2.x",
    "@vitest/ui": "^2.x"
  }
}
```

### Bundle Size Impact

- All testing dependencies are devDependencies (0 production impact)
- Playwright browsers: ~400MB (CI cache recommended)

### Test Organisation

```
src/
├── components/
│   └── Card/
│       ├── Card.tsx
│       ├── Card.test.tsx        # Unit/component tests
│       └── Card.a11y.test.tsx   # Accessibility tests
├── hooks/
│   └── useCardGrid.test.ts
├── test/
│   ├── setup.ts                 # Vitest setup
│   ├── a11y-setup.ts           # axe-core config
│   └── fixtures/               # Test data
│       └── cards.ts
e2e/
├── card-grid.spec.ts           # E2E tests
├── accessibility.spec.ts       # A11y E2E tests
├── performance.spec.ts         # Performance tests
└── utils/
    └── test-helpers.ts
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [Testing React with Vitest](https://vitest.dev/guide/browser/component-testing)
- [Playwright Visual Testing](https://www.chromatic.com/blog/how-to-visual-test-ui-using-playwright/)
- [Jest-axe for React](https://www.npmjs.com/package/jest-axe)
- [CodingEasyPeasy - React Component Testing Best Practices 2025](https://www.codingeasypeasy.com/blog/react-component-testing-best-practices-with-vitest-and-jest-2025-guide)

---

## Related Documentation

### Research
- [Accessibility](./accessibility.md) - WCAG testing requirements
- [Performance & Virtualisation](./performance-virtualisation.md) - Performance testing
- [Card Layouts & Animations](./card-layouts-animations.md) - Animation testing

### Features
- [F-017: Testing Infrastructure](../roadmap/features/completed/F-017-testing-infrastructure.md) - Testing setup implementation

---

**Applies to**: Itemdeck v0.1.0+
