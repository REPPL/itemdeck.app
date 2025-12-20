# ADR-003: Use TanStack Query for Data Fetching

## Status

Accepted

## Context

Itemdeck will fetch data from external sources:
- GitHub repositories (card JSON files)
- Wikimedia Commons (image metadata)
- Potential future APIs

We need to handle:
- Caching and cache invalidation
- Loading and error states
- Background refetching
- Request deduplication
- Offline support

We evaluated several approaches:

| Approach | Caching | DevTools | TypeScript |
|----------|---------|----------|------------|
| TanStack Query | Built-in | Yes | Excellent |
| SWR | Built-in | Community | Good |
| RTK Query | Redux integration | Redux DevTools | Good |
| Manual fetch | Manual | None | Manual |

## Decision

Use **TanStack Query** (React Query v5) for all data fetching.

## Consequences

### Positive

- **Declarative caching** - Configurable stale times, garbage collection
- **Background updates** - Refetch on window focus, interval
- **Request deduplication** - Multiple components share one request
- **Optimistic updates** - UI updates before server confirmation
- **DevTools** - Inspect cache, queries, mutations
- **TypeScript** - Full type inference with query keys

### Negative

- **Bundle size** - 15KB gzipped
- **Learning curve** - Query keys, mutation patterns
- **Boilerplate** - Query client setup, provider

### Mitigations

- Create reusable query hooks for common patterns
- Document query key conventions
- Use query key factories for type safety

## Query Key Convention

```typescript
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
};
```

## Alternatives Considered

### SWR
- Similar features, smaller
- **Rejected**: Fewer features, less active development

### RTK Query
- Redux integration
- **Rejected**: Not using Redux, adds complexity

### Manual fetch + useState
- No dependencies
- **Rejected**: Reinventing the wheel, error-prone

---

## Related Documentation

- [External Data Sources Research](../../../research/external-data-sources.md)
- [F-006: TanStack Query Setup](../../roadmap/features/planned/F-006-tanstack-query-setup.md)
- [F-007: GitHub Data Source](../../roadmap/features/planned/F-007-github-data-source.md)
