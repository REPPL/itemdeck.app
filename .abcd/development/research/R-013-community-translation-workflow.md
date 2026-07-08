# R-013: Community Translation Workflow

## Executive Summary

This research evaluates translation management platforms and workflows for community-contributed translations in Itemdeck. Given the open-source nature of the project and the goal of reaching a global audience, we need a sustainable model for translation contribution, validation, and deployment.

**Key Findings:**
- Weblate offers the best balance of features, open-source ethos, and cost for community projects
- GitHub-native workflow (PRs with JSON files) is viable but lacks translation memory
- String extraction automation via i18next-scanner reduces maintenance burden
- Validation workflow is critical for quality - machine translation as fallback only

**Recommendation:** Use **Weblate** (self-hosted or hosted) for translation management with GitHub synchronisation, combined with i18next-scanner for string extraction.

---

## Translation Platform Comparison

### Evaluated Platforms

| Platform | Pricing | Open Source | GitHub Sync | Translation Memory | Community Model |
|----------|---------|-------------|-------------|-------------------|-----------------|
| **Weblate** | Free (self-hosted) / €19/mo hosted | Yes (GPL-3.0) | Yes | Yes | Excellent |
| **Crowdin** | Free (OSS) / $44/mo | No | Yes | Yes | Good |
| **Lokalise** | $120/mo | No | Yes | Yes | Limited |
| **POEditor** | Free (1000 strings) / $15/mo | No | Yes | Yes | Good |
| **Transifex** | Free (OSS) / $99/mo | No | Yes | Yes | Good |
| **GitHub PRs** | Free | N/A | Native | No | Basic |

### Detailed Analysis

#### Weblate (Recommended)

**Strengths:**
- Fully open source (GPL-3.0) - aligns with Itemdeck's GPL-3.0 licence
- Self-hosting option (zero cost)
- Hosted option at reasonable price (€19/mo for small projects)
- Excellent GitHub/GitLab integration with automatic sync
- Built-in translation memory and machine translation suggestions
- Review workflow for quality control
- Component-based organisation matches namespace structure
- Supports JSON format natively

**Weaknesses:**
- Self-hosting requires infrastructure
- Smaller community than Crowdin
- UI less polished than commercial alternatives

**Code Integration:**
```yaml
# .weblate configuration
format: json
filemask: src/i18n/locales/*/common.json
source_language: en-GB
```

#### Crowdin

**Strengths:**
- Free for open source projects
- Large translator community
- Polished UI and workflow
- Excellent documentation
- In-context editing (visual mode)

**Weaknesses:**
- Closed source platform
- Free tier requires OSS approval process
- Less control over data

#### GitHub-Native (PRs with JSON)

**Strengths:**
- Zero additional tooling
- Familiar workflow for developers
- Full control over process
- No external dependencies

**Weaknesses:**
- No translation memory
- No duplicate detection
- Difficult for non-technical translators
- Higher barrier to contribution
- No built-in review workflow

---

## String Extraction Automation

### i18next-scanner

Automated extraction of translatable strings from source code:

```bash
# Install
npm install --save-dev i18next-scanner

# Configuration file
# i18next-scanner.config.js
```

```javascript
// i18next-scanner.config.js
module.exports = {
  input: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
  ],
  output: './',
  options: {
    debug: true,
    removeUnusedKeys: true,
    sort: true,
    func: {
      list: ['t', 'i18next.t'],
      extensions: ['.ts', '.tsx'],
    },
    trans: {
      component: 'Trans',
      extensions: ['.tsx'],
    },
    lngs: ['en-GB'],
    ns: ['common', 'settings', 'cards', 'mechanics', 'errors', 'accessibility'],
    defaultLng: 'en-GB',
    defaultNs: 'common',
    resource: {
      loadPath: 'src/i18n/locales/{{lng}}/{{ns}}.json',
      savePath: 'src/i18n/locales/{{lng}}/{{ns}}.json',
      jsonIndent: 2,
    },
    keySeparator: '.',
    nsSeparator: ':',
  },
};
```

### Extraction Workflow

```bash
# Package.json scripts
"i18n:extract": "i18next-scanner",
"i18n:check": "i18next-scanner --fail-on-warnings"

# CI integration
npm run i18n:check
```

### Key Detection Patterns

```typescript
// Detected patterns
t('common.actions.save')
t('settings.tabs.appearance')
<Trans i18nKey="cards.count" count={5}>{{count}} cards</Trans>
```

---

## Contributor Workflow

### Recommended Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. String Extraction (Developer)                             │
│    └── i18next-scanner extracts new keys to en-GB JSON       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Sync to Translation Platform (Automated)                  │
│    └── Weblate/Crowdin pulls new keys from GitHub            │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Community Translation (Contributors)                      │
│    └── Translators work in web interface                     │
│    └── Translation memory suggests similar translations      │
│    └── Machine translation provides starting point           │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Review Process (Reviewers)                                │
│    └── Native speakers review submissions                    │
│    └── Reviewers approve or request changes                  │
│    └── Disputed translations escalated                       │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Merge to Repository (Automated)                           │
│    └── Approved translations sync back to GitHub             │
│    └── PR created or direct commit to translations branch    │
│    └── CI validates JSON format                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Release (Developer)                                       │
│    └── Translations included in next release                 │
│    └── Translation coverage reported                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Quality Assurance

### Validation Levels

