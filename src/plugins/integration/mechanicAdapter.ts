/**
 * Mechanic plugin adapter.
 *
 * Integrates mechanic contributions with the existing mechanic registry.
 *
 * @module plugins/integration/mechanicAdapter
 */

import type { MechanicContribution } from "@/plugins/schemas/contributions/mechanic";
import { mechanicRegistry } from "@/mechanics/registry";
import type { Mechanic, MechanicManifest, MechanicFactory, MechanicState } from "@/mechanics/types";
import { usePluginStore } from "@/stores/pluginStore";

// ============================================================================
// Types
// ============================================================================

/**
 * Registered mechanic from plugin.
 */
export interface RegisteredMechanic {
  /** Full mechanic ID (pluginId:mechanicId) */
  id: string;
  /** Plugin ID that provided this mechanic */
  pluginId: string;
  /** Mechanic contribution ID */
  mechanicId: string;
  /** Full mechanic contribution */
  contribution: MechanicContribution;
}


// ============================================================================
// Mechanic Adapter Class
// ============================================================================

/**
 * Mechanic plugin adapter.
 *
 * Manages registering and unregistering mechanic contributions with the
 * existing mechanic registry.
 */
class MechanicPluginAdapter {
  /** Track registered mechanics by plugin */
  private registeredMechanics = new Map<string, RegisteredMechanic[]>();

  /**
   * Register a mechanic from a plugin contribution.
   *
   * @param pluginId - Plugin ID providing the mechanic
   * @param contribution - Mechanic contribution to register
   */
  async registerFromPlugin(
    pluginId: string,
    contribution: MechanicContribution
  ): Promise<void> {
    const fullId = `${pluginId}:${contribution.id}`;

    // Check if already registered
    if (mechanicRegistry.has(fullId)) {
      console.warn(`Mechanic ${fullId} already registered, skipping`);
      return;
    }

    // Create factory function for lazy loading
    const factory: MechanicFactory = async () => {
      return this.createMechanicInstance(pluginId, contribution);
    };

    // Register with mechanic registry
    mechanicRegistry.register(fullId, factory);

    // Track registration
    const registered: RegisteredMechanic = {
      id: fullId,
      pluginId,
      mechanicId: contribution.id,
      contribution,
    };

    const existing = this.registeredMechanics.get(pluginId) ?? [];
    existing.push(registered);
    this.registeredMechanics.set(pluginId, existing);

    // Update plugin store
    const store = usePluginStore.getState();
    store.addActiveMechanic(fullId);
  }

  /**
   * Unregister all mechanics from a plugin.
   *
   * @param pluginId - Plugin ID to unregister
   */
  unregisterFromPlugin(pluginId: string): void {
    const registered = this.registeredMechanics.get(pluginId);
    if (!registered) return;

    // Unregister each mechanic
    for (const mechanic of registered) {
      mechanicRegistry.unregister(mechanic.id);
    }

    // Clear tracking
    this.registeredMechanics.delete(pluginId);

    // Update plugin store
    const store = usePluginStore.getState();
    for (const mechanic of registered) {
      store.removeActiveMechanic(mechanic.id);
    }
  }

  /**
   * Get all mechanics registered by a plugin.
   *
   * @param pluginId - Plugin ID
   * @returns Array of registered mechanics
   */
  getMechanicsForPlugin(pluginId: string): RegisteredMechanic[] {
    return this.registeredMechanics.get(pluginId) ?? [];
  }

  /**
   * Get all registered mechanics from all plugins.
   *
   * @returns Array of all registered mechanics
   */
  getAllRegistered(): RegisteredMechanic[] {
    const all: RegisteredMechanic[] = [];
    for (const mechanics of this.registeredMechanics.values()) {
      all.push(...mechanics);
    }
    return all;
  }

  /**
   * Check if a mechanic is registered.
   *
   * @param pluginId - Plugin ID
   * @param mechanicId - Mechanic contribution ID
   * @returns True if registered
   */
  isRegistered(pluginId: string, mechanicId: string): boolean {
    const fullId = `${pluginId}:${mechanicId}`;
    return mechanicRegistry.has(fullId);
  }

