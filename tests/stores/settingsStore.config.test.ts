/**
 * Tests for settings store collection config functionality.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore, type CollectionConfigForDefaults } from "@/stores/settingsStore";

describe("settingsStore - Collection Config", () => {
  beforeEach(() => {
    // Reset store to defaults
    useSettingsStore.getState().resetToDefaults();
  });

  describe("hasAppliedCollectionDefaults", () => {
    it("defaults to false", () => {
      useSettingsStore.getState().resetToDefaults();
      expect(useSettingsStore.getState().hasAppliedCollectionDefaults).toBe(false);
    });

    it("can be set to true", () => {
      useSettingsStore.getState().setHasAppliedCollectionDefaults(true);
      expect(useSettingsStore.getState().hasAppliedCollectionDefaults).toBe(true);
    });
  });

  describe("applyCollectionDefaults", () => {
    it("applies theme default", () => {
      const config: CollectionConfigForDefaults = {
        defaults: {
          theme: "modern",
        },
      };

      useSettingsStore.getState().applyCollectionDefaults(config);

      expect(useSettingsStore.getState().visualTheme).toBe("modern");
      expect(useSettingsStore.getState().hasAppliedCollectionDefaults).toBe(true);
    });

    it("applies card size default", () => {
      const config: CollectionConfigForDefaults = {
        defaults: {
          cardSize: "large",
        },
      };

      useSettingsStore.getState().applyCollectionDefaults(config);

      expect(useSettingsStore.getState().cardSizePreset).toBe("large");
    });

    it("applies card aspect ratio default", () => {
      const config: CollectionConfigForDefaults = {
        defaults: {
          cardAspectRatio: "1:1",
        },
      };

      useSettingsStore.getState().applyCollectionDefaults(config);

      expect(useSettingsStore.getState().cardAspectRatio).toBe("1:1");
    });

    it("applies card settings defaults", () => {
      const config: CollectionConfigForDefaults = {
        cards: {
          maxVisibleCards: 5,
          shuffleOnLoad: false,
          cardBackDisplay: "logo",
        },
      };

      useSettingsStore.getState().applyCollectionDefaults(config);

      expect(useSettingsStore.getState().maxVisibleCards).toBe(5);
      expect(useSettingsStore.getState().shuffleOnLoad).toBe(false);
      expect(useSettingsStore.getState().cardBackDisplay).toBe("logo");
    });

    it("applies field mapping defaults", () => {
      const config: CollectionConfigForDefaults = {
        fieldMapping: {
          titleField: "name",
          subtitleField: "releaseDate",
          sortField: "rating",
          sortDirection: "desc",
        },
      };

      useSettingsStore.getState().applyCollectionDefaults(config);

      const fieldMapping = useSettingsStore.getState().fieldMapping;
      expect(fieldMapping.titleField).toBe("name");
      expect(fieldMapping.subtitleField).toBe("releaseDate");
      expect(fieldMapping.sortField).toBe("rating");
      expect(fieldMapping.sortDirection).toBe("desc");
    });

    it("preserves existing field mapping values not in config", () => {
      // Set a custom value first
      useSettingsStore.getState().setFieldMapping({ footerBadgeField: "custom" });

      const config: CollectionConfigForDefaults = {
        fieldMapping: {
          titleField: "name",
        },
      };

      useSettingsStore.getState().applyCollectionDefaults(config);

      const fieldMapping = useSettingsStore.getState().fieldMapping;
      expect(fieldMapping.titleField).toBe("name");
      expect(fieldMapping.footerBadgeField).toBe("custom");
    });

    it("does not apply defaults if already applied", () => {
      // Apply initial defaults
      const config1: CollectionConfigForDefaults = {
        defaults: {
          theme: "modern",
        },
      };
      useSettingsStore.getState().applyCollectionDefaults(config1);
      expect(useSettingsStore.getState().visualTheme).toBe("modern");

      // Try to apply different defaults
      const config2: CollectionConfigForDefaults = {
        defaults: {
          theme: "minimal",
        },
      };
      useSettingsStore.getState().applyCollectionDefaults(config2);

      // Should still be modern
      expect(useSettingsStore.getState().visualTheme).toBe("modern");
    });

    it("applies all config sections together", () => {
      const config: CollectionConfigForDefaults = {
        defaults: {
          theme: "minimal",
          cardSize: "small",
        },
        cards: {
          maxVisibleCards: 3,
          shuffleOnLoad: true,
        },
        fieldMapping: {
          sortField: "title",
        },
      };

      useSettingsStore.getState().applyCollectionDefaults(config);

      expect(useSettingsStore.getState().visualTheme).toBe("minimal");
      expect(useSettingsStore.getState().cardSizePreset).toBe("small");
      expect(useSettingsStore.getState().maxVisibleCards).toBe(3);
      expect(useSettingsStore.getState().shuffleOnLoad).toBe(true);
      expect(useSettingsStore.getState().fieldMapping.sortField).toBe("title");
    });

    it("handles empty config gracefully", () => {
      const config: CollectionConfigForDefaults = {};

      useSettingsStore.getState().applyCollectionDefaults(config);

      // Should still mark as applied
      expect(useSettingsStore.getState().hasAppliedCollectionDefaults).toBe(true);
      // But keep default values
      expect(useSettingsStore.getState().visualTheme).toBe("retro");
    });
  });
});
