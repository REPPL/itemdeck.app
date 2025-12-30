/**
 * System settings component with sub-tabbed interface.
 *
 * Core system preferences organised into sub-tabs:
 * - Top level: Dark Mode toggle (always visible)
 * - Accessibility: Reduce motion, high contrast
 * - UI Visibility: Help, settings, search, view, statistics bar toggles
 * - Developer: TanStack devtools, edit mode, debug info, hard reset
 *
 * v0.11.5: Restructured with sub-tabs. Use Placeholder Images moved to Appearance > Cards.
 * v0.15.5: Added Hard Reset feature to Developer tab.
 */

import { useState, useCallback } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteDB } from "@/db";
import {
  useSettingsStore,
  type ReduceMotionPreference,
} from "@/stores/settingsStore";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type SystemSubTab = "accessibility" | "visibility" | "developer";

const subTabs: { id: SystemSubTab; label: string }[] = [
  { id: "accessibility", label: "Accessibility" },
  { id: "visibility", label: "UI Visibility" },
  { id: "developer", label: "Developer" },
];

const reduceMotionOptions: { value: ReduceMotionPreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

interface SystemSettingsProps {
  /** Whether TanStack devtools are enabled */
  devtoolsEnabled?: boolean;
  /** Callback to toggle devtools */
  onDevtoolsToggle?: () => void;
}

/**
 * System settings panel with sub-tabs.
 */
export function SystemSettings({
  devtoolsEnabled = false,
  onDevtoolsToggle,
}: SystemSettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<SystemSubTab>("accessibility");
  const [showHardResetDialog, setShowHardResetDialog] = useState(false);

  // Hard reset handler - clears all persisted data
  const handleHardReset = useCallback(async () => {
    try {
      // Clear all localStorage keys used by itemdeck
      const localStorageKeys = [
        "itemdeck-settings",
        "itemdeck-sources",
        "itemdeck-edits",
        "itemdeck-theme",
        "itemdeck-plugins",
      ];
      for (const key of localStorageKeys) {
        localStorage.removeItem(key);
      }

      // Delete IndexedDB database
      await deleteDB();

      // Reload the page to apply fresh state
      window.location.reload();
    } catch (error) {
      console.error("Hard reset failed:", error);
      // Still try to reload even if something failed
      window.location.reload();
    }
  }, []);

  // Draft state for preview (F-090)
  // Subscribe to _draft to trigger re-renders when draft changes
  useSettingsStore((s) => s._draft);
  const getEffective = useSettingsStore((s) => s.getEffective);
  const updateDraft = useSettingsStore((s) => s.updateDraft);

  // Accessibility settings apply immediately (bypass draft pattern)
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const setHighContrast = useSettingsStore((s) => s.setHighContrast);

  // Get effective values from draft
  // Note: _draft subscription above ensures re-render when these values change
  const reduceMotion = getEffective("reduceMotion");
  const highContrast = getEffective("highContrast");
  const showHelpButton = getEffective("showHelpButton");
  const showSettingsButton = getEffective("showSettingsButton");
  const showSearchBar = getEffective("showSearchBar");
  const showViewButton = getEffective("showViewButton");
  const showStatisticsBar = getEffective("showStatisticsBar");

  // Edit mode uses direct setter (developer feature, immediate feedback)
  const editModeEnabled = useSettingsStore((s) => s.editModeEnabled);
  const setEditModeEnabled = useSettingsStore((s) => s.setEditModeEnabled);

  // Handle accessibility setting changes - apply immediately AND update draft
  const handleReduceMotionChange = (value: ReduceMotionPreference) => {
    setReduceMotion(value);
    updateDraft({ reduceMotion: value });
  };

  const handleHighContrastChange = (enabled: boolean) => {
    setHighContrast(enabled);
    updateDraft({ highContrast: enabled });
  };

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "accessibility":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Reduce Motion</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Reduce motion">
                {reduceMotionOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      reduceMotion === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { handleReduceMotionChange(value); }}
                    role="radio"
                    aria-checked={reduceMotion === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.helpText}>
              Controls animation and motion effects. &quot;System&quot; respects your OS preference.
              Changes apply immediately for accessibility.
            </div>

            <div className={styles.divider} />

            <div className={styles.row}>
              <span className={styles.label}>High Contrast</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => { handleHighContrastChange(e.target.checked); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.helpText}>
              Increases contrast for better visibility.
              Changes apply immediately for accessibility.
            </div>
          </>
        );

      case "visibility":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Show Help Button</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showHelpButton}
                  onChange={(e) => { updateDraft({ showHelpButton: e.target.checked }); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Show Settings Button</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showSettingsButton}
                  onChange={(e) => { updateDraft({ showSettingsButton: e.target.checked }); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Show Search Button</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showSearchBar}
                  onChange={(e) => { updateDraft({ showSearchBar: e.target.checked }); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Show View Button</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showViewButton}
                  onChange={(e) => { updateDraft({ showViewButton: e.target.checked }); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Show Statistics Bar</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={showStatisticsBar}
                  onChange={(e) => { updateDraft({ showStatisticsBar: e.target.checked }); }}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </>
        );

      case "developer":
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
              Enable editing of card data directly in the detail view.
            </div>

            {onDevtoolsToggle && (
              <>
                <div className={styles.divider} />

                <div className={styles.row}>
                  <span className={styles.label}>TanStack DevTools</span>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={devtoolsEnabled}
                      onChange={onDevtoolsToggle}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                <div className={styles.helpText}>
                  Shows React Query devtools for debugging data fetching.
                </div>
              </>
            )}

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Reset URL</h3>

            <div className={styles.helpText}>
              Add <code>?reset=1</code> to the URL to reset all settings to defaults.
              This clears localStorage and reloads the page.
            </div>

            <div className={styles.divider} />

            <h3 className={styles.sectionHeader}>Hard Reset</h3>

            <div className={styles.helpText}>
              Completely reset the application. This will delete all settings,
              cached data, edits, themes, and sources. The page will reload with
              a fresh state.
            </div>

            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => { setShowHardResetDialog(true); }}
            >
              Hard Reset
            </button>

            <ConfirmDialog
              isOpen={showHardResetDialog}
              title="Hard Reset"
              message="This will permanently delete all your settings, cached data, edits, custom themes, and data sources. This action cannot be undone. Are you sure you want to continue?"
              confirmLabel="Reset Everything"
              cancelLabel="Cancel"
              variant="danger"
              onConfirm={() => { void handleHardReset(); }}
              onCancel={() => { setShowHardResetDialog(false); }}
            />
          </>
        );
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Dark Mode - Always visible at top */}
      <div className={styles.row}>
        <span className={styles.label}>Dark Mode</span>
        <ThemeToggle />
      </div>

      <div className={styles.divider} />

      {/* Sub-tab navigation */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="System settings sections">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`system-subtab-${id}`}
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
        id={`system-subtab-${activeSubTab}`}
        aria-labelledby={`system-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
