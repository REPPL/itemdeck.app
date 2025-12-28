/**
 * Settings panel for Snap Ranking mechanic.
 */

import type { MechanicSettingsProps } from "../types";
import type { SnapRankingSettings } from "./types";
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
        <Toggle
          label="Confirm Before Rating"
          checked={settings.confirmRating}
          onChange={(value) => { onChange({ confirmRating: value }); }}
          disabled={disabled}
        />
      </div>

      <div className={styles.settingRow}>
        <Toggle
          label="Auto-advance After Rating"
          checked={settings.autoAdvance}
          onChange={(value) => { onChange({ autoAdvance: value }); }}
          disabled={disabled}
        />
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--colour-text-muted)", marginTop: "0.5rem" }}>
        Use keyboard shortcuts S/A/B/C/D/F for quick rating.
      </p>
    </div>
  );
}
