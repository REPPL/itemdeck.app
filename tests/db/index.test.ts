/**
 * Tests for the app IndexedDB helpers.
 *
 * Regression: deleteDB registered no `onblocked` handler, so a delete blocked
 * by another open connection never settled — hanging any caller that awaited
 * it (notably the hard reset). It must resolve on both success and block.
 */

import { describe, it, expect, vi, afterEach } from "vitest";

interface FakeRequest {
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  onblocked: (() => void) | null;
  error: { message: string } | null;
}

let lastRequest: FakeRequest | null;

function stubIndexedDB(): void {
  lastRequest = null;
  vi.stubGlobal("indexedDB", {
    deleteDatabase: vi.fn(() => {
      const request: FakeRequest = {
        onsuccess: null,
        onerror: null,
        onblocked: null,
        error: null,
      };
      lastRequest = request;
      return request;
    }),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("deleteDB", () => {
  it("resolves when the delete succeeds", async () => {
    stubIndexedDB();
    const { deleteDB } = await import("@/db");

    const promise = deleteDB();
    lastRequest?.onsuccess?.();

    await expect(promise).resolves.toBeUndefined();
  });

  it("resolves (does not hang) when the delete is blocked by another connection", async () => {
    stubIndexedDB();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { deleteDB } = await import("@/db");

    const promise = deleteDB();
    // Simulate another open connection blocking the delete: only onblocked
    // fires, never onsuccess. Without an onblocked handler this would never
    // settle.
    lastRequest?.onblocked?.();

    await expect(promise).resolves.toBeUndefined();
  });
});
