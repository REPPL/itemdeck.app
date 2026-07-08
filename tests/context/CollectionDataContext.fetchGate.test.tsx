/**
 * Tests that CollectionDataProvider does not fetch collection data
 * when no source is active (empty basePath).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CollectionDataProvider } from "@/context/CollectionDataContext";
import { useSourceStore } from "@/stores/sourceStore";

describe("CollectionDataProvider - fetch gating", () => {
  const fetchSpy = vi.fn(() =>
    Promise.reject(new Error("unexpected fetch"))
  );

  beforeEach(() => {
    fetchSpy.mockClear();
    vi.stubGlobal("fetch", fetchSpy);
    // Ensure no source is active
    useSourceStore.setState({
      sources: [],
      activeSourceId: null,
      defaultSourceId: null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch when no source is active", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CollectionDataProvider>
          <div>child</div>
        </CollectionDataProvider>
      </QueryClientProvider>
    );

    // Give the query time to fire if it were (incorrectly) enabled
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
