/**
 * Plugin loader module.
 *
 * Handles loading, initialising, enabling, and disabling plugins.
 * Coordinates with the plugin store, cache, and sandbox systems.
 *
 * @module plugins/loader/pluginLoader
 */

import type {
  PluginManifest,
  PluginTier,
} from "@/plugins/schemas";
import { usePluginStore } from "@/stores/pluginStore";
import {
  cacheManifest,
  getCachedManifest,
  clearPluginCache,
} from "@/plugins/cache/pluginCache";

// ============================================================================
// Types
// ============================================================================

/**
 * Plugin source - where to load the plugin from.
 */
export type PluginSource =
  | { type: "builtin"; id: string }
  | { type: "url"; url: string }
  | { type: "cached"; id: string };

/**
 * Options for loading a plugin.
 */
export interface LoadOptions {
  /** Distribution tier (required for URL sources) */
  tier?: PluginTier;
  /** Skip cache and force reload */
  forceReload?: boolean;
  /** Don't enable the plugin after loading */
  skipEnable?: boolean;
}

/**
 * Loaded plugin instance.
 */
export interface LoadedPlugin {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Distribution tier */
  tier: PluginTier;
  /** Source URL (if loaded from URL) */
  sourceUrl?: string;
  /** Plugin module (if loaded) */
  module?: PluginModule;
  /** Load state */
  state: "pending" | "loading" | "active" | "disabled" | "error";
  /** Error message if state is "error" */
  error?: string;
  /** When the plugin was loaded */
  loadedAt: Date;
}

/**
 * Plugin module interface - what a plugin exports.
 */
export interface PluginModule {
  /** Plugin activation function */
  activate?: (context: PluginContext) => Promise<void> | void;
  /** Plugin deactivation function */
  deactivate?: () => Promise<void> | void;
  /** Plugin contributions (runtime-provided) */
  contributions?: unknown;
}

/**
 * Context passed to plugin activation.
 */
export interface PluginContext {
  /** Plugin ID */
  pluginId: string;
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Storage API (capability-gated) */
  storage: PluginStorage;
  /** UI API (capability-gated) */
  ui: PluginUI;
  /** Collection API (capability-gated) */
  collection: PluginCollection;
}

/**
 * Plugin storage API.
 */
export interface PluginStorage {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Plugin UI API.
 */
export interface PluginUI {
  notify: (message: string, type?: "info" | "success" | "warning" | "error") => void;
  showModal: (content: unknown) => Promise<unknown>;
}

/**
 * Plugin collection API.
 */
export interface PluginCollection {
  getCards: () => Promise<unknown[]>;
  getSelectedCards: () => Promise<unknown[]>;
  getCollectionInfo: () => Promise<unknown>;
}

// ============================================================================
// Built-in Plugin Registry
// ============================================================================

/**
 * Registry of built-in plugins.
 * Maps plugin ID to manifest loader function.
 */
const builtinPlugins = new Map<string, () => Promise<PluginManifest>>();

/**
 * Register a built-in plugin.
 *
 * @param id - Plugin ID
 * @param manifestLoader - Function to load the manifest
 */
export function registerBuiltinPlugin(
  id: string,
  manifestLoader: () => Promise<PluginManifest>
): void {
  builtinPlugins.set(id, manifestLoader);
}

/**
 * Get all registered built-in plugin IDs.
 */
export function getBuiltinPluginIds(): string[] {
  return Array.from(builtinPlugins.keys());
}

// ============================================================================
// Plugin Loader Class
// ============================================================================

/**
 * Plugin loader singleton.
 *
 * Manages the lifecycle of all plugins in the application.
 */
class PluginLoader {
  /** Map of loaded plugins by ID */
  private loadedPlugins = new Map<string, LoadedPlugin>();

  /** In-flight load promises (for deduplication) */
  private loadingPromises = new Map<string, Promise<LoadedPlugin>>();

  /** Whether built-ins have been initialised */
  private builtinsInitialised = false;

  // ==========================================================================
  // Initialisation
  // ==========================================================================

