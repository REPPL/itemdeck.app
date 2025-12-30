# R-018: Error Handling Strategies

## Executive Summary

This research examines error handling patterns for React applications, focusing on strategies for graceful degradation, user-friendly error messaging, and recovery mechanisms. The goal is to establish a consistent error handling architecture for itemdeck's v1.0.0 production release.

## Current State in Itemdeck

### Existing Error Handling

1. **React Error Boundary** (`react-error-boundary` package)
   - Used in `src/App.tsx` for top-level error catching
   - Basic fallback UI with reset capability

2. **TanStack Query Error States**
   - Query-level error handling via `useQuery` error states
   - Retry logic (3 attempts with exponential backoff)
   - `QueryErrorBoundary` for query-specific errors

3. **Zod Validation Errors**
   - Schema validation with `safeParse`
   - `formatValidationError()` for human-readable messages
   - `SchemaNotSupportedError` custom error class

4. **Component-Level Handling**
   - `ImageWithFallback` - graceful image loading failures
   - Network status detection via `useOnlineStatus`

### Gaps Identified

- No centralised error logging
- Inconsistent error message formatting
- No error recovery strategies beyond page reload
- Missing error categorisation (network vs validation vs runtime)
- No user-facing error documentation

## Research Findings

### Error Categories

| Category | Examples | Recovery Strategy |
|----------|----------|-------------------|
| **Network** | API timeout, offline, 404 | Retry with backoff, show cached data |
| **Validation** | Invalid schema, malformed data | Show specific field errors, suggest fixes |
| **Runtime** | Component crash, null reference | Error boundary with reset |
| **User Input** | Invalid URL, unsupported format | Inline validation, clear messaging |
| **Permission** | CORS blocked, auth required | Explain issue, provide alternative |

### React Error Boundary Patterns

#### Pattern 1: Granular Boundaries

```typescript
// Wrap individual features, not entire app
<ErrorBoundary fallback={<CardGridError />}>
  <CardGrid />
</ErrorBoundary>

<ErrorBoundary fallback={<SettingsError />}>
  <SettingsPanel />
</ErrorBoundary>
```

**Pros:** Partial failures don't crash entire app
**Cons:** More boilerplate, need multiple fallback components

#### Pattern 2: Error Boundary with Reset

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onReset={() => {
    // Clear cached state that may have caused the error
    queryClient.clear();
  }}
  resetKeys={[collectionId]}
>
  <App />
</ErrorBoundary>
```

#### Pattern 3: Error Boundary with Logging

```typescript
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onError={(error, info) => {
    // Log to service
    logError({
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      timestamp: new Date().toISOString(),
    });
  }}
>
```

### TanStack Query Error Handling

#### Global Error Handler

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof HTTPError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        toast.error(formatError(error));
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Only show toast for queries that have already been successful
      if (query.state.data !== undefined) {
        toast.error(`Background refresh failed: ${error.message}`);
      }
    },
  }),
});
```

#### Query-Specific Error UI

```typescript
function CollectionView() {
  const { data, error, isError, refetch } = useCollection();

  if (isError) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={refetch}
        suggestions={getErrorSuggestions(error)}
      />
    );
  }

  return <CardGrid cards={data} />;
}
```

### User-Friendly Error Messages

#### Error Message Structure

```typescript
interface UserFriendlyError {
  title: string;           // Brief description
  message: string;         // Detailed explanation
  code?: string;           // Error code for support
  suggestions?: string[];  // What user can try
  recoverable: boolean;    // Can user recover without reload?
  technical?: string;      // Original error for developers
}
```

#### Error Message Mapping

```typescript
const errorMessages: Record<string, UserFriendlyError> = {
  NETWORK_OFFLINE: {
    title: 'You\'re offline',
    message: 'Check your internet connection and try again.',
    suggestions: ['Check WiFi connection', 'Try mobile data'],
    recoverable: true,
  },
  COLLECTION_NOT_FOUND: {
    title: 'Collection not found',
    message: 'The collection URL may be incorrect or the collection may have been removed.',
    suggestions: ['Check the URL is correct', 'Verify the repository is public'],
    recoverable: false,
  },
  SCHEMA_INVALID: {
    title: 'Invalid collection format',
    message: 'The collection data doesn\'t match the expected format.',
    suggestions: ['Contact the collection owner', 'Try a different collection'],
    recoverable: false,
  },
  RATE_LIMITED: {
    title: 'Too many requests',
    message: 'GitHub API rate limit reached. Please wait before trying again.',
    suggestions: ['Wait a few minutes', 'Use cached data if available'],
    recoverable: true,
  },
};
```