| Level | Validator | Required For |
|-------|-----------|--------------|
| **Automated** | JSON syntax, key matching | All submissions |
| **Machine** | Grammar/spelling check | Suggestion only |
| **Peer Review** | Another translator | New languages |
| **Native Review** | Native speaker | RTL languages, key UI |

### Automated Checks

```typescript
// Translation validation script
function validateTranslations(locale: string) {
  const source = loadJSON('en-GB');
  const target = loadJSON(locale);

  // 1. Key coverage
  const missingKeys = findMissingKeys(source, target);
  if (missingKeys.length > 0) {
    console.error(`Missing keys in ${locale}:`, missingKeys);
  }

  // 2. Interpolation matching
  const interpolationErrors = checkInterpolations(source, target);
  if (interpolationErrors.length > 0) {
    console.error('Interpolation mismatch:', interpolationErrors);
  }

  // 3. Plural forms
  const pluralErrors = checkPluralForms(locale, target);
  if (pluralErrors.length > 0) {
    console.error('Plural form issues:', pluralErrors);
  }
}
```

### Review Workflow

1. **Submission**: Translator submits translation
2. **Automated Check**: CI validates format and interpolations
3. **Peer Review**: Another translator reviews (for new languages)
4. **Native Review**: Native speaker validates (for RTL/critical strings)
5. **Approval**: Reviewer approves or requests changes
6. **Merge**: Approved translations merged to main branch

---

## Language Priority

### Phase 1 (v2.0.0)

| Language | Code | Priority | Notes |
|----------|------|----------|-------|
| British English | en-GB | Default | Source language |
| American English | en-US | High | Spelling variants only |
| German | de | High | Large user base |

### Phase 2 (v2.0.0 RTL)

| Language | Code | Priority | Notes |
|----------|------|----------|-------|
| Arabic | ar | High | RTL, requires native review |
| Hebrew | he | High | RTL, requires native review |

### Phase 3 (Community-Driven)

| Language | Code | Priority | Notes |
|----------|------|----------|-------|
| French | fr | Medium | Community contributed |
| Spanish | es | Medium | Community contributed |
| Portuguese | pt-BR | Medium | Community contributed |
| Japanese | ja | Medium | Community contributed |
| Chinese | zh-CN | Medium | Community contributed |

---

## File Structure and Format

### Directory Organisation

```
src/i18n/locales/
├── en-GB/                    # Source language
│   ├── common.json
│   ├── settings.json
│   ├── cards.json
│   ├── mechanics.json
│   ├── errors.json
│   └── accessibility.json
├── en-US/                    # Overrides only
│   └── common.json           # colour→color, etc.
├── de/                       # Full translation
│   ├── common.json
│   ├── settings.json
│   └── ...
└── ar/                       # RTL language
    ├── common.json
    └── ...
```

### JSON Format

```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "messages": {
    "saved": "Changes saved successfully",
    "deleted_one": "{{count}} item deleted",
    "deleted_other": "{{count}} items deleted"
  }
}
```

### Naming Conventions

- Keys: `camelCase`
- Namespaces: `lowercase`
- Plurals: `_one`, `_other`, `_zero` suffixes (i18next format)

---

## Contributor Onboarding

### Documentation Required

1. **CONTRIBUTING.md** section on translations
2. **Translation Guide** with style guidelines
3. **Glossary** of technical terms
4. **Context descriptions** for ambiguous strings

### Contributor Guide Template

```markdown
# Contributing Translations

## Getting Started
1. Visit [translation platform URL]
2. Create an account or sign in with GitHub
3. Select a language to contribute

## Guidelines
- Use formal language (not casual/slang)
- Preserve {{placeholders}} exactly as shown
- Check existing translations for consistency
- Ask questions in discussion forum

## Review Process
- New contributors: All translations reviewed
- Trusted contributors: Auto-approved after X contributions
- Native speakers: Elevated review privileges
```

---

## Recommendations

### Platform Selection

**Recommended:** Weblate (hosted or self-hosted)

**Rationale:**
1. Open source alignment with Itemdeck's GPL-3.0 licence
2. Excellent GitHub integration with bidirectional sync
3. Component-based organisation matches namespace structure
4. Built-in review workflow for quality control
5. Free self-hosted option, affordable hosted option

### Implementation Steps

1. **Set up Weblate** (hosted.weblate.org or self-hosted)
2. **Configure GitHub sync** for translation files
3. **Add i18next-scanner** for string extraction
4. **Create contributor documentation**
5. **Recruit initial translators** for German, Arabic, Hebrew
6. **Establish review workflow** with native speakers

### Quality Gates

| Gate | Requirement | Automation |
|------|-------------|------------|
| JSON Validity | Valid JSON syntax | CI |
| Key Coverage | 100% keys translated | CI |
| Interpolation | All placeholders preserved | CI |
| Peer Review | 1 approval (new languages) | Platform |
| Native Review | Required for RTL | Manual |

---

## Related Documentation

- [v2.0.0 Milestone](../roadmap/milestones/v2.0.0.md) - Internationalisation milestone
- [State-of-the-Art: Internationalisation](./state-of-the-art-internationalisation.md) - i18n library research
- [ADR-021: Internationalisation Library](../decisions/adrs/ADR-021-internationalisation-library.md) - Library selection
- [F-075: Internationalisation Foundation](../roadmap/features/planned/F-075-internationalisation-foundation.md) - Core implementation
- [R-015: i18n Performance Benchmarks](./R-015-i18n-performance-benchmarks.md) - Performance metrics

---

**Status**: Complete
