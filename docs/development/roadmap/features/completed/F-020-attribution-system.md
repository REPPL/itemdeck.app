# F-020: Attribution System

## Problem Statement

When using external images, proper attribution is required:

1. No system for tracking image sources
2. No way to display attribution to users
3. No licence compliance verification
4. No credits export for documentation

## Design Approach

Implement an **attribution tracking and display system** supporting Creative Commons and public domain licences:

### Attribution Types

```typescript
// src/types/attribution.ts
export interface LicenceInfo {
  spdxIdentifier: string;  // e.g., 'CC-BY-4.0', 'CC0-1.0'
  name: string;            // e.g., 'Creative Commons Attribution 4.0'
  url: string;             // Link to licence text
  attributionRequired: boolean;
  shareAlikeRequired: boolean;
  commercialUseAllowed: boolean;
}

export interface ImageSource {
  provider: 'wikimedia' | 'unsplash' | 'pexels' | 'custom' | 'local';
  originalUrl: string;
  downloadUrl: string;
  retrievedAt: string;
}

export interface Attribution {
  id: string;
  title: string;
  author: {
    name: string;
    url?: string;
  };
  licence: LicenceInfo;
  source: ImageSource;
  description?: string;
  dateCreated?: string;
  modifications?: string;
}

export const LICENCES: Record<string, LicenceInfo> = {
  'CC0-1.0': {
    spdxIdentifier: 'CC0-1.0',
    name: 'CC0 1.0 Universal (Public Domain Dedication)',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    attributionRequired: false,
    shareAlikeRequired: false,
    commercialUseAllowed: true,
  },
  'CC-BY-4.0': {
    spdxIdentifier: 'CC-BY-4.0',
    name: 'Creative Commons Attribution 4.0 International',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    attributionRequired: true,
    shareAlikeRequired: false,
    commercialUseAllowed: true,
  },
  'CC-BY-SA-4.0': {
    spdxIdentifier: 'CC-BY-SA-4.0',
    name: 'Creative Commons Attribution-ShareAlike 4.0 International',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    attributionRequired: true,
    shareAlikeRequired: true,
    commercialUseAllowed: true,
  },
  'PUBLIC-DOMAIN': {
    spdxIdentifier: 'Public Domain',
    name: 'Public Domain',
    url: 'https://creativecommons.org/publicdomain/mark/1.0/',
    attributionRequired: false,
    shareAlikeRequired: false,
    commercialUseAllowed: true,
  },
};
```

### Wikimedia Commons API Integration

```typescript
// src/api/wikimediaCommons.ts
import { z } from 'zod';
import type { Attribution } from '../types/attribution';
import { LICENCES } from '../types/attribution';

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

export async function getImageAttribution(filename: string): Promise<Attribution | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: filename.startsWith('File:') ? filename : `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    format: 'json',
    origin: '*',
  });

  try {
    const response = await fetch(`${COMMONS_API_URL}?${params}`);
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as Record<string, unknown>;
    const imageinfo = (page.imageinfo as Array<Record<string, unknown>>)?.[0];
    if (!imageinfo) return null;

    const metadata = (imageinfo.extmetadata ?? {}) as Record<string, { value: string }>;

    return {
      id: String(page.pageid),
      title: String(page.title).replace('File:', ''),
      author: {
        name: extractText(metadata.Artist?.value) ?? 'Unknown',
        url: undefined,
      },
      licence: parseLicence(metadata.LicenseShortName?.value ?? '') ?? LICENCES['PUBLIC-DOMAIN'],
      source: {
        provider: 'wikimedia',
        originalUrl: String(imageinfo.descriptionurl),
        downloadUrl: String(imageinfo.url),
        retrievedAt: new Date().toISOString(),
      },
      description: extractText(metadata.ImageDescription?.value),
      dateCreated: metadata.DateTimeOriginal?.value,
    };
  } catch (error) {
    console.error('Failed to fetch image attribution:', error);
    return null;
  }
}

function extractText(html?: string): string | undefined {
  if (!html) return undefined;
  return html.replace(/<[^>]*>/g, '').trim();
}

function parseLicence(licenceString: string): LicenceInfo | null {
  const normalised = licenceString.toLowerCase();

  if (normalised.includes('cc0') || normalised.includes('public domain')) {
    return LICENCES['CC0-1.0'];
  }
  if (normalised.includes('cc by-sa') || normalised.includes('cc-by-sa')) {
    return LICENCES['CC-BY-SA-4.0'];
  }
  if (normalised.includes('cc by') || normalised.includes('cc-by')) {
    return LICENCES['CC-BY-4.0'];
  }

  return null;
}
```

### Attribution Store

```typescript
// src/stores/attributionStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Attribution } from '../types/attribution';

