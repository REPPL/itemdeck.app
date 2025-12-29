/**
 * ViewPopover component.
 *
 * Popover for changing view mode and grouping options.
 * Opened from the View button in NavigationHub.
 *
 * @see F-086: View Button with Popover
 * @see F-111: Overlay Consistency Review
 */

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore, type LayoutType } from "@/stores/settingsStore";
import { useAvailableGroupFields } from "@/hooks/useAvailableGroupFields";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import styles from "./ViewPopover.module.css";

// ============================================================================
// Icons
// ============================================================================

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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ============================================================================
// Constants
// ============================================================================

const viewModes: { type: LayoutType; icon: React.ReactNode; label: string }[] = [
  { type: "grid", icon: <GridIcon />, label: "Grid" },
  { type: "list", icon: <ListIcon />, label: "List" },
  { type: "compact", icon: <CompactIcon />, label: "Compact" },
];

// ============================================================================
// Animation
// ============================================================================

const popoverVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 10,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================================================
// Types
// ============================================================================

interface ViewPopoverProps {
  /** Whether the popover is open */
  isOpen: boolean;
  /** Callback to close the popover */
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * ViewPopover component.
 *
 * A popover menu for changing view mode (Grid/List/Compact) and
 * grouping options (None/Platform/Year/Decade/Genre).
 */
export function ViewPopover({ isOpen, onClose }: ViewPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Store state
  const layout = useSettingsStore((state) => state.layout);
  const setLayout = useSettingsStore((state) => state.setLayout);
  const groupByField = useSettingsStore((state) => state.groupByField);
  const setGroupByField = useSettingsStore((state) => state.setGroupByField);

  // Get available grouping options based on collection data
  const groupByOptions = useAvailableGroupFields();

  // Group By only shown in List view (not Grid or Compact)
  const showGroupBy = layout === "list";

  // Use shared focus trap hook for consistent behaviour
  useFocusTrap({
    enabled: isOpen,
    onEscape: onClose,
    restoreFocus: true,
  });

  // Handle view mode change
  const handleViewModeChange = useCallback(
    (type: LayoutType) => {
      setLayout(type);
    },
    [setLayout]
  );

  // Handle grouping change
  const handleGroupChange = useCallback(
    (value: string) => {
      setGroupByField(value === "none" ? null : value);
    },
    [setGroupByField]
  );

  // Focus first option when opened
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      const firstButton = popoverRef.current.querySelector("button");
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [isOpen]);

  // Helper to build class names
  const getOptionClass = (isActive: boolean) =>
    [styles.option, isActive && styles.optionActive].filter(Boolean).join(" ");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible overlay for click-outside */}
          <div
            className={styles.overlay}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Popover content */}
          <motion.div
            ref={popoverRef}
            className={styles.popover}
            role="dialog"
            aria-label="View options"
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header row with close button */}
            <div className={styles.header}>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close view options"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Grouping Section - only shown in List view */}
            {showGroupBy && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Group By</h3>
                <ul className={styles.optionList} role="listbox" aria-label="Select grouping">
                  {groupByOptions.map(({ value, label }) => {
                    const isActive = (groupByField ?? "none") === value;
                    return (
                      <li key={value}>
                        <button
                          type="button"
                          className={getOptionClass(isActive)}
                          onClick={() => { handleGroupChange(value); }}
                          role="option"
                          aria-selected={isActive}
                        >
                          <span className={styles.optionLabel}>{label}</span>
                          <span className={styles.checkmark}>
                            <CheckIcon />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* View Mode Section - at bottom */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>View Mode</h3>
              <ul className={styles.optionList} role="listbox" aria-label="Select view mode">
                {viewModes.map(({ type, icon, label }) => (
                  <li key={type}>
                    <button
                      type="button"
                      className={getOptionClass(layout === type)}
                      onClick={() => { handleViewModeChange(type); }}
                      role="option"
                      aria-selected={layout === type}
                    >
                      <span className={styles.optionIcon}>{icon}</span>
                      <span className={styles.optionLabel}>{label}</span>
                      <span className={styles.checkmark}>
                        <CheckIcon />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ViewPopover;
