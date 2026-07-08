# F-023: Manual Refresh Button

## Problem Statement

Users cannot manually check for data updates. The current implementation only refreshes automatically when:

1. Data becomes stale (5 minute staleTime)
2. Window regains focus (refetchOnWindowFocus)
3. Network reconnects (refetchOnReconnect)

This was identified as a deferred item from F-009 (Offline Caching). Users need a way to manually trigger a refresh when they know data has changed or want to ensure they have the latest version.

## Design Approach

### 1. Refresh Button Component

```tsx
// src/components/RefreshButton/RefreshButton.tsx
import { useQueryClient } from "@tanstack/react-query";
import { collectionKeys } from "@/hooks/queryKeys";
import styles from "./RefreshButton.module.css";

interface RefreshButtonProps {
  collectionPath: string;
}

export function RefreshButton({ collectionPath }: RefreshButtonProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: collectionKeys.collection(collectionPath),
    });
    setIsRefreshing(false);
  };

  return (
    <button
      className={styles.refreshButton}
      onClick={handleRefresh}
      disabled={isRefreshing}
      aria-label={isRefreshing ? "Refreshing data" : "Refresh data"}
    >
      <RefreshIcon className={isRefreshing ? styles.spinning : ""} />
      {isRefreshing ? "Refreshing..." : "Refresh"}
    </button>
  );
}
```

### 2. Visual Design

- Position: Header area or floating action button
- Icon: Rotating arrow (spinning during refresh)
- States: Default, hover, active, disabled (during refresh)
- Feedback: Visual spinner + "Refreshing..." text

### 3. Keyboard Support

- Focusable with Tab
- Activatable with Enter/Space
- Disabled state announced to screen readers

### 4. Integration Points

**Option A: Header integration**
```tsx
<header className={styles.header}>
  <h1>Collection Name</h1>
  <RefreshButton collectionPath={path} />
</header>
```

**Option B: Floating action button**
```tsx
<RefreshButton
  collectionPath={path}
  variant="floating"
  position="bottom-right"
/>
```

## Implementation Tasks

- [ ] Create `RefreshButton` component
- [ ] Create `RefreshButton.module.css` with animations
- [ ] Create refresh icon (SVG or use existing icon library)
- [ ] Integrate with TanStack Query invalidation
- [ ] Add loading/spinning state
- [ ] Add to header or as floating button
- [ ] Write unit tests for refresh behaviour
- [ ] Test with screen readers

## Success Criteria

- [ ] Button visible in UI
- [ ] Click triggers data refetch
- [ ] Visual feedback during refresh (spinner)
- [ ] Button disabled while refreshing
- [ ] Keyboard accessible (Tab, Enter/Space)
- [ ] Screen reader announces state changes
- [ ] Works offline (shows appropriate message)

## Dependencies

- **Requires**: F-006 TanStack Query Setup (complete)
- **Blocks**: None

## Complexity

**Small** - Single component with TanStack Query integration.

---

## Related Documentation

- [v0.3.0 Milestone](../../milestones/v0.3.0.md)
- [F-009: Offline Caching](../completed/F-009-offline-caching.md)
- [F-006: TanStack Query Setup](../completed/F-006-tanstack-query-setup.md)
