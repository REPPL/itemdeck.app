# ADR-001: Use Framer Motion for Animations

## Status

Accepted

## Context

Itemdeck requires smooth, accessible animations for:
- Card flip interactions (3D rotation)
- Grid repositioning on filter/resize
- Transition effects between states
- Potential carousel/deck layouts

We evaluated several animation libraries:

| Library | Bundle Size | Features | React Integration |
|---------|-------------|----------|-------------------|
| Framer Motion | 45KB | Gestures, layout, 3D | Excellent |
| React Spring | 25KB | Physics-based | Good |
| GSAP | 60KB | Timeline, complex | Wrapper needed |
| CSS Animations | 0KB | Limited | Native |

Key requirements:
1. 3D transforms for card flip
2. Layout animations for grid repositioning
3. Reduced motion support
4. TypeScript support
5. Active maintenance

## Decision

Use **Framer Motion** as the primary animation library.

## Consequences

### Positive

- **Declarative API** - Animations defined in JSX with `motion` components
- **Layout animations** - `AnimatePresence` and `layoutId` handle complex transitions
- **3D support** - Native `rotateY`, `perspective` for card flip
- **Reduced motion** - `MotionConfig` respects `prefers-reduced-motion`
- **Gesture support** - Built-in drag, hover, tap handlers
- **TypeScript** - Full type definitions included

### Negative

- **Bundle size** - 45KB gzipped (larger than alternatives)
- **Learning curve** - API differs from CSS animations
- **Dependency** - Single vendor dependency for animations

### Mitigations

- Tree-shaking enabled (only import used features)
- Consider lazy loading for heavy animation components
- Document patterns for team consistency

## Alternatives Considered

### React Spring
- Smaller bundle size
- Physics-based animations
- **Rejected**: Less intuitive API for 3D transforms

### GSAP
- Industry-standard power
- Timeline support
- **Rejected**: Licensing concerns, requires wrapper

### CSS-only
- Zero bundle impact
- **Rejected**: Complex 3D and layout animations difficult

---

## Related Documentation

- [Card Layouts & Animations Research](../../../research/card-layouts-animations.md)
- [F-001: Card Flip Animation](../../roadmap/features/completed/F-001-card-flip-animation.md)
