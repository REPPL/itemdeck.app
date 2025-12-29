# State-of-the-Art: Internationalisation (i18n)

## Executive Summary

This report analyses the current state of internationalisation in React applications, comparing leading libraries and recommending an approach for Itemdeck. **react-i18next** emerges as the recommended choice due to its flexibility, TypeScript integration, lazy loading capabilities, and alignment with Itemdeck's existing plugin architecture.

**Key Findings:**
- react-i18next is the market leader for React i18n (14M weekly downloads)
- TypeScript support is mature across all major libraries
- Namespace-based organisation enables lazy loading for bundle size control
- RTL support requires CSS logical properties, not library-specific features

**Recommendation:** Implement react-i18next with namespace-based translation files, integrating language preference into the existing Zustand settings store.

---

## Current State in Itemdeck

### Existing Patterns

Itemdeck currently has no internationalisation infrastructure. All user-facing strings are hardcoded in components:

```typescript
// Current pattern (src/components/SettingsPanel/QuickSettings.tsx)
<span className={styles.label}>Current Theme</span>
```

### String Audit Summary

| Category | Approximate Count | Location |
|----------|------------------|----------|
| Common UI (buttons, labels) | ~50 | Across all components |
| Settings panel | ~150 | SettingsPanel/ subdirectories |
| Error messages | ~25 | QueryErrorBoundary, LoadingScreen |
| ARIA labels | ~30 | All interactive components |
| Card display | ~40 | Card*, Detail view components |
| Mechanics | ~30 | mechanics/ directory |
| **Total** | **~325-360** | 50+ component files |

### British English Requirement

Per project standards, all text uses British English spelling. This means the default locale (`en-GB`) uses spellings like "colour", "behaviour", "customisation".

---

## Research Findings

### Library Comparison

| Aspect | react-i18next | react-intl | LinguiJS |
|--------|---------------|------------|----------|
| **Weekly Downloads** | 14.2M | 1.8M | 150K |
| **Bundle Size (gzip)** | ~26KB (core + react) | ~12KB | ~5KB |
| **TypeScript Support** | Excellent (auto-typed keys) | Good | Good |
| **Lazy Loading** | Native namespaces | Manual | Dynamic imports |
| **Message Format** | Custom interpolation | ICU MessageFormat | ICU MessageFormat |
| **React 18 Support** | Full (concurrent mode) | Full | Full |
| **Last Major Release** | Oct 2024 (v15) | Nov 2023 (v7) | Dec 2024 (v5) |
| **Maintenance** | Weekly updates | Monthly updates | Monthly updates |

### Detailed Analysis

#### react-i18next

**Strengths:**
- **Namespace support**: Split translations by feature area, load on demand
- **Plugin architecture**: Fits Itemdeck's existing modular design
- **TypeScript excellence**: Auto-generates types from JSON files
- **Zustand integration**: Language detection syncs naturally with existing store
- **React 18 ready**: Suspense and concurrent mode support
- **Extensive ecosystem**: Parsers, extractors, editors available

**Weaknesses:**
- Larger bundle than alternatives (~26KB vs ~12KB for react-intl)
- Non-standard message format (not ICU)
- Requires configuration (vs "just works" alternatives)

**Code Example:**
```typescript
// Initialisation
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  fallbackLng: 'en-GB',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  resources: {
    'en-GB': {
      common: require('./locales/en-GB/common.json'),
    },
  },
});

// Component usage
import { useTranslation } from 'react-i18next';

function QuickSettings() {
  const { t } = useTranslation('settings');
  return <span>{t('quick.theme.label')}</span>;
}
```

#### react-intl (FormatJS)

**Strengths:**
- ICU MessageFormat standard (industry standard)
- Smaller bundle size (~12KB)
- Built-in date/number formatting via Intl API
- Strong enterprise adoption
- Message extraction tooling

**Weaknesses:**
- Manual lazy loading implementation required
- Less flexible for dynamic scenarios
- TypeScript key typing requires external tooling
- Babel plugin required for message extraction

**Code Example:**
```typescript
import { IntlProvider, FormattedMessage } from 'react-intl';

function QuickSettings() {
  return (
    <FormattedMessage
      id="settings.quick.theme.label"
      defaultMessage="Current Theme"
    />
  );
}
```

#### LinguiJS

**Strengths:**
- Smallest bundle size (~5KB)
- ICU MessageFormat compatible
- Compile-time extraction
- Good DX with macros

