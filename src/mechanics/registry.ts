/**
 * Mechanic registry for managing mechanic plugins.
 *
 * Central registry for registering, loading, and activating mechanics.
 * Supports lazy loading via factory functions.
 */

import type { Mechanic, MechanicFactory, MechanicManifest } from "./types";

/**
 * Registry for managing mechanics.
 */
class MechanicRegistry {
  /** Factory functions for lazy loading mechanics */
  private factories = new Map<string, MechanicFactory>();

  /** Loaded mechanic instances */
  private instances = new Map<string, Mechanic>();

  /** Currently active mechanic ID */
  private activeMechanicId: string | null = null;

  /** State change listeners */
  private listeners = new Set<() => void>();

  /**
   * Register a mechanic factory.
   *
   * @param id - Unique mechanic identifier
   * @param factory - Factory function that creates the mechanic
   */
  register(id: string, factory: MechanicFactory): void {
    this.factories.set(id, factory);
    this.notifyListeners();
  }

  /**
   * Unregister a mechanic.
   *
   * @param id - Mechanic ID to unregister
   */
  unregister(id: string): void {
    // Deactivate if this is the active mechanic
    if (this.activeMechanicId === id) {
      this.deactivate();
    }

    this.factories.delete(id);
    this.instances.delete(id);
    this.notifyListeners();
  }

  /**
   * Load and activate a mechanic.
   *
   * @param id - Mechanic ID to activate
   * @returns The activated mechanic
   * @throws Error if mechanic not found or activation fails
   */
  async activate(id: string): Promise<Mechanic> {
    // Deactivate current mechanic if any
    if (this.activeMechanicId && this.activeMechanicId !== id) {
      this.deactivate();
    }

    // Get or load the mechanic
    let mechanic = this.instances.get(id);

    if (!mechanic) {
      const factory = this.factories.get(id);
      if (!factory) {
        throw new Error(`Mechanic "${id}" not found in registry`);
      }

      mechanic = await factory();
      this.instances.set(id, mechanic);
    }

    // Activate the mechanic
    if (mechanic.lifecycle.onActivate) {
      await mechanic.lifecycle.onActivate();
    }

    this.activeMechanicId = id;
    this.notifyListeners();

    return mechanic;
  }

  /**
   * Deactivate the current mechanic.
   */
  deactivate(): void {
    if (!this.activeMechanicId) return;

    const mechanic = this.instances.get(this.activeMechanicId);
    if (mechanic?.lifecycle.onDeactivate) {
      mechanic.lifecycle.onDeactivate();
    }

    this.activeMechanicId = null;
    this.notifyListeners();
  }

  /**
   * Reset the active mechanic state.
   */
  reset(): void {
    if (!this.activeMechanicId) return;

    const mechanic = this.instances.get(this.activeMechanicId);
    if (mechanic?.lifecycle.onReset) {
      mechanic.lifecycle.onReset();
    }
  }

  /**
   * Get the currently active mechanic.
   *
   * @returns The active mechanic or null
   */
  getActive(): Mechanic | null {
    if (!this.activeMechanicId) return null;
    return this.instances.get(this.activeMechanicId) ?? null;
  }

  /**
   * Get the active mechanic ID.
   *
   * @returns The active mechanic ID or null
   */
  getActiveId(): string | null {
    return this.activeMechanicId;
  }

  /**
   * Load a mechanic by ID without activating it.
   * Useful for getting settings/configuration before activation.
   *
   * @param id - Mechanic ID
   * @returns The loaded mechanic
   * @throws Error if mechanic not found
   */
  async load(id: string): Promise<Mechanic> {
    // Return already loaded instance
    const existing = this.instances.get(id);
    if (existing) return existing;

    // Load via factory
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Mechanic "${id}" not found in registry`);
    }

    const mechanic = await factory();
    this.instances.set(id, mechanic);
    return mechanic;
  }

  /**
   * Get a mechanic by ID (must be loaded first).
   *
   * @param id - Mechanic ID
   * @returns The mechanic or undefined
   */
  get(id: string): Mechanic | undefined {
    return this.instances.get(id);
  }

  /**
   * Check if a mechanic is registered.
   *
   * @param id - Mechanic ID
   * @returns True if registered
   */
  has(id: string): boolean {
    return this.factories.has(id);
  }

  /**
   * Check if a mechanic is loaded.
   *
   * @param id - Mechanic ID
   * @returns True if loaded
   */
  isLoaded(id: string): boolean {
    return this.instances.has(id);
  }

  /**
   * Get list of all registered mechanic IDs.
   *
   * @returns Array of mechanic IDs
   */
  getIds(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get manifests for all loaded mechanics.
   *
   * @returns Array of mechanic manifests
   */
  getManifests(): MechanicManifest[] {
    return Array.from(this.instances.values()).map((m) => m.manifest);
  }

  /**
   * Load all registered mechanics without activating them.
   * Useful for displaying the full list of available mechanics.
   *
   * @returns Array of loaded mechanics
   */
  async loadAll(): Promise<Mechanic[]> {
    const loadPromises = Array.from(this.factories.entries()).map(
      async ([id, factory]) => {
        if (!this.instances.has(id)) {
          const mechanic = await factory();
          this.instances.set(id, mechanic);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- instance guaranteed to exist after set above
        return this.instances.get(id)!;
      }
    );

    return Promise.all(loadPromises);
  }

  /**
   * Unload a mechanic instance to free memory.
   * The factory remains registered for later reloading.
   *
   * @param id - Mechanic ID to unload
   */
  unload(id: string): void {
    // Cannot unload active mechanic
    if (this.activeMechanicId === id) {
      this.deactivate();
    }

    this.instances.delete(id);
  }

  /**
   * Subscribe to registry changes.
   *
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of a change.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/**
 * Global mechanic registry instance.
 */
export const mechanicRegistry = new MechanicRegistry();
