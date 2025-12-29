/**
 * Built-in plugins.
 *
 * These plugins are bundled with itemdeck and available by default.
 *
 * @module plugins/builtin
 */

import type { PluginManifest } from "@/plugins/schemas";
import { registerBuiltinPlugin } from "@/plugins/loader/pluginLoader";

// ============================================================================
// Theme Plugins
// ============================================================================

export { default as retroThemePlugin } from "./themes/retro";
export { default as modernThemePlugin } from "./themes/modern";
export { default as minimalThemePlugin } from "./themes/minimal";

// ============================================================================
// Mechanic Plugins
// ============================================================================

export { default as memoryMechanicPlugin } from "./mechanics/memory";
export { default as snapRankingMechanicPlugin } from "./mechanics/snap-ranking";

// ============================================================================
// Source Plugins
// ============================================================================

export { default as githubSourcePlugin } from "./sources/github";

// Theme plugin IDs
export const BUILTIN_THEME_IDS = [
  "org.itemdeck.theme-retro",
  "org.itemdeck.theme-modern",
  "org.itemdeck.theme-minimal",
] as const;

// Mechanic plugin IDs
export const BUILTIN_MECHANIC_IDS = [
  "org.itemdeck.mechanic-memory",
  "org.itemdeck.mechanic-snap-ranking",
] as const;

// Source plugin IDs
export const BUILTIN_SOURCE_IDS = [
  "org.itemdeck.source-github",
] as const;

// All builtin plugin IDs
export const BUILTIN_PLUGIN_IDS = [
  ...BUILTIN_THEME_IDS,
  ...BUILTIN_MECHANIC_IDS,
  ...BUILTIN_SOURCE_IDS,
] as const;

/**
 * Register all built-in plugins.
 *
 * This should be called during app initialisation to make
 * all built-in plugins available.
 */
export async function registerAllBuiltinPlugins(): Promise<void> {
  // Register themes
  registerBuiltinPlugin("org.itemdeck.theme-retro", async () => {
    const module = await import("./themes/retro/manifest.json");
    return module.default as unknown as PluginManifest;
  });

  registerBuiltinPlugin("org.itemdeck.theme-modern", async () => {
    const module = await import("./themes/modern/manifest.json");
    return module.default as unknown as PluginManifest;
  });

  registerBuiltinPlugin("org.itemdeck.theme-minimal", async () => {
    const module = await import("./themes/minimal/manifest.json");
    return module.default as unknown as PluginManifest;
  });

  // Register mechanics
  registerBuiltinPlugin("org.itemdeck.mechanic-memory", async () => {
    const module = await import("./mechanics/memory/manifest.json");
    return module.default as unknown as PluginManifest;
  });

  registerBuiltinPlugin("org.itemdeck.mechanic-snap-ranking", async () => {
    const module = await import("./mechanics/snap-ranking/manifest.json");
    return module.default as unknown as PluginManifest;
  });

  // Register sources
  registerBuiltinPlugin("org.itemdeck.source-github", async () => {
    const module = await import("./sources/github/manifest.json");
    return module.default as unknown as PluginManifest;
  });
}
