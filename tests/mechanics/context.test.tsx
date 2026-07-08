/**
 * Tests for the mechanic context provider lifecycle.
 *
 * Guards against store-sync deactivation (activeMechanicId cleared in the
 * settings store) leaving mechanic display overrides applied.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { MechanicProvider, useMechanicContext } from "@/mechanics/context";
import { mechanicRegistry } from "@/mechanics/registry";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Mechanic } from "@/mechanics/types";

const TEST_ID = "test-mech";

function makeMechanic(): Mechanic {
  return {
    manifest: {
      id: TEST_ID,
      name: "Test Mechanic",
      description: "Test mechanic with display preferences",
      icon: () => null,
      version: "1.0.0",
      displayPreferences: {
        cardSizePreset: "large",
        maxVisibleCards: 40,
      },
    },
    lifecycle: {},
    getState: () => ({ isActive: true }),
    subscribe: () => () => {},
    getCardActions: () => ({}),
  };
}

let contextValue: ReturnType<typeof useMechanicContext> | null = null;

function CaptureContext() {
  contextValue = useMechanicContext();
  return null;
}

describe("MechanicProvider - store-sync deactivation", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    mechanicRegistry.register(TEST_ID, () => Promise.resolve(makeMechanic()));
    contextValue = null;
  });

  afterEach(() => {
    cleanup();
    if (mechanicRegistry.has(TEST_ID)) {
      mechanicRegistry.unregister(TEST_ID);
    }
  });

  it("restores mechanic overrides when deactivated via the settings store", async () => {
    useSettingsStore.getState().setCardSizePreset("small");
    useSettingsStore.getState().setMaxVisibleCards(2);

    render(
      <MechanicProvider>
        <CaptureContext />
      </MechanicProvider>
    );

    await act(async () => {
      await contextValue?.activateMechanic(TEST_ID);
    });

    // Overrides applied on activation
    expect(useSettingsStore.getState().cardSizePreset).toBe("large");
    expect(useSettingsStore.getState().maxVisibleCards).toBe(40);
    expect(useSettingsStore.getState().mechanicOverridesActive).toBe(true);

    // Deactivate via the settings store (store-sync path), not via
    // deactivateMechanic()
    act(() => {
      useSettingsStore.getState().setActiveMechanicId(null);
    });

    expect(mechanicRegistry.getActiveId()).toBeNull();
    expect(useSettingsStore.getState().cardSizePreset).toBe("small");
    expect(useSettingsStore.getState().maxVisibleCards).toBe(2);
    expect(useSettingsStore.getState().mechanicOverridesActive).toBe(false);
    expect(useSettingsStore.getState()._mechanicOverridesBackup).toBeNull();
  });
});
