# Card Layouts & Animations

## Executive Summary

For Itemdeck's card flip and reveal animations, **Framer Motion** is the recommended primary library due to its React-first design, excellent gesture support, and dominant ecosystem adoption (13M+ weekly downloads). The library provides declarative APIs for 3D transforms, layout animations, and gesture handling with built-in GPU acceleration.

Key recommendations:
1. Use CSS 3D transforms with `perspective`, `transform-style: preserve-3d`, and `backface-visibility: hidden` for card flips
2. Adopt Framer Motion for orchestrating animations and handling gestures
3. Animate only `transform` and `opacity` properties for optimal performance
4. Implement a "lift and flip" keyframe animation for realistic card behaviour

## Current State in Itemdeck

Itemdeck currently uses:
- **Absolute positioning** with CSS transitions for smooth card repositioning during resize
- **ResizeObserver** for responsive layout recalculation
- **CSS Modules** for component-scoped styling
- Card dimensions: 300×420px (5:7 poker ratio)

The current `Card` component displays a back design. No flip or reveal animations exist yet.

## Research Findings

### Card Flip Animation Approaches

#### 1. Basic CSS 3D Flip

The foundational approach using pure CSS:

```css
.flip-card {
  perspective: 1000px;
  width: 300px;
  height: 420px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
```

**Pros:** Zero dependencies, excellent performance
**Cons:** Limited control over timing, no gesture integration

#### 2. Realistic "Lift and Flip" Animation

Real cards lift off the surface before flipping. This creates a more physical feel:

```css
@keyframes realistic-flip {
  0% {
    transform: rotateY(0deg) translateZ(0);
  }
  50% {
    transform: rotateY(90deg) translateZ(50px);
  }
  100% {
    transform: rotateY(180deg) translateZ(0);
  }
}

.flip-card.flipping .flip-card-inner {
  animation: realistic-flip 0.8s ease-in-out forwards;
}
```

#### 3. Card Thickness Simulation

Adding depth to cards for enhanced realism:

```css
.card-edge {
  position: absolute;
  width: 4px;
  height: 100%;
  background: linear-gradient(to right, #1a1a2e, #2a2a4e);
  transform: translateX(-2px) rotateY(-90deg);
  transform-origin: right center;
}
```

### Reveal/Expand Patterns

#### Full-Screen Expand with Framer Motion

```tsx
import { motion, AnimatePresence } from 'framer-motion';

interface ExpandableCardProps {
  card: Card;
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandableCard({ card, isExpanded, onToggle }: ExpandableCardProps) {
  return (
    <AnimatePresence>
      <motion.div
        layout
        onClick={onToggle}
        initial={{ borderRadius: 8 }}
        animate={{
          width: isExpanded ? '100vw' : 300,
          height: isExpanded ? '100vh' : 420,
          position: isExpanded ? 'fixed' : 'relative',
          top: isExpanded ? 0 : 'auto',
          left: isExpanded ? 0 : 'auto',
          zIndex: isExpanded ? 1000 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        <CardContent card={card} expanded={isExpanded} />
      </motion.div>
    </AnimatePresence>
  );
}
```

#### Shared Layout Animation

For smooth transitions between card grid and detail view:

```tsx
import { motion, LayoutGroup } from 'framer-motion';

function CardGrid({ cards }: { cards: Card[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedCard = cards.find(c => c.id === selectedId);

  return (
    <LayoutGroup>
      <div className={styles.grid}>
        {cards.map(card => (
          <motion.div
            key={card.id}
            layoutId={card.id}
            onClick={() => setSelectedId(card.id)}
            className={styles.card}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedCard && (
          <motion.div
            layoutId={selectedCard.id}
            className={styles.expandedCard}
            onClick={() => setSelectedId(null)}
          >
            <CardDetail card={selectedCard} />
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
```

### Gesture Support

#### Framer Motion Gestures

Built-in gesture support with `whileHover`, `whileTap`, and `drag`:

```tsx
<motion.div
  whileHover={{ scale: 1.05, rotateY: 5 }}
  whileTap={{ scale: 0.98 }}
  drag="x"
  dragConstraints={{ left: -100, right: 100 }}
  onDragEnd={(_, info) => {
    if (Math.abs(info.offset.x) > 50) {
      handleSwipe(info.offset.x > 0 ? 'right' : 'left');
    }
  }}
>
  <Card />
</motion.div>
```

