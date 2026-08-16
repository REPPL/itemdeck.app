/**
 * Tests for the one-shot application of a collection's settings.json
 * `defaults`.
 *
 * A collection's `defaults` are a courtesy: they seed the user's settings the
 * FIRST time that source is seen and must never be re-applied afterwards, or a
 * source could silently undo the user's own later choices. Remembering only
 * the most recent source made that guarantee collapse as soon as two sources
 * that both ship defaults were alternated between, so the applied set is
 * tracked per source.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";
import type { CollectionSettings } from "@/types/collectionSettings";

const STORAGE_KEY = "itemdeck-settings";

function getSetItemMock() {
  return vi.mocked(window.localStorage.setItem);
}

function getGetItemMock() {
  return vi.mocked(window.localStorage.getItem);
}

function lastPersistedState(): Record<string, unknown> {
  const writes = getSetItemMock().mock.calls.filter(
    ([key]) => key === STORAGE_KEY
  );
  const lastWrite = writes[writes.length - 1];
  if (!lastWrite) throw new Error("expected a persisted write");
  const parsed = JSON.parse(lastWrite[1]) as {
    state: Record<string, unknown>;
  };
  return parsed.state;
}

const SOURCE_A = "https://cdn.jsdelivr.net/gh/a/MyPlausibleMe@main/x";
const SOURCE_B = "https://cdn.jsdelivr.net/gh/b/MyPlausibleMe@main/y";

const A_DEFAULTS: CollectionSettings = {
  defaults: { visualTheme: "retro", cardSizePreset: "small" },
};
const B_DEFAULTS: CollectionSettings = {
  defaults: { visualTheme: "minimal", cardSizePreset: "large" },
};

describe("settingsStore - collection defaults are applied once per source", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    getSetItemMock().mockClear();
    getGetItemMock().mockReset();
  });

  it("does not re-apply a source's defaults when alternating A → B → A", () => {
    // First visit to A seeds A's defaults.
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
    expect(useSettingsStore.getState().visualTheme).toBe("retro");

    // The user visits B, which seeds its own defaults.
    useSettingsStore.getState().applyCollectionSettings(SOURCE_B, B_DEFAULTS);
    expect(useSettingsStore.getState().visualTheme).toBe("minimal");

    // The user then makes deliberate choices of their own.
    useSettingsStore.getState().setVisualTheme("modern");
    useSettingsStore.getState().setCardSizePreset("medium");

    // Returning to A must NOT re-apply A's one-shot defaults.
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);

    const state = useSettingsStore.getState();
    expect(state.visualTheme).toBe("modern");
    expect(state.cardSizePreset).toBe("medium");
  });

  it("survives repeated alternation between two sources that ship defaults", () => {
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
    useSettingsStore.getState().applyCollectionSettings(SOURCE_B, B_DEFAULTS);

    useSettingsStore.getState().setVisualTheme("modern");
    useSettingsStore.getState().setMaxVisibleCards(7);

    for (let i = 0; i < 5; i++) {
      useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
      useSettingsStore.getState().applyCollectionSettings(SOURCE_B, B_DEFAULTS);
    }

    const state = useSettingsStore.getState();
    expect(state.visualTheme).toBe("modern");
    expect(state.maxVisibleCards).toBe(7);
  });

  it("still skips a re-apply of the same source's defaults", () => {
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
    useSettingsStore.getState().setVisualTheme("modern");

    // A refetch of the same source (settings.json is not pinned).
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);

    expect(useSettingsStore.getState().visualTheme).toBe("modern");
    expect(
      useSettingsStore.getState().appliedCollectionDefaultsSourceIds
    ).toEqual([SOURCE_A]);
  });

  it("tracks each source that has had its defaults applied", () => {
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
    useSettingsStore.getState().applyCollectionSettings(SOURCE_B, B_DEFAULTS);

    expect(
      useSettingsStore.getState().appliedCollectionDefaultsSourceIds
    ).toEqual([SOURCE_A, SOURCE_B]);
  });

  it("caps the tracked source ids, evicting the oldest first", () => {
    for (let i = 0; i < 55; i++) {
      useSettingsStore
        .getState()
        .applyCollectionSettings(`https://example.com/s${i}`, A_DEFAULTS);
    }

    const tracked =
      useSettingsStore.getState().appliedCollectionDefaultsSourceIds;
    expect(tracked).toHaveLength(50);
    expect(tracked).not.toContain("https://example.com/s0");
    expect(tracked[tracked.length - 1]).toBe("https://example.com/s54");
  });

  it("is not cleared by restoreCollectionForcedSettings", () => {
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, {
      ...A_DEFAULTS,
      forced: { cardBackDisplay: "none" },
    });

    useSettingsStore.getState().restoreCollectionForcedSettings();

    expect(
      useSettingsStore.getState().appliedCollectionDefaultsSourceIds
    ).toEqual([SOURCE_A]);

    // And the restored source still cannot re-seed its defaults.
    useSettingsStore.getState().setVisualTheme("modern");
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
    expect(useSettingsStore.getState().visualTheme).toBe("modern");
  });

  it("persists the tracked source ids", () => {
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);

    expect(lastPersistedState().appliedCollectionDefaultsSourceIds).toEqual([
      SOURCE_A,
    ]);
  });

  it("migrates a version 27 scalar source id to a one-element array", async () => {
    getGetItemMock().mockReturnValue(
      JSON.stringify({
        state: { appliedCollectionDefaultsSourceId: SOURCE_A },
        version: 27,
      })
    );

    await useSettingsStore.persist.rehydrate();

    const state = useSettingsStore.getState() as unknown as Record<
      string,
      unknown
    >;
    expect(state.appliedCollectionDefaultsSourceIds).toEqual([SOURCE_A]);
    expect(state.appliedCollectionDefaultsSourceId).toBeUndefined();

    // The migrated source keeps its one-shot guarantee.
    useSettingsStore.getState().setVisualTheme("modern");
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
    expect(useSettingsStore.getState().visualTheme).toBe("modern");
  });

  it("migrates a version 27 null source id to an empty array", async () => {
    getGetItemMock().mockReturnValue(
      JSON.stringify({
        state: { appliedCollectionDefaultsSourceId: null },
        version: 27,
      })
    );

    await useSettingsStore.persist.rehydrate();

    expect(
      useSettingsStore.getState().appliedCollectionDefaultsSourceIds
    ).toEqual([]);
  });

  it("normalises a tampered persisted value to an empty array", async () => {
    // localStorage is attacker-adjacent: a non-array value must not survive
    // into the store, where `.includes` would throw on every collection load.
    getGetItemMock().mockReturnValue(
      JSON.stringify({
        state: { appliedCollectionDefaultsSourceIds: { evil: true } },
        version: 28,
      })
    );

    await useSettingsStore.persist.rehydrate();

    expect(
      useSettingsStore.getState().appliedCollectionDefaultsSourceIds
    ).toEqual([]);

    // The store is still functional afterwards.
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, A_DEFAULTS);
    expect(useSettingsStore.getState().visualTheme).toBe("retro");
  });
});
