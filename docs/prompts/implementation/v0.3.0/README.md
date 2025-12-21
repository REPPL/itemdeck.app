# v0.3.0 Implementation Prompt

Prompt used to autonomously implement the v0.3.0 Customisation milestone.

---

## Prompt

```
Implement the v0.3.0 Customisation milestone for itemdeck autonomously.

## Context
- v0.1.0 (Animation Foundation) and v0.2.0 (External Data) are complete
- We're on main branch at tag v0.2.0
- 211 tests currently passing

## Milestone Documentation
Read the milestone document at: docs/development/roadmap/milestones/v0.3.0.md

## Features to Implement (14 features)

### Technical Debt (Small)
- F-021: ESLint/TypeScript Fixes - fix deprecated Zod syntax, type safety issues
- F-022: Test Coverage Reporting - add @vitest/coverage-v8, configure thresholds

### Accessibility (Small)
- F-023: Manual Refresh Button - button to trigger data refresh
- F-024: ARIA Live Regions - screen reader announcements

### Card Design Enhancements (Small-Medium)
- F-027: Shuffle by Default - Fisher-Yates shuffle, toggle option
- F-029: Card Info Button - info icon opens detail modal
- F-030: Enhanced Card Front Design - glassmorphism overlay
- F-033: Card Elevation System - dynamic shadows based on state
- F-034: Card Badges - status/category indicators
- F-039: Responsive Typography - fluid font scaling

### Core Features (Medium)
- F-010: Theme System - light/dark/auto modes with CSS custom properties
- F-011: Layout Presets - grid, list, carousel options
- F-012: State Persistence - save preferences to localStorage/IndexedDB
- F-013: Settings Panel - UI for user preferences

## New Dependencies
{
  "dependencies": {
    "zustand": "^5.x"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^4.x"
  }
}

## Implementation Strategy

1. Create feature branch: feature/v0.3.0-customisation
2. Start with technical debt (F-021, F-022) to establish clean baseline
3. Implement card design enhancements (visual improvements)
4. Add accessibility features (F-023, F-024)
5. Build core features (theme, layout, persistence, settings)
6. Run tests after each feature
7. Create devlog and retrospective
8. Commit and prepare for merge

## Key Files to Reference
- Feature specs in docs/development/roadmap/features/planned/
- Existing components in src/components/
- Config schema in src/schemas/config.schema.ts
- Research in docs/research/card-ui-design-patterns.md

## Success Criteria
- All 14 features implemented
- All tests passing
- No ESLint/TypeScript errors
- Theme switching works (light/dark/auto)
- Settings panel functional
- State persists across sessions
- Card design visually improved

Begin implementation now. Work through features systematically, running tests frequently.
```

---

## Agent Configuration

- **Agent Type**: `implement-autonomously`
- **Model**: Default (Sonnet)
- **Execution Mode**: Background/Autonomous

---

## Features Implemented

| ID | Feature | Status |
|----|---------|--------|
| F-021 | ESLint/TypeScript Fixes | Completed |
| F-022 | Test Coverage Reporting | Completed |
| F-023 | Manual Refresh Button | Completed |
| F-024 | ARIA Live Regions | Completed |
| F-027 | Shuffle by Default | Completed |
| F-029 | Card Info Button | Completed |
| F-030 | Enhanced Card Front Design | Completed |
| F-033 | Card Elevation System | Completed |
| F-034 | Card Badges | Completed |
| F-039 | Responsive Typography | Completed |
| F-010 | Theme System | Completed |
| F-011 | Layout Presets | Completed |
| F-012 | State Persistence | Completed |
| F-013 | Settings Panel | Completed |

---

## New Components Created

- `src/components/RefreshButton/` - Manual data refresh button
- `src/components/StatusAnnouncer/` - ARIA live region announcements
- `src/components/SettingsPanel/` - User preferences UI
- `src/components/SettingsButton/` - Settings panel trigger
- `src/components/Badge/` - Status/category badge component
- `src/components/ThemeToggle/` - Theme mode switcher

---

## New Stores Created

- `src/stores/themeStore.ts` - Theme state with persistence
- `src/stores/settingsStore.ts` - User preferences with persistence

---

## Related Documentation

- [v0.3.0 Milestone](../../../development/roadmap/milestones/v0.3.0.md)
- [Feature Specifications](../../../development/roadmap/features/)
- [Card UI Design Patterns Research](../../../research/card-ui-design-patterns.md)
