/**
 * Tests for source adapter entrypoint gating.
 *
 * Manifest-controlled entrypoints must never reach dynamic import()
 * unless they are on the hardcoded builtin allowlist.
 */

import { describe, it, expect } from "vitest";
import { sourceAdapter } from "@/plugins/integration/sourceAdapter";
import type { SourceContribution } from "@/plugins/schemas/contributions/source";

function makeContribution(
  overrides: Partial<SourceContribution>
): SourceContribution {
  return {
    id: "test-source",
    name: "Test Source",
    type: "custom",
    supportsDiscovery: false,
    experimental: false,
    ...overrides,
  };
}

describe("sourceAdapter entrypoint gating", () => {
  it("rejects a remote URL entrypoint", async () => {
    await expect(
      sourceAdapter.registerFromPlugin(
        "org.hostile.remote",
        makeContribution({
          id: "hostile-remote",
          entrypoint: "https://evil.example.com/payload.js",
        })
      )
    ).rejects.toThrow(/allowlist/i);

    expect(sourceAdapter.isRegistered("org.hostile.remote:hostile-remote")).toBe(
      false
    );
  });

  it("rejects a path-traversal entrypoint", async () => {
    await expect(
      sourceAdapter.registerFromPlugin(
        "org.hostile.traversal",
        makeContribution({
          id: "hostile-traversal",
          entrypoint: "../../secrets/steal.js",
        })
      )
    ).rejects.toThrow(/allowlist/i);

    expect(
      sourceAdapter.isRegistered("org.hostile.traversal:hostile-traversal")
    ).toBe(false);
  });

  it("accepts the builtin github discovery entrypoint", async () => {
    await sourceAdapter.registerFromPlugin(
      "org.itemdeck.test-github",
      makeContribution({
        id: "github-test",
        type: "github",
        entrypoint: "@/loaders/githubDiscovery",
      })
    );

    expect(sourceAdapter.isRegistered("org.itemdeck.test-github:github-test")).toBe(
      true
    );
  });

  it("accepts contributions without an entrypoint (default loader)", async () => {
    await sourceAdapter.registerFromPlugin(
      "org.itemdeck.test-url",
      makeContribution({ id: "url-test", type: "url", entrypoint: undefined })
    );

    expect(sourceAdapter.isRegistered("org.itemdeck.test-url:url-test")).toBe(
      true
    );
  });
});
