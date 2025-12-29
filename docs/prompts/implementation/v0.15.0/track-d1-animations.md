# Track D1: Card Animations & Statistics Dashboard

## Features

- F-041: Card Animation Polish
- F-067: Statistics Dashboard

## Implementation Prompt

```
Implement card animation polish and statistics dashboard.

## F-041: Card Animation Polish

### 1. Add spring physics

Update card components to use Framer Motion spring animations:
- Card flip: spring with stiffness: 300, damping: 30
- Grid entrance: staggered with 50ms delay per card

### 2. Files to update

- `src/components/Card/Card.tsx` - Add spring flip animation
- `src/components/CardGrid/CardGrid.tsx` - Add staggered entrance
- `src/components/DraggableCardGrid/DraggableCardGrid.tsx` - Same

### 3. Respect reduced motion

Wrap animations in `useReducedMotion()` check.

## F-067: Statistics Dashboard

### 1. Expand existing statistics

Update `src/components/Statistics/Statistics.tsx`:
- Add expandable dashboard view
- Use existing BarChart component
- Add platform/year distribution charts

### 2. Add toggle button

Add "Expand" button to StatisticsBar to show full dashboard.

## Files to Modify

- src/components/Card/Card.tsx
- src/components/CardGrid/CardGrid.tsx
- src/components/DraggableCardGrid/DraggableCardGrid.tsx
- src/components/Statistics/Statistics.tsx
- src/components/Statistics/StatisticsBar.tsx

## Success Criteria

- [ ] Card flip uses spring physics
- [ ] Grid entrance is staggered
- [ ] Reduced motion preference respected
- [ ] Statistics dashboard expandable
- [ ] Platform/year distribution charts visible
```

---

## Related Documentation

- [F-041 Feature Spec](../../../development/roadmap/features/planned/F-041-card-animation-polish.md)
- [F-067 Feature Spec](../../../development/roadmap/features/planned/F-067-statistics-dashboard.md)
