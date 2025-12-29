/**
 * Settings panel for Competing (Top Trumps) mechanic.
 */

import { useCallback } from "react";
import type { MechanicSettingsProps } from "../types";
import type { CompetingSettings, Difficulty, RoundLimitOption } from "./types";
import { ROUND_LIMIT_OPTIONS, getRoundLimitLabel, DIFFICULTY_DESCRIPTIONS } from "./types";
import styles from "./Competing.module.css";

/**
 * Toggle component.
 */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, onChange, disabled]);

  return (
    <div className={styles.toggleRow}>
      <div
        className={`${styles.toggle ?? ""} ${checked ? (styles.active ?? "") : ""} ${disabled ? (styles.disabled ?? "") : ""}`}
        onClick={handleClick}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <div className={styles.toggleKnob} />
      </div>
      <span className={styles.toggleLabel}>{label}</span>
    </div>
  );
}

/**
 * Competing settings panel.
 */
export function CompetingSettingsPanel({
  settings,
  onChange,
  disabled,
}: MechanicSettingsProps<CompetingSettings>) {
  const handleDifficultyChange = useCallback(
    (difficulty: Difficulty) => {
      onChange({ difficulty });
    },
    [onChange]
  );

  const handleRoundLimitChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = Number(e.target.value) as RoundLimitOption;
      onChange({ roundLimit: value });
    },
    [onChange]
  );

  return (
    <div className={styles.settingsContainer}>
      {/* Difficulty selector */}
      <div className={styles.settingGroup}>
        <span className={styles.settingLabel}>Difficulty</span>
        <div className={styles.difficultyOptions}>
          {(["simple", "medium", "hard"] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              type="button"
              className={`${styles.difficultyOption ?? ""} ${settings.difficulty === diff ? (styles.selected ?? "") : ""}`}
              onClick={() => { handleDifficultyChange(diff); }}
              disabled={disabled}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
        <span className={styles.settingDescription}>
          {DIFFICULTY_DESCRIPTIONS[settings.difficulty]}
        </span>
      </div>

      {/* Round limit */}
      <div className={styles.settingGroup}>
        <label className={styles.settingLabel}>
          Game Mode
          <select
            className={styles.select}
            value={settings.roundLimit}
            onChange={handleRoundLimitChange}
            disabled={disabled}
            style={{ marginLeft: "0.5rem" }}
          >
            {ROUND_LIMIT_OPTIONS.map((limit) => (
              <option key={limit} value={limit}>
                {getRoundLimitLabel(limit)}
              </option>
            ))}
          </select>
        </label>
        <span className={styles.settingDescription}>
          {settings.roundLimit === 0
            ? "Game ends when one player has all the cards."
            : `Game ends after ${String(settings.roundLimit)} rounds. Most cards wins.`}
        </span>
      </div>

      {/* CPU thinking toggle */}
      <div className={styles.settingGroup}>
        <Toggle
          label="Show CPU Thinking"
          checked={settings.showCpuThinking}
          onChange={(value) => { onChange({ showCpuThinking: value }); }}
          disabled={disabled}
        />
        <span className={styles.settingDescription}>
          Brief pause when CPU is selecting a stat.
        </span>
      </div>

      {/* Auto-advance toggle */}
      <div className={styles.settingGroup}>
        <Toggle
          label="Auto-Advance Rounds"
          checked={settings.autoAdvance}
          onChange={(value) => { onChange({ autoAdvance: value }); }}
          disabled={disabled}
        />
        <span className={styles.settingDescription}>
          Automatically proceed to the next round after results.
        </span>
      </div>
    </div>
  );
}
