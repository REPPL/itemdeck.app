# F-003: Image Fallback System

## Problem Statement

Cards may reference images that fail to load (404, network error, CORS issues). Currently there's no graceful degradation - broken images display browser default error states. The application needs:

1. Multi-tier fallback strategy
2. Graceful error states with generated placeholders
3. Loading states during image fetch

## Design Approach

Implement an **ImageWithFallback** component with tiered fallback:

```
1. Primary image URL (external/remote)
2. Local fallback image (bundled asset)
3. Generated SVG placeholder (dynamic)
4. Solid colour background (ultimate fallback)
```

### ImageWithFallback Component

```tsx
import { useState, useCallback } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  placeholderColour?: string;
  className?: string;
}

type LoadState = 'loading' | 'loaded' | 'fallback' | 'placeholder';

export function ImageWithFallback({
  src,
  alt,
  fallbackSrc,
  placeholderColour = '#2a2a4e',
  className,
}: ImageWithFallbackProps) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = useCallback(() => {
    if (loadState === 'loading' && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setLoadState('fallback');
    } else {
      setLoadState('placeholder');
    }
  }, [loadState, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setLoadState('loaded');
  }, []);

  if (loadState === 'placeholder') {
    return (
      <SVGPlaceholder
        alt={alt}
        colour={placeholderColour}
        className={className}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={handleError}
      onLoad={handleLoad}
      className={className}
      style={{ opacity: loadState === 'loading' ? 0 : 1 }}
    />
  );
}
```

### SVG Placeholder Generator

```tsx
interface SVGPlaceholderProps {
  alt: string;
  colour: string;
  width?: number;
  height?: number;
  className?: string;
}

export function SVGPlaceholder({
  alt,
  colour,
  width = 300,
  height = 420,
  className,
}: SVGPlaceholderProps) {
  // Generate initials from alt text
  const initials = alt
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={alt}
    >
      <rect width="100%" height="100%" fill={colour} />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize={width * 0.2}
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
```

### Loading Skeleton

```tsx
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={`${styles.skeleton} ${className}`}>
      <div className={styles.shimmer} />
    </div>
  );
}
```

```css
.skeleton {
  background: linear-gradient(90deg, #2a2a4e 0%, #3a3a5e 50%, #2a2a4e 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Implementation Tasks

- [ ] Create `ImageWithFallback` component
- [ ] Create `SVGPlaceholder` component
- [ ] Create `ImageSkeleton` loading component
- [ ] Add CSS for loading animation
- [ ] Integrate with Card component
- [ ] Add blur-up progressive loading (optional)
- [ ] Handle CORS errors gracefully
- [ ] Add image caching headers support
- [ ] Write unit tests for fallback logic
- [ ] Write visual regression tests

## Success Criteria

- [ ] Failed images show placeholder, not broken icon
- [ ] Placeholder displays meaningful content (initials)
- [ ] Loading state is visually indicated
- [ ] Fallback chain works: primary → fallback → SVG → colour
- [ ] No console errors on image failures
- [ ] Accessible (aria-label on SVG)
- [ ] Tests cover all fallback states

## Dependencies

- **Requires**: F-002 Configuration System (for default colours)
- **Blocks**: None

## Complexity

**Small** - Self-contained component with clear requirements.

---

## Related Documentation

- [Asset Management Research](../../../../research/asset-management.md)
- [Image Handling Research](../../../../research/image-handling-security.md)
- [v0.1.0 Milestone](../../milestones/v0.1.0.md)
