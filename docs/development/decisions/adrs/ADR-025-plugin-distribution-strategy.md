# ADR-025: Plugin Distribution Strategy

## Status

Accepted

## Context

Following ADR-023 (Plugin Trust Tiers), itemdeck needs distribution mechanisms for:

1. **Built-in plugins** - Bundled with the application
2. **Curated plugins** - Downloaded from an official registry
3. **Community plugins** - Loaded from user-provided URLs

### Distribution Requirements

| Tier | Discovery | Download | Verification | Update |
|------|-----------|----------|--------------|--------|
| Built-in | N/A | Bundled | Build-time | App update |
| Curated | Registry API | HTTPS | Checksum | Manual/auto |
| Community | User-provided | GitHub raw | None | Manual |

### Constraints

- **No server infrastructure** initially (static hosting only)
- **GitHub-only** for community plugins (initially)
- **Offline support** - Downloaded plugins should work offline
- **Minimal bundle impact** - External plugins loaded on-demand

## Decision

### 1. Built-in Plugin Bundling

Built-in plugins use **Vite's dynamic import** with explicit chunking:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Built-in mechanics get their own chunks
          if (id.includes('/mechanics/memory/')) return 'plugin-memory';
          if (id.includes('/mechanics/quiz/')) return 'plugin-quiz';
          if (id.includes('/mechanics/collection/')) return 'plugin-collection';
          if (id.includes('/mechanics/competing/')) return 'plugin-competing';
          if (id.includes('/mechanics/snap-ranking/')) return 'plugin-snap-ranking';

          // Built-in themes
          if (id.includes('/themes/')) return 'plugins-themes';
        },
      },
    },
  },
});
```

**Directory structure:**

```
src/plugins/builtins/
├── mechanics/
│   ├── memory/
│   │   ├── manifest.json
│   │   ├── index.ts
│   │   └── components/
│   ├── quiz/
│   ├── collection/
│   ├── competing/
│   └── snap-ranking/
├── themes/
│   ├── light/
│   ├── dark/
│   └── high-contrast/
└── sources/
    └── github/
        └── gh.json
```

### 2. Curated Registry

The curated registry is a **static JSON file** hosted on `plugins.itemdeck.app`:

```json
// https://plugins.itemdeck.app/v1/registry.json
{
  "$schema": "https://itemdeck.app/schemas/registry-v1.json",
  "version": "1.0.0",
  "lastUpdated": "2025-01-15T10:30:00Z",
  "plugins": [
    {
      "id": "quiz-pro",
      "name": "Quiz Pro",
      "description": "Advanced quiz mode with scoring and leaderboards",
      "version": "1.2.0",
      "author": {
        "name": "itemdeck",
        "url": "https://github.com/itemdeck"
      },
      "type": "mechanic",
      "icon": "https://plugins.itemdeck.app/quiz-pro/icon.svg",
      "downloadUrl": "https://plugins.itemdeck.app/quiz-pro/v1.2.0.zip",
      "checksum": "sha256:a1b2c3d4...",
      "minAppVersion": "1.5.0",
      "verified": true,
      "downloads": 1523,
      "rating": 4.8,
      "permissions": ["cards:read", "settings:write", "storage:local"]
    }
  ]
}
```

**Registry client:**

```typescript
// src/plugins/registry/client.ts

const REGISTRY_URL = 'https://plugins.itemdeck.app/v1';

export interface RegistryPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: { name: string; url?: string };
  type: PluginType;
  icon?: string;
  downloadUrl: string;
  checksum: string;
  minAppVersion: string;
  verified: boolean;
  downloads: number;
  rating: number;
  permissions: string[];
}

