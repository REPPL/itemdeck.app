/**
 * ConfigSettingsTabs - Sub-tabbed interface for configuration settings.
 *
 * Top-level Configuration tab with sub-tabs:
 * - Order: Shuffle on Load, Sort By, Sort Direction (sort only visible when shuffle off)
 * - Card: Field mapping split between Front (Footer Badge, Unranked Text) and Back (Subtitle, Logo)
 * - Misc: Other configurable options
 */

import { useState, useCallback } from "react";
import {
  useSettingsStore,
  type FieldMappingConfig,
} from "@/stores/settingsStore";
import {
  SUBTITLE_FIELD_OPTIONS,
  FOOTER_BADGE_FIELD_OPTIONS,
  LOGO_FIELD_OPTIONS,
  SORT_FIELD_OPTIONS,
} from "@/utils/fieldPathResolver";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type ConfigSubTab = "order" | "card" | "misc";

const subTabs: { id: ConfigSubTab; label: string }[] = [
  { id: "order", label: "Order" },
  { id: "card", label: "Card" },
  { id: "misc", label: "Misc" },
];

/**
 * Sub-tabbed configuration settings interface.
 */
export function ConfigSettingsTabs() {
  const [activeSubTab, setActiveSubTab] = useState<ConfigSubTab>("order");

  const {
    shuffleOnLoad,
    setShuffleOnLoad,
    rankPlaceholderText,
    setRankPlaceholderText,
    fieldMapping,
    setFieldMapping,
  } = useSettingsStore();

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
            {/* Sort options only visible when shuffle is off */}
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
          </>
        );

      case "card":
        return (
          <>
            {/* Front Face Fields */}
            <h4 className={styles.subsectionTitle}>Front Face</h4>
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

            {/* Back Face Fields */}
            <h4 className={styles.subsectionTitle}>Back Face</h4>
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

      case "misc":
        return (
          <>
            <p className={styles.themeInfo}>
              Additional configuration options will appear here as features are added.
            </p>
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
