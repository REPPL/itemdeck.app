# ADR-006: Use TanStack Virtual for Large Lists

## Status

Accepted

## Context

Itemdeck may display large card collections (100-1000+ cards). Without virtualisation:
- All cards render in DOM (memory issues)
- Scroll performance degrades
- Initial render time increases

We evaluated several virtualisation libraries:

| Library | Bundle Size | Headless | Grid Support |
|---------|-------------|----------|--------------|
| TanStack Virtual | 10KB | Yes | Yes |
| react-window | 6KB | No | Yes |
| react-virtuoso | 20KB | No | Yes |
| react-virtualized | 35KB | No | Yes |

Key requirements:
1. Grid layout support (not just lists)
2. Headless (custom rendering)
3. Dynamic row heights
4. Smooth scrolling
5. TypeScript support

## Decision

Use **TanStack Virtual** for virtualising large card grids.

## Consequences

### Positive

- **Headless** - Full control over rendering (matches CSS Modules approach)
- **Grid support** - Row virtualisation works with columned layout
- **Dynamic sizing** - Supports variable row heights
- **Overscan** - Configurable buffer for smooth scrolling
- **Small bundle** - 10KB gzipped
- **TypeScript** - Full type definitions

### Negative

- **Manual setup** - Requires calculating rows/columns manually
- **Scroll position** - Need to handle restoration ourselves
- **Complexity** - More code than non-virtualised grid

### Mitigations

- Create wrapper component for common patterns
- Implement scroll position restoration hook
- Only enable virtualisation above threshold (100 cards)

## Virtualisation Threshold

```typescript
const VIRTUALIZATION_THRESHOLD = 100;

function AdaptiveCardGrid({ cards }) {
  if (cards.length > VIRTUALIZATION_THRESHOLD) {
    return <VirtualCardGrid cards={cards} />;
  }
  return <CardGrid cards={cards} />;
}
```

## Alternatives Considered

### react-window
- Smaller bundle
- **Rejected**: Less flexible, not headless

### react-virtuoso
- More features
- **Rejected**: Larger bundle, opinionated styling

### react-virtualized
- Mature, feature-rich
- **Rejected**: Large bundle, older API

### No virtualisation
- Simpler code
- **Rejected**: Performance issues with 100+ cards

---

## Related Documentation

- [Performance & Virtualisation Research](../../../research/performance-virtualisation.md)
- [F-014: Virtual Scrolling](../../roadmap/features/planned/F-014-virtual-scrolling.md)