interface AttributionState {
  attributions: Record<string, Attribution>;

  addAttribution: (imageId: string, attribution: Attribution) => void;
  removeAttribution: (imageId: string) => void;
  getAttribution: (imageId: string) => Attribution | undefined;
  exportAttributions: () => string;
  exportAsMarkdown: () => string;
}

export const useAttributionStore = create<AttributionState>()(
  persist(
    (set, get) => ({
      attributions: {},

      addAttribution: (imageId, attribution) => set((state) => ({
        attributions: { ...state.attributions, [imageId]: attribution },
      })),

      removeAttribution: (imageId) => set((state) => {
        const { [imageId]: removed, ...rest } = state.attributions;
        return { attributions: rest };
      }),

      getAttribution: (imageId) => get().attributions[imageId],

      exportAttributions: () => {
        return Object.values(get().attributions)
          .map((attr) => {
            const parts = [
              `"${attr.title}"`,
              `by ${attr.author.name}`,
              `(${attr.licence.name})`,
              `Source: ${attr.source.originalUrl}`,
            ];
            if (attr.modifications) {
              parts.push(`Modified: ${attr.modifications}`);
            }
            return parts.join(' ');
          })
          .join('\n\n');
      },

      exportAsMarkdown: () => {
        const attributions = Object.values(get().attributions);
        if (attributions.length === 0) return '';

        let md = '## Image Credits\n\n';
        md += '| Image | Author | Licence | Source |\n';
        md += '|-------|--------|---------|--------|\n';

        for (const attr of attributions) {
          md += `| ${attr.title} | ${attr.author.name} | [${attr.licence.spdxIdentifier}](${attr.licence.url}) | [Link](${attr.source.originalUrl}) |\n`;
        }

        return md;
      },
    }),
    {
      name: 'itemdeck-attributions',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Attribution Display Component

```tsx
// src/components/Attribution/Attribution.tsx
import { useState } from 'react';
import type { Attribution as AttributionData } from '../../types/attribution';
import styles from './Attribution.module.css';

interface AttributionProps {
  attribution: AttributionData;
  variant?: 'inline' | 'tooltip' | 'panel';
}

export function Attribution({ attribution, variant = 'inline' }: AttributionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (variant === 'inline') {
    return (
      <span className={styles.inline}>
        &ldquo;
        <a href={attribution.source.originalUrl} target="_blank" rel="noopener noreferrer">
          {attribution.title}
        </a>
        &rdquo; by{' '}
        {attribution.author.url ? (
          <a href={attribution.author.url} target="_blank" rel="noopener noreferrer">
            {attribution.author.name}
          </a>
        ) : (
          attribution.author.name
        )}
        {' '}is licensed under{' '}
        <a href={attribution.licence.url} target="_blank" rel="noopener noreferrer">
          {attribution.licence.spdxIdentifier}
        </a>
      </span>
    );
  }

  if (variant === 'tooltip') {
    return (
      <button
        className={styles.tooltipTrigger}
        aria-label="View image attribution"
        title={`${attribution.title} by ${attribution.author.name} (${attribution.licence.spdxIdentifier})`}
      >
        ⓘ
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <button
        className={styles.panelToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        Image Credit {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <dl className={styles.panelContent}>
          <dt>Title</dt>
          <dd>
            <a href={attribution.source.originalUrl} target="_blank" rel="noopener noreferrer">
              {attribution.title}
            </a>
          </dd>
          <dt>Author</dt>
          <dd>{attribution.author.name}</dd>
          <dt>Licence</dt>
          <dd>
            <a href={attribution.licence.url} target="_blank" rel="noopener noreferrer">
              {attribution.licence.name}
            </a>
          </dd>
          {attribution.modifications && (
            <>
              <dt>Modifications</dt>
              <dd>{attribution.modifications}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}
```

### Licence Compliance Checker

```typescript
// src/utils/licenceCompliance.ts
import type { Attribution } from '../types/attribution';

export interface ComplianceIssue {
  imageId: string;
  severity: 'error' | 'warning';
  message: string;
}

export function checkCompliance(
  attributions: Record<string, Attribution>
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = [];

  for (const [imageId, attr] of Object.entries(attributions)) {
    if (!attr.licence.url) {
      issues.push({
        imageId,
        severity: 'error',
        message: `Unknown licence for "${attr.title}". Verify usage rights.`,
      });
      continue;
    }

    if (attr.licence.attributionRequired) {
      if (!attr.author.name || attr.author.name === 'Unknown') {
        issues.push({
          imageId,
          severity: 'error',
          message: `Attribution required but author unknown for "${attr.title}".`,
        });
      }
    }

    if (!attr.licence.commercialUseAllowed) {
      issues.push({
        imageId,
        severity: 'warning',
        message: `"${attr.title}" uses non-commercial licence. Verify intended use.`,
      });
    }

    if (attr.licence.shareAlikeRequired && attr.modifications) {
      issues.push({
        imageId,
        severity: 'warning',
        message: `"${attr.title}" modified under Share-Alike. Derivatives must use same licence.`,
      });
    }
  }

  return issues;
}
```

### Credits Page

```tsx
// src/pages/Credits/Credits.tsx
import { useAttributionStore } from '../../stores/attributionStore';
import { Attribution } from '../../components/Attribution/Attribution';
import { checkCompliance } from '../../utils/licenceCompliance';
import styles from './Credits.module.css';

export function CreditsPage() {
  const attributions = useAttributionStore((state) => state.attributions);
  const exportAsText = useAttributionStore((state) => state.exportAttributions);
  const exportAsMarkdown = useAttributionStore((state) => state.exportAsMarkdown);

  const issues = checkCompliance(attributions);
  const hasErrors = issues.some((i) => i.severity === 'error');

  const handleExport = (format: 'text' | 'markdown') => {
    const content = format === 'text' ? exportAsText() : exportAsMarkdown();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-credits.${format === 'text' ? 'txt' : 'md'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={styles.container}>
      <h1>Image Credits</h1>

      <p className={styles.intro}>
        This application uses images from various sources under permissive licences.
        We thank all creators for making their work freely available.
      </p>

      {hasErrors && (
        <div role="alert" className={styles.warning}>
          <h2>Compliance Issues</h2>
          <ul>
            {issues.map((issue, i) => (
              <li key={i} className={styles[issue.severity]}>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(attributions).length === 0 ? (
        <p>No external images currently in use.</p>
      ) : (
        <>
          <ul className={styles.creditsList}>
            {Object.entries(attributions).map(([imageId, attr]) => (
              <li key={imageId}>
                <Attribution attribution={attr} variant="inline" />
              </li>
            ))}
          </ul>

          <div className={styles.exportButtons}>
            <button onClick={() => handleExport('text')}>
              Export as Text
            </button>
            <button onClick={() => handleExport('markdown')}>
              Export as Markdown
            </button>
          </div>
        </>
      )}

      <section className={styles.sources}>
        <h2>Recommended Image Sources</h2>
        <ul>
          <li>
            <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">
              Wikimedia Commons
            </a> – Free media repository
          </li>
          <li>
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a> – Free high-resolution photos
          </li>
          <li>
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">
              Pexels
            </a> – Free stock photos
          </li>
        </ul>
      </section>
    </main>
  );
}
```

## Implementation Tasks

- [ ] Create `src/types/attribution.ts` with type definitions
- [ ] Create `src/stores/attributionStore.ts` with Zustand
- [ ] Create `src/api/wikimediaCommons.ts` API client
- [ ] Create `Attribution` display component
- [ ] Create `CreditsPage` component
- [ ] Create licence compliance checker utility
- [ ] Integrate attribution tracking with card data loading
- [ ] Add attribution tooltip to card images
- [ ] Add attribution panel to card detail view
- [ ] Implement text and markdown export
- [ ] Add compliance warnings for issues
- [ ] Write tests for attribution API
- [ ] Write tests for compliance checker
- [ ] Document image sourcing guidelines

## Success Criteria

- [ ] Attributions stored for all external images
- [ ] Attribution displayed in card detail view
- [ ] Credits page lists all attributions
- [ ] Export to text and markdown works
- [ ] Compliance checker identifies issues
- [ ] Unknown licences flagged as errors
- [ ] NC licences flagged as warnings
- [ ] Wikimedia Commons API integration works
- [ ] Tests pass

## Dependencies

- **Requires**: F-018 Security Hardening (URL validation)
- **Blocks**: None

## Complexity

**Medium** – API integration and compliance logic require careful implementation.

---

## Related Documentation

- [Ethical Image Sourcing Research](../../../../research/ethical-image-sourcing.md)
- [ADR-012: Wikimedia Commons for Ethical Sourcing](../../../decisions/adrs/ADR-012-ethical-sourcing.md)
- [v0.6.0 Milestone](../../milestones/v0.6.0.md)
