# ADR-004: Use Zustand for State Management

## Status

Accepted

## Context

Itemdeck needs client-side state management for:
- User preferences (theme, layout, card size)
- UI state (modals, selections)
- Cached card collections
- Attribution tracking

We evaluated several state management approaches:

| Library | Bundle Size | Learning Curve | Persistence |
|---------|-------------|----------------|-------------|
| Zustand | 2KB | Low | Middleware |
| Redux Toolkit | 15KB | Medium | Manual |
| Jotai | 3KB | Low | Atoms |
| React Context | 0KB | Low | Manual |

Key requirements:
1. Small bundle size
2. Simple API
3. Built-in persistence support
4. TypeScript support
5. Works outside React components

## Decision

Use **Zustand** for global state management.

## Consequences

### Positive

- **Tiny** - 2KB gzipped, minimal overhead
- **Simple API** - No boilerplate, no reducers, no actions
- **Persist middleware** - Built-in localStorage/IndexedDB persistence
- **Version migration** - Schema versioning for data migrations
- **Flexible** - Works inside and outside React components
- **TypeScript** - Excellent type inference

### Negative

- **Less structured** - No enforced patterns like Redux
- **DevTools** - Requires separate extension
- **Community** - Smaller ecosystem than Redux

### Mitigations

- Document store patterns and conventions
- Create clear boundaries between stores
- Use persist middleware with version migrations

## Store Pattern

```typescript
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      cardWidth: 200,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'itemdeck-settings',
      version: 1,
      migrate: (state, version) => { /* migrations */ },
    }
  )
);
```

## Alternatives Considered

### Redux Toolkit
- Industry standard
- **Rejected**: Overkill for our needs, larger bundle

### Jotai
- Atomic approach
- **Rejected**: Less intuitive for our use case

### React Context
- Built-in
- **Rejected**: No persistence, prop drilling concerns

### Valtio
- Proxy-based
- **Rejected**: Less predictable updates

---

## Related Documentation

- [State Persistence Research](../../../research/state-persistence.md)
- [F-012: State Persistence](../../roadmap/features/planned/F-012-state-persistence.md)
