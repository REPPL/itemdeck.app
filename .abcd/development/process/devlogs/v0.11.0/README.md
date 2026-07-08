# v0.11.0 Development Log

## Overview

**Version**: v0.11.0 - Mechanics Foundation & Discovery
**Date**: 27 December 2025
**Theme**: Gaming mechanics plugin architecture and card discovery features

## Summary

v0.11.0 is the largest feature release since v0.1.0, implementing a complete plugin architecture for gaming mechanics along with comprehensive card discovery and organisation features.

### Features Implemented

**Mechanics Foundation (4 features)**
- F-053: Mechanic Plugin Registry
- F-054: Mechanic Context Provider
- F-055: Mechanic Overlay System
- F-056: Settings Mechanic Selector

**Discovery & Organisation (3 features)**
- F-036: Card Filtering with Search
- F-065: Card Grouping
- F-066: View Mode Toggle

**Proof of Concept**
- Memory Game mechanic with full gameplay

### Features Deferred

- F-037: Card Sorting (Expanded) → v0.12.0
- F-067: Statistics Dashboard → v0.12.0

---

## Implementation Narrative

### Phase 1: Plugin Architecture

The mechanics system was designed with extensibility in mind. The central `MechanicRegistry` manages mechanic factories using lazy loading via dynamic imports, ensuring mechanics only load when activated.

Key design decisions:
- **Mutual exclusivity** - Only one mechanic active at a time
- **Isolated stores** - Each mechanic has its own Zustand store
- **Overlay system** - Mechanics can inject UI onto cards and grid

The `MechanicProvider` context integrates with the settings store to persist the active mechanic across sessions.

### Phase 2: Memory Game Implementation

The Memory Game was implemented as proof-of-concept for the plugin architecture. It demonstrates:

1. **Game state management** - Flipped cards, matched pairs, score, attempts
2. **Card overlays** - Visual feedback for flip/match states
3. **Grid overlays** - Score display, timer, completion modal
4. **Settings integration** - Difficulty and pair count configuration

**Critical Bug Discovered and Fixed**: Zustand selector pattern

The initial implementation used selectors like `(s) => s.isCardFlipped(cardId)`, calling helper methods. This pattern doesn't trigger re-renders when state changes - Zustand only tracks accessed state properties.

The fix: Subscribe to actual state arrays (`flippedCards`, `matchedPairs`) and derive booleans locally.

```typescript
// Before (broken)
const isFlipped = useMemoryStore((s) => s.isCardFlipped(cardId));

// After (working)
const flippedCards = useMemoryStore((s) => s.flippedCards);
const isFlipped = flippedCards.includes(cardId);
```

### Phase 3: Discovery Features

**SearchBar** - A floating search input with:
- Debounced input (300ms)
- Keyboard shortcut (`/` to focus)
- Animated expand/collapse
- Result count display

**iPad Safari Fix**: The initial implementation wrapped the collapsed search in a `<button>` for click-to-expand. On iPad Safari, this captured clicks from the nested input, causing unwanted collapse. Fixed by removing the button wrapper and handling clicks on specific elements.

**Card Grouping** - Collapsible sections with:
- Group headers with card counts
- Smooth expand/collapse animation
- Multiple grouping options (platform, year, decade)

**View Modes** - Three display options:
- Grid (default) - Card thumbnails
- List - Horizontal rows with details
- Compact - Dense thumbnail grid

### Phase 4: Theme System Integration

**Theme Browser** - Gallery for external themes:
- Fetches from `public/themes/` or remote URLs
- Preview cards showing theme colours
- Apply with single click

**Overlay Transparency Fix**: Users reported the transparency setting had no effect. Investigation revealed CSS files used hardcoded `rgba()` values instead of the CSS variable.

Debug approach:
```javascript
// Browser console to find backdrop elements
document.querySelectorAll('[class*="backdrop"]').forEach(el => {
  console.log(el.className, getComputedStyle(el).background);
});
```