### Recovery Strategies

#### Strategy 1: Graceful Degradation

```typescript
// Show cached data when network fails
function useCollectionWithFallback(id: string) {
  const query = useCollection(id);
  const cachedData = useCachedCollection(id);

  if (query.isError && cachedData) {
    return {
      data: cachedData,
      isStale: true,
      error: query.error,
    };
  }

  return query;
}
```

#### Strategy 2: Partial Loading

```typescript
// Load what we can, show errors for failed parts
function CollectionView() {
  const collection = useCollection();
  const images = useImages(collection.data?.cards);

  return (
    <>
      {collection.isSuccess && <CardGrid cards={collection.data.cards} />}
      {images.isError && (
        <Banner type="warning">
          Some images failed to load. <button onClick={images.refetch}>Retry</button>
        </Banner>
      )}
    </>
  );
}
```

#### Strategy 3: Automatic Recovery

```typescript
// Auto-retry when coming back online
function useAutoRecovery() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (isOnline && wasOffline.current) {
      // Refetch failed queries when back online
      queryClient.refetchQueries({ stale: true });
    }
    wasOffline.current = !isOnline;
  }, [isOnline, queryClient]);
}
```

### Error Logging Best Practices

#### What to Log

```typescript
interface ErrorLog {
  // Error details
  message: string;
  stack?: string;
  code?: string;

  // Context
  component?: string;
  action?: string;
  url?: string;

  // User context (anonymous)
  sessionId: string;
  timestamp: string;

  // Environment
  userAgent: string;
  viewport: { width: number; height: number };
  online: boolean;

  // App state (sanitised)
  collectionId?: string;
  viewMode?: string;
  mechanicActive?: string;
}
```

#### What NOT to Log

- Personal information (emails, names)
- Collection content (card data)
- Full URLs with tokens
- Settings that could identify users

### Accessibility Considerations

```typescript
// Error messages must be accessible
function ErrorDisplay({ error }: { error: UserFriendlyError }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <h2>{error.title}</h2>
      <p>{error.message}</p>
      {error.suggestions && (
        <ul aria-label="Suggestions">
          {error.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Recommendations

### 1. Implement Tiered Error Boundaries

```
App
├── ErrorBoundary (catastrophic - full page error)
│   ├── QueryErrorBoundary (data fetching errors)
│   │   ├── CollectionView
│   │   └── SettingsPanel
│   └── MechanicErrorBoundary (game-specific errors)
│       └── ActiveMechanic
```

### 2. Create Error Service

```typescript
// src/services/errorService.ts
export const errorService = {
  // Categorise error
  categorise(error: unknown): ErrorCategory,

  // Format for user
  formatForUser(error: unknown): UserFriendlyError,

  // Log error (with privacy)
  log(error: unknown, context?: ErrorContext): void,

  // Get recovery action
  getRecoveryAction(error: unknown): RecoveryAction | null,
};
```

### 3. Standardise Error Components

Create consistent error UI components:
- `ErrorBanner` - inline warning/error messages
- `ErrorPage` - full-page error states
- `ErrorToast` - transient error notifications
- `ErrorModal` - blocking errors requiring action

### 4. Add Error Codes

Assign unique codes to all known error conditions for support and debugging:
- `E001` - Network timeout
- `E002` - Collection not found
- `E003` - Schema validation failed
- etc.

## Implementation Considerations

### Performance

- Error boundaries add minimal overhead
- Lazy-load error UI components
- Debounce error logging to prevent spam

### Testing

- Test error boundaries with intentional failures
- Mock network errors in E2E tests
- Verify accessible error announcements

### Monitoring

- Track error frequency by category
- Alert on error rate spikes
- Monitor recovery success rates

## References

- [React Error Boundaries Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [react-error-boundary Package](https://github.com/bvaughn/react-error-boundary)
- [TanStack Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/query-functions#handling-errors)
- [WCAG 2.1 Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)

---

## Related Documentation

- [ADR-030: Error Boundary Architecture](../decisions/adrs/ADR-030-error-boundary-architecture.md)
- [R-019: Logging & Observability](./R-019-logging-observability.md)
- [Testing Strategies](./testing-strategies.md)
- [Accessibility Research](./accessibility.md)

---

**Status**: Complete
