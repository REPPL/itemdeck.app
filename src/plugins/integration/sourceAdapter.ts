/**
 * Source plugin adapter.
 *
 * Integrates source contributions with the collection loading system.
 *
 * @module plugins/integration/sourceAdapter
 */

import type { SourceContribution } from "@/plugins/schemas/contributions/source";
import { usePluginStore } from "@/stores/pluginStore";

// ============================================================================
// Types
// ============================================================================

/**
 * Registered source from a plugin.
 */
export interface RegisteredSource {
  /** Full source ID (pluginId:sourceId) */
  id: string;
  /** Plugin ID that provided this source */
  pluginId: string;
  /** Source contribution ID */
  sourceId: string;
  /** Full source contribution */
  contribution: SourceContribution;
}

/**
 * Source configuration for loading a collection.
 */
export interface SourceConfig {
  /** Source ID to use */
  sourceId: string;
  /** Source-specific configuration */
  config: Record<string, unknown>;
}

/**
 * Source definition for UI display.
 */
export interface SourceDefinition {
  /** Full source ID */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Icon path */
  icon?: string;
  /** Whether this source is enabled */
  enabled: boolean;
}

/**
 * Collection data loaded from a source.
 */
export interface LoadedCollection {
  /** Collection ID */
  id: string;
  /** Collection name */
  name: string;
  /** Collection data */
  data: unknown;
  /** Source that loaded it */
  sourceId: string;
}

// ============================================================================
// Source Adapter Class
// ============================================================================

/**
 * Source plugin adapter.
 *
 * Manages source contributions and provides collection loading functionality.
 */
class SourcePluginAdapter {
  /** Track registered sources by plugin */
  private registeredSources = new Map<string, RegisteredSource[]>();

  /** Source loaders (callable functions) */
  private loaders = new Map<string, (config: unknown) => Promise<unknown>>();

  /**
   * Register a source from a plugin contribution.
   *
   * @param pluginId - Plugin ID providing the source
   * @param contribution - Source contribution to register
   */
  async registerFromPlugin(
    pluginId: string,
    contribution: SourceContribution
  ): Promise<void> {
    const fullId = `${pluginId}:${contribution.id}`;

    // Check if already registered
    if (this.loaders.has(fullId)) {
      console.warn(`Source ${fullId} already registered, skipping`);
      return;
    }

    // Create loader function
    const loader = await this.createLoader(contribution);
    this.loaders.set(fullId, loader);

    // Track registration
    const registered: RegisteredSource = {
      id: fullId,
      pluginId,
      sourceId: contribution.id,
      contribution,
    };

    const existing = this.registeredSources.get(pluginId) ?? [];
    existing.push(registered);
    this.registeredSources.set(pluginId, existing);

    // Update plugin store
    const store = usePluginStore.getState();
    store.addActiveSource(fullId);
  }

  /**
   * Unregister all sources from a plugin.
   *
   * @param pluginId - Plugin ID to unregister
   */
  unregisterFromPlugin(pluginId: string): void {
    const registered = this.registeredSources.get(pluginId);
    if (!registered) return;

    // Remove loaders
    for (const source of registered) {
      this.loaders.delete(source.id);
    }

    // Clear tracking
    this.registeredSources.delete(pluginId);

    // Update plugin store
    const store = usePluginStore.getState();
    for (const source of registered) {
      store.removeActiveSource(source.id);
    }
  }

  /**
   * Get all available sources.
   *
   * @returns Array of source definitions
   */
  getAvailableSources(): SourceDefinition[] {
    const sources: SourceDefinition[] = [];

    for (const registered of this.registeredSources.values()) {
      for (const source of registered) {
        sources.push({
          id: source.id,
          name: source.contribution.name,
          description: source.contribution.description,
          icon: source.contribution.icon,
          enabled: this.loaders.has(source.id),
        });
      }
    }

    return sources;
  }

  /**
   * Get sources for a specific plugin.
   *
   * @param pluginId - Plugin ID
   * @returns Array of registered sources
   */
  getSourcesForPlugin(pluginId: string): RegisteredSource[] {
    return this.registeredSources.get(pluginId) ?? [];
  }