  /**
   * Create a mechanic instance from a contribution.
   */
  private async createMechanicInstance(
    _pluginId: string,
    contribution: MechanicContribution
  ): Promise<Mechanic> {
    // For built-in plugins, load the actual mechanic code
    if (contribution.entrypoint) {
      try {
        // Dynamic import of the mechanic entry point
        const module = await import(/* @vite-ignore */ contribution.entrypoint);

        // Expect the module to export a mechanic object
        const mechanic = module.default ?? module[`${contribution.id}Mechanic`];

        if (mechanic) {
          return mechanic;
        }
      } catch (error) {
        console.error(`Failed to load mechanic ${contribution.id}:`, error);
      }
    }

    // Return a placeholder mechanic if loading fails
    return this.createPlaceholderMechanic(contribution);
  }

  /**
   * Create a placeholder mechanic for contributions without entry points.
   */
  private createPlaceholderMechanic(
    contribution: MechanicContribution
  ): Mechanic {
    // Convert contribution to mechanic manifest format
    const manifest: MechanicManifest = {
      id: contribution.id,
      name: contribution.name,
      description: contribution.description,
      version: "1.0.0",
      minCards: contribution.minCards,
      icon: () => null, // Placeholder icon component
    };

    // Simple state for placeholder
    let state: MechanicState = { isActive: false };
    const listeners = new Set<(state: MechanicState) => void>();

    return {
      manifest,
      lifecycle: {
        onActivate: async () => {
          state = { isActive: true };
          listeners.forEach((l) => l(state));
          console.log(`Mechanic ${contribution.id} activated`);
        },
        onDeactivate: () => {
          state = { isActive: false };
          listeners.forEach((l) => l(state));
          console.log(`Mechanic ${contribution.id} deactivated`);
        },
        onReset: () => {
          state = { isActive: false };
          listeners.forEach((l) => l(state));
          console.log(`Mechanic ${contribution.id} reset`);
        },
      },
      getState: () => state,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getCardActions: () => ({}),
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global mechanic adapter instance.
 */
export const mechanicAdapter = new MechanicPluginAdapter();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Register a mechanic from a plugin.
 *
 * @param pluginId - Plugin ID
 * @param contribution - Mechanic contribution
 */
export async function registerMechanicFromPlugin(
  pluginId: string,
  contribution: MechanicContribution
): Promise<void> {
  return mechanicAdapter.registerFromPlugin(pluginId, contribution);
}

/**
 * Unregister all mechanics from a plugin.
 *
 * @param pluginId - Plugin ID
 */
export function unregisterMechanicsFromPlugin(pluginId: string): void {
  mechanicAdapter.unregisterFromPlugin(pluginId);
}

/**
 * Get all mechanics registered from plugins.
 *
 * @returns Array of registered mechanics
 */
export function getAllPluginMechanics(): RegisteredMechanic[] {
  return mechanicAdapter.getAllRegistered();
}

/**
 * Register built-in mechanics.
 *
 * This is called during app initialisation to register the built-in
 * mechanics (memory, snap-ranking) through the plugin system.
 */
export async function registerBuiltinMechanics(): Promise<void> {
  // Memory mechanic
  await mechanicAdapter.registerFromPlugin("org.itemdeck.mechanic-memory", {
    id: "memory",
    name: "Memory Match",
    description: "Find matching pairs of cards",
    minCards: 4,
    maxCards: 52,
    entrypoint: "@/mechanics/memory",
    experimental: false,
  });

  // Snap Ranking mechanic
  await mechanicAdapter.registerFromPlugin("org.itemdeck.mechanic-snap-ranking", {
    id: "snap-ranking",
    name: "Snap Ranking",
    description: "Rate cards instantly with quick tier decisions",
    minCards: 5,
    maxCards: 0,
    entrypoint: "@/mechanics/snap-ranking",
    experimental: false,
  });
}
