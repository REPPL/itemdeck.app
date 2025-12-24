/**
 * CardSettingsTabs - Sub-tabbed interface for card settings.
 *
 * Replaces section headers with navigable sub-tabs to ensure
 * all settings are visible without scrolling.
 *
 * Sub-tabs:
 * - Layout: Size, Aspect Ratio
 * - Front: Title Display, Badges
 * - Back: Show Logo toggle
 */

import { useState } from "react";
import {
  useSettingsStore,
  type TitleDisplayMode,
  type CardSizePreset,
  type CardAspectRatio,
} from "@/stores/settingsStore";
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

  const {
    cardSizePreset,
    cardAspectRatio,
    cardBackDisplay,
    titleDisplayMode,
    showRankBadge,
    showDeviceBadge,
    setCardSizePreset,
    setCardAspectRatio,
    setCardBackDisplay,
    setTitleDisplayMode,
    setShowRankBadge,
    setShowDeviceBadge,
  } = useSettingsStore();

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
              <span className={styles.label}>Show Rank Badge</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showRankBadge}
                  onChange={(e) => { setShowRankBadge(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
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
          </>
        );

      case "back":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Show Logo</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={cardBackDisplay === "logo"}
                  onChange={(e) => { setCardBackDisplay(e.target.checked ? "logo" : "none"); }}
                />
                <span className={styles.toggleSlider} />
              </label>
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
