# Ethical Image Sourcing

## Executive Summary

For Itemdeck's image sourcing, prioritise **Wikimedia Commons** and **public domain** sources with full attribution support. Implement **automated attribution extraction** via the MediaWiki API, display attributions in a **consistent, non-intrusive format**, and store licence metadata alongside image references.

Key recommendations:
1. Use Wikimedia Commons API for free, well-documented images
2. Store attribution metadata with every image reference
3. Display attributions in a collapsible panel or hover tooltip
4. Support CC BY, CC BY-SA, CC0, and public domain licences
5. Implement licence validation and compliance checking

## Current State in Itemdeck

Itemdeck currently uses:
- **Mock data** with placeholder image URLs
- **No attribution system** implemented
- **No licence tracking** or validation

Implementing ethical sourcing now ensures compliance and respects creators' rights from the start.

## Research Findings

### Licence Types and Requirements

| Licence | Attribution Required | Share Alike | Commercial Use | Notes |
|---------|---------------------|-------------|----------------|-------|
| CC0 (Public Domain) | ❌ | ❌ | ✅ | No restrictions |
| CC BY | ✅ | ❌ | ✅ | Credit author |
| CC BY-SA | ✅ | ✅ | ✅ | Must share alike |
| CC BY-NC | ✅ | ❌ | ❌ | Non-commercial only |
| CC BY-NC-SA | ✅ | ✅ | ❌ | NC + Share Alike |
| Public Domain | ❌ | ❌ | ✅ | No copyright |

**Recommendation:** Only use CC0, CC BY, CC BY-SA, and public domain for simplest compliance.

### Attribution Requirements

For Creative Commons licences requiring attribution (BY), you must include:

1. **Creator name** - The author or photographer
2. **Title** - The original work title (if provided)
3. **Source** - Link to the original work
4. **Licence** - The specific licence with link
5. **Modifications** - Note if changes were made

### Wikimedia Commons API

