/**
 * Tests for collection forced-settings backup/restore.
 *
 * A collection's `forced` settings are written into the user's persisted
 * global settings. Without a backup, viewing one hostile source once
 * permanently overwrites the user's own display config, with no revert path.
 * The store must snapshot the displaced values per source, restore them when
 * the source changes, and survive a crash via rehydration — mirroring the
 * mechanic-overrides backup.
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

describe("settingsStore - collection forced-settings backup/restore", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    getSetItemMock().mockClear();
    getGetItemMock().mockReset();
  });

  it("snapshots only the user's own values for keys the source forces", () => {
    // User's own settings.
    useSettingsStore.setState({
      cardBackDisplay: "logo",
      showRankBadge: true,
      showDeviceBadge: true,
    });

    const settings: CollectionSettings = {
      forced: { cardBackDisplay: "none", showRankBadge: false },
    };
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, settings);

    const state = useSettingsStore.getState();
    // Forced values are applied.
    expect(state.cardBackDisplay).toBe("none");
    expect(state.showRankBadge).toBe(false);
    // The backup holds the user's originals for the forced keys only.
    expect(state._collectionForcedBackup).toEqual({
      cardBackDisplay: "logo",
      showRankBadge: true,
    });
    expect(state.collectionForcedSourceId).toBe(SOURCE_A);
    // showDeviceBadge was not forced, so it is not in the backup.
    expect(state._collectionForcedBackup).not.toHaveProperty("showDeviceBadge");
  });

  it("does not re-snapshot when the same source re-applies (idempotent)", () => {
    useSettingsStore.setState({ cardBackDisplay: "logo" });
    const settings: CollectionSettings = {
      forced: { cardBackDisplay: "none" },
    };

    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, settings);
    // A refetch re-applies the same forced settings; the backup must still hold
    // the ORIGINAL user value, not the now-forced "none".
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, settings);

    expect(useSettingsStore.getState()._collectionForcedBackup).toEqual({
      cardBackDisplay: "logo",
    });
  });

  it("restores the user's own values and clears backup state on restore", () => {
    useSettingsStore.setState({
      cardBackDisplay: "logo",
      appliedCollectionDefaultsSourceId: SOURCE_A,
    });
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, {
      forced: { cardBackDisplay: "none" },
    });

    useSettingsStore.getState().restoreCollectionForcedSettings();

    const state = useSettingsStore.getState();
    expect(state.cardBackDisplay).toBe("logo");
    expect(state.collectionForcedSettings).toBeNull();
    expect(state._collectionForcedBackup).toBeNull();
    expect(state.collectionForcedSourceId).toBeNull();
    // appliedCollectionDefaultsSourceId must NOT be cleared by a forced restore.
    expect(state.appliedCollectionDefaultsSourceId).toBe(SOURCE_A);
  });

  it("captures the user's originals (not source A's forced values) when chaining A → B", () => {
    useSettingsStore.setState({
      cardBackDisplay: "logo",
      showRankBadge: true,
    });

    // Source A forces cardBackDisplay.
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, {
      forced: { cardBackDisplay: "none" },
    });
    // Source B forces a different key plus the overlapping one, with no
    // explicit restore between (e.g. a direct source switch).
    useSettingsStore.getState().applyCollectionSettings(SOURCE_B, {
      forced: { cardBackDisplay: "both", showRankBadge: false },
    });

    const state = useSettingsStore.getState();
    expect(state.collectionForcedSourceId).toBe(SOURCE_B);
    // B's backup must hold the user's true originals, not A's forced "none".
    expect(state._collectionForcedBackup).toEqual({
      cardBackDisplay: "logo",
      showRankBadge: true,
    });

    // Restoring now returns the user's real settings.
    useSettingsStore.getState().restoreCollectionForcedSettings();
    const restored = useSettingsStore.getState();
    expect(restored.cardBackDisplay).toBe("logo");
    expect(restored.showRankBadge).toBe(true);
  });

  it("does not roll back a key the source never forced", () => {
    useSettingsStore.setState({
      cardBackDisplay: "logo",
      showDeviceBadge: true,
    });
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, {
      forced: { cardBackDisplay: "none" },
    });
    // User changes a non-forced key while the forced source is active.
    useSettingsStore.setState({ showDeviceBadge: false });

    useSettingsStore.getState().restoreCollectionForcedSettings();

    // The forced key is restored; the untouched key keeps the user's new value.
    expect(useSettingsStore.getState().cardBackDisplay).toBe("logo");
    expect(useSettingsStore.getState().showDeviceBadge).toBe(false);
  });

  it("persists the backup and source id", () => {
    useSettingsStore.setState({ cardBackDisplay: "logo" });
    useSettingsStore.getState().applyCollectionSettings(SOURCE_A, {
      forced: { cardBackDisplay: "none" },
    });

    const persisted = lastPersistedState();
    expect(persisted._collectionForcedBackup).toEqual({
      cardBackDisplay: "logo",
    });
    expect(persisted.collectionForcedSourceId).toBe(SOURCE_A);
    // The transient marker is not persisted.
    expect(persisted.collectionForcedSettings).toBeUndefined();
  });

  it("rolls back forced settings from a persisted backup on rehydration (crash recovery)", async () => {
    const persisted = JSON.stringify({
      state: {
        cardBackDisplay: "none",
        showRankBadge: false,
        _collectionForcedBackup: {
          cardBackDisplay: "logo",
          showRankBadge: true,
        },
        collectionForcedSourceId: SOURCE_A,
      },
      version: 27,
    });
    getGetItemMock().mockReturnValue(persisted);

    await useSettingsStore.persist.rehydrate();

    const state = useSettingsStore.getState();
    expect(state.cardBackDisplay).toBe("logo");
    expect(state.showRankBadge).toBe(true);
    expect(state._collectionForcedBackup).toBeNull();
    expect(state.collectionForcedSourceId).toBeNull();
    expect(state.collectionForcedSettings).toBeNull();
  });

  it("leaves settings untouched on rehydration when no forced backup is stored", async () => {
    const persisted = JSON.stringify({
      state: { cardBackDisplay: "both" },
      version: 27,
    });
    getGetItemMock().mockReturnValue(persisted);

    await useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().cardBackDisplay).toBe("both");
    expect(useSettingsStore.getState()._collectionForcedBackup).toBeNull();
  });
});
