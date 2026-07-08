# F-112: MyPlausibleMe Example Loading

## Problem Statement

Users need example data to test and explore features. Currently there's no easy way to load sample collections for testing or demonstration purposes.

## Design Approach

Add development-only functionality to load example collections from MyPlausibleMe repository with lazy loading enabled.

## Implementation Tasks

- [ ] Create `src/config/devSources.ts`
- [ ] Define example collections from MyPlausibleMe/data/examples/
- [ ] Only enable in development mode (`import.meta.env.DEV`)
- [ ] Add "Load Example Collection" option in CollectionPicker
- [ ] Configure sources with lazy loading enabled
- [ ] Test loading example collections

## Example Collections

Available examples from MyPlausibleMe/data/examples/:
- books
- games
- movies
- songs
- tv

## Configuration Structure

```typescript
// src/config/devSources.ts
export const DEV_SOURCES = [
  {
    name: 'Example: Books',
    path: 'MyPlausibleMe/data/examples/books',
    lazyLoad: true,
    enabled: import.meta.env.DEV,
  },
  // ... other examples
];
```

## Success Criteria

- [ ] Example collections loadable in development mode
- [ ] Lazy loading enabled for examples
- [ ] Hidden in production builds
- [ ] No impact on production bundle size

## Dependencies

- **Requires**: MyPlausibleMe repository accessible
- **Blocks**: None

## Complexity

**Small** - Configuration and UI option only.

---

## Related Documentation

- [v0.15.0 Milestone](../../milestones/v0.15.0.md)
- [Implementation Prompt](../../../../prompts/implementation/v0.15.0/track-a-onboarding.md)
