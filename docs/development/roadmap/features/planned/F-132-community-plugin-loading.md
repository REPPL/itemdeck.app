# F-132: Community Plugin Loading

## Problem Statement

The curated registry limits plugin availability:

1. **Barrier to entry** - Authors must submit for curation
2. **Slow updates** - Curation process delays releases
3. **Limited variety** - Not all plugins meet curation standards
4. **No experimentation** - Cannot try unvetted plugins

## Design Approach

Allow loading plugins directly from GitHub URLs:

- Users can install plugins from any GitHub repository
- Clear warning about security implications
- Enhanced sandboxing for community plugins
- User accepts responsibility for security

### Trust Tiers

```
┌─────────────────────────────────────────────────────────────┐
│                      Trust Hierarchy                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Built-in Plugins                              TIER 1   ││
│  │  • Bundled with app                                     ││
│  │  • Full trust                                           ││
│  │  • Cannot disable                                       ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Curated Plugins                               TIER 2   ││
│  │  • From official registry                               ││
│  │  • Security audited                                     ││
│  │  • Verified permissions                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                  │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Community Plugins                             TIER 3   ││
│  │  • From GitHub URL                                      ││
│  │  • Not audited                                          ││
│  │  • Enhanced sandbox                                     ││
│  │  • User accepts risk                                    ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### GitHub URL Format

```
Supported formats:
• https://github.com/owner/repo
• https://github.com/owner/repo/tree/branch
• https://github.com/owner/repo/releases/tag/v1.0.0

Expected structure:
repo/
├── manifest.json      # Required
├── dist/
│   └── index.js       # Main bundle
└── ...
```

### Community Plugin Warning

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Community Plugin Warning                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  You are installing a community plugin that has NOT been    │
│  reviewed by Itemdeck.                                       │
│                                                              │
│  Plugin: Card Trivia                                         │
│  Source: github.com/example/card-trivia                     │
│  Author: @example                                            │
│                                                              │
│  ⚠️  This plugin could potentially:                          │
│  • Access your card collection data                         │
│  • Display arbitrary content                                │
│  • Store data in your browser                               │
│                                                              │
│  [  ] I understand the risks and trust this source          │
│                                                              │
│  [Cancel]                              [Install Anyway]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Enhanced Sandbox for Community Plugins

| Capability | Curated | Community |
|------------|---------|-----------|
| Theme CSS | ✅ | ✅ |
| Card data (read) | ✅ | ✅ (limited) |
| Settings | ✅ | ⚠️ Scoped only |
| Network | ✅ Allowlist | ❌ Same-origin only |
| Storage | ✅ | ⚠️ Limited quota |

## Implementation Tasks

### Phase 1: GitHub Loader

- [ ] Create `src/plugins/community/githubLoader.ts`
- [ ] Parse GitHub URLs (repo, branch, release)
- [ ] Fetch manifest.json from repo
- [ ] Fetch plugin bundle from dist/

### Phase 2: Community Plugin UI

- [ ] Add "Install from URL" in Plugin Manager
- [ ] Create URL input with validation
- [ ] Show plugin preview before install
- [ ] Display trust tier badge

### Phase 3: Warning System

- [ ] Create `src/components/CommunityPluginWarning/`
- [ ] Display security implications
- [ ] Require explicit consent checkbox
- [ ] Record user consent decision

### Phase 4: Enhanced Sandbox

- [ ] Create community plugin sandbox variant
- [ ] Restrict network to same-origin
- [ ] Limit storage quota
- [ ] Add stricter API limits

### Phase 5: Management

- [ ] Track community plugins separately
- [ ] Show warning badge in plugin list
- [ ] Enable quick removal
- [ ] Clear data on uninstall

## Success Criteria

- [ ] GitHub URLs parsed correctly
- [ ] Plugins loadable from public repos
- [ ] Warning displayed before install
- [ ] Enhanced sandbox active for community plugins
- [ ] Community plugins clearly marked in UI

## Dependencies

- **F-123**: Plugin Loader & Registry - Plugin loading
- **F-124**: Plugin Security Sandbox - Enhanced sandbox
- **F-125**: Plugin Permission Model - Restricted permissions

## Complexity

**High** - Security implications require careful implementation.

## Estimated Effort

**12-16 hours**

---

## Related Documentation

- [ADR-023: Plugin Trust Tiers](../../decisions/adrs/ADR-023-plugin-trust-tiers.md)
- [Web Security Sandbox Research](../../research/state-of-the-art-web-security-sandbox.md)
- [F-131: Curated Registry API](./F-131-curated-registry-api.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
