/**
 * Integration test for forced-settings restore on source change.
 *
 * A collection's `forced` settings overwrite the user's persisted global
 * settings. When the user switches to a different source — especially one with
 * no settings.json, which never reaches applyCollectionSettings — the
 * provider must restore the user's own settings via the dedicated restore
 * effect. This is the exact end-to-end failure the store backup guards.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { CollectionDataProvider } from "@/context/CollectionDataContext";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSourceStore, type Source } from "@/stores/sourceStore";
import type { CollectionSettings } from "@/types/collectionSettings";

const SOURCE_A_ID = "src_a";
const SOURCE_B_ID = "src_b";
const SOURCE_A_URL = "https://cdn.jsdelivr.net/gh/a/MyPlausibleMe@main/x";
const SOURCE_B_URL = "https://cdn.jsdelivr.net/gh/b/MyPlausibleMe@main/y";

// Source A forces cardBackDisplay; source B has no settings.json at all.
const forcedForA: CollectionSettings = {
  forced: { cardBackDisplay: "none" },
};

// useLocalCollection returns settings based on the active source URL so the
// provider's effects see A's forced settings, then nothing for B.
vi.mock("@/hooks/useCollection", () => ({
  useLocalCollection: ({ basePath }: { basePath: string }) => ({
    data: {
      cards: [{ id: "c1", title: "One" }],
      collection: undefined,
      displayConfig: undefined,
      config: undefined,
      settings: basePath === SOURCE_A_URL ? forcedForA : undefined,
    },
    isLoading: false,
    error: null,
    isSuccess: true,
  }),
}));

function makeSource(id: string, url: string): Source {
  return {
    id,
    url,
    name: id,
    addedAt: new Date(),
    sourceType: "myplausibleme",
  };
}

describe("CollectionDataProvider - forced settings restore on source change", () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    useSourceStore.setState({
      sources: [
        makeSource(SOURCE_A_ID, SOURCE_A_URL),
        makeSource(SOURCE_B_ID, SOURCE_B_URL),
      ],
      activeSourceId: SOURCE_A_ID,
      defaultSourceId: SOURCE_A_ID,
    });
  });

  it("restores the user's own settings when switching to a source with no settings.json", () => {
    // The user's own value.
    useSettingsStore.setState({ cardBackDisplay: "logo" });

    const { rerender } = render(
      <CollectionDataProvider>
        <div>child</div>
      </CollectionDataProvider>
    );

    // Source A's forced value is now applied and backed up.
    expect(useSettingsStore.getState().cardBackDisplay).toBe("none");
    expect(useSettingsStore.getState().collectionForcedSourceId).toBe(
      SOURCE_A_URL
    );

    // Switch the active source to B (which serves no settings.json).
    useSourceStore.setState({ activeSourceId: SOURCE_B_ID });
    rerender(
      <CollectionDataProvider>
        <div>child</div>
      </CollectionDataProvider>
    );

    // The user's own setting is restored; the forced state is cleared.
    expect(useSettingsStore.getState().cardBackDisplay).toBe("logo");
    expect(useSettingsStore.getState().collectionForcedSourceId).toBeNull();
    expect(useSettingsStore.getState()._collectionForcedBackup).toBeNull();
  });
});
