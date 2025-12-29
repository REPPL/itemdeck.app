# F-075: Internationalisation Foundation

## Problem Statement

Itemdeck currently has ~360 user-facing strings hardcoded across 50+ component files. To reach a global audience, we need:
1. A system to extract and manage translations
2. Support for multiple languages (starting with en-GB, en-US, German)
3. Type-safe translation keys to prevent runtime errors
4. Lazy loading to maintain bundle size targets

## Design Approach

Implement **react-i18next** with namespace-based translation files:

1. **Namespace organisation**: Split translations by feature area (common, settings, cards, mechanics, errors, accessibility)
2. **Type safety**: Auto-generate TypeScript types from JSON files
3. **Lazy loading**: Load namespaces on demand (settings namespace loads with SettingsPanel)
4. **Zustand integration**: Store language preference in settingsStore
5. **British English default**: en-GB as fallback locale per project standards

### Directory Structure

```
src/
├── i18n/
│   ├── index.ts                    # i18next initialisation
│   ├── config.ts                   # Supported locales, fallbacks
│   ├── types.ts                    # TypeScript declarations
│   ├── namespaces.ts               # Namespace definitions
│   ├── hooks/
│   │   ├── useLocale.ts            # Language preference hook
│   │   └── useDateFormat.ts        # Locale-aware date formatting
│   ├── locales/
│   │   ├── en-GB/                  # British English (default)
│   │   │   ├── common.json         # ~50 keys
│   │   │   ├── settings.json       # ~150 keys
│   │   │   ├── cards.json          # ~40 keys
│   │   │   ├── mechanics.json      # ~30 keys
│   │   │   ├── errors.json         # ~25 keys
│   │   │   └── accessibility.json  # ~30 keys
│   │   ├── en-US/                  # American English (overrides)
│   │   │   └── common.json         # colour→color spellings
│   │   └── de/                     # German (full set)
│   └── utils/
│       └── plurals.ts              # Plural rule helpers
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add I18nextProvider to provider hierarchy |
| `src/stores/settingsStore.ts` | Add `language` field and sync with i18next |
| `vite.config.ts` | Add i18n chunk for lazy loading |
| `package.json` | Add i18next, react-i18next dependencies |
| `tsconfig.json` | Add path alias for i18n |

### Component Updates (50+ files)

All components with user-facing text need migration:
- `src/components/SettingsPanel/**/*.tsx` - Highest density (~150 strings)
- `src/components/QueryErrorBoundary/` - Error messages
- `src/components/HelpModal/` - Keyboard shortcuts
- `src/components/SearchBar/` - Search UI
- `src/components/LoadingScreen/` - Loading states
- `src/mechanics/**/*.tsx` - Mechanic strings

## Implementation Tasks

### Phase 1: Infrastructure
- [ ] Install dependencies (i18next, react-i18next, i18next-browser-languagedetector)
- [ ] Create `src/i18n/index.ts` with i18next initialisation
- [ ] Create `src/i18n/config.ts` with supported locales
- [ ] Create `src/i18n/types.ts` with TypeScript declarations
- [ ] Add I18nextProvider to App.tsx provider hierarchy
- [ ] Add `language` field to settingsStore
- [ ] Configure Vite manual chunks for i18n bundle

### Phase 2: String Extraction (Priority Order)
- [ ] Extract common UI strings (~50) to `common.json`
- [ ] Extract error messages (~25) to `errors.json`
- [ ] Extract settings panel strings (~150) to `settings.json`
- [ ] Extract help/keyboard shortcuts (~15) to `common.json`
- [ ] Extract search/filter strings (~20) to `common.json`
- [ ] Extract card display strings (~40) to `cards.json`
- [ ] Extract mechanic strings (~30) to `mechanics.json`
- [ ] Extract ARIA labels (~30) to `accessibility.json`

### Phase 3: Component Migration
- [ ] Update SettingsPanel components to use `t()` function
- [ ] Update QueryErrorBoundary to use `t()` function
- [ ] Update HelpModal to use `t()` function
- [ ] Update SearchBar to use `t()` function
- [ ] Update LoadingScreen to use `t()` function
- [ ] Update Card components to use `t()` function
- [ ] Update Mechanic components to use `t()` function
- [ ] Update remaining components

### Phase 4: Language Support
- [ ] Create en-US variant (spelling overrides only)
- [ ] Create German (de) translations
- [ ] Add language selector to Settings > System
- [ ] Add translation coverage tests
- [ ] Add CI check for missing keys

## Technical Considerations

### Key Naming Convention

```
namespace.category.element.variant
```

Examples:
- `settings.tabs.quick` - "Quick"
- `settings.quick.theme.label` - "Current Theme"
- `errors.collection.notFound` - "Collection not found"
- `common.actions.save` - "Save"

### Pluralisation

```json
{
  "cards": {
    "count_one": "{{count}} card",
    "count_other": "{{count}} cards"
  }
}
```

### Type Safety

```typescript
// src/i18n/types.ts
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('./locales/en-GB/common.json');
      settings: typeof import('./locales/en-GB/settings.json');
      // ...
    };
  }
}
```

### Component Pattern

```typescript
import { useTranslation } from 'react-i18next';

