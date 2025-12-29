/**
 * Plugin store using Zustand with persistence.
 *
 * Manages plugin installation, configuration, and state.
 * Tracks installed plugins, their configurations, and granted permissions.
 *
 * @module stores/pluginStore
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  PluginManifest,
  PluginTier,
  Capability,
} from "@/plugins/schemas";

// ============================================================================
// Types
// ============================================================================

/**
 * Installed plugin information.
 */
export interface InstalledPluginInfo {
  /** Plugin manifest */
  manifest: PluginManifest;
  /** Distribution tier (affects security) */
  tier: PluginTier;
  /** Installation source URL (for community plugins) */
  sourceUrl?: string;
  /** Installation timestamp */
  installedAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Whether the plugin is enabled */
  enabled: boolean;
  /** Granted capabilities (may be subset of requested) */
  grantedCapabilities: Capability[];
  /** Plugin load state */
  loadState: PluginLoadState;
  /** Error message if load failed */
  loadError?: string;
}

/**
 * Plugin load states.
 */
export type PluginLoadState =
  | "pending"    // Not yet loaded
  | "loading"   // Currently loading
  | "active"    // Successfully loaded and running
  | "disabled"  // Installed but disabled
  | "error";    // Load failed

/**
 * User preferences for plugin system.
 */
