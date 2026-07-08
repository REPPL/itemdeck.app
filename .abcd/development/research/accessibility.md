# Accessibility (a11y)

## Executive Summary

For Itemdeck's accessibility, implement **WCAG 2.2 Level AA compliance**: semantic HTML, **keyboard navigation** for the card grid, **ARIA attributes** for dynamic content, and **respect for prefers-reduced-motion**. Screen reader support requires proper focus management and live region announcements.

Key recommendations:
1. Use semantic HTML elements (`<article>` for cards, `<button>` for actions)
2. Implement grid keyboard navigation with arrow keys
3. Respect `prefers-reduced-motion` for all animations
4. Test with screen readers (NVDA, VoiceOver)
5. Maintain visible focus indicators with 3:1 contrast

## Current State in Itemdeck

Itemdeck currently uses:
- **Div-based layout** - limited semantic meaning
- **No keyboard navigation** beyond browser defaults
- **No ARIA attributes** for dynamic content
- **No reduced motion** handling
- **Basic focus styles** from browser defaults

Accessibility features need to be added from scratch.

## Research Findings

### WCAG 2.2 Compliance Targets

| Level | Criteria | Itemdeck Relevance |
|-------|----------|-------------------|
| A | Basic accessibility | Required baseline |
| AA | Enhanced accessibility | Target level |
| AAA | Highest accessibility | Nice-to-have |

Key success criteria for Itemdeck:

| Criterion | Description | Priority |
|-----------|-------------|----------|
| 1.1.1 Non-text Content | Alt text for images | High |
| 1.4.3 Contrast | 4.5:1 for text | High |
| 2.1.1 Keyboard | All functionality via keyboard | High |
| 2.1.2 No Keyboard Trap | Users can navigate away | High |
| 2.4.7 Focus Visible | Clear focus indicators | High |
| 2.3.3 Animation | Respect reduced motion | High |
| 4.1.2 Name, Role, Value | ARIA for custom widgets | High |

### Semantic HTML for Cards

```tsx
// src/components/Card/Card.tsx
interface CardProps {
  card: CardData;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Card({ card, isFlipped, onFlip }: CardProps) {
  const cardRef = useRef<HTMLElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <article
      ref={cardRef}
      className={styles.card}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`${card.name}. ${isFlipped ? 'Showing details' : 'Press Enter to flip'}`}
      onKeyDown={handleKeyDown}
      onClick={onFlip}
    >
      <div className={styles.cardInner} aria-hidden="true">
        <div className={styles.front}>
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
          />
          <h3 className={styles.title}>{card.name}</h3>
        </div>
        <div className={styles.back}>
          <p>{card.description}</p>
        </div>
      </div>

      {/* Screen reader only content */}
      <span className="sr-only">
        {isFlipped ? card.description : `${card.name}. ${card.category}`}
      </span>
    </article>
  );
}
```

### Grid Keyboard Navigation

```tsx
// src/components/CardGrid/CardGrid.tsx
import { useRef, useCallback, KeyboardEvent } from 'react';

interface CardGridProps {
  cards: CardData[];
  columns: number;
}

export function CardGrid({ cards, columns }: CardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { key } = e;
    const total = cards.length;

    let nextIndex = focusedIndex;

    switch (key) {
      case 'ArrowRight':
        nextIndex = Math.min(focusedIndex + 1, total - 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(focusedIndex - 1, 0);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(focusedIndex + columns, total - 1);
        break;
      case 'ArrowUp':
        nextIndex = Math.max(focusedIndex - columns, 0);
        break;
      case 'Home':
        nextIndex = e.ctrlKey ? 0 : Math.floor(focusedIndex / columns) * columns;
        break;
      case 'End':
        nextIndex = e.ctrlKey ? total - 1 : Math.min(
          Math.floor(focusedIndex / columns) * columns + columns - 1,
          total - 1
        );
        break;
      default:
        return;
    }

    if (nextIndex !== focusedIndex) {
      e.preventDefault();
      setFocusedIndex(nextIndex);
      focusCard(nextIndex);
    }
  }, [focusedIndex, cards.length, columns]);

  const focusCard = (index: number) => {
    const cards = gridRef.current?.querySelectorAll('[role="button"]');
    (cards?.[index] as HTMLElement)?.focus();
  };

  return (
    <div
      ref={gridRef}
      className={styles.grid}
      role="grid"
      aria-label="Card collection"
      onKeyDown={handleKeyDown}
    >
      <div role="row" className={styles.row}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            role="gridcell"
            className={styles.cell}
          >
            <Card
              card={card}
              tabIndex={index === focusedIndex ? 0 : -1}
              onFocus={() => setFocusedIndex(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Focus Management

```tsx
// src/hooks/useFocusTrap.ts
import { useEffect, useRef, RefObject } from 'react';

