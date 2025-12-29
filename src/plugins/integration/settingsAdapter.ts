/**
 * Settings plugin adapter.
 *
 * Merges plugin settings contributions into the settings UI and manages
 * plugin-specific setting storage.
 *
 * @module plugins/integration/settingsAdapter
 */

import type {
  SettingsContribution,
  SettingDefinition,
  SettingsCategory,
} from "@/plugins/schemas/contributions/settings";
import { usePluginStore } from "@/stores/pluginStore";

// ============================================================================
// Types
// ============================================================================

/**
 * Merged setting definition with plugin context.
 */
export interface MergedSettingDefinition {
  /** Plugin ID that contributed this setting */
  pluginId: string;
  /** Setting definition */
  setting: SettingDefinition;
  /** Current value */
  value: unknown;
}

/**
 * Merged setting group with plugin context.
 */
export interface MergedSettingGroup {
  /** Group ID */
  id: string;
  /** Group label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon */
  icon?: string;
  /** Settings in this group */
  settings: MergedSettingDefinition[];
}

/**
 * Registered settings from a plugin.
 */
interface RegisteredSettings {
  /** Plugin ID */
  pluginId: string;
  /** Setting contributions */
  contributions: SettingsContribution[];
}

// ============================================================================
// Settings Adapter Class
// ============================================================================

/**
 * Settings plugin adapter.
 *
 * Manages plugin settings contributions and provides a unified view
 * of all settings for the UI.
 */
class SettingsPluginAdapter {
  /** Track registered settings by plugin */
  private registeredSettings = new Map<string, RegisteredSettings>();

  /**
   * Register settings from a plugin.
   *
   * @param pluginId - Plugin ID providing the settings
   * @param contributions - Setting contributions to register
   */
  registerSettings(pluginId: string, contributions: SettingsContribution[]): void {
    // Store registration
    this.registeredSettings.set(pluginId, {
      pluginId,
      contributions,
    });

    // Initialise default values in plugin store
    const store = usePluginStore.getState();
    const existingConfig = store.pluginConfigs[pluginId] ?? {};
    const newConfig = { ...existingConfig };

    for (const contribution of contributions) {
      for (const setting of contribution.settings) {
        const key = setting.key;
        if (!(key in newConfig)) {
          newConfig[key] = setting.default;
        }
      }
    }

    store.setPluginConfig(pluginId, newConfig);
  }

  /**
   * Unregister settings from a plugin.
   *
   * @param pluginId - Plugin ID to unregister
   */
  unregisterSettings(pluginId: string): void {
    this.registeredSettings.delete(pluginId);
  }

  /**
   * Get all settings as merged definitions.
   *
   * @returns Array of all merged settings
   */
  getAllSettings(): MergedSettingDefinition[] {
    const all: MergedSettingDefinition[] = [];

    for (const [pluginId, registered] of this.registeredSettings) {
      const store = usePluginStore.getState();
      const config = store.pluginConfigs[pluginId] ?? {};

      for (const contribution of registered.contributions) {
        for (const setting of contribution.settings) {
          all.push({
            pluginId,
            setting,
            value: config[setting.key] ?? setting.default,
          });
        }
      }
    }

    return all;
  }

  /**
   * Get settings organised by group/category.
   *
   * @returns Array of merged setting groups
   */
  getGroupedSettings(): MergedSettingGroup[] {
    const groups = new Map<string, MergedSettingGroup>();

    for (const [pluginId, registered] of this.registeredSettings) {
      const store = usePluginStore.getState();
      const config = store.pluginConfigs[pluginId] ?? {};

      for (const contribution of registered.contributions) {
        // Create category map for this contribution
        const categoryMap = new Map<string, SettingsCategory>();
        for (const category of contribution.categories ?? []) {
          categoryMap.set(category.id, category);
        }

        for (const setting of contribution.settings) {
          const categoryId = setting.category ?? contribution.title;
          const category = categoryMap.get(categoryId);

          const mergedSetting: MergedSettingDefinition = {
            pluginId,
            setting,
            value: config[setting.key] ?? setting.default,
          };

          const existingGroup = groups.get(categoryId);
          if (existingGroup) {
            existingGroup.settings.push(mergedSetting);
          } else {
            groups.set(categoryId, {
              id: categoryId,
              label: category?.label ?? contribution.title,
              description: category?.description ?? contribution.description,
              icon: category?.icon ?? contribution.icon,
              settings: [mergedSetting],
            });
          }
        }
      }
    }

    return Array.from(groups.values());
  }

