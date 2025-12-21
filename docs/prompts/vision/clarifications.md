# Vision Clarifications

Decisions and clarifications made during vision implementation.

## Questions Asked

### 1. Testing Scope

**Question**: The vision mentions 'Unit/integration tests' as out of scope, but the existing roadmap has F-017 Testing Infrastructure planned for v0.6.0. Should we remove F-017 from the roadmap?

**Answer**: Keep for Phase 2+

**Action**: Keep F-017 (Testing Infrastructure) in v0.6.0. The vision's "out of scope" items apply to Phase 1 (the demo). Testing infrastructure will be implemented after the Phase 1 demo is complete.

### 2. Theme Colours

**Question**: The vision defines specific themes (Modern: #1a1a2e, Retro: #1a0a2e) but ADR-005 and F-010 define different colour palettes (light: #ffffff, dark: #0f172a). Which should be canonical?

**Answer**: Merge both

**Action**: Keep light/dark themes from research documentation as the base system. Add Modern and Retro as separate, additional themes. This gives four theme options:
- Light (from research)
- Dark (from research)
- Modern (from vision - deep charcoal with teal accent)
- Retro (from vision - deep purple with neon accents)

### 3. Card Dimensions

**Question**: The vision specifies cardRatio: 1.4 and cardWidth: 180, but the current implementation uses 5:7 poker card ratio (~1.4) with cardWidth: 300. Should we update the defaults?

**Answer**: Keep current

**Action**: Retain the current defaults:
- `cardWidth`: 300px
- `cardRatio`: 5:7 (approximately 1.4)

The vision's values are examples; the current values work well for the existing layout.

### 4. Data Files

**Question**: Where are the CSV data files for the retro games collection?

**Answer**: Will be provided later

**Action**: Remove reference to "attached CSV files" from vision document. Data files will be provided separately when ready for implementation.

---

## Related Documentation

- [Vision Document](./README.md)
- [Setup Clarifications](../setup/clarifications.md)
