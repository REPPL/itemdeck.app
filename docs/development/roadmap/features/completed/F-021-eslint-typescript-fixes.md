# F-021: ESLint/TypeScript Fixes

## Problem Statement

The codebase has accumulated 16 ESLint errors and 3 warnings that need resolution:

1. **Deprecated Zod methods** (4 errors): `z.string().url()` deprecated in favour of `z.url()`
2. **Unsafe type assignments** (6 errors): `Promise.all()` destructuring with `any` types in `useCollection.ts`
3. **Type import violations** (2 errors): Using `import()` type syntax instead of consistent imports
4. **Void expression returns** (2 errors): Arrow functions returning void incorrectly
5. **React refresh warnings** (3): Components exporting non-components

These issues will cause build failures when dependencies are upgraded (particularly Zod v5).

## Design Approach

### 1. Upgrade Deprecated Zod Syntax

```typescript
// Before (deprecated)
imageUrl: z.string().url().optional(),

// After
imageUrl: z.url().optional(),
```

**Files affected:**
- `src/schemas/cardData.schema.ts` (3 instances)
- `src/schemas/category.schema.ts` (1 instance)

### 2. Fix Promise.all Type Safety

```typescript
// Before (unsafe)
const [itemsResponse, categoriesResponse] = await Promise.all([
  fetch(`${basePath}/items.json`),
  fetch(`${basePath}/categories.json`),
]);

// After (type-safe)
const [itemsResponse, categoriesResponse] = await Promise.all<
  [Promise<Response>, Promise<Response>]
>([
  fetch(`${basePath}/items.json`),
  fetch(`${basePath}/categories.json`),
]);
```

**Files affected:**
- `src/hooks/useCollection.ts`

### 3. Fix Type Import Consistency

```typescript
// Before
export type CollectionManifest = import("@/schemas/collection.schema").CollectionManifest;

// After
import type { CollectionManifest } from "@/schemas/collection.schema";
export type { CollectionManifest };
```

**Files affected:**
- `src/types/collection.ts`

### 4. Fix Void Expression Returns

```typescript
// Before
const handleOnline = useCallback(() => setIsOnline(true), []);

// After
const handleOnline = useCallback(() => {
  setIsOnline(true);
}, []);
```

**Files affected:**
- `src/hooks/useOnlineStatus.ts`

### 5. Separate Component Exports

Move utility functions from component files to separate files to satisfy React refresh requirements.

**Files affected:**
- `src/components/ImageWithFallback/SVGPlaceholder.tsx`
- `src/context/ConfigContext.tsx`

## Implementation Tasks

- [ ] Update Zod schema syntax in `cardData.schema.ts`
- [ ] Update Zod schema syntax in `category.schema.ts`
- [ ] Add proper typing to Promise.all in `useCollection.ts`
- [ ] Fix type imports in `collection.ts`
- [ ] Fix void returns in `useOnlineStatus.ts`
- [ ] Separate utility exports from component files
- [ ] Run `npm run lint` and verify 0 errors
- [ ] Run `npm run typecheck` and verify 0 errors
- [ ] Update CI to fail on lint errors

## Success Criteria

- [ ] `npm run lint` reports 0 errors
- [ ] `npm run typecheck` reports 0 errors
- [ ] All 211+ tests still pass
- [ ] Build succeeds without warnings
- [ ] CI pipeline enforces lint checks

## Dependencies

- **Requires**: None
- **Blocks**: None (but should be done early in v0.3.0)

## Complexity

**Small** - Straightforward fixes with clear solutions.

---

## Related Documentation

- [v0.3.0 Milestone](../../milestones/v0.3.0.md)
- [ADR-002: Schema Validation](../../../decisions/adrs/ADR-002-schema-validation.md)
