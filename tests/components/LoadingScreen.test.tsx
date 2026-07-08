/**
 * Tests for LoadingScreen completion behaviour.
 *
 * Covers two permanent-hang defects:
 * 1. A validly loaded zero-card collection must complete the loading
 *    flow (fire onComplete) instead of hanging on "Loading collection...".
 * 2. A rejected image preload must not strand the screen in the
 *    "Caching..." phase; loading completes anyway.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactElement } from "react";
import { render, waitFor, screen, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoadingScreen } from "@/components/LoadingScreen/LoadingScreen";
import { useSourceStore } from "@/stores/sourceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import type { DisplayCard } from "@/hooks/useCollection";

/** Render inside a QueryClientProvider (LoadingScreen calls useQueryClient). */
function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const utils = render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
  return { ...utils, queryClient, invalidateSpy };
}

// Mutable state returned by the mocked useCollectionData hook
const collectionDataState = {
  cards: [] as DisplayCard[],
  displayConfig: undefined,
  config: undefined,
  collection: undefined,
  isLoading: false,
  error: null as Error | null,
};

vi.mock("@/context/CollectionDataContext", () => ({
  useCollectionData: () => collectionDataState,
}));

// Controllable image preloader mock
const preloadMock = vi.fn<(urls: string[]) => Promise<number>>();

vi.mock("@/hooks/useImageCache", () => ({
  useImagePreloader: () => ({
    preload: preloadMock,
    isPreloading: false,
    progress: { completed: 0, total: 0 },
    progressPercent: 0,
  }),
}));

vi.mock("@/hooks/useOnlineStatus", () => ({
  useOnlineStatus: () => true,
}));

vi.mock("@/lib/cardCache", () => ({
  isCollectionCached: vi.fn().mockResolvedValue(false),
  listCachedCollections: vi.fn().mockResolvedValue([]),
}));

// Capture the consent dialog's props so tests can drive Allow/Deny.
const consentDialogProps = {
  open: false,
  onAllow: undefined as undefined | (() => void),
  onDeny: undefined as undefined | (() => void),
};

vi.mock("@/components/CacheConsentDialog", () => ({
  CacheConsentDialog: (props: { isOpen?: boolean; onAllow: () => void; onDeny: () => void }) => {
    consentDialogProps.open = props.isOpen ?? true;
    consentDialogProps.onAllow = props.onAllow;
    consentDialogProps.onDeny = props.onDeny;
    return null;
  },
}));

const SOURCE_ID = "src_1700000000000_test";

function makeCard(overrides: Partial<DisplayCard> = {}): DisplayCard {
  return {
    id: "card-1",
    title: "Test Card",
    imageUrl: "https://example.com/img-1.png",
    imageUrls: ["https://example.com/img-1.png"],
    order: null,
    ...overrides,
  } as DisplayCard;
}

beforeEach(() => {
  vi.clearAllMocks();
  preloadMock.mockResolvedValue(0);

  collectionDataState.cards = [];
  collectionDataState.isLoading = false;
  collectionDataState.error = null;

  // Seed real zustand stores
  useSourceStore.setState({
    sources: [
      {
        id: SOURCE_ID,
        url: "https://example.com/collection",
        name: "Test Collection",
        addedAt: new Date(),
      },
    ],
    activeSourceId: SOURCE_ID,
  });

  // "always" consent: no consent dialog, cache writes allowed
  useSettingsStore.setState({ cacheConsentPreference: "always" });
});

describe("LoadingScreen completion", () => {
  it("fires onComplete for a loaded collection with zero cards", async () => {
    const onComplete = vi.fn();
    collectionDataState.cards = [];
    collectionDataState.isLoading = false;

    renderWithClient(<LoadingScreen onComplete={onComplete} minDisplayTime={0} />);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it("fires onComplete even when image preloading rejects", async () => {
    const onComplete = vi.fn();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    preloadMock.mockRejectedValue(new Error("network down"));

    collectionDataState.cards = [makeCard()];
    collectionDataState.isLoading = false;

    renderWithClient(<LoadingScreen onComplete={onComplete} minDisplayTime={0} />);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(preloadMock).toHaveBeenCalledWith(["https://example.com/img-1.png"]);

    consoleErrorSpy.mockRestore();
  });

  it("does not fire onComplete while the collection is still loading", async () => {
    const onComplete = vi.fn();
    collectionDataState.cards = [];
    collectionDataState.isLoading = true;

    renderWithClient(<LoadingScreen onComplete={onComplete} minDisplayTime={0} />);

    // Give any erroneous completion timer a chance to fire
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("shows the error state instead of completing when loading fails", async () => {
    const onComplete = vi.fn();
    collectionDataState.cards = [];
    collectionDataState.isLoading = false;
    collectionDataState.error = new Error("boom");

    renderWithClient(<LoadingScreen onComplete={onComplete} minDisplayTime={0} />);

    expect(screen.getByText("Failed to load collection")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("LoadingScreen cache consent (ask mode)", () => {
  beforeEach(() => {
    // "ask" mode with no prior consent for this external source
    useSettingsStore.setState({
      cacheConsentPreference: "ask",
      cacheConsentGranted: [],
      cacheConsentDenied: [],
    });
  });

  it("opens the consent dialog even for an image-less collection", async () => {
    const onComplete = vi.fn();
    // Card with no image URLs: the old code required imageUrls.length > 0
    // to ever reach the consent phase, so this collection could never be
    // cached in ask mode.
    collectionDataState.cards = [
      makeCard({ imageUrl: undefined, imageUrls: [] }),
    ];
    collectionDataState.isLoading = false;

    renderWithClient(<LoadingScreen onComplete={onComplete} minDisplayTime={0} />);

    await waitFor(() => {
      expect(consentDialogProps.open).toBe(true);
    });
    // Must wait on the user's consent choice, not silently complete
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("invalidates the collection query when consent is granted so the JSON is cached", async () => {
    const onComplete = vi.fn();
    collectionDataState.cards = [makeCard({ imageUrl: undefined, imageUrls: [] })];
    collectionDataState.isLoading = false;

    const { invalidateSpy } = renderWithClient(
      <LoadingScreen onComplete={onComplete} minDisplayTime={0} />
    );

    await waitFor(() => {
      expect(consentDialogProps.onAllow).toBeTypeOf("function");
    });

    act(() => {
      consentDialogProps.onAllow?.();
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["collections"] });
    });
    // Image-less collection still completes after consent
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