  /**
   * Get a setting value.
   *
   * @param pluginId - Plugin ID
   * @param settingKey - Setting key
   * @returns Setting value
   */
  getSettingValue(pluginId: string, settingKey: string): unknown {
    const store = usePluginStore.getState();
    const config = store.pluginConfigs[pluginId] ?? {};
    return config[settingKey];
  }

  /**
   * Set a setting value.
   *
   * @param pluginId - Plugin ID
   * @param settingKey - Setting key
   * @param value - New value
   */
  setSettingValue(pluginId: string, settingKey: string, value: unknown): void {
    const store = usePluginStore.getState();
    store.updatePluginConfig(pluginId, { [settingKey]: value });
  }

  /**
   * Get settings for a specific plugin.
   *
   * @param pluginId - Plugin ID
   * @returns Array of merged settings for the plugin
   */
  getSettingsForPlugin(pluginId: string): MergedSettingDefinition[] {
    const registered = this.registeredSettings.get(pluginId);
    if (!registered) return [];

    const store = usePluginStore.getState();
    const config = store.pluginConfigs[pluginId] ?? {};
    const settings: MergedSettingDefinition[] = [];

    for (const contribution of registered.contributions) {
      for (const setting of contribution.settings) {
        settings.push({
          pluginId,
          setting,
          value: config[setting.key] ?? setting.default,
        });
      }
    }

    return settings;
  }

  /**
   * Reset all settings for a plugin to their defaults.
   *
   * @param pluginId - Plugin ID
   */
  resetPluginSettings(pluginId: string): void {
    const store = usePluginStore.getState();
    store.resetPluginConfig(pluginId);
  }

  /**
   * Export settings as JSON.
   *
   * @param pluginId - Plugin ID (optional, exports all if omitted)
   * @returns Settings as JSON object
   */
  exportSettings(pluginId?: string): Record<string, unknown> {
    const store = usePluginStore.getState();

    if (pluginId) {
      return store.pluginConfigs[pluginId] ?? {};
    }

    return store.pluginConfigs;
  }

  /**
   * Import settings from JSON.
   *
   * @param pluginId - Plugin ID
   * @param settings - Settings to import
   */
  importSettings(pluginId: string, settings: Record<string, unknown>): void {
    const store = usePluginStore.getState();
    store.setPluginConfig(pluginId, settings);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global settings adapter instance.
 */
export const settingsAdapter = new SettingsPluginAdapter();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Register settings from a plugin.
 *
 * @param pluginId - Plugin ID
 * @param contributions - Setting contributions
 */
export function registerPluginSettings(
  pluginId: string,
  contributions: SettingsContribution[]
): void {
  settingsAdapter.registerSettings(pluginId, contributions);
}

/**
 * Unregister settings from a plugin.
 *
 * @param pluginId - Plugin ID
 */
export function unregisterPluginSettings(pluginId: string): void {
  settingsAdapter.unregisterSettings(pluginId);
}

/**
 * Get all settings grouped for UI display.
 *
 * @returns Array of setting groups
 */
export function getGroupedPluginSettings(): MergedSettingGroup[] {
  return settingsAdapter.getGroupedSettings();
}

/**
 * Get a plugin setting value.
 *
 * @param pluginId - Plugin ID
 * @param settingKey - Setting key
 * @returns Setting value
 */
export function getPluginSettingValue(pluginId: string, settingKey: string): unknown {
  return settingsAdapter.getSettingValue(pluginId, settingKey);
}

/**
 * Set a plugin setting value.
 *
 * @param pluginId - Plugin ID
 * @param settingKey - Setting key
 * @param value - New value
 */
export function setPluginSettingValue(
  pluginId: string,
  settingKey: string,
  value: unknown
): void {
  settingsAdapter.setSettingValue(pluginId, settingKey, value);
}
