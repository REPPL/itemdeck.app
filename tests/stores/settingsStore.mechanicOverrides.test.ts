/**
 * Tests for mechanic display override persistence (F-102).
 *
 * Guards against mechanic overrides permanently destroying user settings:
 * the override backup must survive a crash/tab-kill (persisted) and be
 * restored on rehydration when no mechanic session is active.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSettingsStore } from "@/stores/settingsStore";

const STORAGE_KEY = "itemdeck-settings";

function getSetItemMock() {
  return vi.mocked(window.localStorage.setItem);
}

function getGetItemMock() {
  return vi.mocked(window.localStorage.getItem);
}

describe("settingsStore - mechanic override persistence (F-102)", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    getSetItemMock().mockClear();
    getGetItemMock().mockReset();
  });

  it("includes _mechanicOverridesBackup in the persisted state", () => {
    useSettingsStore.getState().setCardSizePreset("small");
    useSettingsStore.getState().setCardAspectRatio("5:7");
    useSettingsStore.getState().setMaxVisibleCards(2);

    useSettingsStore.getState().applyMechanicOverrides({
      cardSizePreset: "large",
      maxVisibleCards: 40,
    });

    const writes = getSetItemMock().mock.calls.filter(
      ([key]) => key === STORAGE_KEY
    );
    expect(writes.length).toBeGreaterThan(0);

    const lastWrite = writes[writes.length - 1];
    if (!lastWrite) throw new Error("expected a persisted write");
    const persisted = JSON.parse(lastWrite[1]) as {
      state: Record<string, unknown>;
    };

    expect(persisted.state._mechanicOverridesBackup).toEqual({
      cardSizePreset: "small",
      cardAspectRatio: "5:7",
      maxVisibleCards: 2,
    });
  });

  it("restores backed-up settings on rehydration when no mechanic session is active", async () => {
    // Simulate storage left behind by a crash/tab-kill mid-mechanic:
    // overridden display settings plus the pre-override backup.
    const persisted = JSON.stringify({
      state: {
        cardSizePreset: "large",
        cardAspectRatio: "1:1",
        maxVisibleCards: 40,
        _mechanicOverridesBackup: {
          cardSizePreset: "small",
          cardAspectRatio: "3:4",
          maxVisibleCards: 5,
        },
      },
      version: 26,
    });
    getGetItemMock().mockReturnValue(persisted);

    await useSettingsStore.persist.rehydrate();

    const state = useSettingsStore.getState();
    expect(state.cardSizePreset).toBe("small");
    expect(state.cardAspectRatio).toBe("3:4");
    expect(state.maxVisibleCards).toBe(5);
    expect(state._mechanicOverridesBackup).toBeNull();
    expect(state.mechanicOverridesActive).toBe(false);
  });

  it("leaves settings untouched on rehydration when no backup is stored", async () => {
    const persisted = JSON.stringify({
      state: {
        cardSizePreset: "large",
        cardAspectRatio: "1:1",
        maxVisibleCards: 40,
      },
      version: 26,
    });
    getGetItemMock().mockReturnValue(persisted);

    await useSettingsStore.persist.rehydrate();

    const state = useSettingsStore.getState();
    expect(state.cardSizePreset).toBe("large");
    expect(state.cardAspectRatio).toBe("1:1");
    expect(state.maxVisibleCards).toBe(40);
    expect(state._mechanicOverridesBackup).toBeNull();
  });
});
