# F-114: Remote Collection Update Checking

## Problem Statement

Users don't know when their cached collection data is stale. Remote sources (GitHub) may have been updated, but users have no way to know without manually refreshing.

## Design Approach

Add subtle update detection and indication:
1. Check GitHub API for last commit timestamp
2. Compare with local cache timestamp
3. Show subtle badge when update available
4. User initiates refresh (no auto-update)

**User preference:** Subtle indicator (badge/icon), not intrusive.

## Implementation Tasks

- [ ] Create `src/services/updateChecker.ts`
- [ ] Implement GitHub API call for commit timestamps
- [ ] Create `src/hooks/useUpdateChecker.ts` with background polling
- [ ] Create UpdateBadge component
- [ ] Update sourceStore with update tracking fields
- [ ] Add badge to source list in Settings
- [ ] Add manual "Check for updates" button
- [ ] Handle rate limiting gracefully

## GitHub API Approach

```typescript
// Check latest commit on main branch
GET https://api.github.com/repos/{owner}/{repo}/commits/main

// Extract commit date
const remoteTimestamp = new Date(commit.committer.date).getTime();
```

## Update Badge Design

- Small blue dot indicator
- Tooltip: "Update available - click to refresh"
- Non-intrusive placement (near source name)
- Background polling every 15 minutes

## Success Criteria

- [ ] GitHub API checks work correctly
- [ ] Background polling every 15 minutes
- [ ] Badge shows when update available
- [ ] Tooltip provides clear information
- [ ] User can manually trigger check
- [ ] Rate limiting handled gracefully
- [ ] No auto-update (user initiates)

## Dependencies

- **Requires**: GitHub API access
- **Blocks**: None

## Complexity

**Medium** - API integration and state management.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-c2-updates.md)
