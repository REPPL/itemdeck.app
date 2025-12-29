# R-014: RTL Testing Strategy

## Executive Summary

This research defines the testing methodology for Right-to-Left (RTL) language support in Itemdeck. RTL testing requires a combination of automated CSS validation, visual regression testing, and native speaker validation to ensure correct layout mirroring and readability.

**Key Findings:**
- Playwright provides excellent RTL screenshot testing with emulation
- Stylelint can enforce CSS logical properties and catch directional properties
- Visual regression testing should cover LTR and RTL variants of key views
- Native speaker validation is essential for Arabic and Hebrew - cannot be automated

**Recommendation:** Implement a three-layer testing strategy: automated CSS linting, Playwright visual regression, and native speaker review workflow.

---

## Testing Layers

### Layer 1: Automated CSS Audit (Stylelint)

Enforce CSS logical properties and prevent directional property usage.

### Layer 2: Visual Regression Testing (Playwright)

Screenshot comparison between LTR and RTL layouts to catch layout issues.

### Layer 3: Native Speaker Validation

Human review for text direction, reading flow, and cultural appropriateness.

---

## Layer 1: CSS Linting with Stylelint

### Configuration

```bash
npm install --save-dev stylelint stylelint-use-logical-spec
```

```javascript
// .stylelintrc.js
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-use-logical-spec'],
  rules: {
    // Enforce logical properties
    'liberty/use-logical-spec': [
      'always',
      {
        except: [
          // Exceptions for intentionally directional properties
          'border-radius', // Corners are visual, not directional
        ],
      },
    ],
    // Disallow directional properties
    'property-disallowed-list': [
      'margin-left',
      'margin-right',
      'padding-left',
      'padding-right',
      'border-left',
      'border-right',
      'left',
      'right',
      'text-align', // Use 'start' and 'end' values only
    ],
    // Allow logical alternatives
    'property-allowed-list': [
      'margin-inline-start',
      'margin-inline-end',
      'padding-inline-start',
      'padding-inline-end',
      'border-inline-start',
      'border-inline-end',
      'inset-inline-start',
      'inset-inline-end',
    ],
  },
};
```

### CI Integration

```yaml
# .github/workflows/ci.yml
- name: Lint CSS for RTL compliance
  run: npx stylelint "src/**/*.css" --formatter json > stylelint-report.json
```

### Custom Rules for Itemdeck

```javascript
// Additional rules for text-align values
module.exports = {
  rules: {
    'declaration-property-value-allowed-list': {
      'text-align': ['start', 'end', 'center', 'justify'],
      'float': ['inline-start', 'inline-end', 'none'],
    },
  },
};
```

---

## Layer 2: Visual Regression Testing

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'LTR Chrome',
      use: {
        browserName: 'chromium',
        locale: 'en-GB',
      },
    },
    {
      name: 'RTL Chrome',
      use: {
        browserName: 'chromium',
        locale: 'ar',
      },
    },
    {
      name: 'RTL Firefox',
      use: {
        browserName: 'firefox',
        locale: 'he',
      },
    },
  ],
  snapshotDir: './tests/snapshots',
  expect: {
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01, // 1% pixel difference tolerance
    },
  },
});
```

### Test Structure

```typescript
// tests/rtl/layout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('RTL Layout', () => {
  test.beforeEach(async ({ page }) => {
    // Set RTL direction for test
    await page.evaluate(() => {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    });
  });

  test('Card grid mirrors correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('card-grid-rtl.png', {
      fullPage: true,
    });
  });

  test('Settings panel mirrors correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="settings-button"]');
    await expect(page.locator('.settings-panel')).toHaveScreenshot(
      'settings-panel-rtl.png'
    );
  });

  test('Modal dialogs position correctly', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="card"]');
    await expect(page.locator('.modal')).toHaveScreenshot('modal-rtl.png');
  });
});
```

### Key Views to Test

| View | Test File | Critical Elements |
|------|-----------|-------------------|
| Card Grid | `card-grid.spec.ts` | Grid layout, card alignment |
| Settings Panel | `settings.spec.ts` | Tab navigation, form fields |
| Card Detail Modal | `modal.spec.ts` | Modal position, close button |
| Search Bar | `search.spec.ts` | Input alignment, icons |
| Navigation | `navigation.spec.ts` | Sidebar position, menu items |
| Game Mechanics | `mechanics.spec.ts` | Overlays, timers, buttons |

### Comparison Strategy

```typescript
// Compare LTR and RTL screenshots for expected mirroring
test('Layout is properly mirrored', async ({ page }) => {
  // LTR screenshot
  await page.evaluate(() => {
    document.documentElement.dir = 'ltr';
  });
  const ltrScreenshot = await page.screenshot();

  // RTL screenshot
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
  });
  const rtlScreenshot = await page.screenshot();

  // Manual verification: RTL should be mirrored version of LTR
  // (Automated mirroring comparison is complex - use visual inspection)
});
```

---

## Layer 3: Native Speaker Validation

### Validation Workflow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Implementation Complete                                    │
│    └── All RTL CSS changes committed                          │
│    └── Translations added for ar/he                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Staging Deployment                                         │
│    └── Deploy to staging environment                          │
│    └── Enable RTL language switcher                           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Native Speaker Review                                      │
│    └── Provide review checklist                               │
│    └── Collect feedback via structured form                   │
│    └── Record issues with screenshots                         │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Issue Triage                                               │
│    └── Categorise issues (layout, text, cultural)             │
│    └── Prioritise fixes                                       │
│    └── Assign to developers                                   │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Fix and Re-Review                                          │
│    └── Implement fixes                                        │
│    └── Request re-review from same reviewer                   │
│    └── Sign-off required before release                       │
└──────────────────────────────────────────────────────────────┘
```

