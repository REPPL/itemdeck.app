/**
 * Memory game settings component.
 *
 * Renders settings UI for the Memory mechanic.
 * @see ADR-020 for settings isolation pattern
 */

import { useCallback } from "react";
import {
  DIFFICULTY_SETTINGS,
  PAIR_COUNT_OPTIONS,
  type MemoryDifficulty,
  type PairCount,
} from "./store";
import type { MechanicSettingsProps } from "../types";
import type { MemorySettings } from "./types";
import styles from "./Settings.module.css";

/**
 * Memory game settings panel.
 */
export function MemorySettingsPanel({
  settings,
  onChange,
  disabled = false,
}: MechanicSettingsProps<MemorySettings>) {
  const handleDifficultyChange = useCallback(
    (difficulty: MemoryDifficulty) => {
      onChange({ difficulty });
    },
    [onChange]
  );

  const handlePairCountChange = useCallback(
    (pairCount: PairCount) => {
      onChange({ pairCount });
    },
    [onChange]
  );

  return (
    <div className={styles.container}>
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Difficulty</span>
        <div className={styles.segmentedControl}>
          {(
            Object.entries(DIFFICULTY_SETTINGS) as [
              MemoryDifficulty,
              (typeof DIFFICULTY_SETTINGS)[MemoryDifficulty],
            ][]
          ).map(([key, { label }]) => (
            <button
              key={key}
              type="button"
              className={[
                styles.segmentButton,
                settings.difficulty === key ? styles.segmentButtonActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                handleDifficultyChange(key);
              }}
              disabled={disabled}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.settingRow}>
        <span className={styles.settingLabel}>Pairs</span>
        <div className={styles.segmentedControl}>
          {PAIR_COUNT_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              className={[
                styles.segmentButton,
                settings.pairCount === count ? styles.segmentButtonActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                handlePairCountChange(count);
              }}
              disabled={disabled}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
