/**
 * Lazy plugin loader module.
 *
 * Provides on-demand loading with deduplication for plugins.
 * Useful for loading plugins only when needed (e.g., when a mechanic is selected).
 *
 * @module plugins/loader/lazyLoader
 */

import { pluginLoader, type LoadedPlugin, type PluginSource, type LoadOptions } from "./pluginLoader";

// ============================================================================
// Types
// ============================================================================

/**
 * Preload strategy for plugins.
 */
export type PreloadStrategy =
  | "immediate"  // Load as soon as preload is called
  | "idle"       // Load during browser idle time
  | "visible";   // Load when element becomes visible

/**
 * Preload options.
 */
export interface PreloadOptions extends LoadOptions {
  /** Preload strategy */
  strategy?: PreloadStrategy;
  /** Priority (lower = higher priority) */
  priority?: number;
}

/**
 * Lazy load request.
 */
interface LazyLoadRequest {
  source: PluginSource;
  options: LoadOptions;
  promise: Promise<LoadedPlugin>;
  priority: number;
}

// ============================================================================
// Lazy Loader Class
// ============================================================================

/**
 * Lazy plugin loader.
 *
 * Handles on-demand loading with deduplication, preloading,
 * and priority-based loading.
 */
class LazyPluginLoader {
  /** Queue of pending preload requests */
  private preloadQueue: LazyLoadRequest[] = [];

  /** Whether idle callback is scheduled */
  private idleCallbackScheduled = false;

  /** Map of plugin IDs to load promises for deduplication */
  private loadPromises = new Map<string, Promise<LoadedPlugin>>();

  // ==========================================================================
  // Lazy Loading
  // ==========================================================================

  /**
   * Lazily load a plugin.
   *
   * Returns cached result if already loaded, or initiates load if not.
   * Deduplicates concurrent requests for the same plugin.
   *
   * @param source - Plugin source
   * @param options - Load options
   * @returns Promise resolving to loaded plugin
   */
  async load(source: PluginSource, options: LoadOptions = {}): Promise<LoadedPlugin> {
    const key = this.getSourceKey(source);

    // Check if already loading
    const existing = this.loadPromises.get(key);
    if (existing) {
      return existing;
    }

    // Check if already loaded
    const pluginId = this.getPluginIdFromSource(source);
    if (pluginId) {
      const loaded = pluginLoader.getPlugin(pluginId);
      if (loaded && !options.forceReload) {
        return loaded;
      }
    }

    // Start loading
    const loadPromise = pluginLoader.loadPlugin(source, options);
    this.loadPromises.set(key, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadPromises.delete(key);
    }
  }

  /**
   * Load multiple plugins in parallel.
   *
   * @param sources - Array of plugin sources
   * @param options - Common load options
   * @returns Promise resolving to array of loaded plugins
   */
  async loadMany(
    sources: PluginSource[],
    options: LoadOptions = {}
  ): Promise<LoadedPlugin[]> {
    return Promise.all(sources.map((source) => this.load(source, options)));
  }

  /**
   * Load a plugin by ID (from cache or store).
   *
   * @param pluginId - Plugin ID
   * @param options - Load options
   * @returns Promise resolving to loaded plugin
   */
  async loadById(pluginId: string, options: LoadOptions = {}): Promise<LoadedPlugin> {
    // Check if already loaded
    const loaded = pluginLoader.getPlugin(pluginId);
    if (loaded && !options.forceReload) {
      return loaded;
    }

    // Try to load from cache
    return this.load({ type: "cached", id: pluginId }, options);
  }

  // ==========================================================================
  // Preloading
  // ==========================================================================

  /**
   * Preload a plugin for later use.
   *
   * @param source - Plugin source
   * @param options - Preload options
   */
  preload(source: PluginSource, options: PreloadOptions = {}): void {
    const strategy = options.strategy ?? "idle";
    const priority = options.priority ?? 10;

    switch (strategy) {
      case "immediate":
        // Load immediately
        this.load(source, { ...options, skipEnable: true });
        break;

      case "idle":
        // Queue for idle loading
        this.queuePreload(source, options, priority);
        break;

      case "visible":
        // Would need intersection observer - treat as idle for now
        this.queuePreload(source, options, priority);
        break;
    }
  }

  /**
   * Preload multiple plugins.
   *
   * @param sources - Array of plugin sources
   * @param options - Common preload options
   */
  preloadMany(sources: PluginSource[], options: PreloadOptions = {}): void {
    sources.forEach((source, index) => {
      // Stagger priorities
      const priority = (options.priority ?? 10) + index;
      this.preload(source, { ...options, priority });
    });
  }