#### @use-gesture/react + React Spring

For more complex gesture logic:

```tsx
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

function DraggableCard() {
  const [{ x, y, rotateZ }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotateZ: 0,
  }));

  const bind = useDrag(({ down, movement: [mx, my], velocity: [vx] }) => {
    api.start({
      x: down ? mx : 0,
      y: down ? my : 0,
      rotateZ: down ? mx / 10 : 0,
      immediate: down,
      config: { tension: 500, friction: 30 },
    });

    if (!down && Math.abs(vx) > 0.5) {
      // Swipe detected
    }
  });

  return (
    <animated.div
      {...bind()}
      style={{ x, y, rotateZ, touchAction: 'none' }}
    >
      <Card />
    </animated.div>
  );
}
```

### Library Comparison (React/TypeScript)

| Library | Weekly Downloads | GitHub Stars | Bundle Size | TypeScript | Best For |
|---------|-----------------|--------------|-------------|------------|----------|
| [Framer Motion](https://motion.dev/) | 13.1M | 30.6k | ~32KB gzipped | Native | UI animations, gestures, layout |
| [GSAP](https://gsap.com/) | 1.4M | 23.5k | ~23KB core | @types | Complex timelines, scroll |
| [React Spring](https://react-spring.dev/) | 800k | 29k | ~16KB | Native | Physics-based motion |
| [@use-gesture/react](https://use-gesture.netlify.app/) | 1.6M | 9.5k | ~12KB | Native | Touch/mouse gestures |

### Feature Comparison

| Feature | Framer Motion | GSAP | React Spring | CSS Only |
|---------|--------------|------|--------------|----------|
| 3D Transforms | ✅ | ✅ | ✅ | ✅ |
| Gesture Support | ✅ Built-in | ❌ | ❌ (use @use-gesture) | ❌ |
| Layout Animation | ✅ Excellent | ⚠️ Manual | ⚠️ Manual | ❌ |
| Timeline Control | ⚠️ Basic | ✅ Excellent | ⚠️ Basic | ❌ |
| Physics-based | ⚠️ Basic | ⚠️ Plugin | ✅ Excellent | ❌ |
| Hardware Accel | ✅ Auto | ✅ Manual | ✅ Auto | ✅ |
| React Integration | ✅ Native | ⚠️ useEffect | ✅ Native | N/A |
| SSR Support | ✅ | ⚠️ | ✅ | ✅ |

### GPU Acceleration Best Practices

#### Properties Safe to Animate

| Property | GPU Accelerated | Notes |
|----------|----------------|-------|
| `transform` | ✅ Yes | Includes translate, scale, rotate |
| `opacity` | ✅ Yes | Compositor-only |
| `filter` | ✅ Yes | blur, brightness, etc. |
| `clipPath` | ✅ Yes | Shape morphing |
| `width/height` | ❌ No | Triggers layout |
| `top/left` | ❌ No | Triggers layout |
| `margin/padding` | ❌ No | Triggers layout |

#### Using will-change Responsibly

```css
/* Apply only during animation */
.card.animating {
  will-change: transform;
}

/* Remove after animation completes */
.card {
  will-change: auto;
}
```

**Warning:** Excessive `will-change` usage consumes GPU memory and degrades performance.

### Code Examples

#### Complete Flippable Card Component

```tsx
// src/components/FlippableCard/FlippableCard.tsx
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './FlippableCard.module.css';
import type { Card } from '../../types/card';

interface FlippableCardProps {
  card: Card;
  width?: number;
  height?: number;
}

export function FlippableCard({
  card,
  width = 300,
  height = 420
}: FlippableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  return (
    <div
      className={styles.container}
      style={{ width, height, perspective: 1000 }}
    >
      <motion.div
        className={styles.inner}
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        onClick={handleFlip}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={styles.front}>
          <img
            src={card.imageUrl}
            alt={card.name}
            loading="lazy"
          />
        </div>
        <div className={styles.back}>
          <CardBackDesign />
        </div>
      </motion.div>
    </div>
  );
}
```

```css
/* src/components/FlippableCard/FlippableCard.module.css */
.container {
  cursor: pointer;
}

.inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.front,
.back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: var(--card-radius, 8px);
  overflow: hidden;
}

.front img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.back {
  transform: rotateY(180deg);
  background: var(--colour-card-back, #1a1a2e);
}
```

#### Animation State During Resize

Handle animation interruption during window resize:

```tsx
import { useRef, useEffect } from 'react';
import { useAnimation } from 'framer-motion';

function useResizeAwareAnimation() {
  const controls = useAnimation();
  const isResizing = useRef(false);
  const resizeTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleResize = () => {
      isResizing.current = true;
      controls.stop(); // Pause animations during resize

      clearTimeout(resizeTimeout.current);
      resizeTimeout.current = setTimeout(() => {
        isResizing.current = false;
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout.current);
    };
  }, [controls]);

  return { controls, isResizing };
}
```

## Recommendations for Itemdeck

### Priority 1: Card Flip Animation

1. **Install Framer Motion**: `npm install framer-motion`
2. **Create FlippableCard component** with 3D CSS transforms
3. **Use spring physics** for natural-feeling flips (stiffness: 300, damping: 30)
4. **Add "lift" effect** using keyframes for realism

### Priority 2: Gesture Support

1. **Enable tap-to-flip** via Framer Motion's `onClick`
2. **Add hover effects** with `whileHover` for desktop
3. **Consider swipe gestures** for mobile card browsing

### Priority 3: Expand/Detail View

1. **Implement shared layout animation** for grid-to-detail transitions
2. **Use AnimatePresence** for enter/exit animations
3. **Create modal overlay** with spring-based expansion

### Priority 4: Performance Optimisation

1. **Animate only transform/opacity** - never animate layout properties
2. **Use `layout` prop** sparingly - powerful but expensive
3. **Implement `will-change: auto`** cleanup after animations
4. **Profile with Chrome DevTools** > Performance tab

## Implementation Considerations

### Dependencies

```json
{
  "dependencies": {
    "framer-motion": "^11.x"
  }
}
```

### Bundle Size Impact

- Framer Motion: ~32KB gzipped (acceptable for feature set)
- Alternative: Pure CSS for simple flips (~0KB additional)

### Breaking Changes

- None - new components, existing Card unchanged
- Consider deprecating existing Card in favour of FlippableCard

### Migration Path

1. Create FlippableCard alongside existing Card
2. Update CardGrid to use FlippableCard optionally
3. Add settings toggle for animation preferences
4. Remove old Card component once stable

### Accessibility Considerations

- Ensure keyboard activation (Enter/Space to flip)
- Respect `prefers-reduced-motion` media query
- Maintain focus during flip animation
- Announce state change to screen readers

See [Accessibility Research](./accessibility.md) for detailed a11y requirements.

## References

- [Framer Motion Documentation](https://motion.dev/)
- [A More Realistic Card Flip Animation](https://auroratide.com/posts/realistic-flip-animation/)
- [CSS 3D Transforms - Card Flip](https://3dtransforms.desandro.com/card-flip/)
- [W3Schools - How To Create a Flip Card](https://www.w3schools.com/howto/howto_css_flip_card.asp)
- [@use-gesture Documentation](https://use-gesture.netlify.app/)
- [Motion Performance Guide](https://motion.dev/docs/performance)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [npm Trends Comparison](https://npmtrends.com/framer-motion-vs-react-spring-vs-gsap)

---

## Related Documentation

### Research
- [Accessibility](./accessibility.md) - Keyboard navigation and reduced motion
- [Performance & Virtualisation](./performance-virtualisation.md) - Animation performance at scale
- [Customisation Options](./customisation-options.md) - User animation preferences

### Features
- [F-001: Card Flip Animation](../roadmap/features/completed/F-001-card-flip-animation.md) - Implementation of card flip
- [F-041: Card Animations Polish](../roadmap/features/planned/F-041-card-animations-polish.md) - Animation refinements

### Decisions
- [ADR-001: Animation Library](../decisions/adrs/ADR-001-animation-library.md) - Animation library selection

---

**Applies to**: Itemdeck v0.1.0+
