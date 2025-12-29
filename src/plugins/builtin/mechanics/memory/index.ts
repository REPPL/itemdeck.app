/**
 * Memory mechanic plugin entry point.
 *
 * Re-exports the existing memory mechanic implementation.
 *
 * @plugin org.itemdeck.mechanic-memory
 */

import manifest from "./manifest.json";
import { memoryMechanic } from "@/mechanics/memory";
import type { MechanicContribution } from "@/plugins/schemas/contributions/mechanic";

/**
 * Mechanic contribution for memory game.
 * Note: The manifest uses a slightly different structure than MechanicContribution.
 * This is a known mismatch that will be resolved in schema alignment work.
 */
export const memoryContribution: MechanicContribution =
  manifest.contributes.mechanics[0] as unknown as MechanicContribution;

/**
 * Plugin manifest.
 */
export { manifest };

/**
 * Re-export the mechanic implementation.
 */
export { memoryMechanic };

/**
 * Default export for plugin loader.
 */
export default {
  manifest,
  mechanics: [memoryContribution],
  implementation: memoryMechanic,
};
