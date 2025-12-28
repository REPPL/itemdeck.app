/**
 * Settings sub-tab for Data settings.
 *
 * Manages settings import/export and reset functionality.
 */

import { useRef, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "../SettingsPanel.module.css";

/**
 * Settings tab component - manages settings import/export.
 */
export function SettingsTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  const handleExportSettings = () => {
    // Get all settings from the store
    const state = useSettingsStore.getState();

    // Create export object with relevant settings
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        layout: state.layout,
        cardSizePreset: state.cardSizePreset,
        cardAspectRatio: state.cardAspectRatio,
        maxVisibleCards: state.maxVisibleCards,
        cardBackDisplay: state.cardBackDisplay,
        shuffleOnLoad: state.shuffleOnLoad,
        reduceMotion: state.reduceMotion,
        highContrast: state.highContrast,
        titleDisplayMode: state.titleDisplayMode,
        dragModeEnabled: state.dragModeEnabled,
        visualTheme: state.visualTheme,
        cardBackStyle: state.cardBackStyle,
        showRankBadge: state.showRankBadge,
        showDeviceBadge: state.showDeviceBadge,
        rankPlaceholderText: state.rankPlaceholderText,
        dragFace: state.dragFace,
        fieldMapping: state.fieldMapping,
        themeCustomisations: state.themeCustomisations,
        showHelpButton: state.showHelpButton,
        showSettingsButton: state.showSettingsButton,
        showDragIcon: state.showDragIcon,
        randomSelectionEnabled: state.randomSelectionEnabled,
        randomSelectionCount: state.randomSelectionCount,
        defaultCardFace: state.defaultCardFace,
        showStatisticsBar: state.showStatisticsBar,
        editModeEnabled: state.editModeEnabled,
        showSearchBar: state.showSearchBar,
        searchBarMinimised: state.searchBarMinimised,
        searchFields: state.searchFields,
        searchScope: state.searchScope,
        groupByField: state.groupByField,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itemdeck-settings-${new Date().toISOString().split("T")[0] ?? "export"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = JSON.parse(content) as {
          version?: number;
          settings?: Record<string, unknown>;
        };

        // Validate import format
        if (!imported.settings) {
          throw new Error("Invalid settings file: missing settings data");
        }

        // Get setters from the store
        const store = useSettingsStore.getState();
        const settings = imported.settings;

        // Apply each setting if it exists in the import
        if (settings.layout !== undefined) store.setLayout(settings.layout as typeof store.layout);
        if (settings.cardSizePreset !== undefined) store.setCardSizePreset(settings.cardSizePreset as typeof store.cardSizePreset);
        if (settings.cardAspectRatio !== undefined) store.setCardAspectRatio(settings.cardAspectRatio as typeof store.cardAspectRatio);
        if (settings.maxVisibleCards !== undefined) store.setMaxVisibleCards(settings.maxVisibleCards as number);
        if (settings.cardBackDisplay !== undefined) store.setCardBackDisplay(settings.cardBackDisplay as typeof store.cardBackDisplay);
        if (settings.shuffleOnLoad !== undefined) store.setShuffleOnLoad(settings.shuffleOnLoad as boolean);
        if (settings.reduceMotion !== undefined) store.setReduceMotion(settings.reduceMotion as typeof store.reduceMotion);
        if (settings.highContrast !== undefined) store.setHighContrast(settings.highContrast as boolean);
        if (settings.titleDisplayMode !== undefined) store.setTitleDisplayMode(settings.titleDisplayMode as typeof store.titleDisplayMode);
        if (settings.dragModeEnabled !== undefined) store.setDragModeEnabled(settings.dragModeEnabled as boolean);
        if (settings.visualTheme !== undefined) store.setVisualTheme(settings.visualTheme as typeof store.visualTheme);
        if (settings.cardBackStyle !== undefined) store.setCardBackStyle(settings.cardBackStyle as typeof store.cardBackStyle);
        if (settings.showRankBadge !== undefined) store.setShowRankBadge(settings.showRankBadge as boolean);
        if (settings.showDeviceBadge !== undefined) store.setShowDeviceBadge(settings.showDeviceBadge as boolean);
        if (settings.rankPlaceholderText !== undefined) store.setRankPlaceholderText(settings.rankPlaceholderText as string);
        if (settings.dragFace !== undefined) store.setDragFace(settings.dragFace as typeof store.dragFace);
        if (settings.showHelpButton !== undefined) store.setShowHelpButton(settings.showHelpButton as boolean);
        if (settings.showSettingsButton !== undefined) store.setShowSettingsButton(settings.showSettingsButton as boolean);
        if (settings.showDragIcon !== undefined) store.setShowDragIcon(settings.showDragIcon as boolean);
        if (settings.randomSelectionEnabled !== undefined) store.setRandomSelectionEnabled(settings.randomSelectionEnabled as boolean);
        if (settings.randomSelectionCount !== undefined) store.setRandomSelectionCount(settings.randomSelectionCount as number);
        if (settings.defaultCardFace !== undefined) store.setDefaultCardFace(settings.defaultCardFace as typeof store.defaultCardFace);
        if (settings.showStatisticsBar !== undefined) store.setShowStatisticsBar(settings.showStatisticsBar as boolean);
        if (settings.editModeEnabled !== undefined) store.setEditModeEnabled(settings.editModeEnabled as boolean);
        if (settings.showSearchBar !== undefined) store.setShowSearchBar(settings.showSearchBar as boolean);
        if (settings.searchBarMinimised !== undefined) store.setSearchBarMinimised(settings.searchBarMinimised as boolean);
        if (settings.searchFields !== undefined) store.setSearchFields(settings.searchFields as string[]);
        if (settings.searchScope !== undefined) store.setSearchScope(settings.searchScope as typeof store.searchScope);
        if (settings.groupByField !== undefined) store.setGroupByField(settings.groupByField as string | null);

        // Handle nested objects
        if (settings.fieldMapping !== undefined) {
          store.setFieldMapping(settings.fieldMapping as typeof store.fieldMapping);
        }

        // Handle theme customisations per theme
        if (settings.themeCustomisations !== undefined) {
          const customisations = settings.themeCustomisations as typeof store.themeCustomisations;
          for (const theme of Object.keys(customisations) as (keyof typeof customisations)[]) {
            store.setThemeCustomisation(theme, customisations[theme]);
          }
        }

        alert("Settings imported successfully!");
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to import settings");
      }

      // Reset input
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleResetToDefaults = () => {
    if (showResetConfirm) {
      resetToDefaults();
      setShowResetConfirm(false);
      alert("Settings reset to defaults.");
    } else {
      setShowResetConfirm(true);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
  };

  return (
    <>
      <h3 className={styles.sectionHeader}>Export Settings</h3>

      <div className={styles.row}>
        <span className={styles.label}>Save all settings</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleExportSettings}
        >
          Export Settings
        </button>
      </div>

      <div className={styles.helpText}>
        Exports all your preferences, layout settings, and theme customisations.
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Import Settings</h3>

      <div className={styles.row}>
        <span className={styles.label}>Load from file</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleImportClick}
        >
          Import Settings
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      <div className={styles.helpText}>
        Imports settings from a previously exported JSON file.
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Reset Settings</h3>

      <div className={styles.row}>
        <span className={styles.label}>
          {showResetConfirm ? "Are you sure?" : "Reset all settings"}
        </span>
        <div className={styles.buttonGroup}>
          {showResetConfirm ? (
            <>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleResetToDefaults}
              >
                Confirm
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelReset}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleResetToDefaults}
            >
              Reset to Defaults
            </button>
          )}
        </div>
      </div>

      <div className={styles.helpText}>
        Resets all settings to their default values. This cannot be undone.
      </div>
    </>
  );
}
