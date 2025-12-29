/**
 * Minimal theme plugin entry point.
 *
 * @plugin org.itemdeck.theme-minimal
 */

import manifest from "./manifest.json";
import type { ThemeContribution } from "@/plugins/schemas/contributions/theme";

/**
 * Theme contribution for the minimal theme.
 * Note: The manifest uses a slightly different structure than ThemeContribution.
 * This is a known mismatch that will be resolved in schema alignment work.
 */
export const minimalTheme: ThemeContribution =
  manifest.contributes.themes[0] as unknown as ThemeContribution;

/**
 * Plugin manifest.
 */
export { manifest };

/**
 * Default export for plugin loader.
 */
export default {
  manifest,
  themes: [minimalTheme],
};
