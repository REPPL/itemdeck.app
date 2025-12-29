/**
 * Plugin capability definitions and tier limits.
 *
 * Defines all capabilities a plugin can request and the limits
 * imposed by distribution tier (builtin, official, community).
 *
 * @module plugins/security/capabilities
 */

import type { Capability, PluginTier } from "@/plugins/schemas";

// ============================================================================
// Capability Categories
// ============================================================================

/**
 * Capability category for grouping in UI.
 */
export type CapabilityCategory =
  | "storage"
  | "ui"
  | "collection"
  | "network"
  | "system"
  | "dangerous";

/**
 * Capability metadata for display and validation.
 */
export interface CapabilityInfo {
  /** Capability ID */
  id: Capability;
  /** Display name */
  name: string;
  /** Description of what the capability allows */
  description: string;
  /** Category for grouping */
  category: CapabilityCategory;
  /** Risk level (1-5, higher = more risky) */
  riskLevel: 1 | 2 | 3 | 4 | 5;
  /** Icon (emoji) */
  icon: string;
}

/**
 * Complete capability registry with metadata.
 */
export const CAPABILITY_INFO: Record<Capability, CapabilityInfo> = {
  // Storage capabilities
  "storage:local": {
    id: "storage:local",
    name: "Local Storage",
    description: "Store data in browser localStorage (persists across sessions)",
    category: "storage",
    riskLevel: 1,
    icon: "💾",
  },
  "storage:sync": {
    id: "storage:sync",
    name: "Sync Storage",
    description: "Sync data across devices (future feature)",
    category: "storage",
    riskLevel: 2,
    icon: "☁️",
  },
  "storage:unlimited": {
    id: "storage:unlimited",
    name: "Unlimited Storage",
    description: "Store data without size limits",
    category: "storage",
    riskLevel: 3,
    icon: "📦",
  },

  // UI capabilities
  "ui:notifications": {
    id: "ui:notifications",
    name: "Notifications",
    description: "Show toast notifications to the user",
    category: "ui",
    riskLevel: 1,
    icon: "🔔",
  },
  "ui:modal": {
    id: "ui:modal",
    name: "Modal Dialogs",
    description: "Display modal dialogs for user interaction",
    category: "ui",
    riskLevel: 2,
    icon: "📋",
  },
  "ui:overlay": {
    id: "ui:overlay",
    name: "Full-Screen Overlay",
    description: "Display full-screen overlays (for games)",
    category: "ui",
    riskLevel: 2,
    icon: "🎮",
  },
  "ui:toolbar": {
    id: "ui:toolbar",
    name: "Toolbar Items",
    description: "Add items to the application toolbar",
    category: "ui",
    riskLevel: 1,
    icon: "🔧",
  },

  // Collection capabilities
  "collection:read": {
    id: "collection:read",
    name: "Read Collection",
    description: "Read card data from the current collection",
    category: "collection",
    riskLevel: 1,
    icon: "📖",
  },
  "collection:write": {
    id: "collection:write",
    name: "Write Collection",
    description: "Modify card data in the current collection",
    category: "collection",
    riskLevel: 3,
    icon: "✏️",
  },
  "collection:delete": {
    id: "collection:delete",
    name: "Delete Cards",
    description: "Delete cards from the current collection",
    category: "collection",
    riskLevel: 4,
    icon: "🗑️",
  },

  // Network capabilities
  "fetch:sameorigin": {
    id: "fetch:sameorigin",
    name: "Same-Origin Requests",
    description: "Make network requests to the same origin",
    category: "network",
    riskLevel: 1,
    icon: "🔗",
  },
  "fetch:external": {
    id: "fetch:external",
    name: "External Requests",
    description: "Make network requests to external URLs",
    category: "network",
    riskLevel: 3,
    icon: "🌐",
  },

  // System capabilities
  "audio:play": {
    id: "audio:play",
    name: "Play Audio",
    description: "Play sound effects and audio",
    category: "system",
    riskLevel: 2,
    icon: "🔊",
  },

  // Dangerous capabilities (blocked for community)
  "dangerous:eval": {
    id: "dangerous:eval",
    name: "Dynamic Code Execution",
    description: "Execute dynamically generated code (eval, Function constructor)",
    category: "dangerous",
    riskLevel: 5,
    icon: "⚠️",
  },
  "dangerous:dom": {
    id: "dangerous:dom",
    name: "Direct DOM Access",
    description: "Directly manipulate the DOM outside of sandbox",
    category: "dangerous",
    riskLevel: 5,
    icon: "⚠️",
  },
};

// ============================================================================
// Tier Limits
// ============================================================================

/**
 * Capability access level for a tier.
 */
export type CapabilityAccess =
  | "allowed"   // Automatically granted
  | "consent"   // Requires user consent
  | "blocked";  // Not available for this tier

/**
 * Tier capability limits.
 */
export type TierLimits = Record<Capability, CapabilityAccess>;

/**
 * Capability limits by tier.
 *
 * Built-in: Full trust, all capabilities allowed
 * Official: Most capabilities, some need consent
 * Community: Limited capabilities, sandboxed execution
 */
