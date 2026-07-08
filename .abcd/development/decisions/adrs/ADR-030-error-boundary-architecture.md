# ADR-030: Error Boundary Architecture

## Status

Accepted

## Context

itemdeck currently has basic error handling via React Error Boundaries (F-010), but lacks a comprehensive, layered approach to error handling that covers:

1. **Component-level errors** - React rendering failures
2. **Data fetching errors** - TanStack Query failures
3. **Plugin errors** - Third-party code failures in sandbox
4. **User-recoverable errors** - Validation failures, network issues
5. **Fatal errors** - Unrecoverable application state

Research findings from [R-018: Error Handling Strategies](../../research/R-018-error-handling-strategies.md) identified the need for a layered architecture with graceful degradation.

### Current State

- Single global Error Boundary catches React errors
- TanStack Query has default error handling
- No structured recovery strategies
- No error aggregation or reporting
- Plugin errors not isolated

### Requirements

| Requirement | Priority |
|-------------|----------|
| Isolate plugin failures from core app | Critical |
| Provide user-friendly error messages | High |
| Enable component-level recovery | High |
| Support offline/network errors | Medium |
| Aggregate errors for debugging | Medium |

## Decision

Implement a **four-layer error boundary architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Application                     │
│   Catches unhandled errors, shows full-page error state     │
├─────────────────────────────────────────────────────────────┤
│                    Layer 2: Route/View                      │
│   Catches per-view errors, allows navigation to other views │
├─────────────────────────────────────────────────────────────┤
│                    Layer 3: Feature                         │
│   Isolates feature failures (plugins, mechanics, panels)    │
├─────────────────────────────────────────────────────────────┤
│                    Layer 4: Component                       │
│   Graceful degradation for individual components            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Scope | Recovery Action | User Experience |
|-------|-------|-----------------|-----------------|
| **Application** | Entire app | Reload button | Full-page error with diagnostics |
| **Route** | Single view | Navigate away | View-level error with navigation |
| **Feature** | Plugin/mechanic | Disable feature | Feature unavailable message |
| **Component** | Single component | Fallback UI | Placeholder or skeleton |

## Implementation

### Base Error Boundary

```typescript
// src/components/errors/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level: 'application' | 'route' | 'feature' | 'component';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    errorAggregator.record(error, {
      level: this.props.level,
      componentStack: errorInfo.componentStack,
    });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      return typeof fallback === 'function'
        ? fallback(this.state.error, this.reset)
        : fallback;
    }
    return this.props.children;
  }
}
```

### Layer-Specific Boundaries

```typescript
// Application-level: full-page error
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="application"
      fallback={(error, reset) => (
        <FullPageError
          error={error}
          onRetry={reset}
          onReload={() => window.location.reload()}
          showDiagnostics
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Route-level: view-specific error with navigation
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <ErrorBoundary
      level="route"
      fallback={(error, reset) => (
        <ViewError
          error={error}
          onRetry={reset}
          onNavigateHome={() => navigate('/')}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Feature-level: isolate plugins/mechanics
export function FeatureErrorBoundary({
  children,
  featureName,
}: {
  children: ReactNode;
  featureName: string;
}) {
  return (
    <ErrorBoundary
      level="feature"
      fallback={
        <FeatureUnavailable
          feature={featureName}
          message="This feature encountered an error and has been disabled."
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Component-level: graceful degradation
export function ComponentErrorBoundary({
  children,
  fallback = <Skeleton />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ErrorBoundary level="component" fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
```

### TanStack Query Integration

```typescript
// src/lib/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry 4xx errors
        if (error instanceof HTTPError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      useErrorBoundary: (error) => {
        // Only throw to boundary for server errors
        return error instanceof HTTPError && error.status >= 500;
      },
    },
    mutations: {
      useErrorBoundary: false, // Handle mutations locally
      onError: (error) => {
        errorAggregator.record(error, { type: 'mutation' });
      },
    },
  },
});
```

### Plugin Error Isolation

```typescript
// src/plugins/runtime/PluginHost.tsx
export function PluginHost({ plugin }: { plugin: Plugin }) {
  return (
    <FeatureErrorBoundary featureName={`Plugin: ${plugin.name}`}>
      <Suspense fallback={<PluginLoader />}>
        <PluginSandbox plugin={plugin}>
          <PluginRenderer plugin={plugin} />
        </PluginSandbox>
      </Suspense>
    </FeatureErrorBoundary>
  );
}
```

### Error Recovery Hooks

```typescript
// src/hooks/useErrorRecovery.ts
export function useErrorRecovery<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: Error, attempt: number) => void;
    fallbackValue?: T;
  } = {}
) {
  const { retries = 3, retryDelay = 1000, onError, fallbackValue } = options;
  const [state, setState] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    data?: T;
    error?: Error;
    attempt: number;
  }>({ status: 'idle', attempt: 0 });

  const execute = useCallback(async () => {
    setState({ status: 'loading', attempt: 0 });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const data = await operation();
        setState({ status: 'success', data, attempt });
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error, attempt);

        if (attempt < retries) {
          await new Promise(r => setTimeout(r, retryDelay * attempt));
        } else {
          setState({
            status: 'error',
            error,
            attempt,
            data: fallbackValue,
          });
          throw error;
        }
      }
    }
  }, [operation, retries, retryDelay, onError, fallbackValue]);

  return { ...state, execute, reset: () => setState({ status: 'idle', attempt: 0 }) };
}
```

## Consequences

### Positive

- **Fault isolation** - Plugin failures don't crash the app
- **User experience** - Appropriate error UI at each level
- **Recoverability** - Users can retry or navigate away
- **Debugging** - Error aggregation aids diagnosis
- **Consistency** - Standard error handling patterns

### Negative

- **Complexity** - Multiple boundary layers to maintain
- **Bundle size** - Additional error UI components
- **Testing** - Need to test error scenarios at each layer

### Mitigations

- Create shared error UI components
- Add error scenario testing utilities
- Document boundary placement guidelines

## Alternatives Considered

### Single Global Boundary

- Current approach
- **Rejected**: No isolation, all errors show same full-page error

### Try-Catch Everywhere

- Manual error handling in each component
- **Rejected**: Inconsistent, error-prone, verbose

### Third-Party Error Service Only

- Use Sentry/LogRocket for all error handling
- **Rejected**: Privacy concerns, external dependency for core functionality

---

## Related Documentation

- [R-018: Error Handling Strategies](../../research/R-018-error-handling-strategies.md)
- [F-010: Error Boundary Implementation](../../roadmap/features/completed/F-010-error-boundary.md)
- [ADR-024: Plugin Sandbox Implementation](./ADR-024-plugin-sandbox-implementation.md)
- [ADR-031: Logging & Telemetry Strategy](./ADR-031-logging-telemetry-strategy.md)