  /**
   * Cancel a pending preload.
   *
   * @param source - Plugin source to cancel
   */
  cancelPreload(source: PluginSource): void {
    const key = this.getSourceKey(source);
    this.preloadQueue = this.preloadQueue.filter(
      (req) => this.getSourceKey(req.source) !== key
    );
  }

  /**
   * Cancel all pending preloads.
   */
  cancelAllPreloads(): void {
    this.preloadQueue = [];
  }

  // ==========================================================================
  // Preload Queue Management
  // ==========================================================================

  /**
   * Queue a plugin for preloading.
   */
  private queuePreload(
    source: PluginSource,
    options: LoadOptions,
    priority: number
  ): void {
    const key = this.getSourceKey(source);

    // Check if already queued
    const existingIndex = this.preloadQueue.findIndex(
      (req) => this.getSourceKey(req.source) === key
    );

    if (existingIndex >= 0) {
      // Update priority if higher
      const existingRequest = this.preloadQueue[existingIndex];
      if (existingRequest && priority < existingRequest.priority) {
        existingRequest.priority = priority;
      }
      return;
    }

    // Add to queue
    const promise = new Promise<LoadedPlugin>((resolve, reject) => {
      // Promise will be resolved when actually loaded
      const loadPromise = Promise.resolve().then(() =>
        this.load(source, { ...options, skipEnable: true })
      );
      loadPromise.then(resolve).catch(reject);
      this.loadPromises.set(key, loadPromise);
    });

    this.preloadQueue.push({
      source,
      options,
      promise,
      priority,
    });

    // Sort by priority
    this.preloadQueue.sort((a, b) => a.priority - b.priority);

    // Schedule idle callback
    this.scheduleIdleProcessing();
  }

  /**
   * Schedule idle time processing.
   */
  private scheduleIdleProcessing(): void {
    if (this.idleCallbackScheduled || this.preloadQueue.length === 0) {
      return;
    }

    this.idleCallbackScheduled = true;

    if ("requestIdleCallback" in window) {
      requestIdleCallback(
        (deadline) => this.processPreloadQueue(deadline),
        { timeout: 5000 }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.processPreloadQueue(), 100);
    }
  }

  /**
   * Process the preload queue during idle time.
   */
  private processPreloadQueue(deadline?: IdleDeadline): void {
    this.idleCallbackScheduled = false;

    // Process items while we have time
    while (this.preloadQueue.length > 0) {
      // Check if we have time remaining (or no deadline)
      if (deadline && deadline.timeRemaining() < 5) {
        break;
      }

      const request = this.preloadQueue.shift();
      if (request) {
        // Start loading (fire and forget)
        this.load(request.source, { ...request.options, skipEnable: true }).catch(
          (error) => {
            console.warn(
              "[LazyLoader] Preload failed:",
              this.getSourceKey(request.source),
              error
            );
          }
        );
      }
    }

    // Schedule more processing if items remain
    if (this.preloadQueue.length > 0) {
      this.scheduleIdleProcessing();
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

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

  /**
   * Get plugin ID from source if known.
   */
  private getPluginIdFromSource(source: PluginSource): string | undefined {
    switch (source.type) {
      case "builtin":
      case "cached":
        return source.id;
      case "url":
        return undefined;
    }
  }

  /**
   * Check if a plugin is currently being loaded.
   */
  isLoading(source: PluginSource): boolean {
    return this.loadPromises.has(this.getSourceKey(source));
  }

  /**
   * Check if a plugin is queued for preload.
   */
  isQueued(source: PluginSource): boolean {
    const key = this.getSourceKey(source);
    return this.preloadQueue.some((req) => this.getSourceKey(req.source) === key);
  }

  /**
   * Get the number of items in the preload queue.
   */
  getQueueLength(): number {
    return this.preloadQueue.length;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Lazy plugin loader singleton instance */
export const lazyLoader = new LazyPluginLoader();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Lazily load a plugin.
 *
 * @param source - Plugin source
 * @param options - Load options
 * @returns Promise resolving to loaded plugin
 */
export function lazyLoadPlugin(
  source: PluginSource,
  options?: LoadOptions
): Promise<LoadedPlugin> {
  return lazyLoader.load(source, options);
}

/**
 * Preload a plugin for later use.
 *
 * @param source - Plugin source
 * @param options - Preload options
 */
export function preloadPlugin(
  source: PluginSource,
  options?: PreloadOptions
): void {
  lazyLoader.preload(source, options);
}

/**
 * Preload multiple plugins.
 *
 * @param sources - Array of plugin sources
 * @param options - Preload options
 */
export function preloadPlugins(
  sources: PluginSource[],
  options?: PreloadOptions
): void {
  lazyLoader.preloadMany(sources, options);
}