export const TIER_LIMITS: Record<PluginTier, TierLimits> = {
  builtin: {
    // Storage
    "storage:local": "allowed",
    "storage:sync": "allowed",
    "storage:unlimited": "allowed",
    // UI
    "ui:notifications": "allowed",
    "ui:modal": "allowed",
    "ui:overlay": "allowed",
    "ui:toolbar": "allowed",
    // Collection
    "collection:read": "allowed",
    "collection:write": "allowed",
    "collection:delete": "allowed",
    // Network
    "fetch:sameorigin": "allowed",
    "fetch:external": "allowed",
    // System
    "audio:play": "allowed",
    // Dangerous (allowed for builtin)
    "dangerous:eval": "allowed",
    "dangerous:dom": "allowed",
  },

  official: {
    // Storage
    "storage:local": "allowed",
    "storage:sync": "allowed",
    "storage:unlimited": "consent",
    // UI
    "ui:notifications": "allowed",
    "ui:modal": "allowed",
    "ui:overlay": "allowed",
    "ui:toolbar": "allowed",
    // Collection
    "collection:read": "allowed",
    "collection:write": "consent",
    "collection:delete": "consent",
    // Network
    "fetch:sameorigin": "allowed",
    "fetch:external": "consent",
    // System
    "audio:play": "allowed",
    // Dangerous (blocked for official)
    "dangerous:eval": "blocked",
    "dangerous:dom": "blocked",
  },

  community: {
    // Storage
    "storage:local": "allowed",
    "storage:sync": "consent",
    "storage:unlimited": "blocked",
    // UI
    "ui:notifications": "consent",
    "ui:modal": "consent",
    "ui:overlay": "consent",
    "ui:toolbar": "blocked",
    // Collection
    "collection:read": "allowed",
    "collection:write": "consent",
    "collection:delete": "blocked",
    // Network
    "fetch:sameorigin": "consent",
    "fetch:external": "consent",
    // System
    "audio:play": "consent",
    // Dangerous (blocked for community)
    "dangerous:eval": "blocked",
    "dangerous:dom": "blocked",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the access level for a capability in a given tier.
 *
 * @param capability - Capability to check
 * @param tier - Distribution tier
 * @returns Access level
 */
export function getCapabilityAccess(
  capability: Capability,
  tier: PluginTier
): CapabilityAccess {
  return TIER_LIMITS[tier][capability];
}

/**
 * Check if a capability is available for a tier.
 *
 * @param capability - Capability to check
 * @param tier - Distribution tier
 * @returns Whether the capability can be granted (allowed or consent)
 */
export function isCapabilityAvailable(
  capability: Capability,
  tier: PluginTier
): boolean {
  const access = getCapabilityAccess(capability, tier);
  return access !== "blocked";
}

/**
 * Check if a capability requires user consent for a tier.
 *
 * @param capability - Capability to check
 * @param tier - Distribution tier
 * @returns Whether user consent is required
 */
export function requiresConsent(
  capability: Capability,
  tier: PluginTier
): boolean {
  return getCapabilityAccess(capability, tier) === "consent";
}

/**
 * Check if a capability is blocked for a tier.
 *
 * @param capability - Capability to check
 * @param tier - Distribution tier
 * @returns Whether the capability is blocked
 */
export function isCapabilityBlocked(
  capability: Capability,
  tier: PluginTier
): boolean {
  return getCapabilityAccess(capability, tier) === "blocked";
}

/**
 * Get all blocked capabilities for a tier.
 *
 * @param tier - Distribution tier
 * @returns Array of blocked capabilities
 */
export function getBlockedCapabilities(tier: PluginTier): Capability[] {
  return Object.entries(TIER_LIMITS[tier])
    .filter(([, access]) => access === "blocked")
    .map(([cap]) => cap as Capability);
}

/**
 * Get all capabilities that require consent for a tier.
 *
 * @param tier - Distribution tier
 * @returns Array of capabilities requiring consent
 */
export function getConsentCapabilities(tier: PluginTier): Capability[] {
  return Object.entries(TIER_LIMITS[tier])
    .filter(([, access]) => access === "consent")
    .map(([cap]) => cap as Capability);
}

/**
 * Get all automatically allowed capabilities for a tier.
 *
 * @param tier - Distribution tier
 * @returns Array of auto-allowed capabilities
 */
export function getAllowedCapabilities(tier: PluginTier): Capability[] {
  return Object.entries(TIER_LIMITS[tier])
    .filter(([, access]) => access === "allowed")
    .map(([cap]) => cap as Capability);
}

/**
 * Validate requested capabilities against tier limits.
 *
 * @param requested - Capabilities requested by plugin
 * @param tier - Distribution tier
 * @returns Validation result
 */
export function validateCapabilities(
  requested: Capability[],
  tier: PluginTier
): {
  valid: boolean;
  allowed: Capability[];
  needsConsent: Capability[];
  blocked: Capability[];
} {
  const allowed: Capability[] = [];
  const needsConsent: Capability[] = [];
  const blocked: Capability[] = [];

  for (const cap of requested) {
    const access = getCapabilityAccess(cap, tier);
    switch (access) {
      case "allowed":
        allowed.push(cap);
        break;
      case "consent":
        needsConsent.push(cap);
        break;
      case "blocked":
        blocked.push(cap);
        break;
    }
  }

  return {
    valid: blocked.length === 0,
    allowed,
    needsConsent,
    blocked,
  };
}

/**
 * Get capabilities grouped by category.
 *
 * @returns Map of category to capability info
 */
export function getCapabilitiesByCategory(): Map<CapabilityCategory, CapabilityInfo[]> {
  const grouped = new Map<CapabilityCategory, CapabilityInfo[]>();

  for (const info of Object.values(CAPABILITY_INFO)) {
    const existing = grouped.get(info.category) ?? [];
    existing.push(info);
    grouped.set(info.category, existing);
  }

  return grouped;
}

/**
 * Get capability info by ID.
 *
 * @param capability - Capability ID
 * @returns Capability info
 */
export function getCapabilityInfo(capability: Capability): CapabilityInfo {
  return CAPABILITY_INFO[capability];
}