  /**
   * Load a collection using a registered source.
   *
   * @param sourceId - Full source ID (pluginId:sourceId)
   * @param config - Source-specific configuration
   * @returns Loaded collection data
   */
  async loadCollection(
    sourceId: string,
    config: unknown
  ): Promise<LoadedCollection> {
    const loader = this.loaders.get(sourceId);
    if (!loader) {
      throw new Error(`Source "${sourceId}" not found`);
    }

    const data = await loader(config);

    return {
      id: `${sourceId}:${String(Date.now())}`,
      name: "Collection",
      data,
      sourceId,
    };
  }

  /**
   * Check if a source is registered.
   *
   * @param sourceId - Full source ID
   * @returns True if registered
   */
  isRegistered(sourceId: string): boolean {
    return this.loaders.has(sourceId);
  }

  /**
   * Create a loader function for a source contribution.
   */
  private async createLoader(
    contribution: SourceContribution
  ): Promise<(config: unknown) => Promise<unknown>> {
    // For sources with custom entrypoints, load the module
    if (contribution.entrypoint) {
      try {
        const module = await import(/* @vite-ignore */ contribution.entrypoint) as Record<string, unknown>;
        const loader = (module.default ?? module.loadCollection ?? module.load) as ((config: unknown) => Promise<unknown>) | undefined;

        if (typeof loader === "function") {
          return loader;
        }
      } catch (error) {
        console.error(`Failed to load source ${contribution.id}:`, error);
      }
    }

    // Default loader based on source type
    return this.createDefaultLoader(contribution);
  }

  /**
   * Create a default loader based on source type.
   */
  private createDefaultLoader(
    contribution: SourceContribution
  ): (config: unknown) => Promise<unknown> {
    const sourceType = contribution.type;

    switch (sourceType) {
      case "github":
        return async (config: unknown) => {
          const { owner, repo, path } = config as {
            owner: string;
            repo?: string;
            path?: string;
          };
          const url = `https://cdn.jsdelivr.net/gh/${owner}/${repo ?? "collections"}@main/${path ?? ""}`;
          const response = await fetch(url);
          return response.json() as Promise<unknown>;
        };

      case "url":
        return async (config: unknown) => {
          const { url } = config as { url: string };
          const response = await fetch(url);
          return response.json() as Promise<unknown>;
        };

      case "api":
        return async (config: unknown) => {
          const { endpoint, headers } = config as {
            endpoint: string;
            headers?: Record<string, string>;
          };
          const response = await fetch(endpoint, { headers });
          return response.json() as Promise<unknown>;
        };

      case "local":
        return () => {
          // Local sources require file system access - not supported in browser
          throw new Error("Local sources not supported in browser");
        };

      case "custom":
        return () => {
          throw new Error("Custom sources require an entrypoint");
        };

      default:
        return () => {
          throw new Error(`Unknown source type: ${sourceType as string}`);
        };
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global source adapter instance.
 */
export const sourceAdapter = new SourcePluginAdapter();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Register a source from a plugin.
 *
 * @param pluginId - Plugin ID
 * @param contribution - Source contribution
 */
export async function registerSourceFromPlugin(
  pluginId: string,
  contribution: SourceContribution
): Promise<void> {
  return sourceAdapter.registerFromPlugin(pluginId, contribution);
}

/**
 * Unregister all sources from a plugin.
 *
 * @param pluginId - Plugin ID
 */
export function unregisterSourcesFromPlugin(pluginId: string): void {
  sourceAdapter.unregisterFromPlugin(pluginId);
}

/**
 * Get all available sources.
 *
 * @returns Array of source definitions
 */
export function getAvailableSources(): SourceDefinition[] {
  return sourceAdapter.getAvailableSources();
}

/**
 * Load a collection from a source.
 *
 * @param sourceId - Source ID
 * @param config - Source configuration
 * @returns Loaded collection
 */
export async function loadCollectionFromSource(
  sourceId: string,
  config: unknown
): Promise<LoadedCollection> {
  return sourceAdapter.loadCollection(sourceId, config);
}

/**
 * Register built-in sources.
 *
 * This is called during app initialisation to register the built-in
 * sources (GitHub) through the plugin system.
 */
export async function registerBuiltinSources(): Promise<void> {
  // GitHub source
  await sourceAdapter.registerFromPlugin("org.itemdeck.source-github", {
    id: "github",
    name: "GitHub",
    description: "Load collections from GitHub repositories",
    type: "github",
    icon: "github",
    supportsDiscovery: true,
    experimental: false,
    entrypoint: "@/loaders/githubDiscovery",
  });
}