export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean
): RefObject<T> {
  const containerRef = useRef<T>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store current focus
    previousFocus.current = document.activeElement as HTMLElement;

    // Find focusable elements
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus
      previousFocus.current?.focus();
    };
  }, [isActive]);

  return containerRef;
}
```

### Reduced Motion Support

```tsx
// src/hooks/usePrefersReducedMotion.ts
import { useState, useEffect } from 'react';

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}
```

```tsx
// Usage in animation component
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

function AnimatedCard({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}
```

### CSS Reduced Motion

```css
/* src/styles/accessibility.css */

/* Respect reduced motion preference */
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

/* Safe animations - opacity doesn't cause motion sickness */
@media (prefers-reduced-motion: reduce) {
  .card-flip {
    transition: opacity 0.2s ease;
  }

  .card-flip.flipped {
    opacity: 0.8;
  }
}
```

### Framer Motion Configuration

```tsx
// src/providers/MotionProvider.tsx
import { MotionConfig } from 'framer-motion';
import { ReactNode } from 'react';

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
```

### ARIA Live Regions

```tsx
// src/components/LiveRegion/LiveRegion.tsx
import { useState, useEffect, ReactNode } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
}

export function LiveRegion({
  message,
  politeness = 'polite'
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      // Clear and re-announce for screen readers
      setAnnouncement('');
      setTimeout(() => setAnnouncement(message), 100);
    }
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

// Usage
function CardGrid({ cards }: { cards: Card[] }) {
  const [filterMessage, setFilterMessage] = useState('');

  const handleFilter = (filter: string) => {
    const filtered = applyFilter(cards, filter);
    setFilterMessage(`Showing ${filtered.length} cards`);
  };

  return (
    <>
      <LiveRegion message={filterMessage} />
      {/* Grid content */}
    </>
  );
}
```

### Screen Reader Only Styles

```css
/* src/styles/sr-only.css */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Allow focus for skip links */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: inherit;
}
```

### Skip Links

```tsx
// src/components/SkipLinks/SkipLinks.tsx
import styles from './SkipLinks.module.css';

export function SkipLinks() {
  return (
    <nav className={styles.skipLinks} aria-label="Skip links">
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>
      <a href="#card-grid" className={styles.skipLink}>
        Skip to card grid
      </a>
    </nav>
  );
}
```

```css
/* src/components/SkipLinks/SkipLinks.module.css */
.skipLinks {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
}

.skipLink {
  position: absolute;
  left: -9999px;
  padding: 0.75rem 1rem;
  background: var(--colour-primary);
  color: white;
  text-decoration: none;
  font-weight: 600;
}

.skipLink:focus {
  left: 0;
  top: 0;
}
```

### Focus Indicators

```css
/* src/styles/focus.css */

/* Default focus indicator */
:focus-visible {
  outline: 3px solid var(--colour-primary);
  outline-offset: 2px;
}

/* Card-specific focus */
.card:focus-visible {
  outline: 3px solid var(--colour-primary);
  outline-offset: 4px;
  box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.2);
}

/* Remove default outline when custom styling applied */
.card:focus {
  outline: none;
}

.card:focus-visible {
  outline: 3px solid var(--colour-primary);
}

/* High contrast mode */
@media (prefers-contrast: more) {
  :focus-visible {
    outline: 4px solid;
    outline-offset: 4px;
  }
}
```

### Colour Contrast

```typescript
// src/utils/contrast.ts

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Check WCAG compliance
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }

  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}
```

### Accessibility Testing Tools

```json
// package.json
{
  "devDependencies": {
    "@axe-core/react": "^4.x",
    "eslint-plugin-jsx-a11y": "^6.x",
    "@testing-library/jest-dom": "^6.x"
  }
}
```

```typescript
// src/utils/a11yAudit.ts (development only)
import React from 'react';

export async function setupA11yAudit() {
  if (import.meta.env.DEV) {
    const axe = await import('@axe-core/react');
    const ReactDOM = await import('react-dom');

    axe.default(React, ReactDOM, 1000);
  }
}

// Call in main.tsx
setupA11yAudit();
```

### ESLint Configuration

```json
// .eslintrc.json
{
  "extends": [
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "jsx-a11y/tabindex-no-positive": "error",
    "jsx-a11y/no-noninteractive-tabindex": "warn",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/no-static-element-interactions": "error"
  }
}
```

### Accessibility Component Tests

```typescript
// src/__tests__/accessibility.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Card } from '../components/Card';

expect.extend(toHaveNoViolations);

