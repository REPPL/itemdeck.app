# F-005: Reduced Motion Support

## Problem Statement

Some users experience motion sickness, vestibular disorders, or simply prefer minimal animations. The `prefers-reduced-motion` media query allows respecting this preference, but currently:

1. All animations play regardless of preference
2. No system for conditionally disabling animations
3. Framer Motion animations don't auto-respect the preference

WCAG 2.1 Success Criterion 2.3.3 recommends respecting motion preferences.

## Design Approach

Implement a **motion preference system** that:

1. Detects `prefers-reduced-motion` media query
2. Provides a React hook for components to check preference
3. Configures Framer Motion to respect preference
4. Allows user override in settings

### useReducedMotion Hook

```typescript
import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // SSR-safe initial value
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
```

### Framer Motion Integration

```tsx
import { MotionConfig } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
      {children}
    </MotionConfig>
  );
}
```

### CSS Fallback

```css
/* Disable CSS transitions when reduced motion preferred */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Alternative: Reduce but don't eliminate */
@media (prefers-reduced-motion: reduce) {
  .card-flip {
    transition-duration: 0.1s;
  }

  .card-reposition {
    transition-duration: 0.1s;
  }
}
```

### User Override Support

```typescript
interface MotionPreference {
  // 'system' uses OS preference
  // 'reduce' forces reduced motion
  // 'no-preference' forces full motion
  mode: 'system' | 'reduce' | 'no-preference';
}

export function useMotionPreference() {
  const systemPreference = useReducedMotion();
  const [userPreference, setUserPreference] = useState<MotionPreference['mode']>('system');

  const effectivePreference = useMemo(() => {
    if (userPreference === 'system') {
      return systemPreference;
    }
    return userPreference === 'reduce';
  }, [userPreference, systemPreference]);

  return {
    prefersReducedMotion: effectivePreference,
    userPreference,
    setUserPreference,
    systemPreference,
  };
}
```

## Implementation Tasks

- [ ] Create `useReducedMotion` hook
- [ ] Create `MotionProvider` component wrapping app
- [ ] Configure Framer Motion `reducedMotion` prop
- [ ] Add CSS media query fallbacks
- [ ] Add user preference override to config
- [ ] Update Card flip to use reduced motion
- [ ] Update CardGrid transitions
- [ ] Add settings UI toggle (optional for v0.1.0)
- [ ] Test with system preference toggled
- [ ] Write unit tests for preference detection

## Success Criteria

- [ ] System `prefers-reduced-motion` is respected
- [ ] Card flip is instant when reduced motion enabled
- [ ] Grid repositioning is instant when reduced motion enabled
- [ ] No jarring instant changes (subtle reduced motion, not none)
- [ ] User can override system preference (optional)
- [ ] Works across all browsers (Chrome, Firefox, Safari)
- [ ] Tests verify preference detection

## Dependencies

- **Requires**: F-001 Card Flip Animation
- **Blocks**: None

## Complexity

**Small** - Clear requirements, well-documented pattern.

---

## Related Documentation

- [Accessibility Research](../../../../research/accessibility.md)
- [Card Layouts Research - Accessibility Section](../../../../research/card-layouts-animations.md)
- [ADR-011: Accessibility Standard](../../../decisions/adrs/ADR-011-accessibility-standard.md)
- [v0.1.0 Milestone](../../milestones/v0.1.0.md)
