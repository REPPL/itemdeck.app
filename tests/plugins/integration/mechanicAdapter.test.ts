/**
 * Tests for mechanic adapter entrypoint gating.
 *
 * Manifest-controlled entrypoints must never reach dynamic import()
 * unless they are on the hardcoded builtin allowlist.
 */

import { describe, it, expect } from "vitest";
import { mechanicAdapter } from "@/plugins/integration/mechanicAdapter";
import { mechanicRegistry } from "@/mechanics/registry";
import type { MechanicContribution } from "@/plugins/schemas/contributions/mechanic";

function makeContribution(
  overrides: Partial<MechanicContribution>
): MechanicContribution {
  return {
    id: "test-mechanic",
    name: "Test Mechanic",
    description: "A test mechanic",
    entrypoint: "@/mechanics/memory",
    minCards: 2,
    maxCards: 0,
    experimental: false,
    ...overrides,
  };
}

describe("mechanicAdapter entrypoint gating", () => {
  it("rejects a remote URL entrypoint and does not register it", () => {
    expect(() => {
      mechanicAdapter.registerFromPlugin(
        "org.hostile.remote",
        makeContribution({
          id: "hostile-remote",
          entrypoint: "https://evil.example.com/payload.js",
        })
      );
    }).toThrow(/allowlist/i);

    expect(mechanicRegistry.has("org.hostile.remote:hostile-remote")).toBe(
      false
    );
  });

  it("rejects a path-traversal entrypoint and does not register it", () => {
    expect(() => {
      mechanicAdapter.registerFromPlugin(
        "org.hostile.traversal",
        makeContribution({
          id: "hostile-traversal",
          entrypoint: "../../secrets/steal.js",
        })
      );
    }).toThrow(/allowlist/i);

    expect(
      mechanicRegistry.has("org.hostile.traversal:hostile-traversal")
    ).toBe(false);
  });

  it("accepts the builtin memory entrypoint", () => {
    mechanicAdapter.registerFromPlugin(
      "org.itemdeck.test-memory",
      makeContribution({ id: "memory-test", entrypoint: "@/mechanics/memory" })
    );

    expect(mechanicRegistry.has("org.itemdeck.test-memory:memory-test")).toBe(
      true
    );
  });

  it("accepts the builtin snap-ranking entrypoint", () => {
    mechanicAdapter.registerFromPlugin(
      "org.itemdeck.test-snap",
      makeContribution({
        id: "snap-test",
        entrypoint: "@/mechanics/snap-ranking",
      })
    );

    expect(mechanicRegistry.has("org.itemdeck.test-snap:snap-test")).toBe(true);
  });
});