export interface PluginPreferences {
  /** Whether to auto-update plugins */
  autoUpdate: boolean;
  /** Whether to allow community plugins */
  allowCommunityPlugins: boolean;
  /** Trusted domains for community plugins */
  trustedDomains: string[];
  /** Show capability prompts for official plugins */
  promptOfficialPlugins: boolean;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface PluginState {
  // ============================================================================
  // Installed Plugins
  // ============================================================================

  /** Map of plugin ID to installed plugin info */
  installedPlugins: Record<string, InstalledPluginInfo>;

  // ============================================================================
  // Plugin Configurations
  // ============================================================================

  /** Map of plugin ID to plugin configuration */
  pluginConfigs: Record<string, Record<string, unknown>>;

  // ============================================================================
  // Active Plugins by Type
  // ============================================================================

  /** Currently active theme plugin ID */
  activeTheme: string | null;

  /** Active mechanic plugin IDs (can have multiple registered) */
  activeMechanics: string[];

  /** Active source plugin IDs */
  activeSources: string[];

  // ============================================================================
  // User Preferences
  // ============================================================================

  /** Plugin system preferences */
  preferences: PluginPreferences;

  // ============================================================================
  // Actions: Plugin Lifecycle
  // ============================================================================

  /**
   * Install a plugin.
   *
   * @param manifest - Plugin manifest
   * @param tier - Distribution tier
   * @param sourceUrl - Source URL (for community plugins)
   */
  installPlugin: (
    manifest: PluginManifest,
    tier: PluginTier,
    sourceUrl?: string
  ) => void;

  /**
   * Uninstall a plugin.
   *
   * @param pluginId - Plugin ID to uninstall
   */
  uninstallPlugin: (pluginId: string) => void;

  /**
   * Update a plugin's manifest.
   *
   * @param pluginId - Plugin ID
   * @param manifest - New manifest
   */
  updatePlugin: (pluginId: string, manifest: PluginManifest) => void;

  /**
   * Enable a plugin.
   *
   * @param pluginId - Plugin ID to enable
   */
  enablePlugin: (pluginId: string) => void;

  /**
   * Disable a plugin.
   *
   * @param pluginId - Plugin ID to disable
   */
  disablePlugin: (pluginId: string) => void;

  // ============================================================================
  // Actions: Plugin Load State
  // ============================================================================

  /**
   * Set plugin load state.
   *
   * @param pluginId - Plugin ID
   * @param state - New load state
   * @param error - Error message if state is "error"
   */
  setPluginLoadState: (
    pluginId: string,
    state: PluginLoadState,
    error?: string
  ) => void;

  // ============================================================================
  // Actions: Configuration
  // ============================================================================

  /**
   * Set plugin configuration.
   *
   * @param pluginId - Plugin ID
   * @param config - Configuration object
   */
  setPluginConfig: (pluginId: string, config: Record<string, unknown>) => void;

  /**
   * Update specific plugin configuration values.
   *
   * @param pluginId - Plugin ID
   * @param updates - Partial configuration updates
   */
  updatePluginConfig: (
    pluginId: string,
    updates: Record<string, unknown>
  ) => void;

  /**
   * Reset plugin configuration to defaults.
   *
   * @param pluginId - Plugin ID
   */
  resetPluginConfig: (pluginId: string) => void;

  // ============================================================================
  // Actions: Active Plugins
  // ============================================================================

  /**
   * Set the active theme.
   *
   * @param pluginId - Theme plugin ID or null to use default
   */
  setActiveTheme: (pluginId: string | null) => void;

  /**
   * Add an active mechanic.
   *
   * @param pluginId - Mechanic plugin ID
   */
  addActiveMechanic: (pluginId: string) => void;

  /**
   * Remove an active mechanic.
   *
   * @param pluginId - Mechanic plugin ID
   */
  removeActiveMechanic: (pluginId: string) => void;

  /**
   * Add an active source.
   *
   * @param pluginId - Source plugin ID
   */
  addActiveSource: (pluginId: string) => void;

  /**
   * Remove an active source.
   *
   * @param pluginId - Source plugin ID
   */
  removeActiveSource: (pluginId: string) => void;

  // ============================================================================
  // Actions: Capabilities
  // ============================================================================

  /**
   * Grant a capability to a plugin.
   *
   * @param pluginId - Plugin ID
   * @param capability - Capability to grant
   */
  grantCapability: (pluginId: string, capability: Capability) => void;

  /**
   * Revoke a capability from a plugin.
   *
   * @param pluginId - Plugin ID
   * @param capability - Capability to revoke
   */
  revokeCapability: (pluginId: string, capability: Capability) => void;

  /**
   * Check if a plugin has a capability.
   *
   * @param pluginId - Plugin ID
   * @param capability - Capability to check
   * @returns Whether the capability is granted
   */
  hasCapability: (pluginId: string, capability: Capability) => boolean;

  // ============================================================================
  // Actions: Preferences
  // ============================================================================

  /**
   * Update plugin preferences.
   *
   * @param updates - Partial preference updates
   */
  updatePreferences: (updates: Partial<PluginPreferences>) => void;

  /**
   * Add a trusted domain.
   *
   * @param domain - Domain to trust
   */
  addTrustedDomain: (domain: string) => void;

  /**
   * Remove a trusted domain.
   *
   * @param domain - Domain to untrust
   */
  removeTrustedDomain: (domain: string) => void;

  // ============================================================================
  // Selectors (derived state)
  // ============================================================================

  /**
   * Get all plugins of a specific type.
   *
   * @param type - Plugin type to filter by
   * @returns Array of installed plugins of that type
   */
  getPluginsByType: (type: PluginManifest["itemdeck"]["type"]) => InstalledPluginInfo[];

  /**
   * Get enabled plugins only.
   *
   * @returns Array of enabled installed plugins
   */
  getEnabledPlugins: () => InstalledPluginInfo[];

  /**
   * Get a specific plugin by ID.
   *
   * @param pluginId - Plugin ID
   * @returns Plugin info or undefined
   */
  getPlugin: (pluginId: string) => InstalledPluginInfo | undefined;

  /**
   * Check if a plugin is installed.
   *
   * @param pluginId - Plugin ID
   * @returns Whether the plugin is installed
   */
  isInstalled: (pluginId: string) => boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_PREFERENCES: PluginPreferences = {
  autoUpdate: true,
  allowCommunityPlugins: false,
  trustedDomains: [],
  promptOfficialPlugins: true,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      // Initial state
      installedPlugins: {},
      pluginConfigs: {},
      activeTheme: null,
      activeMechanics: [],
      activeSources: [],
      preferences: DEFAULT_PREFERENCES,

      // ========================================================================
      // Plugin Lifecycle Actions
      // ========================================================================

      installPlugin: (manifest, tier, sourceUrl) => {
        const now = new Date().toISOString();
        set((state) => ({
          installedPlugins: {
            ...state.installedPlugins,
            [manifest.id]: {
              manifest,
              tier,
              sourceUrl,
              installedAt: now,
              updatedAt: now,
              enabled: true,
              grantedCapabilities: [],
              loadState: "pending",
            },
          },
        }));
      },

      uninstallPlugin: (pluginId) => {
        set((state) => {
          const { [pluginId]: _, ...remainingPlugins } = state.installedPlugins;
          const { [pluginId]: __, ...remainingConfigs } = state.pluginConfigs;

          return {
            installedPlugins: remainingPlugins,
            pluginConfigs: remainingConfigs,
            activeTheme: state.activeTheme === pluginId ? null : state.activeTheme,
            activeMechanics: state.activeMechanics.filter((id) => id !== pluginId),
            activeSources: state.activeSources.filter((id) => id !== pluginId),
          };
        });
      },

      updatePlugin: (pluginId, manifest) => {
        set((state) => {
          const existing = state.installedPlugins[pluginId];
          if (!existing) return state;

          return {
            installedPlugins: {
              ...state.installedPlugins,
              [pluginId]: {
                ...existing,
                manifest,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      enablePlugin: (pluginId) => {
        set((state) => {
          const existing = state.installedPlugins[pluginId];
          if (!existing) return state;

          return {
            installedPlugins: {
              ...state.installedPlugins,
              [pluginId]: {
                ...existing,
                enabled: true,
                loadState: "pending",
              },
            },
          };
        });
      },

      disablePlugin: (pluginId) => {
        set((state) => {
          const existing = state.installedPlugins[pluginId];
          if (!existing) return state;

          return {
            installedPlugins: {
              ...state.installedPlugins,
              [pluginId]: {
                ...existing,
                enabled: false,
                loadState: "disabled",
              },
            },
          };
        });
      },

      // ========================================================================
      // Load State Actions
      // ========================================================================

      setPluginLoadState: (pluginId, loadState, error) => {
        set((state) => {
          const existing = state.installedPlugins[pluginId];
          if (!existing) return state;

          return {
            installedPlugins: {
              ...state.installedPlugins,
              [pluginId]: {
                ...existing,
                loadState,
                loadError: error,
              },
            },
          };
        });
      },

      // ========================================================================
      // Configuration Actions
      // ========================================================================

      setPluginConfig: (pluginId, config) => {
        set((state) => ({
          pluginConfigs: {
            ...state.pluginConfigs,
            [pluginId]: config,
          },
        }));
      },

      updatePluginConfig: (pluginId, updates) => {
        set((state) => ({
          pluginConfigs: {
            ...state.pluginConfigs,
            [pluginId]: {
              ...state.pluginConfigs[pluginId],
              ...updates,
            },
          },
        }));
      },

      resetPluginConfig: (pluginId) => {
        set((state) => {
          const { [pluginId]: _, ...remainingConfigs } = state.pluginConfigs;
          return { pluginConfigs: remainingConfigs };
        });
      },

      // ========================================================================
      // Active Plugin Actions
      // ========================================================================

      setActiveTheme: (pluginId) => {
        set({ activeTheme: pluginId });
      },

      addActiveMechanic: (pluginId) => {
        set((state) => ({
          activeMechanics: state.activeMechanics.includes(pluginId)
            ? state.activeMechanics
            : [...state.activeMechanics, pluginId],
        }));
      },

      removeActiveMechanic: (pluginId) => {
        set((state) => ({
          activeMechanics: state.activeMechanics.filter((id) => id !== pluginId),
        }));
      },

      addActiveSource: (pluginId) => {
        set((state) => ({
          activeSources: state.activeSources.includes(pluginId)
            ? state.activeSources
            : [...state.activeSources, pluginId],
        }));
      },

      removeActiveSource: (pluginId) => {
        set((state) => ({
          activeSources: state.activeSources.filter((id) => id !== pluginId),
        }));
      },

      // ========================================================================
      // Capability Actions
      // ========================================================================

      grantCapability: (pluginId, capability) => {
        set((state) => {
          const existing = state.installedPlugins[pluginId];
          if (!existing) return state;

          const grantedCapabilities = existing.grantedCapabilities.includes(capability)
            ? existing.grantedCapabilities
            : [...existing.grantedCapabilities, capability];

          return {
            installedPlugins: {
              ...state.installedPlugins,
              [pluginId]: {
                ...existing,
                grantedCapabilities,
              },
            },
          };
        });
      },

      revokeCapability: (pluginId, capability) => {
        set((state) => {
          const existing = state.installedPlugins[pluginId];
          if (!existing) return state;

          return {
            installedPlugins: {
              ...state.installedPlugins,
              [pluginId]: {
                ...existing,
                grantedCapabilities: existing.grantedCapabilities.filter(
                  (c) => c !== capability
                ),
              },
            },
          };
        });
      },

      hasCapability: (pluginId, capability) => {
        const plugin = get().installedPlugins[pluginId];
        if (!plugin) return false;
        return plugin.grantedCapabilities.includes(capability);
      },

      // ========================================================================
      // Preference Actions
      // ========================================================================

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...updates,
          },
        }));
      },

      addTrustedDomain: (domain) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            trustedDomains: state.preferences.trustedDomains.includes(domain)
              ? state.preferences.trustedDomains
              : [...state.preferences.trustedDomains, domain],
          },
        }));
      },

      removeTrustedDomain: (domain) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            trustedDomains: state.preferences.trustedDomains.filter(
              (d) => d !== domain
            ),
          },
        }));
      },

      // ========================================================================
      // Selectors
      // ========================================================================

      getPluginsByType: (type) => {
        const state = get();
        return Object.values(state.installedPlugins).filter(
          (plugin) => plugin.manifest.itemdeck.type === type
        );
      },

      getEnabledPlugins: () => {
        const state = get();
        return Object.values(state.installedPlugins).filter(
          (plugin) => plugin.enabled
        );
      },

      getPlugin: (pluginId) => {
        return get().installedPlugins[pluginId];
      },

      isInstalled: (pluginId) => {
        return pluginId in get().installedPlugins;
      },
    }),
    {
      name: "itemdeck-plugins",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        installedPlugins: state.installedPlugins,
        pluginConfigs: state.pluginConfigs,
        activeTheme: state.activeTheme,
        activeMechanics: state.activeMechanics,
        activeSources: state.activeSources,
        preferences: state.preferences,
      }),
    }
  )
);

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Get the current active theme plugin.
 */
export function useActiveThemePlugin(): InstalledPluginInfo | undefined {
  return usePluginStore((state) =>
    state.activeTheme ? state.installedPlugins[state.activeTheme] : undefined
  );
}

/**
 * Get all enabled theme plugins.
 */
export function useThemePlugins(): InstalledPluginInfo[] {
  return usePluginStore((state) =>
    Object.values(state.installedPlugins).filter(
      (p) => p.manifest.itemdeck.type === "theme" && p.enabled
    )
  );
}

/**
 * Get all enabled mechanic plugins.
 */
export function useMechanicPlugins(): InstalledPluginInfo[] {
  return usePluginStore((state) =>
    Object.values(state.installedPlugins).filter(
      (p) => p.manifest.itemdeck.type === "mechanic" && p.enabled
    )
  );
}

/**
 * Get all enabled source plugins.
 */
export function useSourcePlugins(): InstalledPluginInfo[] {
  return usePluginStore((state) =>
    Object.values(state.installedPlugins).filter(
      (p) => p.manifest.itemdeck.type === "source" && p.enabled
    )
  );
}
