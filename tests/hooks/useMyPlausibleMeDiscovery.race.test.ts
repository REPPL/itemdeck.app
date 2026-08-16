/**
 * Tests for useMyPlausibleMeDiscovery run cancellation.
 *
 * Regression: discovery had no generation guard, so a slow scan for username A
 * (one GitHub tree fetch plus up to 200 jsDelivr metadata fetches) could land
 * after a newer scan for username B and replace B's results with A's — or wipe
 * them with a stale error. The picker then paired the CURRENT username with a
 * STALE collection folder and persisted a permanently-404ing source.
 *
 * Each discovery run must be tagged, and every state write from a superseded
 * run must be dropped — including during the sub-debounce window, where the
 * newer run has not started yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

vi.mock("@/lib/cardCache", () => ({
  isCollectionCached: vi.fn(() => Promise.resolve(false)),
}));

import { useMyPlausibleMeDiscovery } from "@/hooks/useMyPlausibleMeDiscovery";
import { isCollectionCached } from "@/lib/cardCache";
import { useSourceStore } from "@/stores/sourceStore";

const SLOW_USER = "slowuser";
const FAST_USER = "fastuser";
const OTHER_USER = "otheruser";

/** Debounce window inside the hook. */
const DEBOUNCE_MS = 500;

/** Build a single-collection tree response for a username. */
function treeFor(folder: string) {
  return {
    sha: "sha-tree",
    truncated: false,
    tree: [
      {
        path: `data/collections/${folder}/collection.json`,
        type: "blob" as const,
        sha: "sha-blob",
      },
    ],
  };
}

/** Extract the repository owner from either the API or the CDN URL. */
function usernameFrom(url: string): string {
  const apiMatch = /api\.github\.com\/repos\/([^/]+)\//.exec(url);
  if (apiMatch?.[1]) return apiMatch[1];
  return /\/gh\/([^/]+)\//.exec(url)?.[1] ?? "";
}

/** Metadata fetches issued for the slow username. */
let slowMetadataRequests = 0;
/** Releases the slow username's pending metadata fetches. */
let releaseSlowMetadata: () => void = () => undefined;

function mockFetch(): void {
  slowMetadataRequests = 0;
  const gate = new Promise<void>((resolve) => {
    releaseSlowMetadata = resolve;
  });

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const user = usernameFrom(url);

      if (url.includes("api.github.com")) {
        return new Response(JSON.stringify(treeFor(`${user}-collection`)), {
          status: 200,
        });
      }

      if (url.endsWith("/collection.json")) {
        if (user === SLOW_USER) {
          slowMetadataRequests += 1;
          await gate;
        }
        return new Response(JSON.stringify({ name: `${user} collection` }), {
          status: 200,
        });
      }

      return new Response("not found", { status: 404 });
    })
  );
}

/** Let pending microtasks and timers settle inside React's act() scope. */
async function settle(ms: number): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe("useMyPlausibleMeDiscovery cancels superseded runs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch();
    useSourceStore.setState({
      sources: [],
      activeSourceId: null,
      defaultSourceId: null,
    });
    vi.mocked(isCollectionCached).mockResolvedValue(false);
  });

  afterEach(() => {
    releaseSlowMetadata();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps the newest username's results when an older scan finishes last", async () => {
    const { result, rerender } = renderHook(
      ({ user }: { user: string }) => useMyPlausibleMeDiscovery(user),
      { initialProps: { user: SLOW_USER } }
    );

    // The slow scan has started and is parked on its metadata fetch.
    await waitFor(
      () => {
        expect(slowMetadataRequests).toBe(1);
      },
      { timeout: 3000 }
    );

    rerender({ user: FAST_USER });

    // The newer scan completes end to end.
    await waitFor(
      () => {
        expect(result.current.collections.map((c) => c.folder)).toEqual([
          `${FAST_USER}-collection`,
        ]);
      },
      { timeout: 3000 }
    );

    // Now the superseded scan finally resolves; it must not write anything.
    releaseSlowMetadata();
    await settle(200);

    expect(result.current.collections.map((c) => c.folder)).toEqual([
      `${FAST_USER}-collection`,
    ]);
    expect(result.current.error).toBeNull();
  });

  it("drops a superseded scan that resolves inside the debounce window", async () => {
    const { result, rerender } = renderHook(
      ({ user }: { user: string }) => useMyPlausibleMeDiscovery(user),
      { initialProps: { user: SLOW_USER } }
    );

    await waitFor(
      () => {
        expect(slowMetadataRequests).toBe(1);
      },
      { timeout: 3000 }
    );

    // Switch usernames, then let the old scan finish before the new scan's
    // debounce has even elapsed — nothing has superseded it yet by arrival.
    rerender({ user: OTHER_USER });
    releaseSlowMetadata();
    await settle(DEBOUNCE_MS / 5);

    expect(result.current.collections).toEqual([]);

    // The new scan still lands normally.
    await waitFor(
      () => {
        expect(result.current.collections.map((c) => c.folder)).toEqual([
          `${OTHER_USER}-collection`,
        ]);
      },
      { timeout: 3000 }
    );
  });

  it("tags each discovered collection with the username it was scanned from", async () => {
    const { result } = renderHook(() => useMyPlausibleMeDiscovery(FAST_USER));

    await waitFor(
      () => {
        expect(result.current.collections).toHaveLength(1);
      },
      { timeout: 3000 }
    );

    expect(result.current.collections[0]?.username).toBe(FAST_USER);
  });
});