**Weaknesses:**
- Smaller community and ecosystem
- Requires Babel/SWC macro configuration
- Less mature React 18 support
- Fewer integration options

### RTL Support Analysis

RTL (Right-to-Left) support is **independent of i18n library choice**. All three libraries support RTL languages equally. The key implementation factors are:

1. **HTML Direction Attribute**
   ```html
   <html dir="rtl" lang="ar">
   ```

2. **CSS Logical Properties** (modern approach)
   ```css
   /* Instead of: margin-left: 10px; */
   margin-inline-start: 10px;

   /* Instead of: text-align: left; */
   text-align: start;

   /* Instead of: border-right: 1px solid; */
   border-inline-end: 1px solid;
   ```

3. **Flexbox/Grid Automatic Handling**
   ```css
   /* flex-direction: row automatically reverses in RTL */
   display: flex;
   flex-direction: row;
   ```

4. **Icon Mirroring** (selective)
   - Directional icons (chevrons, arrows) should flip
   - Non-directional icons (close, settings) should not flip
   ```css
   [dir="rtl"] .icon-chevron {
     transform: scaleX(-1);
   }
   ```

### Namespace Organisation Patterns

**Feature-Based Namespaces** (Recommended for Itemdeck):
```
locales/
├── en-GB/
│   ├── common.json      # Buttons, labels, shared text
│   ├── settings.json    # Settings panel
│   ├── cards.json       # Card display
│   ├── mechanics.json   # Gaming mechanics
│   ├── errors.json      # Error messages
│   └── accessibility.json # ARIA labels
```

**Benefits:**
- Load only what's needed (settings namespace loads with SettingsPanel)
- Clear ownership (mechanics team owns mechanics.json)
- Smaller initial bundle (common.json loads first, others lazy)

### Key Naming Conventions

**Hierarchical Structure:**
```
namespace.category.element.variant
```

**Examples:**
```json
{
  "settings": {
    "tabs": {
      "quick": "Quick",
      "appearance": "Appearance"
    },
    "quick": {
      "theme": {
        "label": "Current Theme",
        "options": {
          "retro": "Retro",
          "modern": "Modern"
        }
      }
    }
  }
}
```

**Pluralisation (i18next format):**
```json
{
  "cards": {
    "count_one": "{{count}} card",
    "count_other": "{{count}} cards"
  }
}
```

### TypeScript Integration

**Auto-Generated Types with react-i18next:**
```typescript
// src/i18n/types.ts
import type common from './locales/en-GB/common.json';
import type settings from './locales/en-GB/settings.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      settings: typeof settings;
    };
  }
}
```

**Benefits:**
- Compile-time errors for missing keys
- IDE autocomplete for translation keys
- Refactoring safety when renaming keys

---

## Recommendations for Itemdeck

### Primary Recommendation: react-i18next

**Rationale:**
1. **Plugin Architecture Alignment**: Itemdeck already uses a registry-based plugin system. i18next's namespace model fits naturally - mechanics can contribute their own translation namespaces.

2. **TypeScript Strict Mode**: Itemdeck uses `noUncheckedIndexedAccess: true`. Auto-typed keys from react-i18next provide compile-time safety.

3. **Lazy Loading**: With a 200KB JS budget and PWA requirements, namespace-based lazy loading is essential. react-i18next provides this natively.

4. **Zustand Integration**: Language preference can live in `settingsStore` alongside other user preferences, syncing automatically with i18next.

### Implementation Architecture

```
src/
├── i18n/
│   ├── index.ts                    # i18next initialisation
│   ├── config.ts                   # Supported locales, fallbacks
│   ├── types.ts                    # TypeScript declarations
│   ├── hooks/
│   │   ├── useLocale.ts            # Language preference (wraps settingsStore)
│   │   └── useDateFormat.ts        # Locale-aware date formatting
│   ├── locales/
│   │   ├── en-GB/                  # British English (default)
│   │   │   ├── common.json
│   │   │   ├── settings.json
│   │   │   ├── cards.json
│   │   │   ├── mechanics.json
│   │   │   ├── errors.json
│   │   │   └── accessibility.json
│   │   ├── en-US/                  # American English (overrides)
│   │   │   └── common.json         # colour→color spellings only
│   │   ├── de/                     # German
│   │   └── ar/                     # Arabic (RTL, v2.0.0)
│   └── utils/
│       └── plurals.ts
```

### Language Support Roadmap