### Review Checklist

```markdown
# RTL Review Checklist - [Language: Arabic/Hebrew]

## Layout Mirroring
- [ ] Page layout flows right-to-left
- [ ] Navigation sidebar on correct side
- [ ] Card grid reads right-to-left
- [ ] Form labels align correctly
- [ ] Buttons and actions in expected positions

## Text Direction
- [ ] All text reads correctly
- [ ] Mixed content (numbers, English terms) displays correctly
- [ ] Punctuation positioned correctly
- [ ] No text overlap or clipping

## Icons
- [ ] Directional icons (arrows, chevrons) point correctly
- [ ] Non-directional icons unchanged
- [ ] Icon positions make sense for RTL

## Interactions
- [ ] Swiping/scrolling feels natural
- [ ] Modal dialogs appear in expected position
- [ ] Tooltips point to correct elements
- [ ] Animations move in natural direction

## Cultural Appropriateness
- [ ] No culturally inappropriate imagery
- [ ] Dates/times in appropriate format
- [ ] Numbers formatted correctly

## Overall
- [ ] App feels natural for RTL speakers
- [ ] No jarring layout issues
- [ ] Would recommend for RTL users
```

### Reviewer Recruitment

| Source | Approach | Expected Reviewers |
|--------|----------|-------------------|
| Translation Contributors | Invite via Weblate | 2-3 per language |
| Community | Call for volunteers on forums | 1-2 per language |
| Professional | Hire via translation agency | 1 per language (backup) |

---

## Browser Testing Matrix

### Target Browsers

| Browser | Version | RTL Support | Priority |
|---------|---------|-------------|----------|
| Chrome | 89+ | Full | High |
| Firefox | 66+ | Full | High |
| Safari | 15+ | Full | Medium |
| Edge | 89+ | Full | Medium |

### Testing Commands

```bash
# Run RTL tests across browsers
npx playwright test --project="RTL Chrome"
npx playwright test --project="RTL Firefox"
npx playwright test --grep="@rtl"
```

---

## Automated Verification Criteria

### CSS Logical Properties Check

```bash
# Script to verify no directional properties remain
grep -rE "(margin|padding)-(left|right)|border-(left|right)|^(left|right):" \
  src/**/*.css src/**/*.module.css \
  --include="*.css" \
  && echo "FAIL: Directional properties found" \
  || echo "PASS: All properties are logical"
```

### Translation Coverage Check

```bash
# Verify RTL translations exist
for ns in common settings cards mechanics errors accessibility; do
  [ -f "src/i18n/locales/ar/${ns}.json" ] || echo "Missing: ar/${ns}.json"
  [ -f "src/i18n/locales/he/${ns}.json" ] || echo "Missing: he/${ns}.json"
done
```

### Visual Regression CI

```yaml
# .github/workflows/rtl-test.yml
name: RTL Visual Tests

on: [push, pull_request]

jobs:
  visual-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test --project="RTL Chrome"
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: rtl-test-results
          path: test-results/
```

---

## Acceptance Criteria

### Automated (Must Pass)

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| No directional CSS properties | Stylelint | Yes |
| All RTL screenshots match baseline | Playwright | Yes |
| Translation files exist for ar, he | File check | Yes |
| JSON syntax valid | JSON linter | Yes |

### Manual (Must Pass)

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| Arabic reviewer sign-off | Checklist | Yes |
| Hebrew reviewer sign-off | Checklist | Yes |
| Layout feels natural | Reviewer feedback | Yes |
| No visual regressions in LTR | Playwright | Yes |

### Recommended (Should Pass)

| Criterion | Verification | Blocking |
|-----------|--------------|----------|
| Cross-browser consistency | Playwright multi-browser | No |
| Animation direction correct | Manual review | No |
| Scrollbar position correct | Manual review | No |

---

## Timeline and Resources

### Phase 1: Tooling Setup

1. Configure Stylelint with logical property rules
2. Set up Playwright for visual regression
3. Create baseline LTR screenshots

### Phase 2: CSS Migration Verification

1. Run Stylelint on migrated CSS
2. Fix any remaining directional properties
3. Update Playwright baselines

### Phase 3: Visual Testing

1. Generate RTL screenshots
2. Compare with expected mirroring
3. Fix layout issues

### Phase 4: Native Validation

1. Deploy to staging
2. Recruit 2-3 reviewers per language
3. Collect and triage feedback
4. Implement fixes
5. Obtain sign-off

---

## Recommendations

1. **Integrate Stylelint early** - Run during development to catch issues before PR
2. **Automate baseline updates** - Use Playwright's update-snapshots command
3. **Start reviewer recruitment now** - Finding native speakers takes time
4. **Document edge cases** - Some layouts may intentionally differ in RTL
5. **Plan for iteration** - First RTL release may need follow-up fixes

---

## Related Documentation

- [F-077: RTL Language Support](../roadmap/features/planned/F-077-rtl-support.md) - RTL implementation feature
- [State-of-the-Art: Internationalisation](./state-of-the-art-internationalisation.md) - i18n research
- [ADR-008: Playwright for E2E Testing](../decisions/adrs/ADR-008-e2e-testing.md) - Testing infrastructure
- [R-016: Accessibility i18n Integration](./R-016-accessibility-i18n-integration.md) - Accessibility considerations

---

**Status**: Complete
