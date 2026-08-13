/**
 * Persistence-migration tests for the source store.
 *
 * A store-version bump with no `migrate` made zustand hand `undefined` to the
 * store's `merge`, which threw dereferencing `.sources`; the throw was
 * swallowed, so every configured source silently vanished on the upgrade.
 *
 * The global test setup stubs localStorage with inert vi.fn()s. The store's
 * persist captured that object by reference at import, so giving those stubs a
 * real backing map here makes the store read and write the same storage.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSourceStore } from "@/stores/sourceStore";

const STORAGE_KEY = "itemdeck-sources";

describe("sourceStore persistence migration", () => {
  let backing: Record<string, string>;

  beforeEach(async () => {
    backing = {};
    const ls = localStorage as unknown as Record<string, ReturnType<typeof vi.fn>>;
    ls.getItem.mockImplementation((k: string) =>
      k in backing ? backing[k] : null
    );
    ls.setItem.mockImplementation((k: string, v: string) => {
      backing[k] = String(v);
    });
    ls.removeItem.mockImplementation((k: string) => {
      delete backing[k];
    });
    ls.clear.mockImplementation(() => {
      backing = {};
    });

    // Flush the import-time hydration so its trailing write cannot race the
    // payload we install below.
    await useSourceStore.persist.rehydrate();
  });

  it("keeps configured sources when the persisted version is older", async () => {
    const custom = {
      id: "src_custom",
      url: "https://cdn.jsdelivr.net/gh/user/repo@main/data/collections/demo",
      name: "My Collection",
      addedAt: new Date(0).toISOString(),
    };
    backing[STORAGE_KEY] = JSON.stringify({
      state: {
        sources: [custom],
        activeSourceId: "src_custom",
        defaultSourceId: "src_custom",
      },
      // Older than the current STORE_VERSION.
      version: 2,
    });

    await useSourceStore.persist.rehydrate();

    const state = useSourceStore.getState();
    expect(state.sources.find((s) => s.id === "src_custom")).toBeDefined();
    expect(state.activeSourceId).toBe("src_custom");
  });
});
