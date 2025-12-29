# R-015: Internationalisation Performance Benchmarks

## Executive Summary

This research document establishes baseline performance metrics and monitoring methodology for internationalisation (i18n) implementation in Itemdeck. The goal is to ensure i18n adds minimal bundle overhead while maintaining the 200KB JS gzipped target.

**Key Findings:**
- Current bundle target: 200KB JS (gzipped), 15KB CSS (gzipped)
- i18next + react-i18next footprint: ~26KB gzipped
- Namespace lazy loading can reduce initial load by 60-70%
- Size-limit CI integration already configured

**Recommendation:** Allocate 30KB performance budget for i18n infrastructure, with lazy-loaded translation files adding ~2-5KB per language.

---

## Current Bundle Baseline

### Configured Limits

From `package.json`:

```json
"size-limit": [
  {
    "path": "dist/assets/*.js",
    "limit": "200 KB",
    "gzip": true
  },
  {
    "path": "dist/assets/*.css",
    "limit": "15 KB",
    "gzip": true
  }
]
```

### Measurement Commands

```bash
# Check current bundle size
npm run size

# Verify against limits (fails CI if exceeded)
npm run size:check

# Build and analyse
npm run build && npx size-limit
```

---

## i18n Library Footprint Analysis

### i18next Ecosystem Packages

| Package | Size (gzip) | Required | Notes |
|---------|-------------|----------|-------|
| `i18next` | ~15KB | Yes | Core library |
| `react-i18next` | ~11KB | Yes | React bindings |
| `i18next-browser-languagedetector` | ~4KB | Recommended | Auto-detect browser language |
| **Total Core** | **~26KB** | - | Initial load impact |

### Translation File Sizes (Estimated)

| Namespace | Keys | Size (gzip) | Loading |
|-----------|------|-------------|---------|
| `common` | ~50 | ~1KB | Initial |
| `settings` | ~150 | ~3KB | Lazy |
| `cards` | ~40 | ~1KB | Lazy |
| `mechanics` | ~30 | ~1KB | Lazy |
| `errors` | ~25 | ~1KB | Lazy |
| `accessibility` | ~30 | ~1KB | Lazy |
| **Total per language** | **~325** | **~8KB** | Mixed |

### Budget Allocation

| Category | Budget | Notes |
|----------|--------|-------|
| i18next core libraries | 30KB | Fixed overhead |
| Initial translations (common) | 1KB per language | Loaded upfront |
| Lazy namespaces | 7KB per language | Loaded on demand |
| **Initial load impact** | **~31KB** | Core + common.json |

---

## Lazy Loading Strategy

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate i18n core into its own chunk
          'i18n': ['i18next', 'react-i18next'],
          // Translation files lazy load automatically
        }
      }
    }
  }
});
```

### Namespace Lazy Loading

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  fallbackLng: 'en-GB',
  ns: ['common'], // Only load common initially
  defaultNS: 'common',

  // Backend configuration for lazy loading
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },

  // Suspend rendering until ready
  react: {
    useSuspense: true,
  },
});
```

### Component-Level Loading

```typescript
// Load namespace when component mounts
import { useTranslation } from 'react-i18next';

function SettingsPanel() {
  // This triggers lazy load of 'settings' namespace
  const { t, ready } = useTranslation('settings');

  if (!ready) return <LoadingSpinner />;

  return <div>{t('tabs.appearance')}</div>;
}
```

---

## Performance Monitoring

### CI Integration

The existing `size-limit` configuration provides CI checks:

```bash
# Fails if bundle exceeds limits
npm run size:check
```

### Measuring i18n Impact

Before and after comparison:

```bash
# Before i18n (baseline)
npm run build
npx size-limit

# After i18n integration
npm install i18next react-i18next
npm run build
npx size-limit
```

### Recommended Monitoring Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Initial JS bundle | <200KB gzip | size-limit |
| i18n chunk | <30KB gzip | size-limit |
| Translation files | <5KB each gzip | size-limit |
| LCP (Largest Contentful Paint) | <2.5s | Lighthouse |
| TTI (Time to Interactive) | <3.5s | Lighthouse |

---

## Namespace Preloading Strategy

### Priority Order

1. **Critical (load immediately):**
   - `common` - UI elements visible on first render

2. **High (preload after hydration):**
   - `errors` - Error messages must be available fast
   - `accessibility` - Screen reader content

3. **Medium (load on route):**
   - `settings` - When settings panel opens
   - `cards` - When card detail view opens

4. **Low (load on interaction):**
   - `mechanics` - When game mode activates

### Preloading Implementation

```typescript
// Preload after app hydration
useEffect(() => {
  // Preload high-priority namespaces
  i18n.loadNamespaces(['errors', 'accessibility']);
}, []);

// Preload on hover/focus for anticipated interactions
const handleSettingsHover = () => {
  i18n.loadNamespaces(['settings']);
};
```

---

## Testing Methodology

### Bundle Size Verification

```bash
# Automated test script
#!/bin/bash
set -e

echo "Building production bundle..."
npm run build

echo "Checking bundle size limits..."
npm run size:check

echo "Detailed size breakdown..."
npx size-limit --json | jq '.'
```

### Translation File Size Check

```bash
# Check translation file sizes
find dist/locales -name "*.json" -exec gzip -c {} \; | wc -c
```

### Performance Testing

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun
```

---

## Recommendations

### 1. Budget Allocation

| Component | Allocated | Notes |
|-----------|-----------|-------|
| i18next + react-i18next | 30KB | Non-negotiable core |
| Initial translations | 2KB | common.json only |
| Lazy translations | Per-route | Load as needed |
| **Total initial impact** | **~32KB** | 16% of 200KB budget |

### 2. Optimisation Techniques

1. **Tree shaking**: Import only used i18next features
2. **Dynamic imports**: Use `import()` for translation files
3. **Compression**: Ensure gzip/brotli on server
4. **Caching**: Set long cache headers for translation files

### 3. CI Configuration Update

```json
// package.json update
"size-limit": [
  {
    "path": "dist/assets/*.js",
    "limit": "200 KB",
    "gzip": true
  },
  {
    "path": "dist/assets/i18n*.js",
    "limit": "30 KB",
    "gzip": true,
    "name": "i18n chunk"
  },
  {
    "path": "dist/locales/**/*.json",
    "limit": "5 KB",
    "gzip": true,
    "name": "translation file"
  }
]
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Bundle exceeds 200KB | Lazy load more namespaces |
| Slow initial load | Preload critical translations inline |
| Translation files too large | Split into smaller namespaces |
| Cache invalidation issues | Version translation file paths |

---

## Related Documentation

- [State-of-the-Art: Internationalisation](./state-of-the-art-internationalisation.md)
- [ADR-021: Internationalisation Library](../decisions/adrs/ADR-021-internationalisation-library.md)
- [F-075: Internationalisation Foundation](../roadmap/features/planned/F-075-internationalisation-foundation.md)

---

**Status**: Complete
