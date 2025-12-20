# ADR-008: Use Playwright for E2E Testing

## Status

Accepted

## Context

Itemdeck needs end-to-end testing for:
- User journey verification
- Visual regression testing
- Cross-browser compatibility
- Accessibility testing

We evaluated several E2E frameworks:

| Framework | Browsers | Visual Testing | A11y Integration |
|-----------|----------|----------------|------------------|
| Playwright | All major | Built-in | axe-core plugin |
| Cypress | Chrome, Firefox | Plugin | Plugin |
| TestCafe | All major | Plugin | Plugin |

Key requirements:
1. Cross-browser testing (Chrome, Firefox, Safari)
2. Visual regression testing
3. Accessibility testing integration
4. Mobile viewport support
5. CI/CD integration

## Decision

Use **Playwright** for E2E and visual regression testing.

## Consequences

### Positive

- **Cross-browser** - Chrome, Firefox, WebKit (Safari) support
- **Visual testing** - Built-in screenshot comparison
- **axe-core integration** - `@axe-core/playwright` for a11y
- **Mobile viewports** - Device emulation included
- **Parallel execution** - Fast CI runs
- **Auto-wait** - Reduces flaky tests

### Negative

- **Browser download** - ~400MB for all browsers
- **Learning curve** - Different from Cypress
- **No component testing** - Focused on E2E only

### Mitigations

- Cache browsers in CI
- Use Vitest/RTL for component tests
- Document Playwright patterns

## Test Types

| Test Type | Tool | Purpose |
|-----------|------|---------|
| Visual regression | Playwright | Layout consistency |
| E2E flows | Playwright | User journeys |
| Accessibility | axe-core + Playwright | WCAG compliance |
| Component | Vitest + RTL | Unit behaviour |

## Visual Testing Approach

```typescript
test('card grid layout', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-testid="card-grid"]')).toHaveScreenshot(
    'card-grid.png',
    { animations: 'disabled' }
  );
});
```

## Alternatives Considered

### Cypress
- Popular, good DX
- **Rejected**: Limited Safari support, visual testing requires plugin

### TestCafe
- No browser drivers
- **Rejected**: Less active development

### Puppeteer
- Chrome-focused
- **Rejected**: Single browser, lower-level API

---

## Related Documentation

- [Testing Strategies Research](../../../research/testing-strategies.md)
- [F-017: Testing Infrastructure](../../roadmap/features/planned/F-017-testing-infrastructure.md)
