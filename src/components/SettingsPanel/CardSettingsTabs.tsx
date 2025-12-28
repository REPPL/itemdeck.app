/**
 * CardSettingsTabs - Sub-tabbed interface for card settings.
 *
 * Replaces section headers with navigable sub-tabs to ensure
 * all settings are visible without scrolling.
 *
 * Sub-tabs:
 * - Layout: Size, Aspect Ratio
 * - Front: Title Display, Badges, Footer Badge Field, Unranked Text, Placeholder Images
 * - Back: Show Background, Background selection
 *
 * v0.11.5: Dynamic field options based on collection data.
 */

import { useState, useCallback } from "react";
import {
  useSettingsStore,
  type TitleDisplayMode,
  type CardSizePreset,
  type CardAspectRatio,
  type FieldMappingConfig,
} from "@/stores/settingsStore";
import { SUBTITLE_FIELD_OPTIONS } from "@/utils/fieldPathResolver";
import { useBackgroundOptions } from "@/hooks/useBackgroundOptions";
import { useAvailableFields } from "@/hooks/useAvailableFields";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type CardSubTab = "layout" | "front" | "back";

const subTabs: { id: CardSubTab; label: string }[] = [
  { id: "layout", label: "Layout" },
  { id: "front", label: "Front Face" },
  { id: "back", label: "Back Face" },
];

const titleDisplayOptions: { value: TitleDisplayMode; label: string }[] = [
  { value: "truncate", label: "Single line" },
  { value: "wrap", label: "Wrap" },
];

const cardSizeOptions: { value: CardSizePreset; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const cardAspectRatioOptions: { value: CardAspectRatio; label: string }[] = [
  { value: "3:4", label: "3:4" },
  { value: "5:7", label: "5:7" },
  { value: "1:1", label: "1:1" },
];

/**
 * Sub-tabbed card settings interface.
 */
export function CardSettingsTabs() {
  const [activeSubTab, setActiveSubTab] = useState<CardSubTab>("layout");

  // Get available background options based on collection data
  const { builtIn, collection, app } = useBackgroundOptions();

  // Get available field options based on collection data
  const { footerBadgeFields, topBadgeFields } = useAvailableFields();

  const {
    cardSizePreset,
    cardAspectRatio,
    cardBackBackground,
    titleDisplayMode,
    showDeviceBadge,
    rankPlaceholderText,
    usePlaceholderImages,
    fieldMapping,
    setCardSizePreset,
    setCardAspectRatio,
    setCardBackBackground,
    setTitleDisplayMode,
    setShowDeviceBadge,
    setRankPlaceholderText,
    setUsePlaceholderImages,
    setFieldMapping,
  } = useSettingsStore();

  // Derive whether top badge is shown from field mapping
  const showTopBadge = fieldMapping.topBadgeField !== "none";

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
      case "layout":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Size</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Card size">
                {cardSizeOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      cardSizePreset === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setCardSizePreset(value); }}
                    role="radio"
                    aria-checked={cardSizePreset === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Aspect Ratio</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Card aspect ratio">
                {cardAspectRatioOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      cardAspectRatio === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setCardAspectRatio(value); }}
                    role="radio"
                    aria-checked={cardAspectRatio === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        );

      case "front":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Title Display</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Title display mode">
                {titleDisplayOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      titleDisplayMode === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { setTitleDisplayMode(value); }}
                    role="radio"
                    aria-checked={titleDisplayMode === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
              <span className={styles.label}>Use Placeholder Images</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={usePlaceholderImages}
                  onChange={(e) => { setUsePlaceholderImages(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.helpText}>
              When off, cards without images show title on coloured background.
            </div>

            <div className={styles.divider} />

            <div className={styles.row}>
              <span className={styles.label}>Top Badge Field</span>
              <select
                className={styles.select}
                value={fieldMapping.topBadgeField}
                onChange={(e) => { handleFieldMappingChange("topBadgeField", e.target.value); }}
                aria-label="Top badge field"
              >
                {topBadgeFields.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {showTopBadge && (
              <div className={styles.row}>
                <span className={styles.label}>Text if Empty</span>
                <input
                  type="text"
                  className={styles.textInput}
                  value={rankPlaceholderText}
                  onChange={handlePlaceholderChange}
                  placeholder="e.g., ?"
                  aria-label="Text to show when field is empty"
                />
              </div>
            )}

            <div className={styles.divider} />

            <div className={styles.row}>
              <span className={styles.label}>Show Footer Badge</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showDeviceBadge}
                  onChange={(e) => { setShowDeviceBadge(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            {showDeviceBadge && (
              <div className={styles.row}>
                <span className={styles.label}>Footer Badge Field</span>
                <select
                  className={styles.select}
                  value={fieldMapping.footerBadgeField}
                  onChange={(e) => { handleFieldMappingChange("footerBadgeField", e.target.value); }}
                  aria-label="Footer badge field"
                >
                  {footerBadgeFields.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );

      case "back":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Background</span>
              <select
                className={styles.select}
                value={cardBackBackground}
                onChange={(e) => { setCardBackBackground(e.target.value); }}
                aria-label="Card back background"
              >
                <optgroup label="Built-in Patterns">
                  {builtIn.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </optgroup>
                {collection.length > 0 && (
                  <optgroup label="Collection">
                    {collection.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="App">
                  <option value={app.value}>{app.label}</option>
                </optgroup>
              </select>
            </div>
          </>
        );
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Sub-tab navigation - compact button group */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Card settings sections">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`card-subtab-${id}`}
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
        id={`card-subtab-${activeSubTab}`}
        aria-labelledby={`card-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
