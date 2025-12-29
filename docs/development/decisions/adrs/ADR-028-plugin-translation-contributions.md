# ADR-028: Plugin Translation Contributions

## Status

Proposed (Deferred to v2.x)

## Context

Itemdeck's v1.5.0 milestone introduces a full plugin ecosystem where mechanics, themes, and sources can be distributed as plugins. v2.0.0 adds internationalisation. The intersection raises questions:

1. Can third-party plugins provide their own translations?
2. How do mechanic plugins contribute strings to the UI?
3. How are plugin translations validated?
4. What happens when a plugin translation is missing?

This ADR documents the intended approach for v2.x, deferred from v2.0.0 to focus on core i18n implementation first.

## Decision

**Defer plugin translation contributions to v2.x** and implement the following approach when ready:

### Namespace Isolation

Each plugin receives its own translation namespace:

```
src/i18n/locales/en-GB/
├── common.json              # Core app
├── settings.json            # Core app
├── plugin-memory.json       # Memory mechanic plugin
├── plugin-quiz.json         # Quiz mechanic plugin
└── plugin-custom-theme.json # Third-party theme
```

### Plugin Manifest Extension

```json
{
  "$schema": "https://itemdeck.app/schemas/plugin.json",
  "id": "my-mechanic",
  "version": "1.0.0",
  "type": "mechanic",
  "translations": {
    "namespace": "plugin-my-mechanic",
    "supported": ["en-GB", "en-US", "de"],
    "files": {
      "en-GB": "./locales/en-GB.json",
      "en-US": "./locales/en-US.json",
      "de": "./locales/de.json"
    }
  }
}
```

### Loading Strategy

1. **Built-in plugins** - Translations bundled with app
2. **Curated plugins** - Translations loaded from plugin package
3. **Community plugins** - Translations loaded from plugin URL

### Fallback Behaviour

When a plugin translation is missing:

1. Try user's selected language
2. Try fallback language (en-GB)
3. Display translation key as last resort
4. Log warning for missing translations

### Validation Requirements

| Plugin Tier | Validation | Requirement |
|-------------|------------|-------------|
| Built-in | Full coverage | All core languages required |
| Curated | Verified | en-GB required, others recommended |
| Community | None | en-GB recommended only |

## Consequences

### Positive

- **Extensible** - Plugins can provide fully localised experiences
- **Isolated** - Plugin translations don't conflict with core
- **Flexible** - Plugin authors choose which languages to support
- **Graceful degradation** - Missing translations handled safely

### Negative

- **Complexity** - Additional loading and merging logic
- **Quality variability** - Community plugins may have poor translations
- **Bundle size** - Each plugin adds translation overhead

### Mitigations

- Lazy load plugin translations with plugin activation
- Provide translation template generator for plugin authors
- Document best practices for plugin localisation

## Rationale for Deferral

v2.0.0 scope is already significant:
- 360+ core strings to translate
- RTL CSS migration across 100+ files
- Visual regression testing setup
- Native speaker validation workflow

Adding plugin translation infrastructure increases:
- Implementation complexity
- Testing surface area
- Documentation requirements

Deferring allows:
- Focus on solid core i18n foundation
- Learning from v2.0.0 implementation
- Community feedback on translation workflow

## Implementation Notes (for v2.x)

### Phase 1: Plugin Manifest Schema

Extend plugin manifest to include translations section.

### Phase 2: Translation Loader

Modify i18next configuration to load plugin namespaces:

```typescript
// On plugin activation
async function loadPluginTranslations(plugin: Plugin) {
  const { namespace, files } = plugin.manifest.translations;
  const currentLanguage = i18n.language;

  if (files[currentLanguage]) {
    const translations = await fetchTranslations(files[currentLanguage]);
    i18n.addResourceBundle(currentLanguage, namespace, translations);
  }
}
```

### Phase 3: Component Integration

Provide hook for plugin components:

```typescript
// In plugin component
import { usePluginTranslation } from '@itemdeck/plugin-api';

function MyMechanicOverlay() {
  const { t } = usePluginTranslation('plugin-my-mechanic');
  return <div>{t('overlay.title')}</div>;
}
```

### Phase 4: Documentation

Create plugin localisation guide covering:
- Manifest configuration
- File structure
- Key naming conventions
- Testing recommendations

---

## Related Documentation

- [ADR-021: Internationalisation Library](./ADR-021-internationalisation-library.md)
- [ADR-026: Plugin Manifest Schema](./ADR-026-plugin-manifest-schema.md)
- [v1.5.0: Full Plugin Ecosystem](../../roadmap/milestones/v1.5.0.md)
- [v2.0.0: Internationalisation](../../roadmap/milestones/v2.0.0.md)

---