describe('Card accessibility', () => {
  it('should have no axe violations', async () => {
    const { container } = render(
      <Card
        card={{ id: '1', name: 'Test Card', imageUrl: '/test.jpg' }}
        isFlipped={false}
        onFlip={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible', async () => {
    const onFlip = jest.fn();
    render(
      <Card
        card={{ id: '1', name: 'Test Card', imageUrl: '/test.jpg' }}
        isFlipped={false}
        onFlip={onFlip}
      />
    );

    const card = screen.getByRole('button', { name: /Test Card/i });
    card.focus();
    expect(card).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(onFlip).toHaveBeenCalled();
  });

  it('should have accessible name', () => {
    render(
      <Card
        card={{ id: '1', name: 'Test Card', imageUrl: '/test.jpg' }}
        isFlipped={false}
        onFlip={() => {}}
      />
    );

    expect(screen.getByRole('button')).toHaveAccessibleName(/Test Card/i);
  });

  it('should have visible focus indicator', async () => {
    render(
      <Card
        card={{ id: '1', name: 'Test Card', imageUrl: '/test.jpg' }}
        isFlipped={false}
        onFlip={() => {}}
      />
    );

    const card = screen.getByRole('button');
    await userEvent.tab();

    expect(card).toHaveFocus();
    // Visual check would be done in visual regression tests
  });
});
```

### Accessibility Checklist

```markdown
## Card Component
- [ ] Uses semantic `<article>` element
- [ ] Has accessible name (aria-label or heading)
- [ ] Image has descriptive alt text
- [ ] Interactive elements are keyboard accessible
- [ ] Focus indicator is visible (3:1 contrast)
- [ ] Flipped state is announced to screen readers

## Card Grid
- [ ] Grid has accessible role and label
- [ ] Arrow key navigation works
- [ ] Home/End navigation works
- [ ] Focus moves visually and programmatically
- [ ] Filter changes are announced

## Animations
- [ ] Respects prefers-reduced-motion
- [ ] Flip animation has reduced motion alternative
- [ ] No infinite animations that can't be paused

## Theme
- [ ] Text has 4.5:1 contrast ratio
- [ ] Focus indicators have 3:1 contrast
- [ ] Works in high contrast mode
- [ ] Works in forced colors mode
```

## Recommendations for Itemdeck

### Priority 1: Semantic HTML

1. **Use `<article>` for cards** with proper headings
2. **Add alt text** to all card images
3. **Use `<button>` for actions** not divs with onClick

### Priority 2: Keyboard Navigation

1. **Implement grid navigation** with arrow keys
2. **Add skip links** to main content areas
3. **Ensure no keyboard traps** in modals

### Priority 3: Reduced Motion

1. **Create usePrefersReducedMotion hook**
2. **Configure Framer Motion** with `reducedMotion="user"`
3. **Add CSS fallbacks** for reduced motion

### Priority 4: Screen Reader Support

1. **Add ARIA labels** to interactive elements
2. **Implement live regions** for dynamic updates
3. **Test with NVDA/VoiceOver**

### Priority 5: Testing

1. **Install eslint-plugin-jsx-a11y**
2. **Add axe-core** for development testing
3. **Write accessibility tests** with jest-axe

## Implementation Considerations

### Dependencies

```json
{
  "devDependencies": {
    "@axe-core/react": "^4.x",
    "eslint-plugin-jsx-a11y": "^6.x",
    "jest-axe": "^9.x"
  }
}
```

### Bundle Size Impact

- eslint-plugin-jsx-a11y: dev only
- @axe-core/react: dev only (tree-shake in production)
- Runtime a11y utilities: ~1KB

### Testing Strategy

1. Automated: ESLint rules, axe-core in dev
2. Semi-automated: jest-axe in unit tests
3. Manual: Screen reader testing, keyboard testing

### Screen Reader Testing Matrix

| Screen Reader | Browser | OS | Priority |
|---------------|---------|-----|----------|
| NVDA | Firefox | Windows | High |
| VoiceOver | Safari | macOS | High |
| VoiceOver | Safari | iOS | Medium |
| TalkBack | Chrome | Android | Medium |
| JAWS | Chrome | Windows | Low |

## References

- [React Accessibility Documentation](https://legacy.reactjs.org/docs/accessibility.html)
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Motion Accessibility - Framer Motion](https://motion.dev/docs/react-accessibility)
- [prefers-reduced-motion - Josh W. Comeau](https://www.joshwcomeau.com/react/prefers-reduced-motion/)
- [React Aria](https://react-spectrum.adobe.com/react-aria/accessibility.html)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [axe-core](https://github.com/dequelabs/axe-core)

---

## Related Documentation

### Research
- [Card Layouts & Animations](./card-layouts-animations.md) - Animation accessibility
- [Customisation Options](./customisation-options.md) - Theme contrast requirements
- [Testing Strategies](./testing-strategies.md) - Accessibility testing

### Features
- [F-019: Accessibility Audit](../roadmap/features/planned/F-019-accessibility-audit.md) - Comprehensive accessibility review
- [F-024: ARIA Live Regions](../roadmap/features/completed/F-024-aria-live-regions.md) - Screen reader announcements

### Decisions
- [ADR-011: Accessibility Standard](../decisions/adrs/ADR-011-accessibility-standard.md) - Accessibility approach decisions

---

**Applies to**: Itemdeck v0.1.0+
