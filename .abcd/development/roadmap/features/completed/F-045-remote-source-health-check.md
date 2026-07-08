# F-045: Remote Source Health Check

## Problem Statement

Currently, itemdeck discovers data source issues only after attempting a full fetch. Users experience:

1. **Delayed error feedback** - Wait for entire fetch to fail before seeing errors
2. **Unclear error messages** - Generic "fetch failed" without actionable guidance
3. **No schema compatibility warning** - Incompatible schema versions cause runtime errors
4. **No stale data detection** - No indication when cached data is outdated

This creates a poor user experience, especially when switching between sources or when network conditions are unreliable.

## Design Approach

Implement a lightweight health check system that validates sources before loading data:

### Health Check Flow

```
User selects source
        ↓
┌─────────────────────────────┐
│ Phase 1: Accessibility      │
│ HEAD request to CDN URL     │
│ → Check response status     │
│ → Measure latency           │
└─────────────────────────────┘
        ↓ Pass
┌─────────────────────────────┐
│ Phase 2: Schema Discovery   │
│ Fetch collection.json       │
│ → Extract schemaVersion     │
│ → Check compatibility       │
└─────────────────────────────┘
        ↓ Compatible
┌─────────────────────────────┐
│ Phase 3: Status Report      │
│ Return health result        │
│ → status: healthy/degraded  │
│ → issues: warnings/errors   │
└─────────────────────────────┘
```

### Health Status Model

```typescript
interface SourceHealthResult {
  status: 'healthy' | 'degraded' | 'unavailable';
  schemaVersion?: string;
  schemaCompatible: boolean;
  latency: number;
  lastChecked: Date;
  issues: HealthIssue[];
}

interface HealthIssue {
  severity: 'warning' | 'error';
  code: HealthIssueCode;
  message: string;
}

type HealthIssueCode =
  | 'SOURCE_UNAVAILABLE'
  | 'SCHEMA_INCOMPATIBLE'
  | 'SCHEMA_OUTDATED'
  | 'HIGH_LATENCY'
  | 'MISSING_MANIFEST';
```

### Hook API

```typescript
function useSourceHealth(
  source: GitHubRawConfig,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
): UseQueryResult<SourceHealthResult>;
```

## Implementation Tasks

### Phase 1: Core Infrastructure

- [x] Create `src/services/sourceHealthCheck.ts` with health check logic
- [x] Implement `checkAccessibility()` using HEAD requests
- [x] Implement `discoverSchema()` to parse collection.json
- [x] Create `HealthCheckResult` interface with status types

### Phase 2: TanStack Query Integration

- [x] Create `src/hooks/useSourceHealth.ts` hook
- [x] Add query key factory for health checks
- [x] Configure caching (5-minute stale time)
- [x] Add retry logic with backoff

### Phase 3: CDN Integration

- [x] URL building with CDN support
- [x] Add latency measurement to health checks
- [x] Set high latency threshold for degraded status

### Phase 4: UI Components

- [x] Create health status indicator in SourceSettingsTabs
- [x] Add status icons (healthy=green, degraded=yellow, unavailable=red)
- [x] Show latency display
- [x] Add refresh capability

### Phase 5: Integration

- [x] Show health status in settings panel
- [x] Display status per source in source list
- [x] Health check runs on source addition

## Success Criteria

- [x] Health check completes in <500ms for accessible sources
- [x] Users see status indicator before data loads
- [x] Incompatible schema versions show clear warning
- [x] High latency (>2s) triggers degraded status
- [x] Unavailable sources prevent load attempt with clear error
- [x] Health results cached for 5 minutes

## Dependencies

- **v0.7.0**: Schema v2 with schemaVersion field
- **Existing**: TanStack Query, Zod validation
- **New**: jsDelivr CDN integration

## Complexity

**Medium** - New hook and component, builds on existing infrastructure.

## Testing Strategy

- Unit tests for health check logic
- Mock network responses for various scenarios
- Integration test for full health check flow
- E2E test for UI indicator updates

---

## Related Documentation

- [State of the Art: Remote Data Assessment](../../research/state-of-the-art-remote-data-assessment.md)
- [External Data Sources](../../research/external-data-sources.md)
- [F-046: Collection Discovery UI](./F-046-collection-discovery-ui.md)
- [v0.9.0 Milestone](../../milestones/v0.9.0.md)

---

**Status**: Complete
