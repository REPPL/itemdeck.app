# F-001: Card Flip Animation

## Problem Statement

Users cannot interact with cards to reveal their content. The current Card component only displays a static back design. Cards need a flip animation to reveal front-side content, creating the core "Memory game" interaction metaphor.

## Design Approach

Implement a 3D card flip using **CSS transforms** for the flip mechanics and **Framer Motion** for orchestration and gesture handling. The flip should:

1. Use CSS `perspective` and `transform-style: preserve-3d` for realistic 3D effect
2. Include a subtle "lift" during the flip for physical feel
3. Support both click and keyboard activation
4. Respect `prefers-reduced-motion` for accessibility

### Component Architecture

Refactor Card as a compound component:

```tsx
// Usage
<Card>
  <Card.Front>
    <CardContent card={card} />
  </Card.Front>
  <Card.Back>
    <CardBack />
  </Card.Back>
</Card>

// Or with flip control
<Card isFlipped={isFlipped} onFlip={handleFlip}>
  ...
</Card>
```

### Core CSS for 3D Flip

```css
.card {
  perspective: 1000px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}
```

### Framer Motion Integration

```tsx
import { motion } from 'framer-motion';

const flipVariants = {
  front: { rotateY: 0 },
  back: { rotateY: 180 },
};

function FlippableCard({ isFlipped, onFlip, children }) {
  return (
    <motion.div
      className={styles.card}
      animate={isFlipped ? 'back' : 'front'}
      variants={flipVariants}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      onClick={onFlip}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
```

## Implementation Tasks

- [ ] Install Framer Motion: `npm install framer-motion`
- [ ] Create `FlippableCard` component with compound pattern
- [ ] Implement CSS 3D transform styles in Card.module.css
- [ ] Add `isFlipped` state management to CardGrid
- [ ] Implement click handler for flip toggle
- [ ] Add keyboard support (Enter/Space to flip)
- [ ] Add `prefers-reduced-motion` handling (instant flip)
- [ ] Update Card types for front/back content
- [ ] Write unit tests for flip state
- [ ] Write visual regression test for flip states

## Success Criteria

- [ ] Cards flip smoothly on click (0.6s duration)
- [ ] Both card faces render correctly
- [ ] Flip works with keyboard (Enter/Space)
- [ ] Reduced motion preference disables animation
- [ ] No layout shift during flip
- [ ] Works on mobile (touch support)
- [ ] TypeScript types are complete
- [ ] Tests pass

## Dependencies

- **Requires**: None (first feature)
- **Blocks**: F-004 Keyboard Navigation (needs flip interaction)

## Complexity

**Medium** - Involves new dependency, component refactoring, and accessibility considerations.

---

## Related Documentation

- [Card Layouts & Animations Research](../../../../research/card-layouts-animations.md)
- [ADR-001: Animation Library](../../../decisions/adrs/ADR-001-animation-library.md)
- [Accessibility Research](../../../../research/accessibility.md)
- [v0.1.0 Milestone](../../milestones/v0.1.md)
