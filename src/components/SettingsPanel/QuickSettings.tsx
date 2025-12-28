/**
 * Quick Settings component.
 *
 * Provides easy access to the most commonly changed settings:
 * - Visual theme preset (dropdown with all themes)
 * - Card size (Small/Medium/Large buttons)
 * - View mode (Grid/List/Compact buttons)
 * - Shuffle on load (toggle)
 * - Random selection (toggle with count input)
 *
 * v0.11.5: Removed Statistics Bar toggle, Refresh Data button, and Games Mode.
 * Statistics Bar moved to System > UI Visibility.
 * Games Mode accessible via Navigation Hub Games button.
 */

import { useEffect } from "react";
import { useCollectionData } from "@/context/CollectionDataContext";
import {
  useSettingsStore,
  type VisualTheme,
  type CardSizePreset,
  type LayoutType,
} from "@/stores/settingsStore";
// Games Mode removed - now accessible via Navigation Hub Games button
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
  {
    value: "fit",
    label: "Fit",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
        {/* Arrows pointing outward to corners */}
        <path d="M3 3h5v2H5.41l4.3 4.29-1.42 1.42L4 6.41V9H2V3h1z" />
        <path d="M21 3h-5v2h2.59l-4.3 4.29 1.42 1.42L20 6.41V9h2V3h-1z" />
        <path d="M3 21h5v-2H5.41l4.3-4.29-1.42-1.42L4 17.59V15H2v6h1z" />
        <path d="M21 21h-5v-2h2.59l-4.3-4.29 1.42-1.42L20 17.59V15h2v6h-1z" />
        {/* Centre card */}
        <rect x="8" y="8" width="8" height="8" rx="1" />
      </svg>
    ),
  },
];

/**
 * Quick Settings panel for most commonly used settings.
 */
export function QuickSettings() {
  const { cards } = useCollectionData();
  const totalCardCount = cards.length;

  const {
    visualTheme,
    cardSizePreset,
    shuffleOnLoad,
    layout,
    randomSelectionEnabled,
    randomSelectionCount,
    setVisualTheme,
    setCardSizePreset,
    setShuffleOnLoad,
    setLayout,
    setRandomSelectionEnabled,
    setRandomSelectionCount,
  } = useSettingsStore();

  // Clamp selection count when collection changes (e.g., fewer cards available)
  useEffect(() => {
    if (totalCardCount > 0 && randomSelectionCount > totalCardCount) {
      setRandomSelectionCount(totalCardCount);
    }
  }, [totalCardCount, randomSelectionCount, setRandomSelectionCount]);

  // Display effective count (clamped to available cards)
  const effectiveCount = Math.min(randomSelectionCount, totalCardCount || randomSelectionCount);

  return (
    <>
      {/* Visual Theme */}
      <div className={styles.row}>
        <span className={styles.label}>Current Theme</span>
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
        <span className={styles.label}>Shuffle Cards on Load</span>
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
        <>
          <div className={styles.row}>
            <span className={styles.label}>Selection Count</span>
            <input
              type="number"
              className={styles.numberInput}
              value={effectiveCount}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10) || 1;
                setRandomSelectionCount(Math.min(Math.max(1, value), totalCardCount));
              }}
              min={1}
              max={totalCardCount}
              aria-label="Random selection count"
            />
          </div>
          <div className={styles.helpText}>
            (out of {totalCardCount} cards)
          </div>
        </>
      )}

    </>
  );
}
