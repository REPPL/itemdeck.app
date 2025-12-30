# F-131: Curated Registry API

## Problem Statement

Users need a trusted source for quality plugins:

1. **No discovery** - Users cannot find available plugins
2. **No trust indication** - All external plugins equally risky
3. **No quality control** - No vetting of plugin quality
4. **No versioning** - No way to track plugin updates

## Design Approach

Create an official plugin registry API:

- Curated plugins vetted for security and quality
- Versioned releases with changelogs
- Searchable catalogue with categories
- Automatic update notifications

### Registry Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Itemdeck Plugin Registry                     │
│                 (registry.itemdeck.app)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  API Endpoints                                           ││
│  │                                                          ││
│  │  GET  /plugins              List all plugins            ││
│  │  GET  /plugins/:id          Get plugin details          ││
│  │  GET  /plugins/:id/versions Get version history         ││
│  │  GET  /plugins/search       Search plugins              ││
│  │  GET  /plugins/categories   List categories             ││
│  │  GET  /plugins/featured     Featured plugins            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Plugin Data                                             ││
│  │                                                          ││
│  │  • Manifest (validated)                                  ││
│  │  • Security audit status                                 ││
│  │  • Download statistics                                   ││
│  │  • User ratings/reviews                                  ││
│  │  • Version history                                       ││
│  │  • Bundle URL (CDN-hosted)                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### API Response Format

```typescript
// GET /plugins
interface PluginListResponse {
  plugins: PluginSummary[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}

interface PluginSummary {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'mechanic' | 'source' | 'settings';
  author: {
    name: string;
    verified: boolean;
  };
  version: string;
  downloads: number;
  rating: number;
  featured: boolean;
  icon: string;
}

// GET /plugins/:id
interface PluginDetails extends PluginSummary {
  manifest: PluginManifest;
  versions: VersionInfo[];
  securityAudit: {
    status: 'passed' | 'pending' | 'failed';
    lastAudit: string;
    findings: string[];
  };
  bundleUrl: string;
  readme: string;
  screenshots: string[];
  changelog: string;
}
```

### Registry Client

```typescript
// src/plugins/registry/client.ts
class RegistryClient {
  private baseUrl = 'https://registry.itemdeck.app/api/v1';

  async listPlugins(options?: ListOptions): Promise<PluginListResponse>;
  async getPlugin(id: string): Promise<PluginDetails>;
  async searchPlugins(query: string): Promise<PluginListResponse>;
  async getCategories(): Promise<Category[]>;
  async getFeatured(): Promise<PluginSummary[]>;
  async checkUpdates(installed: InstalledPlugin[]): Promise<UpdateInfo[]>;
}
```

## Implementation Tasks

### Phase 1: Registry Client

- [ ] Create `src/plugins/registry/client.ts`
- [ ] Implement list/get/search endpoints
- [ ] Add request caching (15 min TTL)
- [ ] Handle offline gracefully

### Phase 2: Plugin Browser UI

- [ ] Create `src/components/PluginBrowser/`
- [ ] Implement search and filtering
- [ ] Show plugin cards with icons
- [ ] Display ratings and downloads
- [ ] Show security audit status

### Phase 3: Plugin Details View

- [ ] Create `src/components/PluginDetails/`
- [ ] Display full plugin information
- [ ] Show screenshots gallery
- [ ] Display version history
- [ ] Show changelog

### Phase 4: Installation Flow

- [ ] Add "Install" button to plugin cards
- [ ] Show permission request dialog
- [ ] Download plugin bundle
- [ ] Register and activate plugin

### Phase 5: Update System

- [ ] Check for updates on startup
- [ ] Show update badges in UI
- [ ] Implement update flow
- [ ] Support rollback to previous version

## Success Criteria

- [ ] Registry API accessible from app
- [ ] Plugin browser shows available plugins
- [ ] Search works across name/description
- [ ] Plugins installable from registry
- [ ] Update notifications displayed

## Dependencies

- **F-122**: Plugin Manifest Schema - Manifest validation
- **F-123**: Plugin Loader & Registry - Plugin loading
- **F-133**: Plugin Activation UI - Installation interface

## Complexity

**High** - Requires API design, client implementation, and UI components.

## Estimated Effort

**14-18 hours**

---

## Related Documentation

- [ADR-025: Plugin Distribution Strategy](../../decisions/adrs/ADR-025-plugin-distribution-strategy.md)
- [F-132: Community Plugin Loading](./F-132-community-plugin-loading.md)
- [v1.5.0 Milestone](../../milestones/v1.5.0.md)

---

**Status**: Planned
