# ADR-027: Translation Management Workflow

## Status

Accepted

## Context

Itemdeck is implementing internationalisation (i18n) to support multiple languages including RTL languages (Arabic, Hebrew). With the goal of reaching a global audience, we need to decide how translations will be:

1. **Created** - Who writes the initial translations?
2. **Contributed** - How do community members contribute translations?
3. **Validated** - How do we ensure translation quality?
4. **Deployed** - How do translations reach users?

The user has confirmed a preference for **community contributions** over an internally-managed model.

## Decision

Use **Weblate** as the translation management platform with GitHub synchronisation, combined with **i18next-scanner** for automated string extraction.

### Platform: Weblate

**Selected:** Weblate (hosted at hosted.weblate.org or self-hosted)

**Rationale:**
1. **Open source** (GPL-3.0) - Aligns with Itemdeck's GPL-3.0 licence
2. **GitHub integration** - Bidirectional sync keeps translations in repository
3. **Component-based** - Maps directly to i18next namespaces
4. **Translation memory** - Reduces duplicate work across namespaces
5. **Review workflow** - Built-in approval process for quality control
6. **Free for open source** - No cost for public projects

### String Extraction: i18next-scanner

Automated extraction ensures all translatable strings are captured:

```javascript
// i18next-scanner.config.js
module.exports = {
  input: ['src/**/*.{ts,tsx}'],
  output: './',
  options: {
    removeUnusedKeys: true,
    sort: true,
    lngs: ['en-GB'],
    ns: ['common', 'settings', 'cards', 'mechanics', 'errors', 'accessibility'],
    resource: {
      loadPath: 'src/i18n/locales/{{lng}}/{{ns}}.json',
      savePath: 'src/i18n/locales/{{lng}}/{{ns}}.json',
    },
  },
};
```

### Workflow

```
Developer adds string → i18next-scanner extracts → GitHub push
                                                      │
                              Weblate pulls new keys ◄┘
                                      │
              Community translates in Weblate
                                      │
                    Reviewer approves translation
                                      │
              Weblate pushes to GitHub (PR or direct)
                                      │
                      Merged into release branch
```

### Validation Tiers

| Language | Validation Level | Approver |
|----------|------------------|----------|
| en-GB | Source language | Developer |
| en-US | Spelling check | Any contributor |
| de (German) | Peer review | 1 German speaker |
| ar (Arabic) | Native review | Native Arabic speaker |
| he (Hebrew) | Native review | Native Hebrew speaker |

### Quality Gates

1. **Automated** (CI)
   - JSON syntax validation
   - Key coverage check (all source keys present)
   - Interpolation matching ({{placeholders}} preserved)

2. **Platform** (Weblate)
   - Peer review for new languages
   - Consistency checks (translation memory)
   - Glossary term enforcement

3. **Manual** (Release)
   - Native speaker sign-off for RTL languages
   - Visual review in staging environment

## Consequences

### Positive

- **Community-driven** - Leverages community expertise for language coverage
- **Transparent** - All translations visible in public repository
- **Quality controlled** - Multi-tier validation prevents poor translations
- **Sustainable** - No ongoing translation costs for the project
- **Integrated** - Weblate-GitHub sync keeps translations in version control

### Negative

- **Platform dependency** - Relies on Weblate availability (mitigated by self-host option)
- **Review overhead** - Requires reviewers for each language
- **Contribution variability** - Community contributions may be inconsistent
- **RTL expertise** - Finding Arabic/Hebrew reviewers may be challenging

### Mitigations

- **Self-hosting fallback** - Can self-host Weblate if hosted service unavailable
- **Initial seed translations** - Commission initial translations for de, ar, he
- **Reviewer recruitment** - Actively recruit from translation communities
- **Contributor documentation** - Comprehensive guide reduces review burden

## Alternatives Considered

### Crowdin (Rejected)

**Strengths:**
- Free for open source
- Large translator community
- Polished interface

**Rejected because:**
- Closed source platform
- Less alignment with project values
- Approval process for OSS tier

**Would choose if:**
- Needed access to larger translator pool
- Project became commercially funded

### GitHub PRs Only (Rejected)

**Strengths:**
- No external dependencies
- Developer-familiar workflow

**Rejected because:**
- No translation memory
- High barrier for non-technical contributors
- No built-in review workflow

**Would choose if:**
- Only 2-3 languages needed
- All translators were developers

### Internal Management (Rejected)

**Strengths:**
- Full control over quality
- Consistent updates

**Rejected because:**
- User explicitly chose community model
- High ongoing cost
- Limited language coverage

---

## Implementation

### Phase 1: Platform Setup

1. Create Weblate project for Itemdeck
2. Configure GitHub integration
3. Set up components for each namespace
4. Create contributor documentation

### Phase 2: String Extraction

1. Install i18next-scanner
2. Configure extraction rules
3. Add to CI pipeline
4. Extract initial en-GB strings

### Phase 3: Contributor Onboarding

1. Publish translation guide
2. Create glossary of terms
3. Recruit initial translators for German
4. Establish review process

### Phase 4: RTL Languages

1. Recruit Arabic reviewers
2. Recruit Hebrew reviewers
3. Commission initial translations if needed
4. Implement native speaker validation workflow

---

## Related Documentation

- [R-013: Community Translation Workflow](../../research/R-013-community-translation-workflow.md)
- [State-of-the-Art: Internationalisation](../../research/state-of-the-art-internationalisation.md)
- [ADR-021: Internationalisation Library](./ADR-021-internationalisation-library.md)
- [F-075: Internationalisation Foundation](../../roadmap/features/planned/F-075-internationalisation-foundation.md)

---
