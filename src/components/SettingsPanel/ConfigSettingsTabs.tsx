/**
 * ConfigSettingsTabs - Sub-tabbed interface for configuration settings.
 *
 * Top-level Configuration tab with sub-tabs:
 * - Display: Random Selection, Max Visible, Sort By, Sort Direction
 * - Edit: Edit Mode toggle
 *
 * Note: Drag mode settings moved to Appearance > Interactions (v0.15.6)
 */

import { useState, useCallback, useMemo } from "react";
import {
  useSettingsStore,
  type FieldMappingConfig,
} from "@/stores/settingsStore";
import {
  SORT_FIELD_OPTIONS,
  type FieldOption,
} from "@/utils/fieldPathResolver";
import { useCollectionData } from "@/context/CollectionDataContext";
import { useAvailableFields } from "@/hooks/useAvailableFields";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type ConfigSubTab = "display" | "edit";

const subTabs: { id: ConfigSubTab; label: string }[] = [
  { id: "display", label: "Display" },
  { id: "edit", label: "Edit" },
];

/**
 * Sub-tabbed configuration settings interface.
 */
export function ConfigSettingsTabs() {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>("display");
  const { cards: allCards } = useCollectionData();
  const totalCards = allCards.length;
  const { sortFields: dynamicSortFields } = useAvailableFields();

  // Merge static options with dynamically discovered fields, removing duplicates
  const sortFieldOptions = useMemo((): FieldOption[] => {
    const staticValues = new Set(SORT_FIELD_OPTIONS.map((opt) => opt.value));
    const merged = [...SORT_FIELD_OPTIONS];

    // Add dynamic fields that aren't already in static options
    for (const field of dynamicSortFields) {
      if (!staticValues.has(field.value)) {
        merged.push(field);
      }
    }

    return merged;
  }, [dynamicSortFields]);

  // Use draft pattern for settings (F-090)
  // Subscribe to _draft to trigger re-renders when draft changes
  useSettingsStore((s) => s._draft);
  const getEffective = useSettingsStore((s) => s.getEffective);
  const updateDraft = useSettingsStore((s) => s.updateDraft);

  // Get effective values from draft
  // Note: _draft subscription above ensures re-render when these values change
  const shuffleOnLoad = getEffective("shuffleOnLoad");
  const maxVisibleCards = getEffective("maxVisibleCards");
  const randomSelectionEnabled = getEffective("randomSelectionEnabled");
  const randomSelectionCount = getEffective("randomSelectionCount");
  const fieldMapping = getEffective("fieldMapping");
  const editModeEnabled = useSettingsStore((s) => s.editModeEnabled);
  const setEditModeEnabled = useSettingsStore((s) => s.setEditModeEnabled);

  const handleFieldMappingChange = useCallback(
    (field: keyof FieldMappingConfig, value: string) => {
      updateDraft({
        fieldMapping: {
          ...fieldMapping,
          [field]: value,
        },
      });
    },
    [updateDraft, fieldMapping]
  );

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "display":
        return (
          <>
            {/* Random Selection at the top */}
            <div className={styles.row}>
              <span className={styles.label}>Random Selection</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={randomSelectionEnabled}
                  onChange={(e) => { updateDraft({ randomSelectionEnabled: e.target.checked }); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            {/* Selection Count (when enabled) */}
            {randomSelectionEnabled && (
              <>
                <div className={styles.row}>
                  <span className={styles.label}>Show</span>
                  <div className={styles.sliderWrapper}>
                    <input
                      type="range"
                      min={1}
                      max={Math.max(totalCards, 1)}
                      value={Math.min(randomSelectionCount, totalCards || 1)}
                      onChange={(e) => { updateDraft({ randomSelectionCount: Number(e.target.value) }); }}
                      className={styles.slider}
                      aria-label="Number of cards to show"
                    />
                    <span className={styles.sliderValue}>
                      [{Math.min(randomSelectionCount, totalCards || 1)}/{totalCards}]
                    </span>
                  </div>
                </div>
                <div className={styles.helpText}>
                  A random subset will be selected each time the page loads.
                </div>
              </>
            )}

            <div className={styles.divider} />

            <div className={styles.row}>
              <span className={styles.label}>Max Visible</span>
              <div className={styles.numberControl}>
                <button
                  type="button"
                  className={styles.numberButton}
                  onClick={() => { updateDraft({ maxVisibleCards: Math.max(1, maxVisibleCards - 1) }); }}
                  aria-label="Decrease"
                  disabled={maxVisibleCards <= 1}
                >
                  −
                </button>
                <span className={styles.numberValue}>{maxVisibleCards}</span>
                <button
                  type="button"
                  className={styles.numberButton}
                  onClick={() => { updateDraft({ maxVisibleCards: Math.min(10, maxVisibleCards + 1) }); }}
                  aria-label="Increase"
                  disabled={maxVisibleCards >= 10}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.divider} />

            <div className={styles.row}>
              <span className={shuffleOnLoad ? styles.labelDisabled : styles.label}>Sort By</span>
              <select
                className={styles.select}
                value={fieldMapping.sortField}
                onChange={(e) => { handleFieldMappingChange("sortField", e.target.value); }}
                aria-label="Sort field"
                disabled={shuffleOnLoad}
              >
                {sortFieldOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <span className={shuffleOnLoad ? styles.labelDisabled : styles.label}>Sort Direction</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Sort direction">
                <button
                  type="button"
                  className={[
                    styles.segmentButton,
                    fieldMapping.sortDirection === "asc" ? styles.segmentButtonActive : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => { handleFieldMappingChange("sortDirection", "asc"); }}
                  role="radio"
                  aria-checked={fieldMapping.sortDirection === "asc"}
                  disabled={shuffleOnLoad}
                >
                  Asc
                </button>
                <button
                  type="button"
                  className={[
                    styles.segmentButton,
                    fieldMapping.sortDirection === "desc" ? styles.segmentButtonActive : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => { handleFieldMappingChange("sortDirection", "desc"); }}
                  role="radio"
                  aria-checked={fieldMapping.sortDirection === "desc"}
                  disabled={shuffleOnLoad}
                >
                  Desc
                </button>
              </div>
            </div>
            {shuffleOnLoad && (
              <div className={styles.helpText}>
                Sorting is disabled when Shuffle on Load is enabled (see Quick tab).
              </div>
            )}
          </>
        );

      case "edit":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Edit Mode</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={editModeEnabled}
                  onChange={(e) => { setEditModeEnabled(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.helpText}>
              Enables editing of card data. Press E to toggle.
            </div>

            <div className={styles.divider} />

            <div className={styles.infoText}>
              When edit mode is enabled, you can:
            </div>
            <ul className={styles.featureList}>
              <li>Click the edit button on expanded cards</li>
              <li>Modify card metadata (name, year, platform)</li>
              <li>Export and import your edits</li>
            </ul>
          </>
        );
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Sub-tab navigation - compact button group */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Configuration sections">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`config-subtab-${id}`}
            className={[
              tabStyles.subTab,
              activeSubTab === id ? tabStyles.subTabActive : "",
            ].filter(Boolean).join(" ")}
            onClick={() => { setActiveSubTab(id); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div
        className={tabStyles.subTabContent}
        role="tabpanel"
        id={`config-subtab-${activeSubTab}`}
        aria-labelledby={`config-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
