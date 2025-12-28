/**
 * System settings component.
 *
 * Core system preferences: Dark mode, accessibility, UI visibility.
 */

import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshButton } from "@/components/RefreshButton";
import {
  useSettingsStore,
  type ReduceMotionPreference,
} from "@/stores/settingsStore";
import styles from "./SettingsPanel.module.css";

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
 * System settings panel.
 */
export function SystemSettings({
  devtoolsEnabled = false,
  onDevtoolsToggle,
}: SystemSettingsProps) {
  const {
    reduceMotion,
    highContrast,
    showHelpButton,
    showSettingsButton,
    showSearchBar,
    setReduceMotion,
    setHighContrast,
    setShowHelpButton,
    setShowSettingsButton,
    setShowSearchBar,
  } = useSettingsStore();

  return (
    <>
      {/* Dark Mode */}
      <div className={styles.row}>
        <span className={styles.label}>Dark Mode</span>
        <ThemeToggle />
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>Accessibility</h3>

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
              onClick={() => { setReduceMotion(value); }}
              role="radio"
              aria-checked={reduceMotion === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>High Contrast</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => { setHighContrast(e.target.checked); }}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      <div className={styles.divider} />

      <h3 className={styles.sectionHeader}>UI Visibility</h3>

      <div className={styles.row}>
        <span className={styles.label}>Show Help Button</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showHelpButton}
            onChange={(e) => { setShowHelpButton(e.target.checked); }}
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
            onChange={(e) => { setShowSettingsButton(e.target.checked); }}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      <div className={styles.row}>
        <span className={styles.label}>Show Search Bar</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showSearchBar}
            onChange={(e) => { setShowSearchBar(e.target.checked); }}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      {onDevtoolsToggle && (
        <>
          <div className={styles.divider} />

          <h3 className={styles.sectionHeader}>Developer</h3>

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
        </>
      )}

      <div className={styles.divider} />

      <div className={styles.row}>
        <span className={styles.label}>Refresh Data</span>
        <RefreshButton size="small" />
      </div>
    </>
  );
}
