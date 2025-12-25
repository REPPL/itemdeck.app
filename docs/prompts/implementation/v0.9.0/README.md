# v0.9.0 Implementation Prompt - Remote Source Intelligence

**Version:** v0.9.0
**Codename:** Multi-Collection Support
**Branch:** `feature/v0.9.0-remote-sources`

---

## Overview

Add intelligent remote source management with health checking, collection discovery UI, and user-managed source list. This enables users to browse and switch between multiple collections from different remote sources.

---

## Context

- v0.8.0 completed configuration externalisation and offline caching
- Currently only one collection can be loaded at a time
- No validation of remote source availability
- Users can't discover or browse available collections
- Remote source URLs are hardcoded

---

## Scope

### In Scope (v0.9.0)

1. **F-045: Remote Source Health Check** - Validate remote sources are accessible
2. **F-046: Collection Discovery UI** - Browse available collections
3. **F-047: Remote Source Management** - Add/remove/persist source URLs

### Optional Additions (User to approve)

- Recipe collection demo (non-game collection to prove generalisation)
- Index file automation (auto-generate from directory contents)
- F-041: Card Animations Polish

---

## Phase 1: Remote Source Health Check (F-045)

**Purpose:** Validate that remote collection sources are accessible and contain valid data.

**3-Phase Check:**
1. **Accessibility** - Can we reach the URL?
2. **Schema Discovery** - Is there a valid collection.json?
3. **Status Report** - What's available and healthy?

**Files to Create:**
- `src/services/sourceHealthCheck.ts` - Health check logic
- `src/hooks/useSourceHealth.ts` - React hook for health status

**Implementation:**
```typescript
// src/services/sourceHealthCheck.ts
export interface HealthCheckResult {
  url: string;
  status: "healthy" | "degraded" | "unreachable" | "invalid";
  latency: number; // ms
  collectionName?: string;
  itemCount?: number;
  lastChecked: Date;
  error?: string;
}

export async function checkSourceHealth(url: string): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    // Phase 1: Accessibility
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) {
      return {
        url,
        status: "unreachable",
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: `HTTP ${response.status}`,
      };
    }

    // Phase 2: Schema Discovery
    const collectionUrl = url.endsWith("/")
      ? `${url}collection.json`
      : `${url}/collection.json`;

    const collectionResponse = await fetch(collectionUrl);
    if (!collectionResponse.ok) {
      return {
        url,
        status: "degraded",
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: "No collection.json found",
      };
    }

    // Phase 3: Validate collection data
    const collection = await collectionResponse.json();
    const validated = CollectionSchema.safeParse(collection);

    if (!validated.success) {
      return {
        url,
        status: "invalid",
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: "Invalid collection schema",
      };
    }

    return {
      url,
      status: "healthy",
      latency: Date.now() - startTime,
      collectionName: validated.data.metadata?.title,
      itemCount: validated.data.items?.length,
      lastChecked: new Date(),
    };
  } catch (error) {
    return {
      url,
      status: "unreachable",
      latency: Date.now() - startTime,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

**Hook Implementation:**
```typescript
// src/hooks/useSourceHealth.ts
import { useQuery } from "@tanstack/react-query";
import { checkSourceHealth, HealthCheckResult } from "../services/sourceHealthCheck";

