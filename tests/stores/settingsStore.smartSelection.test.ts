/**
 * Tests for the smart selection default mechanism in the settings store.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useSettingsStore,
  computeSmartSelectionDefault,
} from "@/stores/settingsStore";

describe("settingsStore - smart selection default", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  describe("applySmartSelectionDefault", () => {
    it("applies the smart default when the user has not chosen", () => {
      useSettingsStore.getState().applySmartSelectionDefault(100);

      expect(useSettingsStore.getState().randomSelectionCount).toBe(
        computeSmartSelectionDefault(100)
      );
      expect(useSettingsStore.getState().hasUserSetRandomSelectionCount).toBe(
        false
      );
    });

    it("does not mark the smart default as a user choice", () => {
      useSettingsStore.getState().applySmartSelectionDefault(100);
      // A later collection with a different size still gets a smart default
      useSettingsStore.getState().applySmartSelectionDefault(16);

      expect(useSettingsStore.getState().randomSelectionCount).toBe(
        computeSmartSelectionDefault(16)
      );
    });

    it("does not override a count set via setRandomSelectionCount", () => {
      useSettingsStore.getState().setRandomSelectionCount(5);

      useSettingsStore.getState().applySmartSelectionDefault(100);

      expect(useSettingsStore.getState().randomSelectionCount).toBe(5);
    });

    it("does not override a count committed via the draft flow", () => {
      const store = useSettingsStore.getState();
      store.startEditing();
      store.updateDraft({ randomSelectionCount: 7 });
      store.commitDraft();

      useSettingsStore.getState().applySmartSelectionDefault(100);

      expect(useSettingsStore.getState().randomSelectionCount).toBe(7);
      expect(useSettingsStore.getState().hasUserSetRandomSelectionCount).toBe(
        true
      );
    });

    it("ignores an empty collection", () => {
      useSettingsStore.getState().applySmartSelectionDefault(0);

      expect(useSettingsStore.getState().randomSelectionCount).toBe(10);
    });
  });

  describe("commitDraft", () => {
    it("does not mark user intent when the count was not changed", () => {
      const store = useSettingsStore.getState();
      store.startEditing();
      store.updateDraft({ showStatisticsBar: false });
      store.commitDraft();

      expect(useSettingsStore.getState().hasUserSetRandomSelectionCount).toBe(
        false
      );
    });
  });
});
