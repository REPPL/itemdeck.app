# Track C2: Remote Collection Update Checking

## Features

- F-114: Remote Collection Update Checking

## Implementation Prompt

```
Implement remote collection update checking for itemdeck.

## F-114: Remote Collection Update Checking

### 1. Create update checker service

Create `src/services/updateChecker.ts`:

```typescript
interface UpdateCheckResult {
  hasUpdate: boolean;
  remoteTimestamp?: number;
  localTimestamp?: number;
}

export async function checkForUpdates(source: Source): Promise<UpdateCheckResult> {
  // For GitHub sources:
  // GET https://api.github.com/repos/{owner}/{repo}/commits/main
  // Compare commit date with cached timestamp
}
```

### 2. Create useUpdateChecker hook

Create `src/hooks/useUpdateChecker.ts`:

```typescript
export function useUpdateChecker(sourceId: string) {
  // Background check every 15 minutes
  // Store result in sourceStore
  // Return { hasUpdate, checkNow, lastChecked }
}
```

### 3. Create UpdateBadge component

Create `src/components/UpdateBadge/UpdateBadge.tsx`:
- Small blue dot indicator
- Shows when update is available
- Tooltip: "Update available - click to refresh"

### 4. Update sourceStore

Update `src/stores/sourceStore.ts`:
- Add `lastRemoteCheck`, `remoteLastModified`, `hasUpdate` fields

### 5. Add badge to source list

Update Settings > Sources to show UpdateBadge per source.

## Files to Modify

- src/services/updateChecker.ts (new)
- src/hooks/useUpdateChecker.ts (new)
- src/components/UpdateBadge/UpdateBadge.tsx (new)
- src/components/UpdateBadge/UpdateBadge.module.css (new)
- src/components/UpdateBadge/index.ts (new)
- src/stores/sourceStore.ts
- src/components/SettingsPanel/SourceSettingsTabs.tsx

## Success Criteria

- [ ] GitHub API checks for last commit timestamp
- [ ] Background polling every 15 minutes
- [ ] Subtle blue dot badge when update available
- [ ] Tooltip shows update information
- [ ] User can manually trigger check
- [ ] No auto-update (user initiates refresh)
```

---

## Related Documentation

- [F-114 Feature Spec](../../../development/roadmap/features/planned/F-114-update-checking.md)