export function useSourceHealth(url: string, enabled = true) {
  return useQuery<HealthCheckResult>({
    queryKey: ["source-health", url],
    queryFn: () => checkSourceHealth(url),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}

export function useMultiSourceHealth(urls: string[]) {
  return useQueries({
    queries: urls.map((url) => ({
      queryKey: ["source-health", url],
      queryFn: () => checkSourceHealth(url),
      staleTime: 5 * 60 * 1000,
    })),
  });
}
```

---

## Phase 2: Collection Discovery UI (F-046)

**Purpose:** Allow users to browse available collections from remote sources.

**Features:**
- Browse collections from configured sources
- Preview collection metadata before loading
- Quick collection switcher in header/settings
- Visual indicators for collection health status

**Files to Create:**
- `src/components/CollectionBrowser/CollectionBrowser.tsx`
- `src/components/CollectionBrowser/CollectionBrowser.module.css`
- `src/components/CollectionBrowser/CollectionCard.tsx`
- `src/components/CollectionBrowser/index.ts`
- `src/hooks/useCollectionManifest.ts`

**Implementation:**
```typescript
// src/hooks/useCollectionManifest.ts
export interface CollectionManifest {
  collections: CollectionInfo[];
  lastUpdated: Date;
}

export interface CollectionInfo {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
  thumbnail?: string;
  url: string;
}

export function useCollectionManifest(sourceUrl: string) {
  return useQuery<CollectionManifest>({
    queryKey: ["collection-manifest", sourceUrl],
    queryFn: async () => {
      const manifestUrl = `${sourceUrl}/manifest.json`;
      const response = await fetch(manifestUrl);

      if (!response.ok) {
        // Fallback: Try to read collection.json directly
        const collectionUrl = `${sourceUrl}/collection.json`;
        const collectionResponse = await fetch(collectionUrl);
        const collection = await collectionResponse.json();

        return {
          collections: [{
            id: "default",
            title: collection.metadata?.title ?? "Untitled Collection",
            description: collection.metadata?.description,
            itemCount: collection.items?.length ?? 0,
            url: collectionUrl,
          }],
          lastUpdated: new Date(),
        };
      }

      return response.json();
    },
  });
}
```

**Component Implementation:**
```tsx
// src/components/CollectionBrowser/CollectionBrowser.tsx
interface CollectionBrowserProps {
  sources: string[];
  onSelectCollection: (url: string) => void;
  currentCollectionUrl?: string;
}

export function CollectionBrowser({
  sources,
  onSelectCollection,
  currentCollectionUrl,
}: CollectionBrowserProps) {
  const healthChecks = useMultiSourceHealth(sources);

  return (
    <div className={styles.browser}>
      <h2 className={styles.title}>Available Collections</h2>

      <div className={styles.grid}>
        {sources.map((source, index) => {
          const health = healthChecks[index].data;

          return (
            <CollectionCard
              key={source}
              sourceUrl={source}
              health={health}
              isActive={currentCollectionUrl === source}
              onSelect={() => onSelectCollection(source)}
            />
          );
        })}
      </div>
    </div>
  );
}
```

---

## Phase 3: Remote Source Management (F-047)

**Purpose:** Allow users to add, remove, and manage collection source URLs.

**Features:**
- Add new source URLs
- Remove existing sources
- Persist sources in localStorage
- Zustand store for source state
- Validation of URLs before adding

**Files to Create:**
- `src/stores/sourceStore.ts` - Zustand store for sources
- `src/components/SettingsPanel/SourceSettings.tsx` - Settings UI

**Files to Modify:**
- `src/components/SettingsPanel/SettingsPanel.tsx` - Add Sources tab

**Implementation:**
```typescript
// src/stores/sourceStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Source {
  url: string;
  name?: string;
  addedAt: Date;
  lastHealthCheck?: Date;
}

interface SourceState {
  sources: Source[];
  activeSourceUrl: string | null;

  // Actions
  addSource: (url: string, name?: string) => void;
  removeSource: (url: string) => void;
  setActiveSource: (url: string) => void;
  updateSourceHealth: (url: string, lastCheck: Date) => void;
}

export const useSourceStore = create<SourceState>()(
  persist(
    (set) => ({
      sources: [
        {
          url: "/data/",
          name: "Local Collection",
          addedAt: new Date(),
        },
      ],
      activeSourceUrl: "/data/",

      addSource: (url, name) =>
        set((state) => ({
          sources: [
            ...state.sources,
            { url, name, addedAt: new Date() },
          ],
        })),

      removeSource: (url) =>
        set((state) => ({
          sources: state.sources.filter((s) => s.url !== url),
          activeSourceUrl:
            state.activeSourceUrl === url
              ? state.sources[0]?.url ?? null
              : state.activeSourceUrl,
        })),

      setActiveSource: (url) =>
        set({ activeSourceUrl: url }),

      updateSourceHealth: (url, lastCheck) =>
        set((state) => ({
          sources: state.sources.map((s) =>
            s.url === url ? { ...s, lastHealthCheck: lastCheck } : s
          ),
        })),
    }),
    {
      name: "itemdeck-sources",
    }
  )
);
```

**Settings UI:**
```tsx
// src/components/SettingsPanel/SourceSettings.tsx
export function SourceSettings() {
  const { sources, addSource, removeSource, activeSourceUrl, setActiveSource } =
    useSourceStore();
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAddSource = async () => {
    setError(null);

    // Validate URL format
    try {
      new URL(newUrl);
    } catch {
      setError("Invalid URL format");
      return;
    }

    // Check source health before adding
    const health = await checkSourceHealth(newUrl);
    if (health.status === "unreachable") {
      setError("Source is unreachable");
      return;
    }

    addSource(newUrl, health.collectionName);
    setNewUrl("");
  };

  return (
    <div className={styles.sourceSettings}>
      <h3>Collection Sources</h3>

      <div className={styles.sourceList}>
        {sources.map((source) => (
          <SourceItem
            key={source.url}
            source={source}
            isActive={source.url === activeSourceUrl}
            onSelect={() => setActiveSource(source.url)}
            onRemove={() => removeSource(source.url)}
          />
        ))}
      </div>

      <div className={styles.addSource}>
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="https://example.com/collection/"
        />
        <button onClick={handleAddSource}>Add Source</button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
```

---

## Phase 4: Integration

**Files to Modify:**
- `src/App.tsx` - Use activeSourceUrl from store
- `src/hooks/useCollection.ts` - Accept dynamic source URL
- `src/components/SettingsPanel/SettingsPanel.tsx` - Add Sources tab

**App Integration:**
```tsx
// src/App.tsx
function App() {
  const { activeSourceUrl } = useSourceStore();
  const { data: collection, isLoading } = useCollection(activeSourceUrl);

  // ... rest of app
}
```

---

## Success Criteria

- [ ] Source health check returns accurate status
- [ ] Health check identifies unreachable, degraded, and healthy sources
- [ ] Collection browser displays available collections
- [ ] Collection cards show health status indicators
- [ ] Users can add new source URLs
- [ ] URL validation prevents invalid sources
- [ ] Users can remove sources
- [ ] Active source persists across sessions
- [ ] Collection switcher works smoothly
- [ ] Loading states handled during source switch

---

## Post-Implementation

1. Create devlog: `docs/development/process/devlogs/v0.9.0/README.md`
2. Create retrospective: `docs/development/process/retrospectives/v0.9.0/README.md`
3. Update time logs with actual hours
4. Run verification: `/verify-docs`, `/sync-docs`, `/pii-scan`
5. Create git tag: `v0.9.0`

---

## Related Documentation

- [v0.8.0 Implementation Prompt](../v0.8.0/README.md)
- [F-045 Remote Source Health Check](../../development/roadmap/features/planned/F-045.md)
- [F-046 Collection Discovery UI](../../development/roadmap/features/planned/F-046.md)
- [F-047 Remote Source Management](../../development/roadmap/features/planned/F-047.md)

---

**Status**: Ready for Implementation