```typescript
// src/api/wikimediaCommons.ts
import { z } from 'zod';

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';

// API response schema
const ImageInfoSchema = z.object({
  title: z.string(),
  imageinfo: z.array(z.object({
    url: z.string().url(),
    descriptionurl: z.string().url(),
    extmetadata: z.object({
      Artist: z.object({ value: z.string() }).optional(),
      ImageDescription: z.object({ value: z.string() }).optional(),
      LicenseShortName: z.object({ value: z.string() }).optional(),
      LicenseUrl: z.object({ value: z.string() }).optional(),
      Credit: z.object({ value: z.string() }).optional(),
      AttributionRequired: z.object({ value: z.string() }).optional(),
      Copyrighted: z.object({ value: z.string() }).optional(),
      DateTimeOriginal: z.object({ value: z.string() }).optional(),
    }).optional(),
  })),
});

export interface ImageAttribution {
  title: string;
  author: string;
  authorHtml?: string;
  description?: string;
  sourceUrl: string;
  imageUrl: string;
  licence: string;
  licenceUrl: string;
  attributionRequired: boolean;
  dateCreated?: string;
}

export async function getImageAttribution(filename: string): Promise<ImageAttribution | null> {
  const params = new URLSearchParams({
    action: 'query',
    titles: filename.startsWith('File:') ? filename : `File:${filename}`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    format: 'json',
    origin: '*', // CORS
  });

  try {
    const response = await fetch(`${COMMONS_API_URL}?${params}`);
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as z.infer<typeof ImageInfoSchema>;
    const imageinfo = page.imageinfo?.[0];
    if (!imageinfo) return null;

    const metadata = imageinfo.extmetadata ?? {};

    return {
      title: page.title.replace('File:', ''),
      author: extractTextFromHtml(metadata.Artist?.value ?? 'Unknown'),
      authorHtml: metadata.Artist?.value,
      description: extractTextFromHtml(metadata.ImageDescription?.value),
      sourceUrl: imageinfo.descriptionurl,
      imageUrl: imageinfo.url,
      licence: metadata.LicenseShortName?.value ?? 'Unknown',
      licenceUrl: metadata.LicenseUrl?.value ?? '',
      attributionRequired: metadata.AttributionRequired?.value === 'true',
      dateCreated: metadata.DateTimeOriginal?.value,
    };
  } catch (error) {
    console.error('Failed to fetch image attribution:', error);
    return null;
  }
}

function extractTextFromHtml(html?: string): string {
  if (!html) return '';
  // Simple HTML tag removal (for complex HTML, use DOMParser)
  return html.replace(/<[^>]*>/g, '').trim();
}

// Search for images
export async function searchImages(
  query: string,
  limit: number = 20
): Promise<Array<{ title: string; thumbnail: string }>> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srnamespace: '6', // File namespace
    srlimit: String(limit),
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`${COMMONS_API_URL}?${params}`);
  const data = await response.json();

  return data.query?.search?.map((result: { title: string }) => ({
    title: result.title,
    thumbnail: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(result.title.replace('File:', ''))}?width=300`,
  })) ?? [];
}
```

### Attribution Data Schema

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
  originalUrl: string;     // Link to source page
  downloadUrl: string;     // Direct image URL
  retrievedAt: string;     // ISO date
}

export interface Attribution {
  id: string;
  title: string;
  author: {
    name: string;
    url?: string;          // Link to author profile
  };
  licence: LicenceInfo;
  source: ImageSource;
  description?: string;
  dateCreated?: string;
  modifications?: string;  // Description of any changes made
}

// Standard licences
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

  // Format attribution text
  const formatAttribution = (): string => {
    const parts: string[] = [];

    // Title (if available)
    if (attribution.title) {
      parts.push(`"${attribution.title}"`);
    }

    // Author
    parts.push(`by ${attribution.author.name}`);

    // Licence
    parts.push(`(${attribution.licence.name})`);

    return parts.join(' ');
  };

  if (variant === 'inline') {
    return (
      <span className={styles.inline}>
        {attribution.title && (
          <>
            &ldquo;
            <a href={attribution.source.originalUrl} target="_blank" rel="noopener noreferrer">
              {attribution.title}
            </a>
            &rdquo;
            {' '}
          </>
        )}
        by{' '}
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
        {attribution.modifications && (
          <span className={styles.modifications}>
            . Modified: {attribution.modifications}
          </span>
        )}
      </span>
    );
  }

  if (variant === 'tooltip') {
    return (
      <button
        className={styles.tooltipTrigger}
        aria-label="Image attribution"
        title={formatAttribution()}
      >
        ⓘ
      </button>
    );
  }

  // Panel variant
  return (
    <div className={styles.panel}>
      <button
        className={styles.panelToggle}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="attribution-details"
      >
        Image Credit {isExpanded ? '▼' : '▶'}
      </button>

      {isExpanded && (
        <dl id="attribution-details" className={styles.panelContent}>
          <dt>Title</dt>
          <dd>
            <a href={attribution.source.originalUrl} target="_blank" rel="noopener noreferrer">
              {attribution.title || 'Untitled'}
            </a>
          </dd>

          <dt>Author</dt>
          <dd>
            {attribution.author.url ? (
              <a href={attribution.author.url} target="_blank" rel="noopener noreferrer">
                {attribution.author.name}
              </a>
            ) : (
              attribution.author.name
            )}
          </dd>

          <dt>Licence</dt>
          <dd>
            <a href={attribution.licence.url} target="_blank" rel="noopener noreferrer">
              {attribution.licence.name}
            </a>
          </dd>

          <dt>Source</dt>
          <dd>{attribution.source.provider}</dd>

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

```css
/* src/components/Attribution/Attribution.module.css */
.inline {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.inline a {
  color: var(--link-color);
  text-decoration: underline;
}

.tooltipTrigger {
  background: none;
  border: none;
  cursor: help;
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.25rem;
}

.panel {
  border-top: 1px solid var(--border-color);
  padding: 0.5rem;
  background: var(--surface-secondary);
  font-size: 0.75rem;
}

.panelToggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding: 0;
}

.panelContent {
  margin: 0.5rem 0 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.25rem 0.5rem;
}

.panelContent dt {
  font-weight: 600;
  color: var(--text-secondary);
}

.panelContent dd {
  margin: 0;
}

.modifications {
  font-style: italic;
}
```

### Attribution Storage

```typescript
// src/stores/attributionStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Attribution } from '../types/attribution';

interface AttributionState {
  attributions: Record<string, Attribution>;

  // Actions
  addAttribution: (imageId: string, attribution: Attribution) => void;
  removeAttribution: (imageId: string) => void;
  getAttribution: (imageId: string) => Attribution | undefined;
  exportAttributions: () => string;
}

