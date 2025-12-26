/**
 * Edit mode indicator component.
 *
 * Shows a badge when edit mode is enabled, with click handler
 * to open settings panel.
 */

import { useSettingsStore } from "@/stores/settingsStore";
import { EditIcon } from "@/components/Icons/Icons";
import styles from "./EditModeIndicator.module.css";

interface EditModeIndicatorProps {
  /** Click handler (typically opens settings) */
  onClick?: () => void;
}

/**
 * Visual indicator shown when edit mode is active.
 * Appears as a badge in the header area.
 */
export function EditModeIndicator({ onClick }: EditModeIndicatorProps) {
  const editModeEnabled = useSettingsStore((state) => state.editModeEnabled);

  if (!editModeEnabled) {
    return null;
  }

  return (
    <button
      className={styles.indicator}
      onClick={onClick}
      title="Edit mode is active - click to open settings"
      aria-label="Edit mode enabled. Click to open settings."
    >
      <EditIcon size={14} />
      <span className={styles.label}>Edit Mode</span>
    </button>
  );
}

export default EditModeIndicator;
