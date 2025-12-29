# F-067: Statistics Dashboard

## Problem Statement

Users want to understand the composition of their collection at a glance. While F-062 (Collection Statistics) provides basic counts, a visual dashboard with charts and distributions would offer deeper insights.

## Current State

**F-062 (Collection Statistics)** is already complete (v0.9.0):
- `StatisticsBar` component shows basic stats
- Total cards, categories, average metrics
- Dismissible bar above the grid

This feature **enhances** F-062 with visual charts and detailed breakdowns.

## Design Approach

Create an expandable statistics dashboard that can toggle between:
1. **Minimal mode** (current StatisticsBar)
2. **Expanded dashboard** with charts and distributions

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│ Collection Statistics                           [▼ Expand] │
├────────────────────────────────────────────────────────────┤
│ Total: 120 cards  │  12 platforms  │  Avg year: 1994      │
└────────────────────────────────────────────────────────────┘

[Expanded View]
┌────────────────────────────────────────────────────────────┐
│ Platform Distribution                                      │
├────────────────────────────────────────────────────────────┤
│ Game Boy     ████████████████████ 35                       │
│ NES          ████████████ 20                               │
│ SNES         ███████████████ 25                            │
│ Mega Drive   ████████ 15                                   │
│ Other        █████████████ 25                              │
├────────────────────────────────────────────────────────────┤
│ Year Distribution                                          │
├────────────────────────────────────────────────────────────┤
│ 1985-1989    ███████ 12                                    │
│ 1990-1994    ████████████████████████████ 48               │
│ 1995-1999    ████████████████████ 35                       │
│ 2000+        █████████████ 25                              │
└────────────────────────────────────────────────────────────┘
```

### Metrics to Display

| Metric | Description |
|--------|-------------|
| Total Cards | Count of all cards |
| Categories/Platforms | Number of unique platforms |
| Year Range | Earliest to latest year |
| Average Year | Mean release year |
| Rating Distribution | Breakdown by rating (if available) |
| Platform Distribution | Count per platform (bar chart) |
| Year Distribution | Count per decade (bar chart) |
| Genre Distribution | Count per genre (if available) |

### Key Design Decisions

1. **CSS-Only Charts**: No charting library; pure CSS for bars
2. **Expandable**: Toggle between minimal and full dashboard
3. **Responsive**: Adapts to screen width
4. **Theme-Aware**: Uses existing theme colours

### Technical Implementation

**No new state required** - dashboard computed from cards data.

**StatisticsDashboard component:**
```typescript
function StatisticsDashboard({ cards, expanded, onToggle }) {
  const stats = useMemo(() => {
    const platforms = groupBy(cards, c => c.categoryTitle);
    const years = groupBy(cards, c => Math.floor(c.year / 10) * 10);

    return {
      total: cards.length,
      platformCount: Object.keys(platforms).length,
      yearRange: [min(years), max(years)],
      avgYear: mean(cards.map(c => c.year)),
      platformDist: platforms,
      yearDist: years,
    };
  }, [cards]);

  return expanded ? <ExpandedDashboard {...stats} /> : <MinimalBar {...stats} />;
}
```

**CSS Bar Chart:**
```css
.bar {
  height: 1rem;
  background: var(--colour-accent);
  width: calc(var(--percentage) * 1%);
  transition: width 0.3s ease;
}
```

## Implementation Tasks

- [ ] Create `StatisticsDashboard` component
- [ ] Implement expandable/collapsible toggle
- [ ] Create CSS-only bar chart component
- [ ] Calculate platform distribution
- [ ] Calculate year distribution (by decade)
- [ ] Calculate rating distribution (if data available)
- [ ] Add genre distribution (if data available)
- [ ] Ensure responsive layout
- [ ] Theme-aware styling
- [ ] Add accessibility labels to charts
- [ ] Write tests for statistics calculations

## Success Criteria

- [ ] Dashboard shows total, platform count, year range
- [ ] Expand/collapse toggle works
- [ ] Bar charts display distribution visually
- [ ] Charts are responsive
- [ ] Charts use theme colours
- [ ] Charts have accessible labels
- [ ] Statistics update when cards are filtered
- [ ] Performance acceptable for 1000+ cards

## Components

### New Components

**StatisticsDashboard:**
- Wraps existing StatisticsBar
- Adds expandable panel
- Computes additional metrics

**BarChart:**
- Reusable CSS-only bar chart
- Props: data, maxValue, label format

### Modified Components

**StatisticsBar:**
- Add expand/collapse toggle
- Pass expanded state to dashboard

## Dependencies

- **Enhances**: F-062 Collection Statistics (complete)
- **Uses**: Card data from CollectionDataContext
- **Related**: F-036 Card Filtering (filtered stats)

## Complexity

Small

## Milestone

v0.15.0

---

## Related Documentation

- [Collection Statistics (F-062)](../completed/F-062-collection-statistics.md)
- [Card Filtering](../completed/F-036-card-filtering.md)
- [v0.15.0 Milestone](../../milestones/v0.15.0.md)

---

**Status**: Planned
