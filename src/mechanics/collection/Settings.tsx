/**
 * Collection mechanic settings component.
 *
 * Renders settings UI for the Collection mechanic.
 * @see ADR-020 for settings isolation pattern
 */

import { useCallback } from "react";
import type { MechanicSettingsProps } from "../types";
import type { CollectionSettings } from "./types";
import styles from "./collection.module.css";

/**
 * Collection settings panel.
 */
export function CollectionSettingsPanel({
  settings,
  onChange,
  disabled = false,
}: MechanicSettingsProps<CollectionSettings>) {
  const handleShowProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ showProgress: e.target.checked });
    },
    [onChange]
  );

  const handleShowUnownedBadgeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ showUnownedBadge: e.target.checked });
    },
    [onChange]
  );

  const handleKeyboardShortcutsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ keyboardShortcuts: e.target.checked });
    },
    [onChange]
  );

  return (
    <div className={styles.settingsContainer}>
      <label className={styles.settingRow}>
        <input
          type="checkbox"
          checked={settings.showProgress}
          onChange={handleShowProgressChange}
          disabled={disabled}
        />
        <span className={styles.settingLabel}>Show progress bar</span>
      </label>

      <label className={styles.settingRow}>
        <input
          type="checkbox"
          checked={settings.showUnownedBadge}
          onChange={handleShowUnownedBadgeChange}
          disabled={disabled}
        />
        <span className={styles.settingLabel}>
          Show badge on unowned cards
        </span>
      </label>

      <label className={styles.settingRow}>
        <input
          type="checkbox"
          checked={settings.keyboardShortcuts}
          onChange={handleKeyboardShortcutsChange}
          disabled={disabled}
        />
        <span className={styles.settingLabel}>
          Keyboard shortcuts (O = owned, W = wishlist)
        </span>
      </label>

      <p className={styles.settingsHint}>
        Click card badges to cycle: Not owned → Owned → Wishlist
      </p>
    </div>
  );
}
