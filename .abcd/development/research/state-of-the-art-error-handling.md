# State of the Art: Error Handling in React Applications

## Executive Summary

Modern React applications require layered error handling strategies that combine React's built-in Error Boundaries with data fetching library patterns (TanStack Query, SWR), user-friendly error messages, and recovery mechanisms. This research surveys current best practices (2024-2025) for browser-based React applications.

## Landscape Overview

### Evolution of Error Handling

| Era | Approach | Limitations |
|-----|----------|-------------|
| Pre-React 16 | Try-catch in lifecycle | Couldn't catch render errors |
| React 16+ | Error Boundaries | Class components only, no async |
| Modern | Layered + Suspense | Comprehensive, but complex |

### Current Best Practices

1. **Layered Error Boundaries** - Multiple boundaries at different levels
2. **Data Fetching Integration** - TanStack Query/SWR error handling
3. **Graceful Degradation** - Fallback UIs, not blank pages
4. **Recovery Mechanisms** - Retry, reset, navigate away
5. **User-Friendly Messages** - Technical errors translated for users
6. **Accessibility** - Errors announced to screen readers

## Options Evaluated

| Approach | Scope | Recovery | Complexity | Verdict |
|----------|-------|----------|------------|---------|
| Global Error Boundary | All React errors | App reload | Low | Baseline |
| Layered Boundaries | Isolated failures | Component reset | Medium | **Recommended** |
| react-error-boundary | Enhanced boundaries | Built-in reset | Low | **Recommended** |
| Suspense + Error Boundary | Data loading | Suspense fallback | Medium | **Recommended** |
| try-catch everywhere | Manual handling | Custom | High | Not recommended |

## Detailed Analysis

### React Error Boundaries

React's built-in mechanism for catching JavaScript errors in component trees.

```typescript
class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to reporting service
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

**Limitations:**
- Only catches errors during rendering
- Does not catch event handler errors
- Does not catch async errors (promises, timers)
- Class component syntax required

### react-error-boundary Library

Community-standard library providing enhanced error boundary functionality.

```typescript
import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset app state when retry is clicked
      }}
      resetKeys={[userId]}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

**Features:**
- Functional component fallbacks
- Built-in reset mechanism
- Reset keys for automatic recovery
- `useErrorBoundary` hook for programmatic error throwing

### TanStack Query Error Handling

Modern data fetching with built-in error states.

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      useErrorBoundary: (error) => error.response?.status >= 500,
    },
  },
});

function Component() {
  const { data, error, isError, refetch } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
  });

  if (isError) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  return <DataDisplay data={data} />;
}
```

**Patterns:**
- Automatic retries with exponential backoff
- Conditional error boundary propagation
- Local error handling vs boundary propagation
- Optimistic updates with rollback

### Suspense Integration

Combining Suspense with Error Boundaries for loading and error states.

```typescript
function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <Suspense fallback={<Loading />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

**Benefits:**
- Declarative loading states
- Automatic error propagation from suspended resources
- Cleaner component code

### Layered Architecture Pattern

Multiple boundaries at different application levels.

```
Application Level
├── Global Error Boundary (crash recovery)
│   ├── Route Error Boundary (view isolation)
│   │   ├── Feature Boundary (feature isolation)
│   │   │   └── Component Boundary (graceful degradation)
```

| Layer | Catches | Recovery Action | UX |
|-------|---------|-----------------|-----|
| Global | Unhandled errors | Reload app | Full-page error |
| Route | View errors | Navigate away | View-level error |
| Feature | Feature failures | Disable feature | Feature unavailable |
| Component | Render errors | Fallback UI | Skeleton/placeholder |

### User-Friendly Error Messages

Translating technical errors for end users.

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  TIMEOUT: 'The request took too long. Please try again.',
  NOT_FOUND: 'The requested item could not be found.',
  UNAUTHORIZED: 'Please sign in to continue.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  UNKNOWN: 'An unexpected error occurred.',
};

function getUserMessage(error: Error): string {
  const code = error instanceof AppError ? error.code : 'UNKNOWN';
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN;
}
```

### Accessibility Considerations

Ensuring errors are perceivable by all users.

```typescript
function AccessibleError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="error-container"
    >
      <span className="sr-only">Error: </span>
      {message}
    </div>
  );
}
```

**Requirements:**
- `role="alert"` for error messages
- `aria-live="assertive"` for important errors
- Focus management to error content
- Visible focus indicators on retry buttons

### Recovery Strategies

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| Automatic retry | Transient errors | Exponential backoff |
| Manual retry | User-initiated | Retry button |
| Reset state | Corrupted state | Clear + reinitialise |
| Navigate away | Fatal view errors | Redirect to safe route |
| Reload app | Unrecoverable | Full page reload |

```typescript
function ErrorWithRecovery({ error, onRetry, onReset, onHome }) {
  const isTransient = error instanceof NetworkError;
  const isRecoverable = error instanceof RecoverableError;

  return (
    <div role="alert">
      <p>{getUserMessage(error)}</p>
      {isTransient && <button onClick={onRetry}>Retry</button>}
      {isRecoverable && <button onClick={onReset}>Start over</button>}
      <button onClick={onHome}>Go to home</button>
    </div>
  );
}
```

## Recommendations for itemdeck

### 1. Use Layered Error Boundaries

Implement four layers: Application, Route, Feature (plugins), Component.

### 2. Adopt react-error-boundary

Provides reset functionality and better developer experience than raw Error Boundaries.

### 3. Configure TanStack Query Error Handling

- Retry 3 times for network errors
- Don't retry for 4xx errors
- Propagate 5xx errors to boundaries
- Handle mutations locally (no boundary)

### 4. Create Error Message Catalogue

Map error codes to user-friendly messages in British English.

### 5. Ensure Accessibility

- Use `role="alert"` for all error containers
- Manage focus to error messages
- Provide keyboard-accessible recovery actions

### 6. Document Recovery Patterns

Standard recovery UI components for consistent UX.

## References

- [React Error Boundaries Documentation](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary)
- [TanStack Query Error Handling](https://tanstack.com/query/latest/docs/react/guides/errors)
- [WCAG 2.1 Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification)
- [Kent C. Dodds: Error Handling in React](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)

---

## Related Documentation

- [R-018: Error Handling Strategies](./R-018-error-handling-strategies.md)
- [ADR-030: Error Boundary Architecture](../decisions/adrs/ADR-030-error-boundary-architecture.md)
- [F-010: Error Boundary Implementation](../roadmap/features/completed/F-010-error-boundary.md)

---

**Status**: Complete
