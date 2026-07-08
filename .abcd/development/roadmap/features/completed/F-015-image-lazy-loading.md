# F-015: Image Lazy Loading

## Problem Statement

Loading all images upfront wastes bandwidth and slows initial render. Currently:

1. All card images load immediately
2. No progressive loading strategy
3. No intersection-based deferred loading
4. Failed images don't have graceful fallbacks

## Design Approach

Implement **Intersection Observer-based lazy loading** with progressive enhancement:

### Intersection Observer Hook

```typescript
// src/hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {}
): [RefObject<T>, boolean] {
  const { threshold = 0, rootMargin = '200px', triggerOnce = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}
```

### Lazy Image Component

```tsx
// src/components/LazyImage/LazyImage.tsx
import { useState, useCallback, ImgHTMLAttributes } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import styles from './LazyImage.module.css';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  fallbackSrc?: string;
  placeholderColor?: string;
  blur?: boolean;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export function LazyImage({
  src,
  fallbackSrc,
  alt = '',
  placeholderColor = '#e2e8f0',
  blur = true,
  className,
  ...props
}: LazyImageProps) {
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '200px',
    triggerOnce: true,
  });
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  const handleLoad = useCallback(() => {
    setLoadState('loaded');
  }, []);

  const handleError = useCallback(() => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setLoadState('loading');
    } else {
      setLoadState('error');
    }
  }, [fallbackSrc, currentSrc]);

  // Start loading when visible
  if (isVisible && loadState === 'idle') {
    setLoadState('loading');
    setCurrentSrc(src);
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className ?? ''}`}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* Placeholder skeleton */}
      {loadState !== 'loaded' && (
        <div
          className={styles.placeholder}
          role="presentation"
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            ${styles.image}
            ${loadState === 'loaded' ? styles.visible : styles.hidden}
            ${blur && loadState === 'loading' ? styles.blur : ''}
          `}
          {...props}
        />
      )}

      {/* Error state */}
      {loadState === 'error' && (
        <div className={styles.errorState} role="img" aria-label={alt}>
          <ImageOffIcon />
        </div>
      )}
    </div>
  );
}

function ImageOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />
      <line x1="13.5" y1="13.5" x2="6" y2="21" />
      <path d="M18 12l3.5 3.5-3.5 3.5" />
      <path d="M21 19l-9-9" />
    </svg>
  );
}
```

### Lazy Image Styles

```css
/* src/components/LazyImage/LazyImage.module.css */
.container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.hidden {
  opacity: 0;
}

.visible {
  opacity: 1;
}

.blur {
  filter: blur(10px);
  transform: scale(1.1);
}

.errorState {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--colour-surface);
  color: var(--colour-text-muted);
}

.errorState svg {
  width: 48px;
  height: 48px;
}

/* Reduce motion preference */
@media (prefers-reduced-motion: reduce) {
  .placeholder {
    animation: none;
  }

  .image {
    transition: none;
  }

  .blur {
    filter: none;
    transform: none;
  }
}
```

### Progressive Image Component

```tsx
// src/components/ProgressiveImage/ProgressiveImage.tsx
import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import styles from './ProgressiveImage.module.css';

interface ProgressiveImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  lowResSrc?: string; // Tiny placeholder (e.g., 20px wide LQIP)
  alt: string;
}

export function ProgressiveImage({
  src,
  lowResSrc,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  const [containerRef, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '100px',
  });
  const [highResLoaded, setHighResLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(lowResSrc || null);

  useEffect(() => {
    if (!isVisible) return;

    const img = new Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setHighResLoaded(true);
    };
  }, [isVisible, src]);

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${className ?? ''}`}
    >
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`
            ${styles.image}
            ${highResLoaded ? styles.sharp : styles.blurred}
          `}
          {...props}
        />
      )}
    </div>
  );
}
```

### Image Preloading Utility

```typescript
// src/utils/imagePreloader.ts

interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto';
  timeout?: number;
}

export function preloadImage(
  src: string,
  options: PreloadOptions = {}
): Promise<HTMLImageElement> {
  const { priority = 'auto', timeout = 10000 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();

    // Use fetchpriority hint if available
    if ('fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = priority;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout: ${src}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image: ${src}`));
    };

    img.src = src;
  });
}

export function preloadImages(
  srcs: string[],
  options: PreloadOptions = {}
): Promise<PromiseSettledResult<HTMLImageElement>[]> {
  return Promise.allSettled(
    srcs.map(src => preloadImage(src, options))
  );
}

// Preload images that are about to enter viewport
export function preloadUpcoming(
  containerRef: HTMLElement,
  images: string[],
  currentIndex: number,
  preloadCount: number = 3
): void {
  const upcoming = images.slice(currentIndex, currentIndex + preloadCount);
  preloadImages(upcoming, { priority: 'low' });
}
```

### Native Lazy Loading Wrapper

```tsx
// src/components/NativeLazyImage/NativeLazyImage.tsx
import { ImgHTMLAttributes } from 'react';

interface NativeLazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function NativeLazyImage({
  src,
  alt,
  ...props
}: NativeLazyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
}
```

## Implementation Tasks

- [ ] Create `useIntersectionObserver` hook
- [ ] Create `LazyImage` component with states
- [ ] Create shimmer placeholder animation
- [ ] Implement error state with fallback
- [ ] Create `ProgressiveImage` for LQIP support
- [ ] Create image preloading utilities
- [ ] Add native `loading="lazy"` fallback
- [ ] Integrate with Card component
- [ ] Respect `prefers-reduced-motion`
- [ ] Handle images in virtualised lists
- [ ] Write unit tests for loading states
- [ ] Write visual tests for transitions

## Success Criteria

- [ ] Images load only when approaching viewport
- [ ] Shimmer animation shows during load
- [ ] Smooth fade-in when loaded
- [ ] Error state displays fallback icon
- [ ] Native lazy loading used as baseline
- [ ] Progressive loading works with LQIP
- [ ] Reduced motion preference respected
- [ ] Memory usage lower than eager loading
- [ ] Tests pass

## Dependencies

- **Requires**: F-014 Virtual Scrolling (integration)
- **Blocks**: None

## Complexity

**Small** - Well-established patterns with clear browser APIs.

---

## Implementation Notes

**Milestone**: v0.10.6 (recognised as complete - originally planned for v0.4.0)

### Component Path

`src/components/LazyImage/`

### Key Files

- `LazyImage.tsx` - Intersection Observer-based lazy loading component
- `LazyImage.module.css` - Shimmer animation and loading styles
- `index.ts` - Module exports

### Integration

- Uses Intersection Observer API for viewport detection
- Supports placeholder shimmer animation
- Handles error states with fallback display
- Respects `prefers-reduced-motion` preference
- Native `loading="lazy"` attribute as baseline

---

## Related Documentation

- [Performance & Virtualisation Research](../../../../research/performance-virtualisation.md)
- [Asset Management Research](../../../../research/asset-management.md)
- [v0.10.6 Milestone](../../milestones/v0.10.6.md)

---

**Status**: Complete
