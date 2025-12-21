# v0.4.0 Implementation Prompt

Prompt used to autonomously implement the v0.4.0 Performance & Interaction milestone.

---

## Prompt

```
Implement the v0.4.0 Performance & Interaction milestone for itemdeck autonomously.

## Context
- v0.1.0 (Animation Foundation), v0.2.0 (External Data), and v0.3.0 (Customisation) are complete
- We're on branch feature/v0.3.0-customisation at tag v0.3.0
- 211 tests currently passing
- Create new branch: feature/v0.4.0-performance

## Milestone Documentation
Read the milestone document at: docs/development/roadmap/milestones/v0.4.0.md

## Features to Implement (12 features)

### Performance Core (Small-Medium)
- F-025: Bundle Size Monitoring - size-limit config, CI integration
- F-016: Bundle Optimisation - manual chunks, code splitting, terser
- F-015: Image Lazy Loading - Intersection Observer, shimmer placeholders
- F-014: Virtual Scrolling - TanStack Virtual for 100+ cards

### Card Interactions (Small-Medium)
- F-037: Card Sorting - sort by name, year, category with persist
- F-036: Card Filtering - filter by category, text search
- F-035: Card Quick Actions - hover action buttons on cards

### Layout Modes (Medium-Large)
- F-031: Fit to Viewport Mode - scale cards to show all without scrolling
- F-040: Touch Gestures - swipe to flip, long-press for info, pinch zoom

### Advanced Views (Large)
- F-028: Card Drag and Drop - @dnd-kit for reordering
- F-032: Card Stack View - Apple Wallet style stacked cards
- F-038: Card Carousel Mode - horizontal scrolling single-card view

## New Dependencies
{
  "dependencies": {
    "@tanstack/react-virtual": "^3.x",
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x"
  },
  "devDependencies": {
    "size-limit": "^11.x",
    "@size-limit/preset-app": "^11.x",
    "rollup-plugin-visualizer": "^5.x"
  }
}

## Implementation Strategy

1. Create feature branch: feature/v0.4.0-performance
2. Start with bundle monitoring (F-025) to establish baseline
3. Implement bundle optimisation (F-016) for code splitting
4. Add image lazy loading (F-015) for performance
5. Implement virtual scrolling (F-014) for large collections
6. Add filtering and sorting (F-036, F-037) for usability
7. Implement quick actions (F-035) for card interactions
8. Add fit-to-viewport mode (F-031)
9. Implement touch gestures (F-040)
10. Add drag and drop (F-028) for reordering
11. Implement stack view (F-032) and carousel (F-038)
12. Run tests after each feature
13. Create devlog and retrospective BEFORE final commit
14. Ensure all tests pass before completing

## Key Files to Reference
- Feature specs in docs/development/roadmap/features/planned/
- Existing components in src/components/
- Settings store in src/stores/settingsStore.ts
- Theme system in src/styles/theme.css

## Success Criteria
- All 12 features implemented
- All tests passing
- No ESLint/TypeScript errors
- Virtual scrolling smooth at 1000+ cards
- Bundle size < 300KB gzipped
- Touch gestures work on mobile
- Drag and drop reorders cards
- All layout modes functional

## Important Requirements
- Write devlog at docs/development/process/devlogs/v0.4.0/README.md BEFORE final commit
- Write retrospective at docs/development/process/retrospectives/v0.4.0/README.md BEFORE final commit
- Run /sync-docs to verify documentation consistency
- Move completed features from planned/ to completed/
- Update milestone status to Complete

Begin implementation now. Work through features systematically, running tests frequently.
```

---

## Agent Configuration

- **Agent Type**: `implement-autonomously`
- **Model**: Default (Sonnet)
- **Execution Mode**: Background/Autonomous

---

## Features to Implement

| ID | Feature | Complexity | Status |
|----|---------|------------|--------|
| F-025 | Bundle Size Monitoring | Small | Pending |
| F-016 | Bundle Optimisation | Medium | Pending |
| F-015 | Image Lazy Loading | Medium | Pending |
| F-014 | Virtual Scrolling | Large | Pending |
| F-037 | Card Sorting | Small | Pending |
| F-036 | Card Filtering | Medium | Pending |
| F-035 | Card Quick Actions | Medium | Pending |
| F-031 | Fit to Viewport Mode | Medium | Pending |
| F-040 | Touch Gestures | Medium | Pending |
| F-028 | Card Drag and Drop | Large | Pending |
| F-032 | Card Stack View | Large | Pending |
| F-038 | Card Carousel Mode | Large | Pending |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Render 100 cards | < 16ms |
| Scroll performance | 60fps |
| Bundle size (gzipped) | < 300KB |

---

## Related Documentation

- [v0.4.0 Milestone](../../../development/roadmap/milestones/v0.4.0.md)
- [Feature Specifications](../../../development/roadmap/features/)
- [Performance Research](../../../research/performance-virtualisation.md)
