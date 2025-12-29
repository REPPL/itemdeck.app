/**
 * Plugin API factory for creating capability-gated APIs.
 *
 * Provides the host-side implementation of the plugin API that
 * integrates with itemdeck's stores and services.
 *
 * @module plugins/sandbox/pluginAPI
 */

import type { Capability } from "@/plugins/schemas";
import { usePluginStore } from "@/stores/pluginStore";
import type { WorkerSandbox } from "./workerSandbox";

// ============================================================================
// Types
// ============================================================================

/**
 * Plugin API handlers for a specific plugin.
 */
export interface PluginAPIHandlers {
  storage: {
    get: (key: string) => Promise<unknown>;
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  ui: {
    notify: (message: string, type?: "info" | "success" | "warning" | "error") => Promise<void>;
    showModal: (content: unknown) => Promise<unknown>;
  };
  collection: {
    getCards: () => Promise<unknown[]>;
    getSelectedCards: () => Promise<unknown[]>;
    getInfo: () => Promise<unknown>;
  };
}

/**
 * Notification handler type.
 */
export type NotificationHandler = (
  message: string,
  type: "info" | "success" | "warning" | "error"
) => void;

/**
 * Modal handler type.
 */
export type ModalHandler = (content: unknown) => Promise<unknown>;

/**
 * Collection data provider type.
 */
export type CollectionDataProvider = () => {
  cards: unknown[];
  selectedCards: unknown[];
  info: unknown;
};

// ============================================================================
// Global Handlers
// ============================================================================

let globalNotificationHandler: NotificationHandler | null = null;
let globalModalHandler: ModalHandler | null = null;
let globalCollectionProvider: CollectionDataProvider | null = null;

/**
 * Set the global notification handler.
 *
 * @param handler - Handler function
 */
export function setNotificationHandler(handler: NotificationHandler): void {
  globalNotificationHandler = handler;
}

/**
 * Set the global modal handler.
 *
 * @param handler - Handler function
 */
export function setModalHandler(handler: ModalHandler): void {
  globalModalHandler = handler;
}

/**
 * Set the global collection data provider.
 *
 * @param provider - Provider function
 */
export function setCollectionProvider(provider: CollectionDataProvider): void {
  globalCollectionProvider = provider;
}

// ============================================================================
// API Handler Factory
// ============================================================================

/**
 * Create API handlers for a plugin.
 *
 * @param pluginId - Plugin ID
 * @param capabilities - Granted capabilities
 * @returns API handlers
 */
export function createPluginAPIHandlers(
  pluginId: string,
  capabilities: Capability[]
): PluginAPIHandlers {
  const store = usePluginStore.getState();

  /**
   * Check if capability is granted.
   */
  function requireCapability(cap: Capability): void {
    if (!capabilities.includes(cap)) {
      throw new Error(`Capability not granted: ${cap}`);
    }
  }

  // Storage API
  const storage: PluginAPIHandlers["storage"] = {
    get: async (key: string) => {
      requireCapability("storage:local");
      const config = store.pluginConfigs[pluginId] ?? {};
      return config[key];
    },

    set: async (key: string, value: unknown) => {
      requireCapability("storage:local");
      store.updatePluginConfig(pluginId, { [key]: value });
    },

    delete: async (key: string) => {
      requireCapability("storage:local");
      const config = { ...store.pluginConfigs[pluginId] };
      delete config[key];
      store.setPluginConfig(pluginId, config);
    },

    clear: async () => {
      requireCapability("storage:local");
      store.resetPluginConfig(pluginId);
    },
  };

  // UI API
  const ui: PluginAPIHandlers["ui"] = {
    notify: async (message: string, type = "info") => {
      requireCapability("ui:notifications");

      if (globalNotificationHandler) {
        globalNotificationHandler(message, type);
      } else {
        // Fallback to console
        console.log(`[Plugin ${pluginId}] ${type}: ${message}`);
      }
    },

    showModal: async (content: unknown) => {
      requireCapability("ui:modal");

      if (globalModalHandler) {
        return globalModalHandler(content);
      } else {
        throw new Error("Modal system not available");
      }
    },
  };

  // Collection API
  const collection: PluginAPIHandlers["collection"] = {
    getCards: async () => {
      requireCapability("collection:read");

      if (globalCollectionProvider) {
        return globalCollectionProvider().cards;
      }
      return [];
    },

    getSelectedCards: async () => {
      requireCapability("collection:read");

      if (globalCollectionProvider) {
        return globalCollectionProvider().selectedCards;
      }
      return [];
    },

    getInfo: async () => {
      requireCapability("collection:read");

      if (globalCollectionProvider) {
        return globalCollectionProvider().info;
      }
      return {};
    },
  };

  return { storage, ui, collection };
}

/**
 * Register API handlers on a worker sandbox.
 *
 * @param sandbox - Worker sandbox instance
 * @param pluginId - Plugin ID
 * @param capabilities - Granted capabilities
 */
export function registerSandboxAPIHandlers(
  sandbox: WorkerSandbox,
  pluginId: string,
  capabilities: Capability[]
): void {
  const handlers = createPluginAPIHandlers(pluginId, capabilities);

  // Storage API
  sandbox.registerAPIHandler("storage", "get", async (key) =>
    handlers.storage.get(key as string)
  );
  sandbox.registerAPIHandler("storage", "set", async (key, value) =>
    handlers.storage.set(key as string, value)
  );
  sandbox.registerAPIHandler("storage", "delete", async (key) =>
    handlers.storage.delete(key as string)
  );
  sandbox.registerAPIHandler("storage", "clear", async () =>
    handlers.storage.clear()
  );

  // UI API
  sandbox.registerAPIHandler("ui", "notify", async (message, type) =>
    handlers.ui.notify(
      message as string,
      type as "info" | "success" | "warning" | "error"
    )
  );
  sandbox.registerAPIHandler("ui", "showModal", async (content) =>
    handlers.ui.showModal(content)
  );

  // Collection API
  sandbox.registerAPIHandler("collection", "getCards", async () =>
    handlers.collection.getCards()
  );
  sandbox.registerAPIHandler("collection", "getSelectedCards", async () =>
    handlers.collection.getSelectedCards()
  );
  sandbox.registerAPIHandler("collection", "getInfo", async () =>
    handlers.collection.getInfo()
  );
}
