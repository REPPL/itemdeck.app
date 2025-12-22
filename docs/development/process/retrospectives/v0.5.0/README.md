# v0.5.0 Retrospective - Schema Design

## What Went Well

### Collaborative Design Process

The schema design emerged through iterative conversation, exploring multiple options before settling on the Entity-Relationship approach. This collaborative process ensured the final design addressed real requirements rather than hypothetical ones.

### Clean Separation of Concerns

The modular schema structure with separate component files (image, display, fields) allows for:
- Independent evolution of each component
- Easier comprehension of individual parts
- Reusability across different contexts

### Future-Proofing

The versioned URL namespace (`/schemas/v1/`) allows for breaking changes in future versions without disrupting existing collections.

### Image Attribution First-Class

Elevating image attribution from an afterthought (unstructured string) to a first-class concept (structured object) demonstrates commitment to proper content licensing and attribution.

## What Could Improve

### Scope Creep from Original Plan

The original v0.5.0 plan in `docs/prompts/implementation/v0.5.0/README.md` was much larger, covering:
- Visual overhaul (badges, card redesign)
- Navigation (admin button, search, explorer)
- Settings reorganisation
- Theme system

These were descoped to focus on schema design. Future milestones should be scoped more realistically from the start.

### Documentation Location

Schema files are in `docs/reference/schemas/` but this is documentation, not runtime code. Consider whether schemas should live in `src/schemas/` if they'll be used for runtime validation.

### Example Completeness

The example `retro-games` collection only includes 12 games (subset of the full 72). A complete migration would better demonstrate the schema's capabilities.

## Lessons Learned

### Design Before Implementation

Spending time on schema design (evaluating options, discussing trade-offs) before writing code resulted in a more robust solution. The temptation to jump straight to implementation should be resisted for foundational work.

### Modular Schemas Scale Better

Breaking the schema into components (`image.schema.json`, `display.schema.json`, etc.) makes each piece manageable. A monolithic schema file would have been harder to navigate and maintain.

### Flexibility vs Simplicity Trade-off

Every flexible feature adds complexity. The Entity-Relationship model is powerful but requires more schema definition than a simple flat list. For very simple collections, this might be overkill.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Entity-Relationship over Tag-Based | Better for complex hierarchical data with natural groupings |
| Embedded images over separate entity | Images rarely shared across entities; simpler mental model |
| Versioned URL namespace | Allows breaking changes without disrupting existing collections |
| Component schemas | Modular, reusable, easier to maintain |
| Expression syntax for image selection | Flexible but may need runtime parser implementation |

## Metrics

| Metric | Value |
|--------|-------|
| Schema files | 5 |
| Example files | 3 |
| Bug fixes | 1 (DragOverlay) |
| Tests passing | 211 |
| Breaking changes | 0 (schema is new, not replacing) |

## Action Items for Future

- [ ] Implement schema loader in v0.6.0
- [ ] Migrate full retro-games collection
- [ ] Consider runtime schema validation
- [ ] Document image expression syntax formally
- [ ] Revisit descoped visual features for future milestone

---

## Related Documentation

- [v0.5.0 Devlog](../../devlogs/v0.5.0/README.md)
- [v0.5.0 Implementation Prompt](../../../prompts/implementation/v0.5.0/README.md)
- [Collection Schema](../../../reference/schemas/v1/collection.schema.json)
