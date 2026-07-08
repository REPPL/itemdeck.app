/**
 * Tests for useUpdateChecker / useUpdateCheckerAll.
 *
 * Regression: performCheck used to depend on the source OBJECT from the
 * store; every check called setSourceUpdateCheck, which rebuilt the object,
 * which re-fired the effect — a self-triggering loop hammering the GitHub
 * API. The hooks must run exactly ONE check when nothing but the store's
 * own update-check bookkeeping changes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

vi.mock("@/services/updateChecker", () => ({
  checkForUpdates: vi.fn(),
}));

vi.mock("@/lib/cardCache", () => ({
  getCacheMetadata: vi.fn(() =>
    Promise.resolve({ exists: false, status: "none" })
  ),
}));

import { useUpdateChecker, useUpdateCheckerAll } from "@/hooks/useUpdateChecker";
import { checkForUpdates } from "@/services/updateChecker";
import { useSourceStore, type Source } from "@/stores/sourceStore";

const SOURCE_ID = "src_check_1";

/**
 * checkForUpdates mock that yields to the macrotask queue.
 *
 * A purely microtask-resolved mock would let a self-triggering check loop
 * starve the event loop and hang the test instead of failing it.
 */
function mockCheckResult(): void {
  vi.mocked(checkForUpdates).mockImplementation(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
    return {
      hasUpdate: true,
      remoteTimestamp: 1234567890,
      checkedAt: new Date(),
    };
  });
}

const testSource: Source = {
  id: SOURCE_ID,
  url: "https://cdn.jsdelivr.net/gh/user/MyPlausibleMe@main/data/collections/retro/games",
  name: "user/retro/games",
  addedAt: new Date(),
  sourceType: "myplausibleme",
  mpmUsername: "user",
  mpmFolder: "retro/games",
};

/** Let any (erroneous) re-triggered checks run before counting. */
async function settle(ms = 150): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

describe("useUpdateChecker", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useSourceStore.setState({
      sources: [testSource],
      activeSourceId: SOURCE_ID,
      defaultSourceId: SOURCE_ID,
    });

    mockCheckResult();
  });

  it("runs exactly one check on mount (no self-triggering loop)", async () => {
    const { unmount } = renderHook(() => useUpdateChecker(SOURCE_ID));

    await waitFor(() => {
      expect(checkForUpdates).toHaveBeenCalledTimes(1);
    });

    // Give a buggy implementation time to loop before asserting
    await settle();
    unmount();

    expect(checkForUpdates).toHaveBeenCalledTimes(1);
  });

  it("reflects the check result from the store", async () => {
    const { result, unmount } = renderHook(() => useUpdateChecker(SOURCE_ID));

    await waitFor(() => {
      expect(result.current.hasUpdate).toBe(true);
    });

    const stored = useSourceStore.getState().getSource(SOURCE_ID);
    expect(stored?.remoteLastModified).toBe(1234567890);
    expect(stored?.lastRemoteCheck).toBeInstanceOf(Date);

    unmount();
  });

  it("does nothing for an unknown source id", async () => {
    const { unmount } = renderHook(() => useUpdateChecker("src_missing"));

    await settle(50);
    unmount();

    expect(checkForUpdates).not.toHaveBeenCalled();
  });
});

describe("useUpdateCheckerAll", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useSourceStore.setState({
      sources: [testSource],
      activeSourceId: SOURCE_ID,
      defaultSourceId: SOURCE_ID,
    });

    mockCheckResult();
  });

  it("runs exactly one check per source on mount (no self-triggering loop)", async () => {
    const { result, unmount } = renderHook(() => useUpdateCheckerAll());

    await waitFor(() => {
      expect(checkForUpdates).toHaveBeenCalledTimes(1);
    });

    // Give a buggy implementation time to loop before asserting
    await settle();

    expect(checkForUpdates).toHaveBeenCalledTimes(1);
    expect(result.current.sourcesWithUpdates).toHaveLength(1);

    unmount();
  });
});
