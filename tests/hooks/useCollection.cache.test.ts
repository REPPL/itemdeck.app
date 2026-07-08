/**
 * Tests for useCollection cache behavior (offline/caching subsystem).
 *
 * Covers:
 * - Cache writes are keyed by the sourceStore source.id (canonical convention
 *   shared with LoadingScreen, CacheIndicator, and useUpdateChecker).
 * - Cache writes respect cache consent (settingsStore.hasCacheConsent).
 * - Offline fallback: when the fetch fails and a cached copy exists,
 *   the cached collection is returned with isStale=true.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

vi.mock("@/loaders", () => ({
  loadCollection: vi.fn(),
  createResolverContext: vi.fn(() => ({})),
  resolveAllRelationships: vi.fn(() => [
    { id: "g1", title: "Game One" },
  ]),
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
import { loadCollection } from "@/loaders";
import {
  cacheCollection,
  getCachedCollection,
  isCollectionCached,
} from "@/lib/cardCache";
import { useSourceStore, type Source } from "@/stores/sourceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Collection } from "@/schemas";

const SOURCE_ID = "src_test_1";
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

const loadedFixture = {
  definition: {},
  entities: {},
  primaryType: "game",
};

const cachedCollectionFixture: Collection = {
  items: [
    {
      id: "g1",
      title: "Cached Game",
      imageUrl: "https://example.com/img.png",
      imageUrls: ["https://example.com/img.png"],
      metadata: { order: "1" },
    },
  ],
  categories: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

/** Flush pending microtasks and short timers (fire-and-forget cache writes). */
async function flushAsync(ms = 50): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

describe("useCollection cache behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useSourceStore.setState({
      sources: [testSource],
      activeSourceId: SOURCE_ID,
      defaultSourceId: SOURCE_ID,
    });

    useSettingsStore.setState({
      cacheConsentPreference: "always",
      cacheConsentGranted: [],
      cacheConsentDenied: [],
    });

    vi.mocked(loadCollection).mockResolvedValue(
      loadedFixture as never
    );
    vi.mocked(isCollectionCached).mockResolvedValue(false);
    vi.mocked(getCachedCollection).mockResolvedValue(null);
  });

  it("writes cache entries keyed by the sourceStore source.id", async () => {
    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    await waitFor(() => {
      expect(cacheCollection).toHaveBeenCalled();
    });

    // Canonical convention: sourceStore source.id, NOT a slug of the URL
    expect(vi.mocked(cacheCollection).mock.calls[0]?.[0]).toBe(SOURCE_ID);
    expect(isCollectionCached).toHaveBeenCalledWith(SOURCE_ID);
  });

  it("does not write to the cache when consent preference is 'never'", async () => {
    useSettingsStore.setState({ cacheConsentPreference: "never" });

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    await flushAsync();

    expect(cacheCollection).not.toHaveBeenCalled();
  });

  it("does not write to the cache in 'ask' mode without a per-source grant", async () => {
    useSettingsStore.setState({ cacheConsentPreference: "ask" });

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    await flushAsync();

    expect(cacheCollection).not.toHaveBeenCalled();
  });

  it("writes to the cache in 'ask' mode when the source has been granted consent", async () => {
    useSettingsStore.setState({
      cacheConsentPreference: "ask",
      cacheConsentGranted: [SOURCE_ID],
    });

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    await waitFor(() => {
      expect(cacheCollection).toHaveBeenCalledWith(
        SOURCE_ID,
        expect.anything()
      );
    });
  });

  it("falls back to the cached collection with isStale=true when the fetch fails", async () => {
    vi.mocked(loadCollection).mockRejectedValue(new Error("network down"));
    vi.mocked(getCachedCollection).mockResolvedValue(cachedCollectionFixture);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getCachedCollection).toHaveBeenCalledWith(SOURCE_ID);
    expect(result.current.data?.isStale).toBe(true);
    expect(result.current.data?.cards).toHaveLength(1);
    expect(result.current.data?.cards[0]?.title).toBe("Cached Game");
    expect(result.current.data?.cards[0]?.order).toBe(1);
  });

  it("surfaces the fetch error when there is no cached fallback", async () => {
    vi.mocked(loadCollection).mockRejectedValue(new Error("network down"));
    vi.mocked(getCachedCollection).mockResolvedValue(null);

    const { result } = renderHook(
      () => useLocalCollection({ basePath: SOURCE_URL }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("network down");
  });
});