  /**
   * Initialise all built-in plugins.
   *
   * Should be called once at app startup.
   */
  async initializeBuiltins(): Promise<void> {
    if (this.builtinsInitialised) {
      return;
    }

    const ids = getBuiltinPluginIds();

    for (const id of ids) {
      try {
        await this.loadPlugin({ type: "builtin", id });
      } catch (error) {
        console.error(`[PluginLoader] Failed to load built-in plugin: ${id}`, error);
      }
    }

    this.builtinsInitialised = true;
  }

  /**
   * Restore plugins from persisted state.
   *
   * Loads all enabled plugins from the plugin store.
   */
  async restoreFromStore(): Promise<void> {
    const store = usePluginStore.getState();
    const enabledPlugins = store.getEnabledPlugins();

    for (const pluginInfo of enabledPlugins) {
      // Skip built-ins (they're loaded separately)
      if (pluginInfo.tier === "builtin") {
        continue;
      }

      try {
        await this.loadPlugin(
          pluginInfo.sourceUrl
            ? { type: "url", url: pluginInfo.sourceUrl }
            : { type: "cached", id: pluginInfo.manifest.id },
          { tier: pluginInfo.tier }
        );
      } catch (error) {
        console.error(
          `[PluginLoader] Failed to restore plugin: ${pluginInfo.manifest.id}`,
          error
        );
        store.setPluginLoadState(
          pluginInfo.manifest.id,
          "error",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }
  }

  // ==========================================================================
  // Loading
  // ==========================================================================

  /**
   * Load a plugin from the given source.
   *
   * @param source - Where to load the plugin from
   * @param options - Load options
   * @returns Loaded plugin
   */
  async loadPlugin(
    source: PluginSource,
    options: LoadOptions = {}
  ): Promise<LoadedPlugin> {
    // Determine plugin ID for deduplication
    const sourceKey = this.getSourceKey(source);

    // Check for in-flight load
    const existing = this.loadingPromises.get(sourceKey);
    if (existing && !options.forceReload) {
      return existing;
    }

    // Create load promise
    const loadPromise = this.doLoadPlugin(source, options);
    this.loadingPromises.set(sourceKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(sourceKey);
    }
  }

  /**
   * Internal load implementation.
   */
  private async doLoadPlugin(
    source: PluginSource,
    options: LoadOptions
  ): Promise<LoadedPlugin> {
    const store = usePluginStore.getState();
    let manifest: PluginManifest;
    let tier: PluginTier;
    let sourceUrl: string | undefined;

    // Load manifest based on source type
    switch (source.type) {
      case "builtin": {
        const loader = builtinPlugins.get(source.id);
        if (!loader) {
          throw new Error(`Built-in plugin not found: ${source.id}`);
        }
        manifest = await loader();
        tier = "builtin";
        break;
      }

      case "url": {
        manifest = await this.fetchManifest(source.url);
        tier = options.tier ?? "community";
        sourceUrl = source.url;
        break;
      }

      case "cached": {
        const cached = await getCachedManifest(source.id);
        if (!cached) {
          throw new Error(`Plugin not in cache: ${source.id}`);
        }
        manifest = cached.manifest;
        tier = cached.tier;
        sourceUrl = cached.sourceUrl;
        break;
      }
    }

    // Update store
    if (!store.isInstalled(manifest.id)) {
      store.installPlugin(manifest, tier, sourceUrl);
    }

    // Cache manifest (for non-builtin)
    if (tier !== "builtin") {
      await cacheManifest(manifest, tier, sourceUrl);
    }

    // Create loaded plugin entry
    const loadedPlugin: LoadedPlugin = {
      manifest,
      tier,
      sourceUrl,
      state: options.skipEnable ? "disabled" : "pending",
      loadedAt: new Date(),
    };

    this.loadedPlugins.set(manifest.id, loadedPlugin);

    // Enable if not skipped
    if (!options.skipEnable) {
      await this.enablePlugin(manifest.id);
    }

    return loadedPlugin;
  }

  /**
   * Fetch a manifest from a URL.
   */
  private async fetchManifest(url: string): Promise<PluginManifest> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${String(response.status)} ${response.statusText}`);
    }

    const data: unknown = await response.json();

    // TODO: Validate with Zod schema
    return data as PluginManifest;
  }

  /**
   * Get a unique key for a plugin source.
   */
  private getSourceKey(source: PluginSource): string {
    switch (source.type) {
      case "builtin":
        return `builtin:${source.id}`;
      case "url":
        return `url:${source.url}`;
      case "cached":
        return `cached:${source.id}`;
    }
  }

  // ==========================================================================
  // Enable/Disable
  // ==========================================================================

  /**
   * Enable a loaded plugin.
   *
   * @param pluginId - Plugin ID to enable
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const loaded = this.loadedPlugins.get(pluginId);
    if (!loaded) {
      throw new Error(`Plugin not loaded: ${pluginId}`);
    }

    const store = usePluginStore.getState();

    // Update state to loading
    loaded.state = "loading";
    store.setPluginLoadState(pluginId, "loading");

    try {
      // Load plugin module if entry point specified
      if (loaded.manifest.entry?.main) {
        // For now, we don't actually load the module
        // This will be implemented when we add sandbox support
        loaded.module = undefined;
      }

      // Activate plugin
      if (loaded.module?.activate) {
        const context = this.createPluginContext(loaded);
        await loaded.module.activate(context);
      }

      // Update state
      loaded.state = "active";
      store.setPluginLoadState(pluginId, "active");
      store.enablePlugin(pluginId);

      // Register with type-specific systems
      this.registerPluginContributions(loaded);
    } catch (error) {
      loaded.state = "error";
      loaded.error = error instanceof Error ? error.message : "Unknown error";
      store.setPluginLoadState(pluginId, "error", loaded.error);
      throw error;
    }
  }

  /**
   * Disable a plugin.
   *
   * @param pluginId - Plugin ID to disable
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const loaded = this.loadedPlugins.get(pluginId);
    if (!loaded) {
      return;
    }

    const store = usePluginStore.getState();

    try {
      // Deactivate plugin
      if (loaded.module?.deactivate) {
        await loaded.module.deactivate();
      }

      // Unregister contributions
      this.unregisterPluginContributions(loaded);

      // Update state
      loaded.state = "disabled";
      store.setPluginLoadState(pluginId, "disabled");
      store.disablePlugin(pluginId);
    } catch (error) {
      console.error(`[PluginLoader] Error disabling plugin: ${pluginId}`, error);
    }
  }

  /**
   * Uninstall a plugin completely.
   *
   * @param pluginId - Plugin ID to uninstall
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    // Disable first
    await this.disablePlugin(pluginId);

    // Clear from cache
    await clearPluginCache(pluginId);

    // Remove from store
    const store = usePluginStore.getState();
    store.uninstallPlugin(pluginId);

    // Remove from loaded plugins
    this.loadedPlugins.delete(pluginId);
  }

  // ==========================================================================
  // Plugin Context
  // ==========================================================================

  /**
   * Create the context object passed to plugin activation.
   */
  private createPluginContext(loaded: LoadedPlugin): PluginContext {
    const pluginId = loaded.manifest.id;
    const store = usePluginStore.getState();

    // Create capability-gated APIs
    const storage: PluginStorage = {
      get: (key) => {
        if (!store.hasCapability(pluginId, "storage:local")) {
          return Promise.reject(new Error("storage:local capability not granted"));
        }
        const config = store.pluginConfigs[pluginId] ?? {};
        return Promise.resolve(config[key]);
      },
      set: (key, value) => {
        if (!store.hasCapability(pluginId, "storage:local")) {
          return Promise.reject(new Error("storage:local capability not granted"));
        }
        store.updatePluginConfig(pluginId, { [key]: value });
        return Promise.resolve();
      },
      delete: (key) => {
        if (!store.hasCapability(pluginId, "storage:local")) {
          return Promise.reject(new Error("storage:local capability not granted"));
        }
        const config = { ...store.pluginConfigs[pluginId] };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete config[key];
        store.setPluginConfig(pluginId, config);
        return Promise.resolve();
      },
      clear: () => {
        if (!store.hasCapability(pluginId, "storage:local")) {
          return Promise.reject(new Error("storage:local capability not granted"));
        }
        store.resetPluginConfig(pluginId);
        return Promise.resolve();
      },
    };

    const ui: PluginUI = {
      notify: (message, type = "info") => {
        if (!store.hasCapability(pluginId, "ui:notifications")) {
          throw new Error("ui:notifications capability not granted");
        }
        // TODO: Integrate with notification system
        console.log(`[Plugin ${pluginId}] ${type}: ${message}`);
      },
      showModal: () => {
        if (!store.hasCapability(pluginId, "ui:modal")) {
          return Promise.reject(new Error("ui:modal capability not granted"));
        }
        // TODO: Integrate with modal system
        return Promise.reject(new Error("Modal system not yet implemented"));
      },
    };

    const collection: PluginCollection = {
      getCards: () => {
        if (!store.hasCapability(pluginId, "collection:read")) {
          return Promise.reject(new Error("collection:read capability not granted"));
        }
        // TODO: Integrate with collection store
        return Promise.resolve([]);
      },
      getSelectedCards: () => {
        if (!store.hasCapability(pluginId, "collection:read")) {
          return Promise.reject(new Error("collection:read capability not granted"));
        }
        // TODO: Integrate with selection state
        return Promise.resolve([]);
      },
      getCollectionInfo: () => {
        if (!store.hasCapability(pluginId, "collection:read")) {
          return Promise.reject(new Error("collection:read capability not granted"));
        }
        // TODO: Integrate with collection metadata
        return Promise.resolve({});
      },
    };

    return {
      pluginId,
      manifest: loaded.manifest,
      storage,
      ui,
      collection,
    };
  }

  // ==========================================================================
  // Contribution Registration
  // ==========================================================================

  /**
   * Register a plugin's contributions with the appropriate systems.
   */
  private registerPluginContributions(loaded: LoadedPlugin): void {
    const { manifest } = loaded;
    const store = usePluginStore.getState();

    // Register based on plugin type
    switch (manifest.itemdeck.type) {
      case "theme":
        // Theme plugins automatically set as active theme option
        break;

      case "mechanic":
        store.addActiveMechanic(manifest.id);
        break;

      case "source":
        store.addActiveSource(manifest.id);
        break;

      case "settings":
        // Settings plugins contribute to settings panel
        break;

      case "bundle":
        // Bundle plugins may contain multiple contribution types
        break;
    }
  }

  /**
   * Unregister a plugin's contributions.
   */
  private unregisterPluginContributions(loaded: LoadedPlugin): void {
    const { manifest } = loaded;
    const store = usePluginStore.getState();

    switch (manifest.itemdeck.type) {
      case "theme":
        // If this was the active theme, clear it
        if (store.activeTheme === manifest.id) {
          store.setActiveTheme(null);
        }
        break;

      case "mechanic":
        store.removeActiveMechanic(manifest.id);
        break;

      case "source":
        store.removeActiveSource(manifest.id);
        break;
    }
  }

  // ==========================================================================
  // Query Methods
  // ==========================================================================

  /**
   * Get a loaded plugin by ID.
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.loadedPlugins.get(pluginId);
  }

  /**
   * Get all loaded plugins.
   */
  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.loadedPlugins.values());
  }

  /**
   * Get loaded plugins by type.
   */
  getPluginsByType(type: PluginManifest["itemdeck"]["type"]): LoadedPlugin[] {
    return this.getAllPlugins().filter(
      (p) => p.manifest.itemdeck.type === type
    );
  }

  /**
   * Get active plugins only.
   */
  getActivePlugins(): LoadedPlugin[] {
    return this.getAllPlugins().filter((p) => p.state === "active");
  }

  /**
   * Check if a plugin is loaded.
   */
  isLoaded(pluginId: string): boolean {
    return this.loadedPlugins.has(pluginId);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Plugin loader singleton instance */
export const pluginLoader = new PluginLoader();
