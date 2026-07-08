# F-024: ARIA Live Regions

## Problem Statement

Screen reader users are not notified when:

1. Data is loading
2. Data has finished loading
3. Errors occur during data fetching
4. Cards are flipped
5. Offline/online status changes

Currently, async state changes happen silently, leaving screen reader users unaware of important UI updates.

## Design Approach

### 1. Loading State Announcements

```tsx
// Add aria-busy to CardGrid during loading
<section
  role="grid"
  aria-label="Card collection"
  aria-busy={isLoading}
>
  {/* cards */}
</section>
```

### 2. Status Announcements Component

```tsx
// src/components/StatusAnnouncer/StatusAnnouncer.tsx
interface StatusAnnouncerProps {
  message: string;
  politeness?: "polite" | "assertive";
}

export function StatusAnnouncer({
  message,
  politeness = "polite",
}: StatusAnnouncerProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
```

### 3. Error Announcements

```tsx
// In QueryErrorBoundary or error handling
<div role="alert" aria-live="assertive">
  Failed to load collection. Please try again.
</div>
```

### 4. Integration Points

| Event | Announcement | Politeness |
|-------|--------------|------------|
| Loading starts | "Loading collection..." | polite |
| Loading complete | "Loaded {n} cards" | polite |
| Error occurs | "Error: {message}" | assertive |
| Card flipped | "{title} card flipped" | polite |
| Offline detected | "You are offline" | assertive |
| Back online | "Connection restored" | polite |

### 5. Screen Reader Only Styles

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Implementation Tasks

- [ ] Create `StatusAnnouncer` component
- [ ] Add `.sr-only` utility class to global styles
- [ ] Add `aria-busy` to CardGrid during loading
- [ ] Announce loading completion with card count
- [ ] Add `role="alert"` to error messages
- [ ] Announce card flip actions
- [ ] Announce offline/online status changes
- [ ] Test with NVDA and VoiceOver
- [ ] Write unit tests for announcements

## Success Criteria

- [ ] Screen reader announces "Loading..." when data fetching
- [ ] Screen reader announces "Loaded X cards" on completion
- [ ] Screen reader announces errors immediately (assertive)
- [ ] Screen reader announces offline/online changes
- [ ] Announcements don't interrupt ongoing speech unnecessarily
- [ ] Works with NVDA (Windows) and VoiceOver (macOS/iOS)

## Dependencies

- **Requires**: None
- **Blocks**: F-019 Accessibility Audit (provides foundation)

## Complexity

**Small** - Focused accessibility enhancement with clear patterns.

---

## Related Documentation

- [v0.3.0 Milestone](../../milestones/v0.3.0.md)
- [F-019: Accessibility Audit](./F-019-accessibility-audit.md)
- [ADR-011: Accessibility Standard](../../../decisions/adrs/ADR-011-accessibility-standard.md)
- [Accessibility Research](../../../../research/accessibility.md)