export async function fetchRegistry(): Promise<RegistryPlugin[]> {
  const response = await fetch(`${REGISTRY_URL}/registry.json`);
  if (!response.ok) {
    throw new Error(`Registry fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.plugins;
}

export async function searchPlugins(query: string): Promise<RegistryPlugin[]> {
  const plugins = await fetchRegistry();
  const lowerQuery = query.toLowerCase();

  return plugins.filter(p =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  );
}

export async function downloadPlugin(plugin: RegistryPlugin): Promise<Blob> {
  const response = await fetch(plugin.downloadUrl);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const blob = await response.blob();

  // Verify checksum
  const hash = await computeChecksum(blob);
  if (hash !== plugin.checksum) {
    throw new Error('Plugin checksum mismatch - download may be corrupted');
  }

  return blob;
}

async function computeChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex}`;
}
```

**Plugin package structure:**

```
quiz-pro-v1.2.0.zip
├── manifest.json       # Plugin manifest
├── index.html          # Sandbox entry point
├── plugin.js           # Bundled plugin code
├── plugin.css          # Plugin styles
└── assets/
    └── icon.svg
```

### 3. Community Plugin Loading

Community plugins are loaded directly from **GitHub raw URLs**:

```typescript
// src/plugins/community/loader.ts

const ALLOWED_HOSTS = [
  'raw.githubusercontent.com',
  'cdn.jsdelivr.net', // jsdelivr mirrors GitHub
];

export interface CommunityPluginSource {
  url: string;
  branch?: string;
}

export async function loadCommunityPlugin(
  source: CommunityPluginSource
): Promise<PluginManifest> {
  const url = new URL(source.url);

  // Validate host
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    throw new Error(`Unsupported host: ${url.hostname}. Only GitHub URLs are allowed.`);
  }

  // Parse GitHub URL
  const parsed = parseGitHubUrl(source.url);
  if (!parsed) {
    throw new Error('Invalid GitHub URL format');
  }

  // Fetch manifest
  const manifestUrl = buildRawUrl(parsed, 'manifest.json', source.branch);
  const manifestResponse = await fetch(manifestUrl);
  if (!manifestResponse.ok) {
    throw new Error(`Failed to fetch manifest: ${manifestResponse.status}`);
  }

  const manifest = await manifestResponse.json();

  // Validate manifest schema
  const validated = PluginManifestSchema.safeParse(manifest);
  if (!validated.success) {
    throw new Error(`Invalid manifest: ${validated.error.message}`);
  }

  return {
    ...validated.data,
    source: {
      type: 'community',
      url: source.url,
      branch: source.branch || parsed.branch,
    },
  };
}

interface GitHubParsed {
  owner: string;
  repo: string;
  branch: string;
  path: string;
}

function parseGitHubUrl(url: string): GitHubParsed | null {
  // Handle various GitHub URL formats
  const patterns = [
    // https://github.com/owner/repo
    /github\.com\/([^\/]+)\/([^\/]+)$/,
    // https://github.com/owner/repo/tree/branch/path
    /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)\/?(.*)?$/,
    // https://raw.githubusercontent.com/owner/repo/branch/path
    /raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/?(.*)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        branch: match[3] || 'main',
        path: match[4] || '',
      };
    }
  }

  return null;
}

function buildRawUrl(parsed: GitHubParsed, file: string, branch?: string): string {
  const b = branch || parsed.branch;
  const basePath = parsed.path ? `${parsed.path}/` : '';
  return `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${b}/${basePath}${file}`;
}
```

**User flow for community plugins:**

```typescript
// src/components/PluginManager/AddCommunityPlugin.tsx

