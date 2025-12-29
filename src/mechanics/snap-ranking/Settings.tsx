/**
 * Settings panel for Snap Ranking (Guess the Value) mechanic.
 */

import type { MechanicSettingsProps } from "../types";
import type { SnapRankingSettings } from "./types";
import { CARD_COUNT_OPTIONS, getCardCountLabel, type CardCountOption } from "./types";
import styles from "./SnapRanking.module.css";

/**
 * Toggle component for settings.
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
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: disabled ? "not-allowed" : "pointer" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { onChange(e.target.checked); }}
        disabled={disabled}
        style={{ width: "1.25rem", height: "1.25rem" }}
      />
      <span style={{ opacity: disabled ? 0.5 : 1 }}>{label}</span>
    </label>
  );
}

/**
 * Snap Ranking settings panel.
 */
export function SnapRankingSettingsPanel({
  settings,
  onChange,
  disabled,
}: MechanicSettingsProps<SnapRankingSettings>) {
  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingRow}>
        <Toggle
          label="Show Timer"
          checked={settings.showTimer}
          onChange={(value) => { onChange({ showTimer: value }); }}
          disabled={disabled}
        />
      </div>

      <div className={styles.settingRow}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>Cards:</span>
          <select
            value={settings.cardCount}
            onChange={(e) => { onChange({ cardCount: Number(e.target.value) as CardCountOption }); }}
            disabled={disabled}
            style={{
              padding: "0.25rem 0.5rem",
              borderRadius: "4px",
              border: "1px solid var(--colour-border, #444)",
              background: "var(--colour-surface, #1a1a2e)",
              color: "var(--colour-text, #fff)",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            {CARD_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {getCardCountLabel(count)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--colour-text-muted)", marginTop: "0.5rem" }}>
        The game uses the Top Badge field from Settings to determine what to guess.
        Use number keys 1-9 (and 0 for 10th option) as shortcuts.
      </p>
    </div>
  );
}
