/**
 * Mechanics system entry point.
 *
 * Registers all available mechanics and exports the API.
 */

import { mechanicRegistry } from "./registry";

// Register mechanics with lazy loading
mechanicRegistry.register("memory", async () => {
  const { memoryMechanic } = await import("./memory");
  return memoryMechanic;
});

// v0.12.5: Snap Ranking mechanic
mechanicRegistry.register("snap-ranking", async () => {
  const { snapRankingMechanic } = await import("./snap-ranking");
  return snapRankingMechanic;
});

// Export public API
export { mechanicRegistry } from "./registry";
export { MechanicProvider, useMechanicContext, useActiveMechanic, useMechanicState, useMechanicCardActions, useMechanicList } from "./context";
export type { Mechanic, MechanicManifest, MechanicState, CardActions, CardOverlayProps, GridOverlayProps, MechanicFactory } from "./types";
