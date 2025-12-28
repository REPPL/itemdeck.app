/**
 * Quick Settings component.
 *
 * Provides easy access to the most commonly changed settings:
 * - Visual theme preset
 * - Card size
 * - View mode
 * - Shuffle on load
 * - Random selection
 * - Statistics bar
 * - Mechanics toggle
 */

import { RefreshButton } from "@/components/RefreshButton";
import {
  useSettingsStore,
  type VisualTheme,
  type CardSizePreset,
  type LayoutType,
} from "@/stores/settingsStore";
import styles from "./SettingsPanel.module.css";

/**
 * Visual theme options.
 */
const themeOptions: { value: VisualTheme; label: string }[] = [
  { value: "retro", label: "Retro" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
];

/**
 * Card size options.
 */
const cardSizeOptions: { value: CardSizePreset; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

/**
 * Layout type options.
 */
const layoutOptions: { value: LayoutType; label: string; icon: React.ReactNode }[] = [
  {
    value: "grid",
    label: "Grid",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    value: "list",
    label: "List",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <rect x="3" y="10" width="18" height="4" rx="1" />
        <rect x="3" y="16" width="18" height="4" rx="1" />
      </svg>
    ),
  },
  {
    value: "compact",
    label: "Compact",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        <rect x="3" y="3" width="5" height="5" rx="0.5" />
        <rect x="9.5" y="3" width="5" height="5" rx="0.5" />
        <rect x="16" y="3" width="5" height="5" rx="0.5" />
        <rect x="3" y="9.5" width="5" height="5" rx="0.5" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" />
        <rect x="16" y="9.5" width="5" height="5" rx="0.5" />
        <rect x="3" y="16" width="5" height="5" rx="0.5" />
        <rect x="9.5" y="16" width="5" height="5" rx="0.5" />
        <rect x="16" y="16" width="5" height="5" rx="0.5" />
      </svg>
    ),
  },
];

/**
 * Quick Settings panel for most commonly used settings.
 */
export function QuickSettings() {
  const {
    visualTheme,
    cardSizePreset,
    shuffleOnLoad,
    layout,
    activeMechanicId,
    showStatisticsBar,
    randomSelectionEnabled,
    randomSelectionCount,
    setVisualTheme,
    setCardSizePreset,
    setShuffleOnLoad,
    setLayout,
    setActiveMechanicId,
    setShowStatisticsBar,
    setRandomSelectionEnabled,
    setRandomSelectionCount,
  } = useSettingsStore();

  return (
    <>
      {/* Visual Theme */}
      <div className={styles.row}>
        <span className={styles.label}>Theme</span>
        <select
          className={styles.select}
          value={visualTheme}
          onChange={(e) => { setVisualTheme(e.target.value as VisualTheme); }}
          aria-label="Visual theme"
        >
          {themeOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Card Size */}
      <div className={styles.row}>
        <span className={styles.label}>Card Size</span>
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

      {/* View Mode */}
      <div className={styles.row}>
        <span className={styles.label}>View Mode</span>
        <div className={styles.segmentedControl} role="radiogroup" aria-label="View mode">
          {layoutOptions.map(({ value, label, icon }) => (
            <button
              key={value}
              type="button"
              className={[
                styles.segmentButton,
                layout === value ? styles.segmentButtonActive : "",
              ].filter(Boolean).join(" ")}
              onClick={() => { setLayout(value); }}
              role="radio"
              aria-checked={layout === value}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Shuffle on Load */}
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

      {/* Random Selection */}
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

      {randomSelectionEnabled && (
        <div className={styles.row}>
          <span className={styles.label}>Selection Count</span>
          <input
            type="number"
            className={styles.numberInput}
            value={randomSelectionCount}
            onChange={(e) => { setRandomSelectionCount(Math.max(1, parseInt(e.target.value, 10) || 1)); }}
            min={1}
            max={100}
            aria-label="Random selection count"
          />
        </div>
      )}

      {/* Statistics Bar */}
      <div className={styles.row}>
        <span className={styles.label}>Statistics Bar</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showStatisticsBar}
            onChange={(e) => { setShowStatisticsBar(e.target.checked); }}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      <div className={styles.divider} />

      {/* Mechanics Toggle */}
      <div className={styles.row}>
        <span className={styles.label}>Mechanics</span>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={activeMechanicId !== null}
            onChange={(e) => {
              if (e.target.checked) {
                setActiveMechanicId("memory"); // Default to memory game
              } else {
                setActiveMechanicId(null);
              }
            }}
          />
          <span className={styles.toggleSlider} />
        </label>
      </div>

      <div className={styles.helpText}>
        Enable game mechanics overlay for the card grid.
      </div>

      <div className={styles.divider} />

      {/* Refresh Data */}
      <div className={styles.row}>
        <span className={styles.label}>Refresh Data</span>
        <RefreshButton size="small" />
      </div>
    </>
  );
}
