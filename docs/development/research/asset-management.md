# Asset Management

## Executive Summary

For Itemdeck's asset management, implement a **multi-tier fallback strategy** with graceful degradation: primary image → cached fallback → generated SVG placeholder. Use **progressive loading** with blur-up technique for perceived performance, and **service worker caching** for offline resilience.

Key recommendations:
1. Create an `ImageWithFallback` component with onError handling
2. Generate procedural SVG placeholders as ultimate fallback
3. Use blur-up progressive loading for large images
4. Cache images aggressively via service worker with Workbox

## Current State in Itemdeck

Itemdeck currently uses:
- **Mock card data** with imageUrl field
- **No image loading** - only back design displayed
- **No error handling** for failed images
- **No caching strategy** for assets

The foundation has no image loading implemented yet.

## Research Findings

### Image Loading State Machine

```
┌─────────────┐
│   INITIAL   │ No image requested yet
└──────┬──────┘
       │ Component mounts / enters viewport
       ▼
┌─────────────┐
│   LOADING   │ Show placeholder (blur/skeleton)
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌─────┐ ┌──────┐
│ OK  │ │ ERROR│
└──┬──┘ └──┬───┘
   │       │
   ▼       │ Retry? (exponential backoff)
┌──────────┤
│ LOADED   │ Show full image
└──────────┘
       │ All retries failed
       ▼
┌─────────────┐
│  FALLBACK   │ Show fallback image
└──────┬──────┘
       │ Fallback also failed
       ▼
┌─────────────┐
│ PLACEHOLDER │ Show generated SVG
└─────────────┘
```

### Fallback Strategy Tiers

| Tier | Type | Description | Example |
|------|------|-------------|---------|
| 1 | Primary | Original image URL | `https://example.com/card.jpg` |
| 2 | Cached | Service worker cached version | Previously loaded image |
| 3 | Static fallback | Bundled fallback image | `/assets/card-placeholder.png` |
| 4 | Generated SVG | Procedurally generated | Dynamic SVG with card colour |

### Code Examples

#### ImageWithFallback Component

```tsx
// src/components/ImageWithFallback/ImageWithFallback.tsx
import { useState, useCallback, ImgHTMLAttributes } from 'react';
import styles from './ImageWithFallback.module.css';

type ImageState = 'loading' | 'loaded' | 'error' | 'fallback';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  placeholderSrc?: string;
  generatePlaceholder?: () => string;
  retryCount?: number;
  retryDelay?: number;
  onLoadStateChange?: (state: ImageState) => void;
}

export function ImageWithFallback({
  src,
  fallbackSrc,
  placeholderSrc,
  generatePlaceholder,
  retryCount = 2,
  retryDelay = 1000,
  onLoadStateChange,
  alt = '',
  className,
  ...props
}: ImageWithFallbackProps) {
  const [state, setState] = useState<ImageState>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);
  const [retries, setRetries] = useState(0);

  const updateState = useCallback((newState: ImageState) => {
    setState(newState);
    onLoadStateChange?.(newState);
  }, [onLoadStateChange]);

  const handleLoad = useCallback(() => {
    updateState('loaded');
  }, [updateState]);

  const handleError = useCallback(() => {
    // Retry with exponential backoff
    if (currentSrc === src && retries < retryCount) {
      const delay = retryDelay * Math.pow(2, retries);
      setTimeout(() => {
        setRetries(prev => prev + 1);
        // Force reload by appending cache buster
        setCurrentSrc(`${src}?retry=${retries + 1}`);
      }, delay);
      return;
    }

    // Try fallback image
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      updateState('fallback');
      return;
    }

    // Use generated placeholder
    if (generatePlaceholder) {
      setCurrentSrc(generatePlaceholder());
      updateState('fallback');
      return;
    }

    // Ultimate fallback - error state
    updateState('error');
  }, [currentSrc, src, fallbackSrc, retries, retryCount, retryDelay, generatePlaceholder, updateState]);

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      {/* Placeholder shown while loading */}
      {state === 'loading' && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={styles.placeholder}
        />
      )}

      {/* Main image */}
      <img
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`${styles.image} ${state === 'loaded' ? styles.visible : styles.hidden}`}
        {...props}
      />

      {/* Error state */}
      {state === 'error' && (
        <div className={styles.error} role="img" aria-label={alt}>
          <span className={styles.errorIcon}>⚠</span>
          <span className={styles.errorText}>Image unavailable</span>
        </div>
      )}
    </div>
  );
}
```

```css
/* src/components/ImageWithFallback/ImageWithFallback.module.css */
.container {
  position: relative;
  overflow: hidden;
  background-color: var(--colour-surface, #1a1a2e);
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease-in-out;
}

.placeholder {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(10px);
  transform: scale(1.1); /* Hide blur edges */
}

.visible {
  opacity: 1;
}

.hidden {
  opacity: 0;
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--colour-error-bg, #2a1a1a);
  color: var(--colour-error, #ff6b6b);
}

.errorIcon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.errorText {
  font-size: 0.875rem;
}
```

