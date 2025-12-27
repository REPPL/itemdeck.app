/**
 * ViewModeToggle component for switching between grid, list, and compact views.
 */

import { useCallback } from "react";
import { useSettingsStore, type LayoutType } from "@/stores/settingsStore";
import styles from "./ViewModeToggle.module.css";

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}

function CompactIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
  );
}

const viewModes: { type: LayoutType; icon: React.ReactNode; label: string }[] = [
  { type: "grid", icon: <GridIcon />, label: "Grid view" },
  { type: "list", icon: <ListIcon />, label: "List view" },
  { type: "compact", icon: <CompactIcon />, label: "Compact view" },
];

/**
 * Segmented control for switching view modes.
 */
export function ViewModeToggle() {
  const layout = useSettingsStore((state) => state.layout);
  const setLayout = useSettingsStore((state) => state.setLayout);

  const handleClick = useCallback(
    (type: LayoutType) => {
      setLayout(type);
    },
    [setLayout]
  );

  return (
    <div className={styles.container} role="group" aria-label="View mode">
      {viewModes.map(({ type, icon, label }) => (
        <button
          key={type}
          type="button"
          className={`${styles.button ?? ""} ${layout === type ? styles.active ?? "" : ""}`}
          onClick={() => { handleClick(type); }}
          aria-pressed={layout === type}
          aria-label={label}
          title={label}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

export default ViewModeToggle;
