# R-016: Accessibility and Internationalisation Integration

## Executive Summary

This research examines the intersection of accessibility (a11y) and internationalisation (i18n) in Itemdeck. Ensuring accessible multilingual support requires careful consideration of ARIA labels, screen reader behaviour, language attributes, and RTL-specific accessibility concerns.

**Key Findings:**
- ARIA labels must be localised alongside visible text
- Screen readers behave differently in RTL languages - testing is essential
- The `lang` attribute must be dynamically updated for language switching
- `aria-live` regions require careful handling with translation changes

**Recommendation:** Extend the accessibility namespace with comprehensive ARIA labels, implement dynamic `lang` attribute management, and include screen reader testing in the RTL validation workflow.

---

## ARIA Label Localisation

### Current State

Itemdeck has ~30 ARIA labels planned for the `accessibility.json` namespace:

```json
{
  "aria": {
    "navigation": {
      "mainMenu": "Main navigation menu",
      "settingsButton": "Open settings panel",
      "closeButton": "Close dialog"
    },
    "cards": {
      "gridLabel": "Card collection grid",
      "cardButton": "View card details for {{title}}",
      "flipCard": "Flip card to see reverse"
    }
  }
}
```

### Requirements

1. **All ARIA labels must be translated** - Screen readers read these aloud
2. **Interpolation must preserve context** - `{{title}}` placeholders work correctly
3. **Pluralisation** - "1 card selected" vs "5 cards selected"
4. **Gender agreement** - Some languages require grammatical gender

### Implementation Pattern

```typescript
// Component with localised ARIA
function CardGrid({ cards }: { cards: Card[] }) {
  const { t } = useTranslation('accessibility');

  return (
    <div
      role="grid"
      aria-label={t('aria.cards.gridLabel')}
      aria-rowcount={cards.length}
    >
      {cards.map((card) => (
        <button
          key={card.id}
          aria-label={t('aria.cards.cardButton', { title: card.title })}
        >
          {/* card content */}
        </button>
      ))}
    </div>
  );
}
```

### Comprehensive ARIA Labels Inventory

| Category | Label | Key | Notes |
|----------|-------|-----|-------|
| Navigation | Main menu | `aria.nav.mainMenu` | |
| Navigation | Settings button | `aria.nav.settings` | |
| Navigation | Close button | `aria.nav.close` | Used in modals |
| Cards | Grid label | `aria.cards.grid` | |
| Cards | Card button | `aria.cards.button` | Interpolated |
| Cards | Flip action | `aria.cards.flip` | |
| Cards | Selection count | `aria.cards.selected` | Pluralised |
| Settings | Panel label | `aria.settings.panel` | |
| Settings | Tab list | `aria.settings.tabs` | |
| Settings | Tab item | `aria.settings.tab` | Interpolated |
| Mechanics | Game status | `aria.mechanics.status` | Dynamic |
| Mechanics | Timer | `aria.mechanics.timer` | Live region |
| Mechanics | Score | `aria.mechanics.score` | Live region |
| Search | Search input | `aria.search.input` | |
| Search | Results count | `aria.search.results` | Pluralised |
| Errors | Error message | `aria.errors.message` | Alert role |
| Loading | Loading state | `aria.loading.state` | |

---

## Language Attribute Management

### The `lang` Attribute

The HTML `lang` attribute tells assistive technologies which language to use for pronunciation:

```html
<!-- Correct pronunciation depends on this -->
<html lang="ar" dir="rtl">
```

### Dynamic Language Switching

```typescript
// src/App.tsx
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { isRTLLocale } from '@/i18n/config';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update document language
    document.documentElement.lang = i18n.language;

    // Update direction for RTL languages
    document.documentElement.dir = isRTLLocale(i18n.language) ? 'rtl' : 'ltr';
  }, [i18n.language]);

  return <AppContent />;
}
```

### Mixed Language Content

When content includes multiple languages (e.g., English product names in Arabic UI):

```tsx
// Mark inline language changes
<p>
  {t('settings.theme.label')}:
  <span lang="en">Modern Theme</span>
</p>
```

---

## Live Regions and Dynamic Content

### Challenge

`aria-live` regions announce content changes to screen readers. When translations change dynamically, we need to ensure announcements are appropriate.

### Implementation

```typescript
// Announce important changes
function GameTimer({ seconds }: { seconds: number }) {
  const { t } = useTranslation('mechanics');
  const announcement = t('timer.remaining', { seconds });

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
}

// Avoid announcing every keystroke
function SearchResults({ count }: { count: number }) {
  const { t } = useTranslation('accessibility');
  const [debouncedCount, setDebouncedCount] = useState(count);

  // Debounce to avoid excessive announcements
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCount(count), 500);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {t('aria.search.results', { count: debouncedCount })}
    </div>
  );
}
```

### Live Region Guidelines

| Region Type | `aria-live` | Use Case |
|-------------|-------------|----------|
| Error alerts | `assertive` | Error messages that need immediate attention |
| Search results | `polite` | Non-urgent status updates |
| Game timer | `polite` | Periodic updates (not every second) |
| Loading state | `polite` | Loading/complete states |
| Score changes | `polite` | Game score updates |

---

## Screen Reader Testing

### Testing Tools

| Tool | Platform | Languages Tested |
|------|----------|------------------|
| VoiceOver | macOS/iOS | All (good Arabic support) |
| NVDA | Windows | All (good multilingual support) |
| JAWS | Windows | All (industry standard) |
| TalkBack | Android | All |

