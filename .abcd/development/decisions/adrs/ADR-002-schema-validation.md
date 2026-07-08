# ADR-002: Use Zod for Schema Validation

## Status

Accepted

## Context

Itemdeck needs runtime validation for:
- Configuration files (JSON/YAML)
- External API responses (GitHub, Wikimedia)
- User-provided card data
- Settings persistence

We evaluated several validation libraries:

| Library | Bundle Size | TypeScript Integration | Runtime Validation |
|---------|-------------|------------------------|-------------------|
| Zod | 12KB | Infers types from schema | Yes |
| Yup | 15KB | Separate type definitions | Yes |
| io-ts | 8KB | Functional, complex | Yes |
| Ajv (JSON Schema) | 20KB | Separate types | Yes |

Key requirements:
1. TypeScript type inference from schemas
2. Clear error messages for users
3. Composable schemas (extend, merge)
4. Small bundle size
5. Active maintenance

## Decision

Use **Zod** as the primary schema validation library.

## Consequences

### Positive

- **Type inference** - `z.infer<typeof Schema>` generates TypeScript types
- **Single source of truth** - Schema defines both validation and types
- **Composable** - `.extend()`, `.merge()`, `.partial()` for reuse
- **Transform support** - `.transform()` for data normalisation
- **Error formatting** - Structured errors for user feedback
- **Safe parse** - `.safeParse()` returns result object, never throws

### Negative

- **Runtime overhead** - Validation runs at runtime (not compile-time only)
- **Bundle size** - 12KB added to bundle
- **Learning curve** - Schema DSL differs from TypeScript

### Mitigations

- Validate at boundaries only (API responses, config loading)
- Use `.safeParse()` for graceful error handling
- Document common schema patterns

## Alternatives Considered

### Yup
- Similar API
- **Rejected**: Weaker TypeScript inference

### io-ts
- Functional approach
- **Rejected**: Steeper learning curve

### JSON Schema + Ajv
- Industry standard
- **Rejected**: Separate type definitions needed

### Manual Validation
- Zero dependencies
- **Rejected**: Error-prone, no type inference

---

## Related Documentation

- [Configuration Hierarchy Research](../../../research/configuration-hierarchy.md)
- [F-002: Configuration System](../../roadmap/features/planned/F-002-configuration-system.md)
- [F-008: Card Data Schema](../../roadmap/features/planned/F-008-card-data-schema.md)
