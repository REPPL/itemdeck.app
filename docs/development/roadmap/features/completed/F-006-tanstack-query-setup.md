# F-006: TanStack Query Setup

## Problem Statement

The application uses mock data bundled at build time. To support external data sources, we need a robust data fetching layer that handles:

1. Caching and cache invalidation
2. Loading and error states
3. Background refetching
4. Request deduplication

## Design Approach

Implement **TanStack Query (React Query)** as the data fetching foundation. This provides:

- Declarative data fetching with hooks
- Automatic caching with configurable stale times
- Built-in loading/error states
- DevTools for debugging

### Query Client Setup

```tsx
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000,   // 30 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});
```

### Provider Setup

```tsx
// src/main.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </React.StrictMode>
);
```

### Base Query Hook Pattern

```tsx
// src/hooks/useCards.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { CardData } from '../types/card';

export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
};

async function fetchCards(filters?: CardFilters): Promise<CardData[]> {
  // Implementation will vary by data source
  const response = await fetch('/api/cards');
  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }
  return response.json();
}

export function useCards(
  filters?: CardFilters,
  options?: Omit<UseQueryOptions<CardData[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: cardKeys.list(filters ?? {}),
    queryFn: () => fetchCards(filters),
    ...options,
  });
}
```

### Error Boundary Integration

```tsx
// src/components/QueryErrorBoundary.tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div role="alert">
              <p>Something went wrong:</p>
              <pre>{error.message}</pre>
              <button onClick={resetErrorBoundary}>Try again</button>
            </div>
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## Implementation Tasks

- [x] Install TanStack Query: `npm install @tanstack/react-query`
- [x] Install DevTools: `npm install -D @tanstack/react-query-devtools`
- [x] Create `src/lib/queryClient.ts` with default config
- [x] Add QueryClientProvider to main.tsx
- [x] Add DevTools (dev mode only)
- [x] Create query key factory pattern
- [x] Create base `useCards` hook
- [x] Create `QueryErrorBoundary` component
- [x] Add loading skeleton components
- [x] Migrate mock data to use query hook
- [x] Write tests for query hooks

## Success Criteria

- [x] QueryClientProvider wraps application
- [x] DevTools available in development
- [x] Query hooks return loading/error/data states
- [x] Cache prevents duplicate requests
- [x] Error states handled gracefully
- [x] TypeScript types complete
- [x] Tests pass

## Dependencies

- **Requires**: v0.1.0 complete
- **Blocks**: F-007 GitHub Data Source

## Complexity

**Medium** - Establishes patterns for all data fetching.

---

## Related Documentation

- [External Data Sources Research](../../../../research/external-data-sources.md)
- [ADR-003: Data Fetching](../../../decisions/adrs/ADR-003-data-fetching.md)
- [v0.2.0 Milestone](../../milestones/v0.2.0.md)
