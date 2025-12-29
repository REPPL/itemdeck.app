/**
 * Snap Ranking mechanic plugin entry point.
 *
 * Re-exports the existing snap-ranking mechanic implementation.
 *
 * @plugin org.itemdeck.mechanic-snap-ranking
 */

import manifest from "./manifest.json";
import { snapRankingMechanic } from "@/mechanics/snap-ranking";
import type { MechanicContribution } from "@/plugins/schemas/contributions/mechanic";

/**
 * Mechanic contribution for snap ranking.
 * Note: The manifest uses a slightly different structure than MechanicContribution.
 * This is a known mismatch that will be resolved in schema alignment work.
 */
export const snapRankingContribution: MechanicContribution =
  manifest.contributes.mechanics[0] as unknown as MechanicContribution;

/**
 * Plugin manifest.
 */
export { manifest };

/**
 * Re-export the mechanic implementation.
 */
export { snapRankingMechanic };

/**
 * Default export for plugin loader.
 */
export default {
  manifest,
  mechanics: [snapRankingContribution],
  implementation: snapRankingMechanic,
};