| Version | Languages | RTL | Notes |
|---------|-----------|-----|-------|
| v1.5.0 | en-GB, en-US, de | No | Foundation + first translation |
| v2.0.0 | + ar, he | Yes | Full RTL support |
| v2.x.0 | Community | Yes | Translation contribution system |

### Integration with Existing Systems

**Settings Store:**
```typescript
// src/stores/settingsStore.ts
interface SettingsState {
  // ... existing fields
  language: 'en-GB' | 'en-US' | 'de';
  setLanguage: (lang: string) => void;
}

// Sync with i18next on change
useSettingsStore.subscribe(
  (state) => state.language,
  (language) => i18n.changeLanguage(language)
);
```

**Provider Hierarchy:**
```typescript
// src/App.tsx
<I18nextProvider i18n={i18n}>
  <ConfigProvider>
    <SettingsProvider>
      {/* existing providers */}
    </SettingsProvider>
  </ConfigProvider>
</I18nextProvider>
```

---

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "i18next": "^24.0.0",
    "react-i18next": "^15.0.0",
    "i18next-browser-languagedetector": "^8.0.0"
  },
  "devDependencies": {
    "i18next-scanner": "^4.0.0"
  }
}
```

### Bundle Impact

| Package | Size (gzip) | Loading |
|---------|-------------|---------|
| i18next core | ~15KB | Initial |
| react-i18next | ~11KB | Initial |
| Language files | ~2-5KB each | Lazy per locale |

**Mitigation:** Vite manual chunks configuration:
```typescript
// vite.config.ts
manualChunks: {
  i18n: ['i18next', 'react-i18next'],
}
```

### Migration Path

**Phase 1: Infrastructure**
1. Install dependencies
2. Create i18n directory structure
3. Add I18nextProvider to App.tsx
4. Add language to settingsStore

**Phase 2: String Extraction** (by priority)
1. Common UI (~50 strings)
2. Error messages (~25 strings)
3. Settings panel (~150 strings)
4. Remaining strings (~100 strings)

**Phase 3: Additional Languages**
1. en-US variant (overrides only)
2. German translations
3. Language selector in settings

**Phase 4: RTL Preparation** (v2.0.0)
1. Audit CSS for logical property conversion
2. Implement icon mirroring system
3. Arabic and Hebrew translations

### Testing Strategy

**Unit Tests:**
```typescript
// tests/i18n/translations.test.ts
describe('Translation coverage', () => {
  it('all locales have matching keys', () => {
    const enKeys = flattenKeys(en);
    const deKeys = flattenKeys(de);
    expect(deKeys).toEqual(expect.arrayContaining(enKeys));
  });
});
```

**Component Tests:**
```typescript
// tests/utils/renderWithI18n.tsx
export function renderWithI18n(component: ReactElement) {
  return render(
    <I18nextProvider i18n={i18n}>{component}</I18nextProvider>
  );
}
```

### Potential Challenges

| Challenge | Mitigation |
|-----------|------------|
| Missing translations | TypeScript key typing, CI coverage checks |
| Bundle size growth | Namespace lazy loading, chunk splitting |
| RTL layout issues | Plan CSS logical properties from start |
| Plural complexity | Use i18next built-in plural rules |

---

## References

### Documentation
- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [FormatJS (react-intl)](https://formatjs.io/)
- [LinguiJS Documentation](https://lingui.dev/)

### Comparisons
- [react-intl vs react-i18next (locize)](https://www.locize.com/blog/react-intl-vs-react-i18next)
- [react-i18next vs react-intl (i18nexus)](https://i18nexus.com/posts/comparing-react-i18next-and-react-intl)
- [npm-compare: i18next libraries](https://npm-compare.com/i18next,react-i18next,react-intl)

### RTL Resources
- [MDN: CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
- [RTL Styling 101](https://rtlstyling.com/)

### Tools
- [i18next-scanner](https://github.com/i18next/i18next-scanner) - String extraction
- [i18n Ally VSCode Extension](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally) - IDE support

---

## Related Documentation

- [ADR-021: Internationalisation Library](../decisions/adrs/ADR-021-internationalisation-library.md)
- [F-075: Internationalisation Foundation](../roadmap/features/planned/F-075-internationalisation-foundation.md)
- [F-077: RTL Support](../roadmap/features/planned/F-077-rtl-support.md)
- [v1.5.0 Milestone](../roadmap/milestones/v1.5.0.md)
