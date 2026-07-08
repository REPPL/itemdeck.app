/**
 * Tests for the smart random-selection default applied by
 * CollectionDataProvider when cards load.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { CollectionDataProvider } from "@/context/CollectionDataContext";
import {
  useSettingsStore,
  computeSmartSelectionDefault,
} from "@/stores/settingsStore";

const TOTAL_CARDS = 100;

// Mock the collection hook so the provider sees a loaded collection
// without any network access
vi.mock("@/hooks/useCollection", () => {
  const cards = Array.from({ length: 100 }, (_, i) => ({
    id: `card-${String(i)}`,
    title: `Card ${String(i)}`,
  }));
  return {
    useLocalCollection: () => ({
      data: {
        cards,
        collection: undefined,
        displayConfig: undefined,
        uiLabels: undefined,
        config: undefined,
        settings: undefined,
      },
      isLoading: false,
      error: null,
    }),
  };
});

describe("CollectionDataProvider - smart selection default", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
  });

  it("preserves a user-chosen randomSelectionCount when cards load", () => {
    // Simulate a persisted user choice (both the value and the user-intent
    // marker set by the setter are persisted across app starts)
    useSettingsStore.getState().setRandomSelectionCount(5);

    render(
      <CollectionDataProvider>
        <div>child</div>
      </CollectionDataProvider>
    );

    expect(useSettingsStore.getState().randomSelectionCount).toBe(5);
  });

  it("applies the smart default when the user has not chosen a count", () => {
    render(
      <CollectionDataProvider>
        <div>child</div>
      </CollectionDataProvider>
    );

    expect(useSettingsStore.getState().randomSelectionCount).toBe(
      computeSmartSelectionDefault(TOTAL_CARDS)
    );
  });
});
