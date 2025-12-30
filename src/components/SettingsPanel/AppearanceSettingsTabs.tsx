/**
 * Appearance settings with sub-tabbed interface.
 *
 * Visual appearance settings: Theme, Cards, Field mapping.
 * v0.11.1 Redesign: Merged Theme and Cards tabs.
 *
 * Sub-tabs:
 * - Theme: Visual theme selection, colours, card style, browse
 * - Cards: Layout, front face, back face settings
 * - Fields: Field mapping configuration
 * - Interactions: Drag mode, edit mode settings
 */

import { useState, useEffect } from "react";
import { ThemeSettingsTabs } from "./ThemeSettingsTabs";
import { CardSettingsTabs } from "./CardSettingsTabs";
import { ConfigSettingsTabs } from "./ConfigSettingsTabs";
import { useSettingsStore, type DefaultCardFace, type DragFace } from "@/stores/settingsStore";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type AppearanceSubTab = "theme" | "cards" | "fields" | "interactions";

const subTabs: { id: AppearanceSubTab; label: string }[] = [
  { id: "theme", label: "Theme" },
  { id: "cards", label: "Cards" },
  { id: "fields", label: "Fields" },
  { id: "interactions", label: "Interactions" },
];

interface AppearanceSettingsTabsProps {
  /** Initial sub-tab to navigate to (from search) */
  initialSubTab?: string;
}

/**
 * Combined appearance settings with sub-tabs.
 */
export function AppearanceSettingsTabs({ initialSubTab }: AppearanceSettingsTabsProps) {
  const [activeSubTab, setActiveSubTab] = useState<AppearanceSubTab>("theme");

  // Handle navigation from search
  useEffect(() => {
    if (initialSubTab && subTabs.some((t) => t.id === initialSubTab)) {
      setActiveSubTab(initialSubTab as AppearanceSubTab);
    }
  }, [initialSubTab]);

  // Use draft pattern for settings (F-090)
  // Subscribe to _draft to trigger re-renders when draft changes
  useSettingsStore((s) => s._draft);
  const getEffective = useSettingsStore((s) => s.getEffective);
  const updateDraft = useSettingsStore((s) => s.updateDraft);

  // Get effective values from draft
  // Note: _draft subscription above ensures re-render when these values change
  const dragModeEnabled = getEffective("dragModeEnabled");
  const showDragIcon = getEffective("showDragIcon");
  const dragFace = getEffective("dragFace");
  const defaultCardFace = getEffective("defaultCardFace");

  // Handlers that update draft
  const handleDragModeChange = (enabled: boolean) => {
    updateDraft({ dragModeEnabled: enabled });
  };

  const handleShowDragIconChange = (show: boolean) => {
    updateDraft({ showDragIcon: show });
  };

  const handleDragFaceChange = (face: DragFace) => {
    updateDraft({ dragFace: face });
  };

  const handleDefaultCardFaceChange = (face: DefaultCardFace) => {
    updateDraft({ defaultCardFace: face });
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "theme":
        return <ThemeSettingsTabs />;

      case "cards":
        return <CardSettingsTabs />;

      case "fields":
        return <ConfigSettingsTabs />;

      case "interactions":
        return (
          <>
            <h3 className={styles.sectionHeader}>Card Interactions</h3>

            <div className={styles.row}>
              <span className={styles.label}>Drag Mode</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={dragModeEnabled}
                  onChange={(e) => { handleDragModeChange(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.helpText}>
              Enable drag and drop to reorder cards in the grid.
            </div>

            {dragModeEnabled && (
              <>
                <div className={styles.row}>
                  <span className={styles.label}>Drag Face</span>
                  <div className={styles.segmentedControl} role="radiogroup" aria-label="Which card face to drag">
                    <button
                      type="button"
                      className={[
                        styles.segmentButton,
                        dragFace === "front" ? styles.segmentButtonActive : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => { handleDragFaceChange("front"); }}
                      role="radio"
                      aria-checked={dragFace === "front"}
                    >
                      Front
                    </button>
                    <button
                      type="button"
                      className={[
                        styles.segmentButton,
                        dragFace === "back" ? styles.segmentButtonActive : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => { handleDragFaceChange("back"); }}
                      role="radio"
                      aria-checked={dragFace === "back"}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className={[
                        styles.segmentButton,
                        dragFace === "both" ? styles.segmentButtonActive : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => { handleDragFaceChange("both"); }}
                      role="radio"
                      aria-checked={dragFace === "both"}
                    >
                      Both
                    </button>
                  </div>
                </div>

                <div className={styles.row}>
                  <span className={styles.label}>Show Drag Icon</span>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={showDragIcon}
                      onChange={(e) => { handleShowDragIconChange(e.target.checked); }}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              </>
            )}

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Default Card Face</h3>

            <div className={styles.row}>
              <span className={styles.label}>Start On</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Default card face">
                <button
                  type="button"
                  className={[
                    styles.segmentButton,
                    defaultCardFace === "front" ? styles.segmentButtonActive : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => { handleDefaultCardFaceChange("front"); }}
                  role="radio"
                  aria-checked={defaultCardFace === "front"}
                >
                  Front
                </button>
                <button
                  type="button"
                  className={[
                    styles.segmentButton,
                    defaultCardFace === "back" ? styles.segmentButtonActive : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => { handleDefaultCardFaceChange("back"); }}
                  role="radio"
                  aria-checked={defaultCardFace === "back"}
                >
                  Back
                </button>
              </div>
            </div>

            <div className={styles.helpText}>
              Which face cards show when the page loads.
            </div>
          </>
        );
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Sub-tab navigation */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Appearance settings sections">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`appearance-subtab-${id}`}
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
        id={`appearance-subtab-${activeSubTab}`}
        aria-labelledby={`appearance-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
