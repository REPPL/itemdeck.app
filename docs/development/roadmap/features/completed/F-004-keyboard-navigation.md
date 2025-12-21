# F-004: Keyboard Navigation

## Problem Statement

The card grid is currently mouse-only. Users who rely on keyboards (accessibility requirement) or prefer keyboard navigation cannot:

1. Navigate between cards
2. Flip cards with keyboard
3. Understand current focus position

WCAG 2.1 Success Criterion 2.1.1 requires all functionality to be operable through a keyboard.

## Design Approach

Implement **roving tabindex** pattern for grid navigation:

- Arrow keys move between cards
- Enter/Space flips focused card
- Only one card is in tab order at a time
- Visual focus indicator shows current position

### Keyboard Navigation Hook

```tsx
import { useCallback, useState, KeyboardEvent } from 'react';

interface UseGridNavigationOptions {
  totalItems: number;
  columns: number;
  onSelect?: (index: number) => void;
}

export function useGridNavigation({
  totalItems,
  columns,
  onSelect,
}: UseGridNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      let newIndex = focusedIndex;

      switch (event.key) {
        case 'ArrowRight':
          newIndex = Math.min(focusedIndex + 1, totalItems - 1);
          break;
        case 'ArrowLeft':
          newIndex = Math.max(focusedIndex - 1, 0);
          break;
        case 'ArrowDown':
          newIndex = Math.min(focusedIndex + columns, totalItems - 1);
          break;
        case 'ArrowUp':
          newIndex = Math.max(focusedIndex - columns, 0);
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = totalItems - 1;
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onSelect?.(focusedIndex);
          return;
        default:
          return;
      }

      if (newIndex !== focusedIndex) {
        event.preventDefault();
        setFocusedIndex(newIndex);
      }
    },
    [focusedIndex, totalItems, columns, onSelect]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getTabIndex: (index: number) => (index === focusedIndex ? 0 : -1),
  };
}
```

### Focus Management in CardGrid

```tsx
function CardGrid({ cards, onCardFlip }: CardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  const { focusedIndex, handleKeyDown, getTabIndex } = useGridNavigation({
    totalItems: cards.length,
    columns,
    onSelect: onCardFlip,
  });

  // Focus the card element when focusedIndex changes
  useEffect(() => {
    const card = cardRefs.current.get(focusedIndex);
    card?.focus();
  }, [focusedIndex]);

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label="Card collection"
      onKeyDown={handleKeyDown}
    >
      {cards.map((card, index) => (
        <Card
          key={card.id}
          ref={(el) => el && cardRefs.current.set(index, el)}
          card={card}
          tabIndex={getTabIndex(index)}
          role="gridcell"
          aria-label={card.name}
        />
      ))}
    </div>
  );
}
```

### Focus Indicator Styles

```css
.card:focus {
  outline: none;
}

.card:focus-visible {
  outline: 3px solid var(--focus-colour, #4a90d9);
  outline-offset: 2px;
  box-shadow: 0 0 0 6px rgba(74, 144, 217, 0.3);
}

/* High contrast mode support */
@media (forced-colors: active) {
  .card:focus-visible {
    outline: 3px solid CanvasText;
  }
}
```

## Implementation Tasks

- [x] Create `useGridNavigation` hook in `src/hooks/useGridNavigation.ts`
- [x] Add `role="button"` and `aria-pressed` to Card component
- [x] Implement roving tabindex pattern
- [x] Add keyboard event handlers (arrows, Home, End, Enter, Space)
- [x] Add focus ref management via cardRefs Map
- [x] Style focus-visible indicator in Card.module.css
- [x] Support Home/End keys for first/last navigation
- [x] Add high contrast mode support (@media forced-colors)
- [x] Write unit tests for navigation logic (21 tests)

## Success Criteria

- [x] Tab into grid focuses first card
- [x] Arrow keys navigate between cards
- [x] Enter/Space flips focused card
- [x] Focus indicator is clearly visible
- [x] Only one card in tab order at a time (roving tabindex)
- [x] Home/End jump to first/last card
- [x] Works with screen readers (aria-label, aria-pressed)
- [x] No focus traps
- [x] Tests pass (21/21)

## Dependencies

- **Requires**: F-001 Card Flip Animation (needs flip handler)
- **Blocks**: None

## Complexity

**Medium** - Requires understanding of ARIA patterns and focus management.

---

## Related Documentation

- [Accessibility Research](../../../../research/accessibility.md)
- [ADR-011: Accessibility Standard](../../../decisions/adrs/ADR-011-accessibility-standard.md)
- [v0.1.0 Milestone](../../milestones/v0.1.0.md)
