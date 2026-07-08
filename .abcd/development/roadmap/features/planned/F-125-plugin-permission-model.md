# F-125: Plugin Permission Model

## Problem Statement

Plugins need different levels of access:

1. **Theme plugins** - Only CSS variables and colours
2. **Mechanic plugins** - Card data and UI overlay
3. **Source plugins** - Network access and data parsing
4. **Settings plugins** - Configuration state

Without a permission model:
- All plugins get full access (security risk)
- OR all plugins get minimal access (limited functionality)

## Design Approach

Implement a capability-based permission model:

- Plugins declare required permissions in manifest
- Users approve permissions before activation
- Sandbox enforces permissions at runtime
- Audit log tracks permission usage

### Permission Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Permission Categories                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐                                        │
│  │  theme:*        │  Theme modification permissions         │
│  │  ├─ theme:read  │  Read current theme values             │
│  │  └─ theme:write │  Modify CSS variables                  │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  cards:*        │  Card data permissions                  │
│  │  ├─ cards:read  │  Read card data (collection)           │
│  │  └─ cards:list  │  List available cards                  │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  settings:*     │  Settings permissions                   │
│  │  ├─ settings:read  │  Read settings values              │
│  │  └─ settings:write │  Modify settings (scoped)          │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  network:*      │  Network permissions                    │
│  │  └─ network:fetch │  Fetch from allowlisted domains     │
│  └─────────────────┘                                        │
│                                                              │
│  ┌─────────────────┐                                        │
│  │  ui:*           │  UI permissions                         │
│  │  ├─ ui:overlay  │  Display overlay components            │
│  │  └─ ui:notify   │  Show notifications                    │
│  └─────────────────┘                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Permission by Plugin Type

| Plugin Type | Default Permissions | Optional Permissions |
|-------------|--------------------|--------------------|
| Theme | theme:read, theme:write | settings:read |
| Mechanic | cards:read, ui:overlay | settings:read, settings:write |
| Source | network:fetch, cards:list | - |
| Settings | settings:read, settings:write | ui:notify |

### Permission Request UI

```
┌─────────────────────────────────────────────────────────────┐
│  Activate "Retro Theme" plugin?                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  This plugin requests the following permissions:             │
│                                                              │
│  ✓ theme:write    Modify visual theme                       │
│  ✓ theme:read     Read current theme values                 │
│                                                              │
│  ⚠ settings:read  Read your settings (optional)             │
│                                                              │
│  [Cancel]                              [Allow & Activate]   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Permission Definition

- [ ] Create `src/plugins/permissions/types.ts`
- [ ] Define permission categories and scopes
- [ ] Create permission validation utilities
- [ ] Document each permission's capabilities

### Phase 2: Manifest Integration

- [ ] Extend manifest schema for permissions
- [ ] Validate permissions during manifest parsing
- [ ] Detect excessive permission requests

### Phase 3: Runtime Enforcement

- [ ] Create `src/plugins/permissions/enforcer.ts`
- [ ] Integrate with sandbox API bridge
- [ ] Block API calls without required permission
- [ ] Return clear permission denied errors

### Phase 4: User Approval UI

- [ ] Create `src/components/PluginPermissionModal/`
- [ ] Display required vs optional permissions
- [ ] Store user permission decisions
- [ ] Allow revoking permissions later

### Phase 5: Audit Logging

- [ ] Log all permission checks
- [ ] Record permission usage patterns
- [ ] Surface suspicious behaviour

## Success Criteria

- [ ] All API calls check permissions before execution
- [ ] Users can see and approve permissions before activation
- [ ] Permission violations logged clearly
- [ ] Users can revoke permissions and deactivate plugins
- [ ] Default permissions appropriate for each plugin type

## Dependencies

- **F-122**: Plugin Manifest Schema - Declares permissions
- **F-124**: Plugin Security Sandbox - Enforces permissions

## Complexity

**Medium** - Requires coordination between manifest, sandbox, and UI.

## Estimated Effort

**10-14 hours**

---

## Related Documentation

- [Plugin Architecture Research](../../research/state-of-the-art-plugin-architecture.md)
- [ADR-023: Plugin Trust Tiers](../../decisions/adrs/ADR-023-plugin-trust-tiers.md)
- [F-124: Plugin Security Sandbox](./F-124-plugin-security-sandbox.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
