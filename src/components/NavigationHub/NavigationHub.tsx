/**
 * NavigationHub component.
 *
 * Collapsible navigation hub with staggered expand/collapse animation.
 * - Always visible: Help (bottom) + Navigation toggle (top)
 * - Expandable: Settings, Games, Search, View (revealed between Help and Navigation)
 *
 * Layout from bottom to top (column-reverse):
 * - Help (bottom, always visible)
 * - [Expandable: Settings, Games, Search, View] (appear above Help)
 * - Navigation toggle (top, always visible, icon rotates when expanded)
 *
 * @see F-085: Collapsible Navigation Hub
 */

import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./NavigationHub.module.css";

// ============================================================================
// Icons
// ============================================================================

function QuestionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function GameControllerIcon() {
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
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="18" cy="10" r="1" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </svg>
  );
}

function GearIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ViewIcon() {
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

// ============================================================================
// Animation Variants
// ============================================================================

const buttonVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
    y: 20,
  },
  visible: (index: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
      delay: index * 0.05, // 50ms stagger
    },
  }),
  exit: (index: number) => ({
    opacity: 0,
    scale: 0,
    y: 20,
    transition: {
      duration: 0.15,
      delay: (3 - index) * 0.03, // Reverse stagger on exit
    },
  }),
};

// ============================================================================
// Types
// ============================================================================

interface NavigationHubProps {
  /** Callback when Help button is clicked */
  onHelpClick: () => void;
  /** Callback when Search button is clicked */
  onSearchClick: () => void;
  /** Callback when Games button is clicked */
  onGamesClick: () => void;
  /** Callback when Settings button is clicked */
  onSettingsClick: () => void;
  /** Callback when View button is clicked */
  onViewClick: () => void;
  /** Whether all buttons should be disabled (e.g., during gameplay) */
  disabled?: boolean;
  /** Whether the Help button is visible */
  showHelpButton?: boolean;
  /** Whether the Settings button is visible */
  showSettingsButton?: boolean;
  /** Whether the Search button is visible */
  showSearchBar?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * NavigationHub component.
 *
 * A collapsible navigation hub with staggered expand/collapse animation.
 * Help button is always visible at the top. Navigation toggle at the bottom
 * reveals View, Search, Games, and Settings buttons when clicked.
 */
export function NavigationHub({
  onHelpClick,
  onSearchClick,
  onGamesClick,
  onSettingsClick,
  onViewClick,
  disabled = false,
  showHelpButton = true,
  showSettingsButton = true,
  showSearchBar = true,
}: NavigationHubProps) {
  // Store state
  const navExpanded = useSettingsStore((s) => s.navExpanded);
  const toggleNavExpanded = useSettingsStore((s) => s.toggleNavExpanded);
  const activeMechanicId = useSettingsStore((s) => s.activeMechanicId);
  const searchQuery = useSettingsStore((s) => s.searchQuery);
  const activeFilters = useSettingsStore((s) => s.activeFilters);

  const isMechanicActive = activeMechanicId !== null;
  const hasActiveSearch = searchQuery.trim() !== "" || activeFilters.length > 0;

  // Button order from bottom to top (column-reverse):
  // DOM order: Navigation, Settings, Games, Search, View, Help
  // Visual order (bottom to top): Navigation, Settings, Games, Search, View, Help

  // Helper to build class names safely
  const getButtonClass = (...classes: (string | undefined | false)[]) =>
    classes.filter(Boolean).join(" ");

  // With column-reverse, DOM order determines visual position:
  // 1. Help (first in DOM → bottom of stack, always visible)
  // 2. Expandable buttons (middle → appear between Help and Navigation)
  // 3. Navigation (last in DOM → top of stack, always visible)

  return (
    <div className={styles.container}>
      {/* Help button - always visible at bottom (first in DOM with column-reverse) */}
      {showHelpButton && (
        <motion.button
          type="button"
          className={getButtonClass(styles.button, disabled && styles.buttonDisabled)}
          onClick={onHelpClick}
          disabled={disabled}
          aria-label="Help and keyboard shortcuts"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: disabled ? 0.4 : 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.1 }}
          whileHover={disabled ? {} : { scale: 1.1 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
        >
          <QuestionIcon />
        </motion.button>
      )}

      {/* Expandable buttons - appear above Help, below Navigation when expanded */}
      <AnimatePresence>
        {navExpanded && (
          <>
            {/* Settings - index 0 (closest to Help, first to appear) */}
            {showSettingsButton && (
              <motion.button
                type="button"
                className={getButtonClass(styles.button, (disabled || isMechanicActive) && styles.buttonDisabled)}
                onClick={onSettingsClick}
                disabled={disabled || isMechanicActive}
                aria-label="Open settings"
                custom={0}
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={disabled || isMechanicActive ? {} : { scale: 1.1 }}
                whileTap={disabled || isMechanicActive ? {} : { scale: 0.95 }}
              >
                <GearIcon />
              </motion.button>
            )}

            {/* Games - index 1 */}
            <motion.button
              type="button"
              className={getButtonClass(styles.button, isMechanicActive && styles.buttonActive, disabled && styles.buttonDisabled)}
              onClick={onGamesClick}
              disabled={disabled}
              aria-label={isMechanicActive ? "Manage active game mechanic" : "Open game mechanics"}
              title={isMechanicActive ? "Mechanic active - click to manage" : "Game Mechanics"}
              custom={1}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={disabled ? {} : { scale: 1.1 }}
              whileTap={disabled ? {} : { scale: 0.95 }}
            >
              <GameControllerIcon />
              {isMechanicActive && <span className={styles.indicator} />}
            </motion.button>

            {/* Search - index 2 */}
            {showSearchBar && (
              <motion.button
                type="button"
                className={getButtonClass(styles.button, (disabled || isMechanicActive) && styles.buttonDisabled)}
                onClick={onSearchClick}
                disabled={disabled || isMechanicActive}
                aria-label="Open search"
                title="Open search (press /)"
                custom={2}
                variants={buttonVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={disabled || isMechanicActive ? {} : { scale: 1.1 }}
                whileTap={disabled || isMechanicActive ? {} : { scale: 0.95 }}
              >
                <SearchIcon />
                {hasActiveSearch && <span className={styles.indicator} />}
              </motion.button>
            )}

            {/* View - index 3 (closest to Navigation, last to appear) */}
            <motion.button
              type="button"
              className={getButtonClass(styles.button, (disabled || isMechanicActive) && styles.buttonDisabled)}
              onClick={onViewClick}
              disabled={disabled || isMechanicActive}
              aria-label="Change view mode and grouping"
              title="View options"
              custom={3}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              whileHover={disabled || isMechanicActive ? {} : { scale: 1.1 }}
              whileTap={disabled || isMechanicActive ? {} : { scale: 0.95 }}
            >
              <ViewIcon />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Navigation toggle - always visible at top (last in DOM with column-reverse) */}
      <motion.button
        type="button"
        className={getButtonClass(styles.button, styles.navToggle, navExpanded && styles.navToggleExpanded)}
        onClick={toggleNavExpanded}
        aria-label={navExpanded ? "Collapse navigation menu" : "Expand navigation menu"}
        aria-expanded={navExpanded}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className={styles.navToggleIcon}
          animate={{ rotate: navExpanded ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <PlusIcon />
        </motion.span>
      </motion.button>
    </div>
  );
}

export default NavigationHub;
