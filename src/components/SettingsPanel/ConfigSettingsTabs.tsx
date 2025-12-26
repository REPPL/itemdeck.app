/**
 * ConfigSettingsTabs - Sub-tabbed interface for configuration settings.
 *
 * Top-level Configuration tab with sub-tabs:
 * - Display Order: Max Visible, Shuffle, Drag to Reorder, Sort By, Sort Direction
 * - Front Face: Footer Badge Field, Unranked Text
 * - Back Face: Subtitle Field, Logo Field
 */

import { useState, useCallback } from "react";
import {
  useSettingsStore,
  type FieldMappingConfig,
  type DragFace,
  type DefaultCardFace,
} from "@/stores/settingsStore";
import {
  SUBTITLE_FIELD_OPTIONS,
  FOOTER_BADGE_FIELD_OPTIONS,
  LOGO_FIELD_OPTIONS,
  SORT_FIELD_OPTIONS,
} from "@/utils/fieldPathResolver";
import { useCollectionData } from "@/context/CollectionDataContext";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

const dragModeOptions: { value: DragFace | "none"; label: string }[] = [
  { value: "none", label: "None" },
  { value: "front", label: "Front" },
  { value: "back", label: "Back" },
  { value: "both", label: "Both" },
];

const defaultFaceOptions: { value: DefaultCardFace; label: string }[] = [
  { value: "back", label: "Back" },
  { value: "front", label: "Front" },
];

type ConfigSubTab = "order" | "front" | "back";

const subTabs: { id: ConfigSubTab; label: string }[] = [
  { id: "order", label: "Display" },
  { id: "front", label: "Front Face" },
  { id: "back", label: "Back Face" },
];

/**
 * Sub-tabbed configuration settings interface.
 */
export function ConfigSettingsTabs() {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>("order");
  const { cards: allCards } = useCollectionData();
  const totalCards = allCards.length;

  const {
    shuffleOnLoad,
    setShuffleOnLoad,
    maxVisibleCards,
    setMaxVisibleCards,
    dragModeEnabled,
    setDragModeEnabled,
    dragFace,
    setDragFace,
    defaultCardFace,
    setDefaultCardFace,
    randomSelectionEnabled,
    setRandomSelectionEnabled,
    randomSelectionCount,
    setRandomSelectionCount,
    rankPlaceholderText,
    setRankPlaceholderText,
    fieldMapping,
    setFieldMapping,
    editModeEnabled,
    setEditModeEnabled,
  } = useSettingsStore();

  // Compute effective drag mode from dragModeEnabled and dragFace
  const effectiveDragMode: DragFace | "none" = dragModeEnabled ? dragFace : "none";

  // Handle drag mode change
  const handleDragModeChange = useCallback((value: DragFace | "none") => {
    if (value === "none") {
      setDragModeEnabled(false);
    } else {
      setDragModeEnabled(true);
      setDragFace(value);
    }
  }, [setDragModeEnabled, setDragFace]);

  const handlePlaceholderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRankPlaceholderText(event.target.value);
    },
    [setRankPlaceholderText]
  );

  const handleFieldMappingChange = useCallback(
    (field: keyof FieldMappingConfig, value: string) => {
      setFieldMapping({ [field]: value });
    },
    [setFieldMapping]
  );

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "order":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Max Visible</span>
              <div className={styles.numberControl}>
                <button
                  type="button"
                  className={styles.numberButton}
                  onClick={() => { setMaxVisibleCards(Math.max(1, maxVisibleCards - 1)); }}
                  aria-label="Decrease"
                  disabled={maxVisibleCards <= 1}
                >
                  −
                </button>
                <span className={styles.numberValue}>{maxVisibleCards}</span>
                <button
                  type="button"
                  className={styles.numberButton}
                  onClick={() => { setMaxVisibleCards(Math.min(10, maxVisibleCards + 1)); }}
                  aria-label="Increase"
                  disabled={maxVisibleCards >= 10}
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Shuffle on Load</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={shuffleOnLoad}
                  onChange={(e) => { setShuffleOnLoad(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Show Cards</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Default card face">
                {defaultFaceOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      defaultCardFace === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setDefaultCardFace(value); }}
                    role="radio"
                    aria-checked={defaultCardFace === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Drag to Reorder</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Drag mode">
                {dragModeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      effectiveDragMode === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { handleDragModeChange(value); }}
                    role="radio"
                    aria-checked={effectiveDragMode === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {!shuffleOnLoad && (
              <>
                <div className={styles.row}>
                  <span className={styles.label}>Sort By</span>
                  <select
                    className={styles.select}
                    value={fieldMapping.sortField}
                    onChange={(e) => { handleFieldMappingChange("sortField", e.target.value); }}
                    aria-label="Sort field"
                  >
                    {SORT_FIELD_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Sort Direction</span>
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
                    >
                      Desc
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Divider before Random Selection */}
            <div className={styles.divider} />

            {/* Random Selection Toggle */}
            <div className={styles.row}>
              <span className={styles.label}>Random Selection</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={randomSelectionEnabled}
                  onChange={(e) => { setRandomSelectionEnabled(e.target.checked); }}
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
                      onChange={(e) => { setRandomSelectionCount(Number(e.target.value)); }}
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

            {/* Divider before Edit Mode */}
            <div className={styles.divider} />

            {/* Edit Mode Toggle */}
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
          </>
        );

      case "front":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Footer Badge Field</span>
              <select
                className={styles.select}
                value={fieldMapping.footerBadgeField}
                onChange={(e) => { handleFieldMappingChange("footerBadgeField", e.target.value); }}
                aria-label="Footer badge field"
              >
                {FOOTER_BADGE_FIELD_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Unranked Text</span>
              <input
                type="text"
                className={styles.textInput}
                value={rankPlaceholderText}
                onChange={handlePlaceholderChange}
                placeholder="The one that got away!"
                aria-label="Rank placeholder text"
              />
            </div>
          </>
        );

      case "back":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Subtitle Field</span>
              <select
                className={styles.select}
                value={fieldMapping.subtitleField}
                onChange={(e) => { handleFieldMappingChange("subtitleField", e.target.value); }}
                aria-label="Subtitle field"
              >
                {SUBTITLE_FIELD_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Logo Field</span>
              <select
                className={styles.select}
                value={fieldMapping.logoField}
                onChange={(e) => { handleFieldMappingChange("logoField", e.target.value); }}
                aria-label="Logo field"
              >
                {LOGO_FIELD_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
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