export const useAttributionStore = create<AttributionState>()(
  persist(
    (set, get) => ({
      attributions: {},

      addAttribution: (imageId, attribution) => set((state) => ({
        attributions: {
          ...state.attributions,
          [imageId]: attribution,
        },
      })),

      removeAttribution: (imageId) => set((state) => {
        const { [imageId]: removed, ...rest } = state.attributions;
        return { attributions: rest };
      }),

      getAttribution: (imageId) => get().attributions[imageId],

      // Export for credits page or documentation
      exportAttributions: () => {
        const attributions = Object.values(get().attributions);

        return attributions
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
    }),
    {
      name: 'itemdeck-attributions',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Licence Compliance Checking

```typescript
// src/utils/licenceCompliance.ts
import type { Attribution, LicenceInfo } from '../types/attribution';
import { LICENCES } from '../types/attribution';

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
    // Check if licence is known
    if (!attr.licence.url) {
      issues.push({
        imageId,
        severity: 'error',
        message: `Unknown licence for "${attr.title}". Verify usage rights.`,
      });
      continue;
    }

    // Check attribution requirements
    if (attr.licence.attributionRequired) {
      if (!attr.author.name || attr.author.name === 'Unknown') {
        issues.push({
          imageId,
          severity: 'error',
          message: `Attribution required but author unknown for "${attr.title}".`,
        });
      }
    }

    // Check for NC (non-commercial) licences
    if (!attr.licence.commercialUseAllowed) {
      issues.push({
        imageId,
        severity: 'warning',
        message: `"${attr.title}" uses non-commercial licence. Verify intended use.`,
      });
    }

    // Check for Share-Alike requirement
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

// Validate a licence string from API
export function parseLicence(licenceString: string): LicenceInfo | null {
  const normalised = licenceString.toLowerCase().replace(/\s+/g, '-');

  // Direct match
  for (const [key, licence] of Object.entries(LICENCES)) {
    if (normalised.includes(key.toLowerCase())) {
      return licence;
    }
  }

  // Pattern matching for common variants
  if (normalised.includes('cc0') || normalised.includes('public-domain')) {
    return LICENCES['CC0-1.0'];
  }

  if (normalised.includes('cc-by-sa') || normalised.includes('cc by-sa')) {
    return LICENCES['CC-BY-SA-4.0'];
  }

  if (normalised.includes('cc-by') || normalised.includes('cc by')) {
    return LICENCES['CC-BY-4.0'];
  }

  return null;
}
```

### Credits Page Component

```tsx
// src/pages/Credits/Credits.tsx
import { useAttributionStore } from '../../stores/attributionStore';
import { Attribution } from '../../components/Attribution/Attribution';
import styles from './Credits.module.css';

export function CreditsPage() {
  const attributions = useAttributionStore((state) => state.attributions);
  const exportAttributions = useAttributionStore((state) => state.exportAttributions);

  const handleExport = () => {
    const text = exportAttributions();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'image-credits.txt';
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <h1>Image Credits</h1>

      <p className={styles.intro}>
        This application uses images from various sources under permissive licences.
        We thank all creators for making their work freely available.
      </p>

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

          <button onClick={handleExport} className={styles.exportButton}>
            Export Credits as Text
          </button>
        </>
      )}

      <section className={styles.sources}>
        <h2>Image Sources</h2>
        <ul>
          <li>
            <a href="https://commons.wikimedia.org" target="_blank" rel="noopener noreferrer">
              Wikimedia Commons
            </a>
            {' '}- Free media repository
          </li>
          <li>
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
            {' '}- Free high-resolution photos
          </li>
        </ul>
      </section>
    </div>
  );
}
```

### Image Source Providers

```typescript
// src/api/imageProviders.ts
import type { Attribution } from '../types/attribution';
import { LICENCES } from '../types/attribution';

// Unsplash API (requires API key)
export async function getUnsplashAttribution(photoId: string): Promise<Attribution | null> {
  const API_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  if (!API_KEY) {
    console.warn('Unsplash API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/${photoId}`,
      {
        headers: {
          Authorization: `Client-ID ${API_KEY}`,
        },
      }
    );

    if (!response.ok) return null;

    const photo = await response.json();

    return {
      id: photo.id,
      title: photo.description ?? photo.alt_description ?? 'Untitled',
      author: {
        name: photo.user.name,
        url: photo.user.links.html,
      },
      licence: {
        spdxIdentifier: 'Unsplash',
        name: 'Unsplash License',
        url: 'https://unsplash.com/license',
        attributionRequired: true,
        shareAlikeRequired: false,
        commercialUseAllowed: true,
      },
      source: {
        provider: 'unsplash',
        originalUrl: photo.links.html,
        downloadUrl: photo.urls.regular,
        retrievedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to fetch Unsplash attribution:', error);
    return null;
  }
}

// Pexels API (requires API key)
export async function getPexelsAttribution(photoId: string): Promise<Attribution | null> {
  const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
  if (!API_KEY) {
    console.warn('Pexels API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/photos/${photoId}`,
      {
        headers: {
          Authorization: API_KEY,
        },
      }
    );

    if (!response.ok) return null;

    const photo = await response.json();

    return {
      id: String(photo.id),
      title: photo.alt ?? 'Untitled',
      author: {
        name: photo.photographer,
        url: photo.photographer_url,
      },
      licence: {
        spdxIdentifier: 'Pexels',
        name: 'Pexels License',
        url: 'https://www.pexels.com/license/',
        attributionRequired: false, // Appreciated but not required
        shareAlikeRequired: false,
        commercialUseAllowed: true,
      },
      source: {
        provider: 'pexels',
        originalUrl: photo.url,
        downloadUrl: photo.src.large,
        retrievedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to fetch Pexels attribution:', error);
    return null;
  }
}
```

### Ethical Sourcing Guidelines

```markdown
## Image Sourcing Checklist

### Before Using an Image

- [ ] Verify the licence allows your intended use
- [ ] Check if attribution is required
- [ ] Note the author/creator name
- [ ] Save the source URL
- [ ] Check for any modification restrictions
- [ ] Verify commercial use is allowed (if applicable)

### Attribution Requirements by Source

| Source | Attribution Required | Preferred Format |
|--------|---------------------|------------------|
| Wikimedia Commons | Depends on licence | As specified |
| Unsplash | Yes (encouraged) | "Photo by [Name] on Unsplash" |
| Pexels | No (but appreciated) | "Photo by [Name] from Pexels" |
| Public Domain | No | Optional credit |

### Best Practices

1. **Always store attribution data** - Even if not required, track sources
2. **Display credits accessibly** - Don't hide attributions
3. **Link back to originals** - Support creators with traffic
4. **Update if licences change** - Periodically verify compliance
5. **Document modifications** - Note any edits made

### Avoid

- ❌ Using images with unknown licences
- ❌ Removing watermarks or credit metadata
- ❌ Using NC-licensed images commercially
- ❌ Ignoring Share-Alike requirements
- ❌ Hotlinking (use downloaded copies)
```

## Recommendations for Itemdeck

### Priority 1: Attribution Infrastructure

1. **Define Attribution types** in TypeScript
2. **Create attribution store** with Zustand
3. **Implement Wikimedia Commons API** client
4. **Store attributions** alongside card data

### Priority 2: Display Components

1. **Create Attribution component** with multiple variants
2. **Add credits panel** to card detail view
3. **Create Credits page** listing all attributions
4. **Support export** for documentation

### Priority 3: Compliance Tools

1. **Implement licence parsing** from API responses
2. **Add compliance checking** function
3. **Warn on unknown licences**
4. **Block non-commercial licences** if commercial use intended

### Priority 4: Documentation

1. **Create sourcing guidelines** for contributors
2. **Document supported sources**
3. **Provide attribution templates**
4. **Include in-app credits page**

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "zod": "^3.x"  // Already recommended for validation
  }
}
```

### API Rate Limits

| API | Rate Limit | Notes |
|-----|------------|-------|
| Wikimedia Commons | ~200 req/s | User-Agent required |
| Unsplash | 50 req/hr (demo) | API key required |
| Pexels | 200 req/hr | API key required |

### Caching Strategy

- Cache attribution data in IndexedDB
- Store alongside image references
- Refresh on explicit user action
- Include retrieval timestamp for auditing

### Legal Considerations

- This document provides guidance, not legal advice
- When in doubt, contact the original creator
- Consider professional legal review for commercial use
- Keep records of licence versions at time of use

## References

- [Wikimedia Commons API](https://commons.wikimedia.org/wiki/Commons:API)
- [Creative Commons Recommended Practices for Attribution](https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution)
- [Creative Commons Licence Chooser](https://creativecommons.org/choose/)
- [Wikimedia Commons Credit Line Guide](https://commons.wikimedia.org/wiki/Commons:Credit_line)
- [Unsplash Licence](https://unsplash.com/license)
- [Pexels Licence](https://www.pexels.com/license/)
- [SPDX Licence List](https://spdx.org/licenses/)
- [image-attribution Library](https://github.com/gbv/image-attribution)

---

## Related Documentation

- [Image Handling & Security](./image-handling-security.md) - Secure image loading
- [External Data Sources](./external-data-sources.md) - API integration patterns
- [Asset Management](./asset-management.md) - Image caching and fallbacks

---

**Applies to**: Itemdeck v0.1.0+