function AddCommunityPlugin() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PluginManifest | null>(null);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const manifest = await loadCommunityPlugin({ url });
      setPreview(manifest);
    } catch (error) {
      toast.error(`Failed to load: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!preview) return;

    // Show warning dialogue
    const confirmed = await showConfirmDialog({
      title: 'Install Community Plugin?',
      message: `
        "${preview.name}" is a community plugin.

        ⚠️ This plugin is NOT verified by itemdeck.
        ⚠️ Only install plugins from authors you trust.

        The plugin will have limited permissions and run in a sandbox.
      `,
      confirmLabel: 'I understand, install',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      await installPlugin(preview);
      toast.success(`Installed ${preview.name}`);
    }
  };

  return (
    <div className={styles.addCommunityPlugin}>
      <h3>Add Community Plugin</h3>

      <input
        type="url"
        placeholder="https://github.com/user/itemdeck-plugin"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button onClick={handlePreview} disabled={loading || !url}>
        {loading ? 'Loading...' : 'Preview'}
      </button>

      {preview && (
        <div className={styles.preview}>
          <h4>{preview.name}</h4>
          <p>{preview.description}</p>
          <p>Version: {preview.version}</p>
          <p>Author: {preview.author.name}</p>

          <div className={styles.permissions}>
            <strong>Permissions (limited):</strong>
            <ul>
              {preview.permissions
                .filter(p => COMMUNITY_ALLOWED_PERMISSIONS.includes(p))
                .map(p => <li key={p}>{formatPermission(p)}</li>)}
            </ul>
          </div>

          <button onClick={handleInstall} className={styles.installButton}>
            Install Plugin
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4. Local Plugin Storage

Downloaded plugins are stored in **IndexedDB** for offline use:

```typescript
// src/plugins/storage/PluginStorage.ts

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PluginDB extends DBSchema {
  plugins: {
    key: string;
    value: StoredPlugin;
    indexes: { 'by-type': string };
  };
  assets: {
    key: string;
    value: Blob;
  };
}

interface StoredPlugin {
  id: string;
  manifest: PluginManifest;
  tier: PluginTrustTier;
  installedAt: string;
  updatedAt: string;
  enabled: boolean;
}

export class PluginStorage {
  private db: IDBPDatabase<PluginDB> | null = null;

  async init(): Promise<void> {
    this.db = await openDB<PluginDB>('itemdeck-plugins', 1, {
      upgrade(db) {
        const pluginStore = db.createObjectStore('plugins', { keyPath: 'id' });
        pluginStore.createIndex('by-type', 'manifest.type');

        db.createObjectStore('assets');
      },
    });
  }

  async savePlugin(plugin: StoredPlugin, assets: Map<string, Blob>): Promise<void> {
    if (!this.db) throw new Error('Storage not initialised');

    const tx = this.db.transaction(['plugins', 'assets'], 'readwrite');

    await tx.objectStore('plugins').put(plugin);

    for (const [name, blob] of assets) {
      const key = `${plugin.id}/${name}`;
      await tx.objectStore('assets').put(blob, key);
    }

    await tx.done;
  }

  async getPlugin(id: string): Promise<StoredPlugin | undefined> {
    if (!this.db) throw new Error('Storage not initialised');
    return this.db.get('plugins', id);
  }

  async getPluginsByType(type: PluginType): Promise<StoredPlugin[]> {
    if (!this.db) throw new Error('Storage not initialised');
    return this.db.getAllFromIndex('plugins', 'by-type', type);
  }

  async getAsset(pluginId: string, assetName: string): Promise<Blob | undefined> {
    if (!this.db) throw new Error('Storage not initialised');
    return this.db.get('assets', `${pluginId}/${assetName}`);
  }

  async removePlugin(id: string): Promise<void> {
    if (!this.db) throw new Error('Storage not initialised');

    const tx = this.db.transaction(['plugins', 'assets'], 'readwrite');

    await tx.objectStore('plugins').delete(id);

    // Delete associated assets
    const assetStore = tx.objectStore('assets');
    const keys = await assetStore.getAllKeys();
    for (const key of keys) {
      if (typeof key === 'string' && key.startsWith(`${id}/`)) {
        await assetStore.delete(key);
      }
    }

    await tx.done;
  }
}
```

### 5. Update Mechanism

**Curated plugins:**

```typescript
// src/plugins/updates/UpdateChecker.ts

export class UpdateChecker {
  private storage: PluginStorage;
  private lastCheck: number = 0;
  private checkInterval = 24 * 60 * 60 * 1000; // 24 hours

  async checkForUpdates(): Promise<PluginUpdate[]> {
    // Rate limit checks
    if (Date.now() - this.lastCheck < this.checkInterval) {
      return [];
    }
    this.lastCheck = Date.now();

    const registry = await fetchRegistry();
    const installed = await this.storage.getPluginsByType('mechanic');

    const updates: PluginUpdate[] = [];

    for (const plugin of installed) {
      if (plugin.tier !== 'curated') continue;

      const registryVersion = registry.find(r => r.id === plugin.id);
      if (!registryVersion) continue;

      if (semver.gt(registryVersion.version, plugin.manifest.version)) {
        updates.push({
          plugin,
          currentVersion: plugin.manifest.version,
          newVersion: registryVersion.version,
          changelog: registryVersion.changelog,
        });
      }
    }

    return updates;
  }

  async applyUpdate(update: PluginUpdate): Promise<void> {
    // Download new version
    const registryPlugin = await getRegistryPlugin(update.plugin.id);
    const blob = await downloadPlugin(registryPlugin);

    // Extract and save
    const { manifest, assets } = await extractPluginArchive(blob);

    await this.storage.savePlugin(
      {
        ...update.plugin,
        manifest,
        updatedAt: new Date().toISOString(),
      },
      assets
    );

    // Reload if currently active
    await reloadPlugin(update.plugin.id);
  }
}
```

**Community plugins:**

Community plugins show a manual "Check for updates" button that re-fetches the manifest from GitHub.

## Consequences

### Positive

- **No backend required** - Static hosting for registry
- **Offline support** - Plugins cached in IndexedDB
- **GitHub ecosystem** - Community can use familiar tools
- **Verifiable downloads** - Checksum validation for curated
- **Progressive enhancement** - Start simple, add features later

### Negative

- **Limited discovery** - No search API (client-side filtering)
- **Manual updates** - No push notifications for community
- **GitHub dependency** - Community limited to one platform
- **Storage limits** - IndexedDB quotas vary by browser

### Mitigations

- **Future: Algolia** - Add search index when needed
- **Update polling** - Check periodically for curated updates
- **CDN support** - Add jsdelivr as GitHub alternative
- **Quota warnings** - Show storage usage in settings

## Future Considerations

### Phase 2 Enhancements

- **Search API** - Server-side search with Algolia
- **Plugin ratings** - User reviews and ratings
- **Automatic updates** - Background update checking
- **Private registry** - Enterprise/self-hosted registry
- **GitLab/Bitbucket** - Additional Git hosts for community

---

## Related Documentation

- [ADR-023: Plugin Trust Tiers](./ADR-023-plugin-trust-tiers.md)
- [ADR-024: Plugin Sandbox Implementation](./ADR-024-plugin-sandbox-implementation.md)
- [ADR-026: Plugin Manifest Schema](./ADR-026-plugin-manifest-schema.md)
- [State-of-the-Art: Plugin Architecture](../../research/state-of-the-art-plugin-architecture.md)
- [v1.5.0 Milestone](../../roadmap/milestones/v1.5.0.md)

---

**Applies to**: itemdeck v1.5.0+
