/**
 * Security/robustness tests: a single malformed entity from an untrusted
 * collection must not crash the whole collection load.
 *
 * Each case below threw a TypeError inside the entity→DisplayCard transform
 * before the fix, which propagated out of loadFreshCollection and failed the
 * entire query (isError) instead of degrading one card.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

// The resolved entities returned here are fed straight into the transform.
const resolvedEntities: Record<string, unknown>[] = [];

vi.mock("@/loaders", () => ({
  loadCollection: vi.fn(),
  createResolverContext: vi.fn(() => ({})),
  resolveAllRelationships: vi.fn(() => resolvedEntities),
  getEntityRank: vi.fn(() => null),
  getImageUrls: vi.fn(() => []),
  getPrimaryImage: vi.fn(() => undefined),
  getLogoUrl: vi.fn(() => undefined),
}));

vi.mock("@/loaders/settingsLoader", () => ({
  loadCollectionSettings: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/cardCache", () => ({
  cacheCollection: vi.fn(() => Promise.resolve()),
  isCollectionCached: vi.fn(() => Promise.resolve(false)),
  getCachedCollection: vi.fn(() => Promise.resolve(null)),
}));

import { useLocalCollection } from "@/hooks/useCollection";
import { loadCollection, getImageUrls } from "@/loaders";
import { useSourceStore, type Source } from "@/stores/sourceStore";
import { useSettingsStore } from "@/stores/settingsStore";

const SOURCE_ID = "src_untrusted_1";
const SOURCE_URL =
  "https://cdn.jsdelivr.net/gh/user/MyPlausibleMe@main/data/collections/retro/games";

const testSource: Source = {
  id: SOURCE_ID,
  url: SOURCE_URL,
  name: "user/retro/games",
  addedAt: new Date(),
  sourceType: "myplausibleme",
  mpmUsername: "user",
  mpmFolder: "retro/games",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

function setResolvedEntities(entities: Record<string, unknown>[]): void {
  resolvedEntities.length = 0;
  resolvedEntities.push(...entities);
}

describe("useCollection — malformed untrusted entities do not crash the load", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSourceStore.setState({
      sources: [testSource],
      activeSourceId: SOURCE_ID,
      defaultSourceId: SOURCE_ID,
    });
    useSettingsStore.setState({ cacheConsentPreference: "never" });
    vi.mocked(loadCollection).mockResolvedValue({
      definition: {},
      entities: {},
      primaryType: "game",
    } as never);
  });

  it('loads a card whose averageRating is null (no `"score" in null` crash)', async () => {
    setResolvedEntities([{ id: "g1", title: "Game One", averageRating: null }]);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.cards).toHaveLength(1);
    // null means "no rating", not a rating to normalise.
    expect(result.current.data?.cards[0]?.rating).toBeUndefined();
  });

  it("loads a card whose videos field is not an array (no `.map` crash)", async () => {
    setResolvedEntities([
      { id: "g1", title: "Game One", videos: "not-an-array" },
    ]);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.cards).toHaveLength(1);
  });

  it("loads a card whose resolved platform title is a number (no `.replace` crash)", async () => {
    setResolvedEntities([
      {
        id: "g1",
        title: "Game One",
        _resolved: { platform: { id: "p1", title: 1999 } },
      },
    ]);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.cards).toHaveLength(1);
  });

  it("coerces an object-typed summary to undefined (not a React-child object)", async () => {
    setResolvedEntities([
      { id: "g1", title: "Game One", summary: { en: "hello" } },
    ]);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    const card = result.current.data?.cards[0];
    // An object left as-is is truthy and would throw "Objects are not valid as
    // a React child" when rendered; it must be dropped to undefined.
    expect(typeof card?.summary).not.toBe("object");
    expect(card?.summary).toBeUndefined();
  });

  it("coerces object-typed platform shortTitle/title so the device badge cannot be an object", async () => {
    setResolvedEntities([
      {
        id: "g1",
        title: "Game One",
        _resolved: {
          platform: {
            id: "p1",
            title: { nested: "x" },
            shortTitle: { nested: "y" },
          },
        },
      },
    ]);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    const card = result.current.data?.cards[0];
    // `device` (categoryShort) and categoryTitle feed JSX children directly.
    expect(typeof card?.device).not.toBe("object");
    expect(card?.device).toBeUndefined();
    expect(typeof card?.categoryTitle).not.toBe("object");
    expect(card?.categoryTitle).toBeUndefined();
  });

  it("caps card.imageUrls for an entity listing a huge number of images", async () => {
    const hugeUrlList = Array.from(
      { length: 5000 },
      (_, i) => `https://cdn.jsdelivr.net/img/${String(i)}.png`
    );
    vi.mocked(getImageUrls).mockReturnValueOnce(hugeUrlList);
    setResolvedEntities([{ id: "g1", title: "Game One" }]);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    const card = result.current.data?.cards[0];
    // The gallery mounts one node per media item and the preloader fetches
    // each, so the combined media list must be bounded well below 5000.
    expect(card?.imageUrls.length).toBeLessThanOrEqual(100);
  });

  it("coerces object-typed platform summary/year in categoryInfo", async () => {
    setResolvedEntities([
      {
        id: "g1",
        title: "Game One",
        _resolved: {
          platform: {
            id: "p1",
            title: "Platform",
            summary: { en: "obj" },
            year: { not: "a-year" },
          },
        },
      },
    ]);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    const categoryInfo = result.current.data?.cards[0]?.categoryInfo;
    expect(typeof categoryInfo?.summary).not.toBe("object");
    expect(categoryInfo?.summary).toBeUndefined();
    expect(typeof categoryInfo?.year).not.toBe("object");
    expect(categoryInfo?.year).toBeUndefined();
  });
});
