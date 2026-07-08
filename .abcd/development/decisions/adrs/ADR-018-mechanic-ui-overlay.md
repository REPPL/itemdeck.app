# ADR-018: Mechanic UI Overlay System

## Status

Accepted

## Context

Gaming mechanics need to render custom UI elements on top of cards and the grid. Examples:
- Memory Game: Match indicator, selection highlight
- Collection: Owned/wishlist badge
- Competing: Stat comparison overlay
- Quiz: Answer buttons
- Snap Ranking: Rating slider, progress bar

We need to decide how mechanics inject their UI into the existing component tree.

| Approach | Flexibility | Performance | Complexity | Animation |
|----------|-------------|-------------|------------|-----------|
| **Slot Props** | High | Excellent | Low | Native |
| **React Portals** | Highest | Good | Medium | Native |
| **Render Props** | High | Excellent | Medium | Native |
| **CSS Injection** | Low | Excellent | Low | Limited |
| **HOC Wrapping** | Medium | Good | High | Native |

## Decision

Use **Slot Props Pattern** with optional components defined in the mechanic interface.

Mechanics provide optional `CardOverlay` and `GridOverlay` components via their interface. Parent components (Card, CardGrid) render these in designated slots when a mechanic is active.

```typescript
interface Mechanic {
  // ... other fields

  // Optional overlay components
  CardOverlay?: ComponentType<CardOverlayProps>;
  GridOverlay?: ComponentType<GridOverlayProps>;
}

interface CardOverlayProps {
  card: DisplayCard;
  cardState: CardMechanicState;
  onAction?: (action: string, payload?: unknown) => void;
}

interface GridOverlayProps {
  cards: DisplayCard[];
  gameState: MechanicState;
  onAction?: (action: string, payload?: unknown) => void;
}
```

## Consequences

### Positive

- **Simple integration** - Just render the component if it exists
- **Type-safe** - Props are well-defined interfaces
- **Animation friendly** - Overlays can use Framer Motion
- **Scoped styles** - Each overlay manages its own CSS
- **Lazy loaded** - Overlay code bundled with mechanic

### Negative

- **Fixed positions** - Can only render in designated slots
- **z-index management** - Must coordinate with existing layers
- **Re-render coupling** - Card re-renders include overlay

### Mitigations

- **Multiple slots** - Provide slots at different positions (top, bottom, full)
- **z-index tokens** - Define z-index scale for overlays
- **Memo overlays** - Memoise overlay components to prevent unnecessary re-renders

## Card Overlay Implementation

```tsx
// src/components/Card/Card.tsx
import { useMechanic } from '@/mechanics/context';

function Card({ card, ...props }: CardProps) {
  const { mechanic, state } = useMechanic();

  const cardState = useMemo(() => {
    if (!mechanic) return null;
    return mechanic.getCardState?.(card.id) ?? null;
  }, [mechanic, card.id, state]);

  return (
    <div className="card" data-card-id={card.id}>
      <CardInner {...props} />

      {/* Mechanic overlay slot */}
      {mechanic?.CardOverlay && (
        <div className="card-overlay-slot">
          <mechanic.CardOverlay
            card={card}
            cardState={cardState}
            onAction={(action, payload) =>
              mechanic.getCardActions().onCardAction?.(card.id, action, payload)
            }
          />
        </div>
      )}
    </div>
  );
}
```

## Grid Overlay Implementation

```tsx
// src/components/CardGrid/CardGrid.tsx
import { useMechanic } from '@/mechanics/context';

function CardGrid({ cards }: CardGridProps) {
  const { mechanic, state } = useMechanic();

  return (
    <div className="card-grid">
      {/* Card rendering */}
      {cards.map(card => <Card key={card.id} card={card} />)}

      {/* Grid-level overlay (scoreboard, timer, etc.) */}
      {mechanic?.GridOverlay && (
        <div className="grid-overlay-slot">
          <mechanic.GridOverlay
            cards={cards}
            gameState={state}
            onAction={(action, payload) =>
              mechanic.getActions()[action]?.(payload)
            }
          />
        </div>
      )}
    </div>
  );
}
```

## Overlay Positions

### Card Overlay Slots

```
┌─────────────────────────────┐
│  [badge-top-left]           │  ← Match indicator
│                             │
│       Card Content          │
│                             │
│  [badge-bottom-left]        │  ← Collection status
│             [badge-bottom]  │  ← Selection state
└─────────────────────────────┘
     ↑ Full overlay possible
```

### Grid Overlay Positions

```
┌─────────────────────────────────────────┐
│  [top-bar]  Score: 150  Time: 2:30      │
├─────────────────────────────────────────┤
│                                         │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐   │
│   │     │  │     │  │     │  │     │   │
│   └─────┘  └─────┘  └─────┘  └─────┘   │
│                                         │
│   [center-modal]  Game Complete! 🎉     │
│                                         │
├─────────────────────────────────────────┤
│  [bottom-bar]  [Pause] [Reset]          │
└─────────────────────────────────────────┘
```

## Z-Index Scale

```css
/* src/styles/z-index.css */
:root {
  --z-card-base: 1;
  --z-card-hover: 10;
  --z-card-overlay: 20;
  --z-grid-overlay: 100;
  --z-modal: 1000;
  --z-mechanic-modal: 900;  /* Below app modal */
  --z-tooltip: 1100;
}
```

## Animation Coordination

Overlays can use Framer Motion with existing card animations:

```tsx
// Memory Game Card Overlay
function MemoryCardOverlay({ card, cardState }: CardOverlayProps) {
  return (
    <AnimatePresence>
      {cardState?.isMatched && (
        <motion.div
          className="match-indicator"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          ✓
        </motion.div>
      )}

      {cardState?.isSelected && !cardState?.isMatched && (
        <motion.div
          className="selection-ring"
          layoutId={`selection-${card.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </AnimatePresence>
  );
}
```

## Overlay Styling Guidelines

1. **Use CSS Modules** - Scope styles to overlay component
2. **Respect theme** - Use CSS custom properties for colours
3. **Support reduced motion** - Check `prefers-reduced-motion`
4. **Avoid layout shift** - Use absolute positioning
5. **Touch targets** - Minimum 44x44px for interactive elements

```css
/* MemoryCardOverlay.module.css */
.matchIndicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--colour-success);
  color: white;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  z-index: var(--z-card-overlay);
  pointer-events: none;  /* Don't block card clicks */
}

@media (prefers-reduced-motion: reduce) {
  .matchIndicator {
    animation: none;
  }
}
```

## Alternatives Considered

### React Portals

- Render overlays to a root-level container
- **Rejected**: Loses layout context, complicates positioning relative to cards

### Render Props

- Pass render function to Card component
- **Rejected**: More verbose, harder to type, less intuitive

### CSS-Only Overlays

- Use data attributes and CSS to show/hide
- **Rejected**: Limited to simple visuals, no interactive content

### Higher-Order Components

- Wrap Card with mechanic-specific HOC
- **Rejected**: Complex composition, multiple wrapping layers

---

## Related Documentation

- [ADR-016: Gaming Mechanics Plugin Architecture](./ADR-016-gaming-mechanics-plugin-architecture.md)
- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [Modular Architecture Research](../../research/modular-architecture.md)
- [Card Layouts & Animations Research](../../research/card-layouts-animations.md)

---

**Applies to**: Itemdeck v0.11.0+