### Testing Checklist

```markdown
# Screen Reader Testing - [Language]

## Navigation
- [ ] Main menu announces correctly
- [ ] Tab navigation reads labels in correct language
- [ ] Focus order makes sense for RTL

## Cards
- [ ] Card titles read correctly
- [ ] Card actions announced properly
- [ ] Grid navigation works (arrow keys)

## Forms
- [ ] Input labels read correctly
- [ ] Error messages announced
- [ ] Required fields indicated

## Dynamic Content
- [ ] Live regions announce updates
- [ ] Loading states announced
- [ ] Error alerts interrupt appropriately

## Language Switching
- [ ] New language applied immediately
- [ ] Screen reader switches pronunciation
- [ ] Focus remains stable after switch
```

### RTL-Specific Screen Reader Considerations

| Consideration | LTR Behaviour | RTL Behaviour |
|---------------|---------------|---------------|
| Reading order | Left to right | Right to left |
| Arrow keys | Left=back, Right=forward | Right=back, Left=forward |
| Tab order | Left to right | Right to left (usually) |
| Number reading | Standard | May need special handling |

---

## WCAG Compliance for Multilingual Sites

### Relevant Success Criteria

| Criterion | Level | Requirement | i18n Impact |
|-----------|-------|-------------|-------------|
| 1.3.2 Meaningful Sequence | A | Content order preserved | RTL affects visual order |
| 2.4.2 Page Titled | A | Page title descriptive | Must be translated |
| 3.1.1 Language of Page | A | `lang` attribute set | Must update dynamically |
| 3.1.2 Language of Parts | AA | `lang` for inline changes | Mark mixed language content |
| 4.1.2 Name, Role, Value | A | ARIA labels accessible | Must be translated |

### Implementation Checklist

- [ ] `<html lang="...">` updated on language change
- [ ] `<html dir="...">` updated for RTL languages
- [ ] `<title>` element translated
- [ ] All ARIA labels translated
- [ ] Inline language changes marked with `lang` attribute
- [ ] Live regions use appropriate `aria-live` values
- [ ] Focus visible in all colour themes

---

## Error Handling for Translation Failures

### Fallback Strategy

```typescript
// i18n configuration with fallback handling
i18n.init({
  fallbackLng: 'en-GB',
  saveMissing: true,
  missingKeyHandler: (lng, ns, key) => {
    console.warn(`Missing translation: ${lng}/${ns}/${key}`);
    // Report to monitoring
  },
  // Return key name if translation missing (for ARIA, use descriptive keys)
  returnEmptyString: false,
});
```

### ARIA Label Fallbacks

```typescript
// Ensure ARIA labels always have meaningful text
function getAriaLabel(key: string, fallback: string): string {
  const translated = t(key);
  // If translation returns the key (missing), use fallback
  return translated === key ? fallback : translated;
}

// Usage
<button aria-label={getAriaLabel('aria.nav.close', 'Close')}>
  <CloseIcon />
</button>
```

---

## Accessibility Testing Tools for i18n

### Automated Tools

| Tool | Purpose | i18n Support |
|------|---------|--------------|
| axe-core | General a11y testing | Good |
| Lighthouse | Audit scores | Good |
| eslint-plugin-jsx-a11y | React linting | Limited |
| pa11y | CLI testing | Good |

### Integration

```bash
# axe-core with Playwright
npm install @axe-core/playwright

# Test configuration
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('accessibility in RTL', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  });

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Recommendations

### 1. Extend Accessibility Namespace

Create comprehensive ARIA labels in `accessibility.json`:

```json
{
  "aria": {
    "navigation": { /* 10+ labels */ },
    "cards": { /* 15+ labels */ },
    "settings": { /* 10+ labels */ },
    "mechanics": { /* 10+ labels */ },
    "search": { /* 5+ labels */ },
    "errors": { /* 5+ labels */ },
    "loading": { /* 3+ labels */ }
  },
  "announcements": {
    "pageLoaded": "Page loaded",
    "languageChanged": "Language changed to {{language}}",
    "settingsSaved": "Settings saved"
  }
}
```

### 2. Implement Language Management Hook

```typescript
// src/hooks/useLanguageManager.ts
export function useLanguageManager() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = isRTLLocale(i18n.language) ? 'rtl' : 'ltr';

    // Announce language change to screen readers
    announceToScreenReader(
      t('announcements.languageChanged', { language: i18n.language })
    );
  }, [i18n.language]);
}
```

### 3. Include Screen Reader Testing in RTL Validation

Add to F-077 requirements:
- Screen reader testing checklist for Arabic
- Screen reader testing checklist for Hebrew
- VoiceOver and NVDA testing minimum

### 4. Document Mixed Language Patterns

Create guidelines for marking inline language changes in components.

---

## Related Documentation

- [F-075: Internationalisation Foundation](../roadmap/features/planned/F-075-internationalisation-foundation.md) - Core i18n implementation
- [F-019: Accessibility Audit](../roadmap/features/planned/F-019-accessibility-audit.md) - Accessibility audit feature
- [Accessibility Research](./accessibility.md) - Accessibility research foundation
- [R-014: RTL Testing Strategy](./R-014-rtl-testing-strategy.md) - RTL testing methodology
- [ADR-011: WCAG 2.2 AA Accessibility Standard](../decisions/adrs/ADR-011-accessibility-standard.md) - Accessibility standard

---

**Status**: Complete