#### Procedural SVG Placeholder Generator

```typescript
// src/utils/generatePlaceholder.ts

interface PlaceholderOptions {
  width: number;
  height: number;
  baseColour?: string;
  pattern?: 'solid' | 'gradient' | 'noise' | 'geometric';
  seed?: string;
}

export function generatePlaceholderSVG(options: PlaceholderOptions): string {
  const {
    width,
    height,
    baseColour = '#2a2a4e',
    pattern = 'gradient',
    seed = 'default',
  } = options;

  // Generate deterministic colours from seed
  const colours = generateColoursFromSeed(seed, baseColour);

  let content = '';

  switch (pattern) {
    case 'gradient':
      content = `
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colours.primary}" />
            <stop offset="100%" style="stop-color:${colours.secondary}" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      `;
      break;

    case 'geometric':
      content = generateGeometricPattern(width, height, colours);
      break;

    case 'noise':
      content = `
        <defs>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="${colours.primary}" />
        <rect width="100%" height="100%" filter="url(#noise)" opacity="0.1" />
      `;
      break;

    default: // solid
      content = `<rect width="100%" height="100%" fill="${colours.primary}" />`;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${width}"
         height="${height}"
         viewBox="0 0 ${width} ${height}">
      ${content}
    </svg>
  `.trim();

  // Return as data URI
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generateColoursFromSeed(seed: string, base: string): {
  primary: string;
  secondary: string;
  accent: string;
} {
  // Simple hash function for deterministic results
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }

  // Generate hue offset from hash
  const hueOffset = (hash % 60) - 30;

  // Parse base colour and adjust
  const baseHSL = hexToHSL(base);

  return {
    primary: hslToHex({
      h: (baseHSL.h + hueOffset + 360) % 360,
      s: baseHSL.s,
      l: baseHSL.l,
    }),
    secondary: hslToHex({
      h: (baseHSL.h + hueOffset + 30 + 360) % 360,
      s: baseHSL.s * 0.8,
      l: baseHSL.l * 0.8,
    }),
    accent: hslToHex({
      h: (baseHSL.h + hueOffset + 180) % 360,
      s: baseHSL.s,
      l: Math.min(baseHSL.l * 1.2, 90),
    }),
  };
}

function generateGeometricPattern(
  width: number,
  height: number,
  colours: { primary: string; secondary: string; accent: string }
): string {
  const shapes: string[] = [];
  const gridSize = 40;

  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      const shapeType = (x + y) % 3;
      const colour = shapeType === 0 ? colours.primary :
                     shapeType === 1 ? colours.secondary : colours.accent;
      const opacity = 0.3 + (Math.random() * 0.4);

      if (shapeType === 0) {
        shapes.push(`<rect x="${x}" y="${y}" width="${gridSize}" height="${gridSize}" fill="${colour}" opacity="${opacity}" />`);
      } else if (shapeType === 1) {
        shapes.push(`<circle cx="${x + gridSize/2}" cy="${y + gridSize/2}" r="${gridSize/3}" fill="${colour}" opacity="${opacity}" />`);
      } else {
        shapes.push(`<polygon points="${x},${y + gridSize} ${x + gridSize/2},${y} ${x + gridSize},${y + gridSize}" fill="${colour}" opacity="${opacity}" />`);
      }
    }
  }

  return `
    <rect width="100%" height="100%" fill="${colours.primary}" />
    ${shapes.join('\n')}
  `;
}

