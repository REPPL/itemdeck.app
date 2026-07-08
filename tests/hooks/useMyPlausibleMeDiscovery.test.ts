/**
 * Tests for useMyPlausibleMeDiscovery cache-status lookup.
 *
 * Regression: discovery used to check cache status with a synthetic
 * "myplausibleme:<user>:<path>" key, while cache entries are keyed by the
 * sourceStore source.id — so isCached was always false. Discovery must
 * resolve the registered source for a collection and check by its id.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/lib/cardCache", () => ({
  isCollectionCached: vi.fn(() => Promise.resolve(false)),
}));

import { useMyPlausibleMeDiscovery } from "@/hooks/useMyPlausibleMeDiscovery";
import { isCollectionCached } from "@/lib/cardCache";
import { useSourceStore, type Source } from "@/stores/sourceStore";

const USERNAME = "TestUser";
const SOURCE_ID = "src_cached_1";

const registeredSource: Source = {
  id: SOURCE_ID,
  url: `https://cdn.jsdelivr.net/gh/${USERNAME}/MyPlausibleMe@main/data/collections/retro/games`,
  name: `${USERNAME}/retro/games`,
  addedAt: new Date(),
  sourceType: "myplausibleme",
  mpmUsername: USERNAME,
  mpmFolder: "retro/games",
};

const treeResponse = {
  sha: "abc",
  truncated: false,
  tree: [
    {
      path: "data/collections/retro/games/collection.json",
      type: "blob",
      sha: "def",
    },
    {
      path: "data/collections/books/collection.json",
      type: "blob",
      sha: "ghi",
    },
  ],
};

function mockFetch(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("api.github.com")) {
        return Promise.resolve(
          new Response(JSON.stringify(treeResponse), { status: 200 })
        );
      }

      if (url.endsWith("/collection.json")) {
        return Promise.resolve(
          new Response(JSON.stringify({ name: "Some Collection" }), {
            status: 200,
          })
        );
      }

      return Promise.resolve(new Response("not found", { status: 404 }));
    })
  );
}

describe("useMyPlausibleMeDiscovery cache status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch();

    useSourceStore.setState({
      sources: [registeredSource],
      activeSourceId: SOURCE_ID,
      defaultSourceId: SOURCE_ID,
    });

    // Only the registered source's id is cached
    vi.mocked(isCollectionCached).mockImplementation((sourceId: string) =>
      Promise.resolve(sourceId === SOURCE_ID)
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports isCached=true via the registered source.id", async () => {
    const { result } = renderHook(() => useMyPlausibleMeDiscovery(USERNAME));

    await waitFor(
      () => {
        expect(result.current.collections).toHaveLength(2);
      },
      { timeout: 3000 }
    );

    const cached = result.current.collections.find(
      (c) => c.folder === "retro/games"
    );
    expect(cached?.isCached).toBe(true);

    // The lookup must use the sourceStore id convention
    expect(isCollectionCached).toHaveBeenCalledWith(SOURCE_ID);
  });

  it("reports isCached=false for collections with no registered source", async () => {
    const { result } = renderHook(() => useMyPlausibleMeDiscovery(USERNAME));

    await waitFor(
      () => {
        expect(result.current.collections).toHaveLength(2);
      },
      { timeout: 3000 }
    );

    const unregistered = result.current.collections.find(
      (c) => c.folder === "books"
    );
    expect(unregistered?.isCached).toBe(false);
  });
});
