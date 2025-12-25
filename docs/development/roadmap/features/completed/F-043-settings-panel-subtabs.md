# F-043: Settings Panel Sub-tabs

## Problem Statement

The "Cards" settings tab has accumulated too many settings, making it difficult to find specific options. Users must scroll through a long list to find what they're looking for.

Current settings in "Cards" tab:
- Card size (slider)
- Gap between cards (slider)
- Border radius (slider)
- Shuffle on load
- Flip animation duration
- Badge visibility
- Back logo visibility
- Show title on front
- Show metadata
- ... and more

## Design Approach

Split the "Cards" tab into three logical sub-tabs:

### General Sub-tab
- Card size (slider)
- Gap between cards (slider)
- Border radius (slider)
- Shuffle on load (toggle)
- Max visible cards (NEW - see F-044)

### Front Sub-tab
- Show title (toggle)
- Show subtitle (toggle)
- Show badge (toggle)
- Show secondary badge (toggle)
- Show footer metadata (toggle)
- Flip animation duration (slider)

### Back Sub-tab
- Show logo (toggle)
- Show verdict/title (toggle)
- Show text (toggle)
- Card back colour (picker or theme-aware)

### UI Pattern

Use a horizontal pill/tab bar within the Cards section:

```
┌─────────────────────────────────────┐
│ Cards                               │
├─────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┐  │
│ │ General  │  Front   │  Back    │  │
│ └──────────┴──────────┴──────────┘  │
│                                     │
│ [Content for selected sub-tab]      │
│                                     │
└─────────────────────────────────────┘
```

## Implementation Tasks

- [x] Create `CardSettingsSubtabs` component
- [x] Create sub-tab navigation UI (pills or tabs)
- [x] Move existing settings into appropriate sub-tabs
- [x] Add sub-tab state (which tab is active)
- [x] Ensure keyboard navigation works within sub-tabs
- [x] Add transitions between sub-tabs
- [x] Test accessibility (ARIA roles, focus management)

## Success Criteria

- [x] "Cards" tab shows three sub-tabs: Layout, Front, Back
- [x] All existing settings function correctly after move
- [x] Sub-tab selection is keyboard accessible
- [x] Visual indicator shows active sub-tab
- [x] Sub-tab state persists during settings panel session
- [x] Mobile-friendly layout

## Dependencies

- **Requires**: Existing settings panel (F-013)
- **Blocks**: None

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing settings functionality | Low | High | Comprehensive testing |
| Poor mobile UX with nested tabs | Medium | Medium | Responsive design, test on small screens |

---

## Related Documentation

- [v0.6.1 Milestone](../../milestones/v0.6.1.md)
- [F-042 Collection Display Driver](./F-042-collection-display-driver.md)
- [F-044 Random Card Sampling](./F-044-random-card-sampling.md)
- [F-013 Settings Panel](../completed/F-013-settings-panel.md)

---

**Status**: Complete
