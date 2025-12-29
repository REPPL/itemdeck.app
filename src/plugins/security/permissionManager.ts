/**
 * Plugin permission manager.
 *
 * Handles capability granting, revoking, and checking for plugins.
 * Integrates with the plugin store for persistence.
 *
 * @module plugins/security/permissionManager
 */

import type { Capability, PluginTier } from "@/plugins/schemas";
import { usePluginStore } from "@/stores/pluginStore";
import {
  getCapabilityAccess,
  isCapabilityBlocked,
  validateCapabilities,
} from "./capabilities";

// ============================================================================
// Types
// ============================================================================

/**
 * Permission request result.
 */
export interface PermissionRequestResult {
  /** Whether the request was successful */
  granted: boolean;
  /** Capabilities that were granted */
  grantedCapabilities: Capability[];
  /** Capabilities that were denied */
  deniedCapabilities: Capability[];
  /** Capabilities that are blocked for this tier */
  blockedCapabilities: Capability[];
  /** Whether user consent was required */
  requiresConsent: boolean;
}

/**
 * Permission check result.
 */
export interface PermissionCheckResult {
  /** Whether the capability is available */
  available: boolean;
  /** Whether user consent is needed */
  needsConsent: boolean;
  /** Whether the capability has been granted */
  granted: boolean;
  /** Reason if not available */
  reason?: "blocked" | "not-requested" | "denied";
}

/**
 * Pending consent request.
 */
export interface PendingConsentRequest {
  /** Plugin ID */
  pluginId: string;
  /** Capabilities requiring consent */
  capabilities: Capability[];
  /** Promise resolver */
  resolve: (granted: Capability[]) => void;
  /** Promise rejecter */
  reject: (error: Error) => void;
}

// ============================================================================
// Permission Manager Class
// ============================================================================

/**
 * Permission manager for plugins.
 *
 * Handles the complete lifecycle of capability permissions:
 * - Checking if a plugin can use a capability
 * - Requesting capabilities (with consent if needed)
 * - Granting and revoking capabilities
 * - Tracking pending consent requests
 */
class PermissionManager {
  /** Pending consent requests */
  private pendingRequests = new Map<string, PendingConsentRequest>();

  /** Consent handler (set by UI) */
  private consentHandler:
    | ((pluginId: string, capabilities: Capability[]) => Promise<Capability[]>)
    | null = null;

  // ==========================================================================
  // Consent Handler
  // ==========================================================================

  /**
   * Set the consent handler.
   *
   * The consent handler is called when a plugin requests capabilities
   * that require user consent. It should display a UI and return
   * the capabilities the user agreed to grant.
   *
   * @param handler - Consent handler function
   */
  setConsentHandler(
    handler: (pluginId: string, capabilities: Capability[]) => Promise<Capability[]>
  ): void {
    this.consentHandler = handler;

    // Process any pending requests
    for (const [pluginId, request] of this.pendingRequests) {
      this.processConsentRequest(pluginId, request);
    }
  }

  /**
   * Clear the consent handler.
   */
  clearConsentHandler(): void {
    this.consentHandler = null;
  }

  // ==========================================================================
  // Permission Checking
  // ==========================================================================

  /**
   * Check if a plugin has a specific capability.
   *
   * @param pluginId - Plugin ID
   * @param capability - Capability to check
   * @returns Whether the capability is granted
   */
  checkCapability(pluginId: string, capability: Capability): boolean {
    const store = usePluginStore.getState();
    return store.hasCapability(pluginId, capability);
  }

  /**
   * Get detailed permission check result.
   *
   * @param pluginId - Plugin ID
   * @param capability - Capability to check
   * @returns Detailed check result
   */
  getPermissionStatus(
    pluginId: string,
    capability: Capability
  ): PermissionCheckResult {
    const store = usePluginStore.getState();
    const plugin = store.getPlugin(pluginId);

    if (!plugin) {
      return {
        available: false,
        needsConsent: false,
        granted: false,
        reason: "not-requested",
      };
    }

    const tier = plugin.tier;
    const access = getCapabilityAccess(capability, tier);

    // Check if blocked
    if (access === "blocked") {
      return {
        available: false,
        needsConsent: false,
        granted: false,
        reason: "blocked",
      };
    }

    // Check if already granted
    const granted = plugin.grantedCapabilities.includes(capability);

    // Check if in manifest
    const requested = plugin.manifest.capabilities.includes(capability);

    if (!requested) {
      return {
        available: false,
        needsConsent: false,
        granted: false,
        reason: "not-requested",
      };
    }

    return {
      available: true,
      needsConsent: access === "consent",
      granted,
      reason: granted ? undefined : "denied",
    };
  }

  /**
   * Get all granted capabilities for a plugin.
   *
   * @param pluginId - Plugin ID
   * @returns Array of granted capabilities
   */
  getGrantedCapabilities(pluginId: string): Capability[] {
    const store = usePluginStore.getState();
    const plugin = store.getPlugin(pluginId);
    return plugin?.grantedCapabilities ?? [];
  }

  // ==========================================================================
  // Permission Requesting
  // ==========================================================================