// Colour conversion utilities
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(hsl: { h: number; s: number; l: number }): string {
  const { h, s, l } = hsl;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = lNorm - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
```

#### Card Back Design SVG

```typescript
// src/components/CardBack/generateCardBack.ts

interface CardBackOptions {
  width: number;
  height: number;
  theme?: 'classic' | 'modern' | 'minimal';
  accentColour?: string;
}

export function generateCardBackSVG({
  width,
  height,
  theme = 'classic',
  accentColour = '#6366f1',
}: CardBackOptions): string {
  const patterns = {
    classic: generateClassicPattern(width, height, accentColour),
    modern: generateModernPattern(width, height, accentColour),
    minimal: generateMinimalPattern(width, height, accentColour),
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${width}"
         height="${height}"
         viewBox="0 0 ${width} ${height}">
      ${patterns[theme]}
    </svg>
  `.trim();

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function generateClassicPattern(w: number, h: number, accent: string): string {
  return `
    <rect width="100%" height="100%" fill="#1a1a2e" />
    <rect x="10" y="10" width="${w - 20}" height="${h - 20}"
          fill="none" stroke="${accent}" stroke-width="2" rx="4" />
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.3" />
    </pattern>
    <rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="url(#grid)" />
    <circle cx="${w / 2}" cy="${h / 2}" r="30" fill="${accent}" opacity="0.2" />
  `;
}

function generateModernPattern(w: number, h: number, accent: string): string {
  return `
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e" />
        <stop offset="100%" style="stop-color:#2a2a4e" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
    <path d="M 0 ${h * 0.3} Q ${w * 0.5} ${h * 0.1} ${w} ${h * 0.4}"
          stroke="${accent}" stroke-width="2" fill="none" opacity="0.5" />
    <path d="M 0 ${h * 0.7} Q ${w * 0.5} ${h * 0.9} ${w} ${h * 0.6}"
          stroke="${accent}" stroke-width="2" fill="none" opacity="0.5" />
  `;
}

function generateMinimalPattern(w: number, h: number, accent: string): string {
  return `
    <rect width="100%" height="100%" fill="#1a1a2e" />
    <rect x="${w * 0.4}" y="${h * 0.4}" width="${w * 0.2}" height="${h * 0.2}"
          fill="${accent}" opacity="0.3" rx="4" />
  `;
}
```

#### Progressive Image Loading (Blur-Up)

```tsx
// src/components/ProgressiveImage/ProgressiveImage.tsx
import { useState, useEffect } from 'react';
import styles from './ProgressiveImage.module.css';

interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;  // Low-quality version
  alt: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function ProgressiveImage({
  src,
  placeholderSrc,
  alt,
  width,
  height,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);

  useEffect(() => {
    // Preload the full image
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      onError?.();
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);

  return (
    <div
      className={styles.container}
      style={{ width, height }}
    >
      <img
        src={currentSrc}
        alt={alt}
        className={`${styles.image} ${isLoaded ? styles.loaded : styles.loading}`}
        width={width}
        height={height}
      />
    </div>
  );
}
```

```css
/* src/components/ProgressiveImage/ProgressiveImage.module.css */
.container {
  position: relative;
  overflow: hidden;
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease-out;
}

.loading {
  filter: blur(20px);
  transform: scale(1.05);
}

.loaded {
  filter: blur(0);
  transform: scale(1);
}
```

#### Service Worker Image Caching

```typescript
// src/sw.ts (Workbox)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Card images - Cache First with long expiry
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'card-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// External images (GitHub, external URLs) - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin !== self.location.origin &&
               (url.pathname.endsWith('.jpg') ||
                url.pathname.endsWith('.png') ||
                url.pathname.endsWith('.webp')),
  new StaleWhileRevalidate({
    cacheName: 'external-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      }),
    ],
  })
);

// SVG assets - Cache First
registerRoute(
  ({ request }) => request.url.endsWith('.svg'),
  new CacheFirst({
    cacheName: 'svg-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
      }),
    ],
  })
);
```

#### Image Preloading Hook

```typescript
// src/hooks/useImagePreloader.ts
import { useState, useEffect, useCallback } from 'react';

interface PreloadResult {
  loaded: string[];
  failed: string[];
  pending: string[];
  progress: number;
}

export function useImagePreloader(urls: string[]): PreloadResult {
  const [loaded, setLoaded] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    if (urls.length === 0) return;

    const preloadImage = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          setLoaded(prev => [...prev, url]);
          resolve();
        };
        img.onerror = () => {
          setFailed(prev => [...prev, url]);
          reject();
        };
        img.src = url;
      });
    };

    // Preload in batches to avoid overwhelming the browser
    const batchSize = 5;
    const batches = [];
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }

    const preloadBatches = async () => {
      for (const batch of batches) {
        await Promise.allSettled(batch.map(preloadImage));
      }
    };

    preloadBatches();
  }, [urls]);

  const pending = urls.filter(url => !loaded.includes(url) && !failed.includes(url));
  const progress = urls.length > 0 ? ((loaded.length + failed.length) / urls.length) * 100 : 0;

  return { loaded, failed, pending, progress };
}

// Usage
function CardGrid({ cards }: { cards: Card[] }) {
  const imageUrls = cards.map(c => c.imageUrl);
  const { progress, failed } = useImagePreloader(imageUrls);

  return (
    <div>
      {progress < 100 && <LoadingBar progress={progress} />}
      {failed.length > 0 && (
        <Banner>
          {failed.length} images failed to load
        </Banner>
      )}
      {/* Grid content */}
    </div>
  );
}
```

### CSS Background Fallback Patterns

```css
/* src/styles/backgrounds.css */

/* Fallback pattern for CSS backgrounds */
.card-background {
  /* Tier 1: Try WebP (modern browsers) */
  background-image: url('/assets/card-bg.webp');

  /* Tier 2: Fallback to PNG */
  background-image: image-set(
    url('/assets/card-bg.webp') type('image/webp'),
    url('/assets/card-bg.png') type('image/png')
  );
}

/* For browsers without image-set support */
@supports not (background-image: image-set(url('x.webp') type('image/webp'))) {
  .card-background {
    background-image: url('/assets/card-bg.png');
  }
}

/* SVG fallback via multiple backgrounds */
.card-pattern {
  /* PNG fallback for older browsers */
  background: url('/assets/pattern.png');

  /* SVG with transparent gradient (only works if SVG supported) */
  background:
    url('/assets/pattern.svg'),
    linear-gradient(transparent, transparent);
}

/* Ultimate fallback to solid colour */
.card-pattern-safe {
  background-color: var(--colour-card-back, #1a1a2e);
  background-image: url('/assets/pattern.svg');
}
```

### Library Comparison

| Library | Weekly Downloads | Use Case | Bundle Size |
|---------|-----------------|----------|-------------|
| [react-graceful-image](https://www.npmjs.com/package/react-graceful-image) | 2k | Lazy load + retries | ~5KB |
| [react-lazy-load-image-component](https://www.npmjs.com/package/react-lazy-load-image-component) | 400k | Lazy + effects | ~3KB |
| [react-loading-skeleton](https://www.npmjs.com/package/react-loading-skeleton) | 1.2M | Skeleton loaders | ~3KB |
| Custom solution | N/A | Full control | ~2KB |

**Recommendation:** Custom solution for full control over fallback behaviour and integration with Itemdeck's design system.

## Recommendations for Itemdeck

### Priority 1: ImageWithFallback Component

1. **Create base component** with onError handling
2. **Implement retry logic** with exponential backoff
3. **Support multiple fallback tiers** (fallback → SVG)
4. **Add loading states** (skeleton/blur)

### Priority 2: SVG Placeholder Generation

1. **Create procedural generator** for card placeholders
2. **Use card ID as seed** for deterministic colours
3. **Support multiple patterns** (solid, gradient, geometric)
4. **Generate at runtime** - no additional assets needed

### Priority 3: Card Back Designs

1. **Create SVG-based card backs** for themes
2. **Generate programmatically** from accent colour
3. **Support theme switching** without new assets
4. **Use as ultimate fallback** for card images

### Priority 4: Service Worker Caching

1. **Configure Workbox** for image caching
2. **Use Cache-First** for known good images
3. **Use Stale-While-Revalidate** for external sources
4. **Set appropriate expiry times**

### Priority 5: Progressive Loading

1. **Implement blur-up technique** for large images
2. **Generate tiny placeholders** (10x14px) for cards
3. **Preload visible images** on grid scroll
4. **Batch preloading** to avoid network congestion

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {},
  "devDependencies": {
    "workbox-precaching": "^7.x",
    "workbox-routing": "^7.x",
    "workbox-strategies": "^7.x",
    "workbox-expiration": "^7.x"
  }
}
```

### Bundle Size Impact

- Custom ImageWithFallback: ~2KB
- SVG generation utilities: ~1KB
- No runtime dependencies

### Performance Considerations

- **Generate SVGs on demand** - don't precalculate all
- **Cache generated SVGs** in memory for repeated use
- **Use CSS containment** for image containers
- **Avoid layout shifts** with fixed dimensions

### Accessibility

- **Provide meaningful alt text** for images
- **Announce loading states** to screen readers
- **Handle keyboard focus** on image containers
- **Respect reduced motion** for transitions

See [Accessibility](./accessibility.md) for detailed requirements.

### Security

- **Validate image URLs** before loading
- **Use CSP** to restrict image sources
- **Sanitise SVG content** if user-provided

See [Image Handling & Security](./image-handling-security.md) for security details.

## References

- [react-graceful-image](https://github.com/linasmnew/react-graceful-image)
- [Building React Component for Lazy Loading Images](https://www.timsanteford.com/posts/building-a-react-component-for-lazy-loading-images-with-error-fallback/)
- [SVG Fallbacks Guide - CSS-Tricks](https://css-tricks.com/a-complete-guide-to-svg-fallbacks/)
- [Progressive Image Loading in React](https://blog.logrocket.com/progressive-image-loading-react-tutorial/)
- [Pre-Caching Images with React Suspense](https://css-tricks.com/pre-caching-image-with-react-suspense/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [React Loading Skeleton](https://blog.logrocket.com/handling-react-loading-states-react-loading-skeleton/)

---

## Related Documentation

- [Image Handling & Security](./image-handling-security.md) - Security aspects of image loading
- [Performance & Virtualisation](./performance-virtualisation.md) - Lazy loading at scale
- [Customisation Options](./customisation-options.md) - Theme-based card backs

---

**Applies to**: Itemdeck v0.1.0+
