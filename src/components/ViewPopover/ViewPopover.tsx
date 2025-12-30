/**
 * ViewPopover component.
 *
 * Popover for changing view mode, sort order, and grouping options.
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
// Types
// ============================================================================

type SortOption = "shuffle" | "order" | "year" | "title";

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

function FitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {/* Four corner arrows pointing outward */}
      <path d="M3 3h5v2H5.41l3.3 3.29-1.42 1.42L4 6.41V9H2V3h1z" />
      <path d="M21 3v6h-2V6.41l-3.29 3.3-1.42-1.42L17.59 5H15V3h6z" />
      <path d="M3 21v-6h2v2.59l3.29-3.3 1.42 1.42L6.41 19H9v2H3z" />
      <path d="M21 21h-6v-2h2.59l-3.3-3.29 1.42-1.42L19 17.59V15h2v6z" />
    </svg>
  );
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
      <line x1="4" y1="4" x2="9" y2="9" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="11" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="17" y2="18" />
      <polyline points="15 9 18 6 21 9" />
      <line x1="18" y1="6" x2="18" y2="18" />
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
  { type: "fit", icon: <FitIcon />, label: "Fit" },
];

const sortOptions: { value: SortOption; icon: React.ReactNode; label: string }[] = [
  { value: "shuffle", icon: <ShuffleIcon />, label: "Shuffle" },
  { value: "order", icon: <SortIcon />, label: "By Rank" },
  { value: "year", icon: <SortIcon />, label: "By Year" },
  { value: "title", icon: <SortIcon />, label: "By Title" },
];

// ============================================================================
// Animation
// ============================================================================

const popoverVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
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
  const shuffleOnLoad = useSettingsStore((state) => state.shuffleOnLoad);
  const setShuffleOnLoad = useSettingsStore((state) => state.setShuffleOnLoad);
  const fieldMapping = useSettingsStore((state) => state.fieldMapping);
  const setFieldMapping = useSettingsStore((state) => state.setFieldMapping);

  // Get available grouping options based on collection data
  const groupByOptions = useAvailableGroupFields();

  // Sort is available in Grid, List, and Compact (not Fit - it shows all cards)
  const sortEnabled = layout !== "fit";

  // Group By is available in List and Compact only (not Grid or Fit)
  const groupByEnabled = layout === "list" || layout === "compact";

  // Get current sort option (shuffleOnLoad can be toggled by user)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const currentSort: SortOption = shuffleOnLoad
    ? "shuffle"
    : (fieldMapping.sortField as SortOption);

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

  // Handle sort change
  const handleSortChange = useCallback(
    (value: SortOption) => {
      if (value === "shuffle") {
        setShuffleOnLoad(true);
      } else {
        setShuffleOnLoad(false);
        setFieldMapping({
          ...fieldMapping,
          sortField: value,
          sortDirection: value === "title" ? "asc" : "asc",
        });
      }
    },
    [setShuffleOnLoad, setFieldMapping, fieldMapping]
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
  const getOptionClass = (isActive: boolean, isDisabled = false) =>
    [
      styles.option,
      isActive && styles.optionActive,
      isDisabled && styles.optionDisabled,
    ].filter(Boolean).join(" ");

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
              <span className={styles.headerTitle}>Display Options</span>
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="Close view options"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Three-column layout for View Mode, Sort, and Group By */}
            <div className={styles.columns}>
              {/* View Mode Section */}
              <div className={styles.column}>
                <h3 className={styles.sectionTitle}>View</h3>
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

              {/* Sort Section - disabled in Fit view */}
              <div className={styles.column}>
                <h3 className={styles.sectionTitle}>Sort</h3>
                <ul className={styles.optionList} role="listbox" aria-label="Select sort order">
                  {sortOptions.map(({ value, icon, label }) => (
                    <li key={value}>
                      <button
                        type="button"
                        className={getOptionClass(currentSort === value && sortEnabled, !sortEnabled)}
                        onClick={() => { if (sortEnabled) handleSortChange(value); }}
                        role="option"
                        aria-selected={currentSort === value && sortEnabled}
                        aria-disabled={!sortEnabled}
                        disabled={!sortEnabled}
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

              {/* Group By Section - disabled in Fit view */}
              <div className={styles.column}>
                <h3 className={styles.sectionTitle}>Group By</h3>
                <ul className={styles.optionList} role="listbox" aria-label="Select grouping">
                  {groupByOptions.map(({ value, label }) => {
                    const isActive = (groupByField ?? "none") === value;
                    return (
                      <li key={value}>
                        <button
                          type="button"
                          className={getOptionClass(isActive && groupByEnabled, !groupByEnabled)}
                          onClick={() => { if (groupByEnabled) handleGroupChange(value); }}
                          role="option"
                          aria-selected={isActive && groupByEnabled}
                          aria-disabled={!groupByEnabled}
                          disabled={!groupByEnabled}
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
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ViewPopover;