This revealed the correct element was receiving the variable, but at 25% opacity the effect was subtle. Updated multiple CSS files to use `var(--overlay-transparency-background)` with fallbacks.

### Phase 5: Settings Integration

**MechanicPanel** - A dedicated overlay (separate from Settings) for:
- Mechanic selection
- Active mechanic display with stop button
- Memory game settings (difficulty, pair count)

The separation emphasises that mechanics change app behaviour, distinct from visual/config settings.

---

## Challenges Encountered

### 1. Zustand Re-render Patterns

**Problem**: Calling methods in Zustand selectors doesn't trigger re-renders.

**Solution**: Always select raw state, derive values in component.

### 2. iPad Safari Touch Events

**Problem**: Button elements capture touches from nested interactive elements.

**Solution**: Use divs with click handlers instead of semantic buttons where nesting is required.

### 3. CSS Variable Cascading

**Problem**: Overlay transparency not applying across components.

**Solution**: Ensure all overlay CSS uses the same variable with consistent fallbacks.

### 4. Memory Game Pair Generation

**Problem**: Ensuring cards are properly paired and shuffled.

**Solution**: Create pairs array, flatten, shuffle with Fisher-Yates, assign to cards.

---

## Code Highlights

### Plugin Factory Pattern

```typescript
mechanicRegistry.register('memory', async () => {
  const { memoryMechanic } = await import('./memory');
  return memoryMechanic;
});
```

### Difficulty-Based Flip Delay

```typescript
const DIFFICULTY_SETTINGS: Record<MemoryDifficulty, DifficultyConfig> = {
  easy: { label: 'Easy', flipDelay: 1500 },
  medium: { label: 'Medium', flipDelay: 1000 },
  hard: { label: 'Hard', flipDelay: 500 },
};

// In flipCard action:
const flipDelay = DIFFICULTY_SETTINGS[state.difficulty].flipDelay;
setTimeout(() => get().checkMatch(), flipDelay);
```

### Search Debounce Hook

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setSearchQuery(inputValue);
  }, 300);
  return () => clearTimeout(timeoutId);
}, [inputValue]);
```

---

## Files Summary

### Created (30+ files)

**Mechanics Infrastructure**
- `src/mechanics/types.ts`
- `src/mechanics/registry.ts`
- `src/mechanics/context.tsx`
- `src/mechanics/index.ts`

**Memory Game**
- `src/mechanics/memory/types.ts`
- `src/mechanics/memory/store.ts`
- `src/mechanics/memory/components.tsx`
- `src/mechanics/memory/index.ts`
- `src/mechanics/memory/memory.module.css`

**Discovery Components**
- `src/components/SearchBar/`
- `src/components/CardGroup/`
- `src/components/CardListItem/`
- `src/components/CardCompactItem/`

**Theme Browser**
- `src/services/themeLoader.ts`
- `src/components/ThemeBrowser/`

**Settings**
- `src/components/SettingsPanel/MechanicsTab.tsx`
- `src/components/MechanicPanel/`

### Modified (15+ files)

- `src/App.tsx` - MechanicProvider, SearchBar
- `src/stores/settingsStore.ts` - Search, filter, mechanic state
- `src/components/CardGrid/` - Filtering, grouping, view modes
- `src/hooks/useVisualTheme.ts` - Transparency handling
- `src/styles/theme.css` - Overlay variables
- Various CSS modules for transparency fix

---

## Lessons Learned

1. **Zustand patterns matter** - Selectors must access state properties, not call methods
2. **Mobile testing essential** - iPad Safari revealed touch event issues
3. **CSS variables need defaults** - Always provide fallback values
4. **Plugin architecture pays off** - Adding new mechanics is now straightforward

---

## Related Documentation

- [v0.11.0 Milestone](../../roadmap/milestones/v0.11.0.md)
- [v0.11.0 Retrospective](../retrospectives/v0.11.0/README.md)
- [v0.11.0 Implementation Prompt](../../../prompts/implementation/v0.11.0-full/README.md)
- [ADR-016: Gaming Mechanics Plugin Architecture](../../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md)
