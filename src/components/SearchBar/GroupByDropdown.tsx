/**
 * GroupByDropdown component for selecting card grouping.
 */

import { useCallback } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { GROUP_BY_FIELD_OPTIONS } from "@/utils/fieldPathResolver";
import styles from "./GroupByDropdown.module.css";

function GroupIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

/**
 * Dropdown for selecting grouping field.
 * Only visible in list/compact views (not grid/cards).
 */
export function GroupByDropdown() {
  const layout = useSettingsStore((state) => state.layout);
  const groupByField = useSettingsStore((state) => state.groupByField);
  const setGroupByField = useSettingsStore((state) => state.setGroupByField);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setGroupByField(value === "none" ? null : value);
    },
    [setGroupByField]
  );

  // Hide in grid view (cards) - grouping only affects list/compact views
  if (layout === "grid") {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>Group by</span>
      <div className={styles.container}>
        <span className={styles.icon}>
          <GroupIcon />
        </span>
        <select
          className={styles.select}
          value={groupByField ?? "none"}
          onChange={handleChange}
          aria-label="Group cards by"
        >
          {GROUP_BY_FIELD_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default GroupByDropdown;
