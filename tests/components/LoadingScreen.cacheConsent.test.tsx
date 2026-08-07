/**
 * The loading screen must not preload images when caching was declined.
 *
 * "Never cache" only suppressed the consent prompt: preloading still fetched
 * every image from the third-party host and wrote it to IndexedDB, leaving
 * the setting weaker than declining once.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const preload = vi.fn(() => Promise.resolve(0));

vi.mock("@/context/CollectionDataContext", () => ({
  useCollectionData: () => ({
    cards: [
      { id: "a", imageUrls: ["https://cdn.example.com/a.png"] },
      { id: "b", imageUrls: ["https://cdn.example.com/b.png"] },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/hooks/useImageCache", () => ({
  useImagePreloader: () => ({
    preload,
    isPreloading: false,
    progressPercent: 0,
  }),
}));

vi.mock("@/lib/cardCache", () => ({
  isCollectionCached: () => Promise.resolve(false),
  listCachedCollections: () => Promise.resolve([]),
}));

import { LoadingScreen } from "@/components/LoadingScreen/LoadingScreen";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSourceStore } from "@/stores/sourceStore";

/** Point the source store at one external (non built-in) source. */
function useExternalSource() {
  useSourceStore.setState({
    activeSourceId: "src-1",
    sources: [
      {
        id: "src-1",
        name: "Remote",
        url: "https://cdn.jsdelivr.net/gh/someone/repo@main/data",
        isBuiltIn: false,
      },
    ],
  } as unknown as Parameters<typeof useSourceStore.setState>[0]);
}

function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LoadingScreen minDisplayTime={0} />
    </QueryClientProvider>
  );
}

describe("LoadingScreen cache consent", () => {
  beforeEach(() => {
    preload.mockClear();
    useExternalSource();
  });

  it("does not preload images when the visitor chose never", async () => {
    useSettingsStore.setState({ cacheConsentPreference: "never" });

    renderScreen();

    // Give the effects a chance to run; preload must never be called.
    await waitFor(() => {
      expect(preload).not.toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(preload).not.toHaveBeenCalled();
  });

  it("preloads images when the visitor chose always", async () => {
    useSettingsStore.setState({ cacheConsentPreference: "always" });

    renderScreen();

    await waitFor(() => {
      expect(preload).toHaveBeenCalled();
    });
  });
});