function QuickSettings() {
  const { t } = useTranslation('settings');

  return (
    <div>
      <span>{t('quick.theme.label')}</span>
      {/* ... */}
    </div>
  );
}
```

---

## Error Handling and Fallback Strategy

### Fallback Chain

When a translation is missing, i18next uses a fallback chain:

```
1. Requested language (e.g., 'de')
   ↓ (if missing)
2. Fallback language ('en-GB')
   ↓ (if missing)
3. Translation key as last resort
```

### Configuration

```typescript
// src/i18n/index.ts
i18n.init({
  fallbackLng: 'en-GB',
  returnEmptyString: false,  // Don't return empty strings
  returnNull: false,         // Don't return null

  // Handle missing keys
  saveMissing: process.env.NODE_ENV === 'development',
  missingKeyHandler: (lng, ns, key, fallbackValue) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Missing translation: ${lng}/${ns}/${key}`);
    }
    // In production, report to monitoring
  },

  // Interpolation safety
  interpolation: {
    escapeValue: false,  // React already escapes
    skipOnVariables: false,
  },
});
```

### Network Failure Handling

When lazy-loaded namespaces fail to fetch:

```typescript
// src/i18n/index.ts
import Backend from 'i18next-http-backend';

i18n.use(Backend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
    // Retry failed requests
    requestOptions: {
      mode: 'cors',
      cache: 'default',
    },
  },

  // Retry configuration
  load: 'currentOnly',
  preload: ['en-GB'],  // Always preload fallback

  // Handle load errors gracefully
  react: {
    useSuspense: true,
    bindI18n: 'languageChanged loaded',
  },
});

// Error boundary for translation loading
i18n.on('failedLoading', (lng, ns, msg) => {
  console.error(`Failed to load ${lng}/${ns}: ${msg}`);
  // Show user-friendly message if critical namespace fails
});
```

### Offline Translation Caching

Leverage service worker for offline support:

```typescript
// Service worker caches translation files
// vite-plugin-pwa configuration
workbox: {
  runtimeCaching: [
    {
      urlPattern: /\/locales\/.*\.json$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'translations',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        },
      },
    },
  ],
}
```

### User Experience During Loading

```typescript
// Suspense boundary for translation loading
function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <I18nextProvider i18n={i18n}>
        <AppContent />
      </I18nextProvider>
    </Suspense>
  );
}

// Namespace-level loading indicator
function SettingsPanel() {
  const { t, ready } = useTranslation('settings', { useSuspense: false });

  if (!ready) {
    return <SettingsSkeleton />;
  }

  return <SettingsContent t={t} />;
}
```

### Error Boundaries

```typescript
// Wrap translation-heavy components
function TranslationErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={
        <div role="alert">
          Unable to load translations. Please refresh the page.
        </div>
      }
      onError={(error) => {
        console.error('Translation error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## Community Contribution Integration

Translation contributions are managed via Weblate (see ADR-027).

### String Extraction Automation

```bash
# Extract new strings from source code
npm run i18n:extract

# Verify translation coverage
npm run i18n:check

# CI integration
npm run i18n:check || exit 1
```

### Contribution Workflow

1. Developers add strings with `t()` function
2. `i18next-scanner` extracts to en-GB JSON
3. Weblate syncs new keys from GitHub
4. Contributors translate in Weblate interface
5. Approved translations sync back to GitHub
6. Translations included in next release

### Quality Gates

| Check | Automation | Requirement |
|-------|------------|-------------|
| JSON syntax | CI | All files valid |
| Key coverage | CI | All en-GB keys in other locales |
| Interpolation | CI | Placeholders match source |
| Peer review | Weblate | Required for new languages |
| Native review | Manual | Required for RTL languages |

---

## Success Criteria

- [ ] All 360+ user-facing strings extracted to translation files
- [ ] TypeScript compile-time errors for missing/invalid keys
- [ ] Language selector in Settings with en-GB, en-US, de options
- [ ] Language preference persists across sessions
- [ ] Namespace lazy loading reduces initial bundle
- [ ] German translations complete and validated
- [ ] All existing tests pass with i18n wrapper
- [ ] No hardcoded user-facing strings in components

## Dependencies

- **Requires**: None
- **Blocks**: [F-077 RTL Support](./F-077-rtl-support.md)

## Complexity

**High** - Large-scale string extraction across 50+ files, requires careful migration to avoid breaking existing functionality.

---

## Related Documentation

- [State-of-the-Art: Internationalisation](../../../research/state-of-the-art-internationalisation.md)
- [R-013: Community Translation Workflow](../../../research/R-013-community-translation-workflow.md)
- [R-015: i18n Performance Benchmarks](../../../research/R-015-i18n-performance-benchmarks.md)
- [R-016: Accessibility i18n Integration](../../../research/R-016-accessibility-i18n-integration.md)
- [ADR-021: Internationalisation Library](../../../decisions/adrs/ADR-021-internationalisation-library.md)
- [ADR-027: Translation Management Workflow](../../../decisions/adrs/ADR-027-translation-management-workflow.md)
- [v2.0.0 Milestone](../../milestones/v2.0.0.md)

---

**Status**: Planned
