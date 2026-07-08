/**
 * Tests for buildCollectionUrl parameter encoding: hostile parameter
 * values must not reshape the CDN URL.
 */

import { describe, it, expect } from "vitest";
import { buildCollectionUrl } from "@/providers";

describe("buildCollectionUrl encoding", () => {
  it("builds the documented URL for plain params", () => {
    expect(
      buildCollectionUrl("gh", { u: "REPPL", collection: "commercials" })
    ).toBe(
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/commercials"
    );
  });

  it("keeps slashes in nested collection folders", () => {
    expect(
      buildCollectionUrl("gh", { u: "REPPL", collection: "retro/my_games" })
    ).toBe(
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro/my_games"
    );
  });

  it("encodes a hostile username containing '/' and '@'", () => {
    const url = buildCollectionUrl("gh", {
      u: "attacker/other-repo@evil",
      collection: "commercials",
    });

    expect(url).toBe(
      "https://cdn.jsdelivr.net/gh/attacker%2Fother-repo%40evil/MyPlausibleMe@main/data/collections/commercials"
    );
  });

  it("encodes hostile characters within collection segments but not the slashes", () => {
    const url = buildCollectionUrl("gh", {
      u: "REPPL",
      collection: "retro/my games#x",
    });

    expect(url).toBe(
      "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro/my%20games%23x"
    );
  });
});
