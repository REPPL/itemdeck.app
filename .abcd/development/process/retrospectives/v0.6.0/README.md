# v0.6.0 Retrospective - Schema Loader

Post-milestone reflection for the Schema Loader implementation.

---

## What Went Well

### 1. Clean Type Design

The TypeScript types closely mirror the JSON Schema structure, making it easy to understand the relationship between schema specification and runtime code. Type guards and utility functions make the types practical to use.

### 2. Expression-Based Selectors

The image selector expression language (`images[type=cover][0] ?? images[0]`) provides flexibility without complexity. It's intuitive to read and allows collection authors to control image selection without code changes.

### 3. Backward Compatibility

Supporting both legacy and v1 formats simultaneously makes migration risk-free. Existing collections continue to work while new features can use the v1 schema.

### 4. Comprehensive Test Coverage

46 new tests for the loaders ensure the core parsing and resolution logic is well-tested. Tests cover edge cases like missing references, empty arrays, and fallback expressions.

### 5. Migration Script

The migration script successfully converted all 79 games and 13 platforms, parsing attribution strings into structured objects. This proves the v1 format can represent real-world data.

---

## What Could Improve

### 1. Settings Audit Deferred

The v0.6.0 prompt included a settings audit phase that was deferred. Collection-level settings customisation should be addressed in a future version to fully leverage schema-driven configuration.

### 2. Runtime Validation

Currently using TypeScript types without runtime validation. Consider adding Zod schemas for the v1 format to catch malformed collection files early with helpful error messages.

### 3. Error Handling

Loader errors could be more descriptive. When a collection file is malformed, the error message should indicate which property failed and why.

### 4. Performance Optimisation

For large collections, the relationship resolver creates lookup maps for all entity types. Consider lazy initialisation for types that aren't referenced.

---

## Lessons Learned

### 1. Schema-First Development Works

Designing the schema (v0.5.0) before implementation (v0.6.0) made the loader straightforward to build. The specification served as a clear contract.

### 2. Expression Languages Are Powerful

Small expression languages (like the image selector) provide significant flexibility with minimal complexity. They're easier to document and reason about than arbitrary code.

### 3. Auto-Detection Simplifies Migration

Detecting format automatically means users don't need to configure anything. The right loader is selected based on file content.

### 4. Test Early, Test Thoroughly

Writing tests for the loaders before integrating with the hook caught several edge cases (empty arrays, missing fields, malformed expressions) early.

---

## Decisions Made

### 1. Keep Legacy Files

During migration, legacy `items.json` and `categories.json` files are preserved. This allows rolling back if issues are discovered.

### 2. Lowercase Entity IDs

Platform IDs are lowercased during migration to ensure consistent referencing. This matches the `kebab-case` convention in the schema.

### 3. Optional Attribution

Image attribution is structured but optional. Many images may not have known attribution, and requiring it would be impractical.

### 4. Implicit Relationships

When a field name matches an entity type name (e.g., `platform`), the resolver automatically treats it as a reference. This reduces boilerplate in schema definitions.

---

## Metrics

| Metric | Value |
|--------|-------|
| New files created | 13 |
| Files modified | 4 |
| New tests | 46 |
| Total tests | 257 |
| Test pass rate | 100% |
| Build success | Yes |
| TypeScript errors | 0 |

---

## Deferred Items

The following items from the original v0.6.0 scope were deferred:

1. **Settings Audit & Reorganisation** - Collection-level settings customisation needs UX design
2. **SettingsPanel UI Updates** - Dependent on settings audit

These should be addressed in a future release.

---

## Related Documentation

- [v0.6.0 Devlog](../../devlogs/v0.6.0/README.md)
- [v0.6.0 Implementation Prompt](../../../../prompts/implementation/v0.6.0/README.md)
- [v0.5.0 Retrospective](../v0.5.0/README.md) - Schema Design reflection