  /**
   * Request capabilities for a plugin.
   *
   * Handles the complete flow:
   * 1. Validate against tier limits
   * 2. Auto-grant allowed capabilities
   * 3. Request consent for consent-required capabilities
   * 4. Block blocked capabilities
   *
   * @param pluginId - Plugin ID
   * @param capabilities - Capabilities to request
   * @returns Request result
   */
  async requestCapabilities(
    pluginId: string,
    capabilities: Capability[]
  ): Promise<PermissionRequestResult> {
    const store = usePluginStore.getState();
    const plugin = store.getPlugin(pluginId);

    if (!plugin) {
      return {
        granted: false,
        grantedCapabilities: [],
        deniedCapabilities: capabilities,
        blockedCapabilities: [],
        requiresConsent: false,
      };
    }

    const tier = plugin.tier;
    const validation = validateCapabilities(capabilities, tier);

    // Grant auto-allowed capabilities
    for (const cap of validation.allowed) {
      store.grantCapability(pluginId, cap);
    }

    // Handle consent-required capabilities
    let consentedCapabilities: Capability[] = [];
    if (validation.needsConsent.length > 0) {
      consentedCapabilities = await this.requestConsent(
        pluginId,
        validation.needsConsent
      );

      // Grant consented capabilities
      for (const cap of consentedCapabilities) {
        store.grantCapability(pluginId, cap);
      }
    }

    const allGranted = [...validation.allowed, ...consentedCapabilities];
    const denied = validation.needsConsent.filter(
      (cap) => !consentedCapabilities.includes(cap)
    );

    return {
      granted: allGranted.length === capabilities.length,
      grantedCapabilities: allGranted,
      deniedCapabilities: denied,
      blockedCapabilities: validation.blocked,
      requiresConsent: validation.needsConsent.length > 0,
    };
  }

  /**
   * Request user consent for capabilities.
   *
   * @param pluginId - Plugin ID
   * @param capabilities - Capabilities requiring consent
   * @returns Capabilities the user agreed to
   */
  private async requestConsent(
    pluginId: string,
    capabilities: Capability[]
  ): Promise<Capability[]> {
    // If no consent handler, deny all
    if (!this.consentHandler) {
      // Queue for later if handler not yet set
      return new Promise((resolve, reject) => {
        this.pendingRequests.set(pluginId, {
          pluginId,
          capabilities,
          resolve,
          reject,
        });
      });
    }

    // Request consent via handler
    return this.consentHandler(pluginId, capabilities);
  }

  /**
   * Process a pending consent request.
   */
  private async processConsentRequest(
    pluginId: string,
    request: PendingConsentRequest
  ): Promise<void> {
    if (!this.consentHandler) {
      return;
    }

    try {
      const granted = await this.consentHandler(pluginId, request.capabilities);
      this.pendingRequests.delete(pluginId);
      request.resolve(granted);
    } catch (error) {
      this.pendingRequests.delete(pluginId);
      request.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ==========================================================================
  // Permission Granting/Revoking
  // ==========================================================================

  /**
   * Grant a capability to a plugin.
   *
   * @param pluginId - Plugin ID
   * @param capability - Capability to grant
   * @returns Whether the grant was successful
   */
  grantCapability(pluginId: string, capability: Capability): boolean {
    const store = usePluginStore.getState();
    const plugin = store.getPlugin(pluginId);

    if (!plugin) {
      return false;
    }

    // Check if blocked
    if (isCapabilityBlocked(capability, plugin.tier)) {
      return false;
    }

    store.grantCapability(pluginId, capability);
    return true;
  }

  /**
   * Revoke a capability from a plugin.
   *
   * @param pluginId - Plugin ID
   * @param capability - Capability to revoke
   */
  revokeCapability(pluginId: string, capability: Capability): void {
    const store = usePluginStore.getState();
    store.revokeCapability(pluginId, capability);
  }

  /**
   * Revoke all capabilities from a plugin.
   *
   * @param pluginId - Plugin ID
   */
  revokeAllCapabilities(pluginId: string): void {
    const granted = this.getGrantedCapabilities(pluginId);
    for (const cap of granted) {
      this.revokeCapability(pluginId, cap);
    }
  }

  // ==========================================================================
  // Auto-Grant on Install
  // ==========================================================================

  /**
   * Auto-grant capabilities when a plugin is installed.
   *
   * Grants capabilities that don't require consent.
   *
   * @param pluginId - Plugin ID
   * @param manifest - Plugin manifest
   * @param tier - Distribution tier
   * @returns Capabilities that need consent
   */
  autoGrantOnInstall(
    pluginId: string,
    capabilities: Capability[],
    tier: PluginTier
  ): Capability[] {
    const store = usePluginStore.getState();
    const needsConsent: Capability[] = [];

    for (const cap of capabilities) {
      const access = getCapabilityAccess(cap, tier);

      if (access === "allowed") {
        store.grantCapability(pluginId, cap);
      } else if (access === "consent") {
        needsConsent.push(cap);
      }
      // Blocked capabilities are ignored
    }

    return needsConsent;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

/** Permission manager singleton instance */
export const permissionManager = new PermissionManager();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Check if a plugin has a capability.
 *
 * @param pluginId - Plugin ID
 * @param capability - Capability to check
 * @returns Whether the capability is granted
 */
export function checkPluginCapability(
  pluginId: string,
  capability: Capability
): boolean {
  return permissionManager.checkCapability(pluginId, capability);
}

/**
 * Request capabilities for a plugin.
 *
 * @param pluginId - Plugin ID
 * @param capabilities - Capabilities to request
 * @returns Request result
 */
export function requestPluginCapabilities(
  pluginId: string,
  capabilities: Capability[]
): Promise<PermissionRequestResult> {
  return permissionManager.requestCapabilities(pluginId, capabilities);
}

/**
 * Grant a capability to a plugin.
 *
 * @param pluginId - Plugin ID
 * @param capability - Capability to grant
 * @returns Whether successful
 */
export function grantPluginCapability(
  pluginId: string,
  capability: Capability
): boolean {
  return permissionManager.grantCapability(pluginId, capability);
}

/**
 * Revoke a capability from a plugin.
 *
 * @param pluginId - Plugin ID
 * @param capability - Capability to revoke
 */
export function revokePluginCapability(
  pluginId: string,
  capability: Capability
): void {
  permissionManager.revokeCapability(pluginId, capability);
}
