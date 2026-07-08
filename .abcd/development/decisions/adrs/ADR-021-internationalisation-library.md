# ADR-021: Internationalisation Library

## Status

Accepted

## Context

Itemdeck needs to support multiple languages to reach a global audience. The application currently has ~360 user-facing strings hardcoded across 50+ component files. We need to select an internationalisation (i18n) library that:

1. Integrates well with React 18 and TypeScript strict mode
2. Supports lazy loading to maintain bundle size targets (200KB JS)
3. Provides type safety for translation keys
4. Aligns with the existing plugin architecture (mechanics can contribute translations)
5. Supports RTL languages (Arabic, Hebrew) for future v2.0.0 release

## Decision

Use **react-i18next** as the internationalisation library for Itemdeck.

### Key Configuration

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  fallbackLng: 'en-GB',
  defaultNS: 'common',
  ns: ['common'],  // Load common initially, others lazy
  interpolation: { escapeValue: false },
});
```

### Namespace Structure

| Namespace | Purpose | Approximate Keys |
|-----------|---------|------------------|
| `common` | Buttons, labels, shared UI | ~50 |
| `settings` | Settings panel strings | ~150 |
| `cards` | Card display, detail view | ~40 |
| `mechanics` | Game mode strings | ~30 |
| `errors` | Error messages | ~25 |
| `accessibility` | ARIA labels, announcements | ~30 |

## Consequences

### Positive

- **TypeScript Integration**: Auto-generated types from JSON files provide compile-time safety for translation keys, aligning with Itemdeck's strict TypeScript configuration
- **Namespace Support**: Feature-based namespaces enable lazy loading - settings translations load only when SettingsPanel opens
- **Plugin Compatibility**: Mechanics and themes can contribute their own translation namespaces via manifest, consistent with existing plugin architecture
- **Zustand Integration**: Language preference stores in `settingsStore` alongside other user preferences
- **Active Maintenance**: Weekly updates, 14M weekly downloads, strong community support
- **React 18 Support**: Full Suspense and concurrent mode compatibility

### Negative

- **Bundle Size**: ~26KB gzipped (larger than react-intl's ~12KB)
- **Non-Standard Format**: Uses custom interpolation syntax rather than ICU MessageFormat
- **Configuration Overhead**: Requires explicit setup (providers, types, namespace loading)

### Mitigations

- Bundle impact mitigated by Vite manual chunk splitting
- Configuration complexity is one-time setup cost
- Custom format is widely understood and well-documented

## Alternatives Considered

### react-intl (FormatJS)

**Rejected because:**
- Manual lazy loading implementation required
- Less flexible for plugin-contributed translations
- TypeScript key typing requires external tooling
- Requires Babel plugin for message extraction

**Would choose if:**
- ICU MessageFormat compliance was required
- Bundle size was critical constraint (<15KB)

### LinguiJS

**Rejected because:**
- Smaller community and ecosystem
- Requires Babel/SWC macro configuration
- Less mature integration options
- Fewer plugins available

**Would choose if:**
- Absolute minimum bundle size was required (~5KB)
- Compile-time extraction was primary concern

### No Library (Template Literals)

**Rejected because:**
- No lazy loading capability
- No pluralisation support
- No tooling for translators
- Maintenance burden at scale

---

## Related Documentation

- [State-of-the-Art: Internationalisation](../../research/state-of-the-art-internationalisation.md)
- [F-075: Internationalisation Foundation](../../roadmap/features/planned/F-075-internationalisation-foundation.md)
- [v1.5.0 Milestone](../../roadmap/milestones/v1.5.0.md)
