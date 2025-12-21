/**
 * Layout mode selector component.
 *
 * Provides buttons to switch between different layout modes.
 */

import { useCallback } from "react";
import { type LayoutMode } from "@/stores/layoutStore";
import styles from "./LayoutModeSelector.module.css";

/**
 * Props for LayoutModeSelector component.
 */
interface LayoutModeSelectorProps {
  /** Current layout mode */
  currentMode: LayoutMode;
  /** Callback when mode changes */
  onModeChange: (mode: LayoutMode) => void;
  /** Number of cards (affects virtual mode availability) */
  cardCount: number;
}

/**
 * Layout mode configuration.
 */
interface LayoutModeConfig {
  id: LayoutMode;
  label: string;
  icon: React.ReactNode;
  description: string;
}

/**
 * Layout mode configurations.
 */
const LAYOUT_MODES: LayoutModeConfig[] = [
  {
    id: "grid",
    label: "Grid",
    icon: <GridIcon />,
    description: "Standard grid layout",
  },
  {
    id: "virtual",
    label: "Virtual",
    icon: <ListIcon />,
    description: "Virtualised grid for large collections",
  },
  {
    id: "carousel",
    label: "Carousel",
    icon: <CarouselIcon />,
    description: "Single card focus with navigation",
  },
  {
    id: "stack",
    label: "Stack",
    icon: <StackIcon />,
    description: "Apple Wallet style stack",
  },
  {
    id: "fit",
    label: "Fit",
    icon: <FitIcon />,
    description: "Fit all cards in viewport",
  },
];

/**
 * Layout mode selector with button group.
 *
 * Features:
 * - Visual icons for each mode
 * - Keyboard accessible
 * - Active state indication
 * - Tooltips with descriptions
 *
 * @example
 * ```tsx
 * <LayoutModeSelector
 *   currentMode={layoutMode}
 *   onModeChange={setLayoutMode}
 *   cardCount={cards.length}
 * />
 * ```
 */
export function LayoutModeSelector({
  currentMode,
  onModeChange,
  cardCount,
}: LayoutModeSelectorProps) {
  const handleModeClick = useCallback(
    (mode: LayoutMode) => {
      onModeChange(mode);
    },
    [onModeChange]
  );

  return (
    <div
      className={styles.container}
      role="group"
      aria-label="Layout mode selection"
    >
      {LAYOUT_MODES.map((mode) => {
        const isActive = currentMode === mode.id;
        const isVirtualDisabled = mode.id === "virtual" && cardCount < 50;

        return (
          <button
            key={mode.id}
            className={`${styles.button ?? ""} ${isActive ? (styles.active ?? "") : ""}`}
            onClick={() => { handleModeClick(mode.id); }}
            disabled={isVirtualDisabled}
            aria-pressed={isActive}
            title={mode.description}
            type="button"
          >
            {mode.icon}
            <span className={styles.label}>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Icon components
function GridIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="4" />
      <rect x="3" y="10" width="18" height="4" />
      <rect x="3" y="17" width="18" height="4" />
    </svg>
  );
}

function CarouselIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <rect x="2" y="6" width="4" height="12" rx="1" opacity="0.5" />
      <rect x="8" y="4" width="8" height="16" rx="1" />
      <rect x="18" y="6" width="4" height="12" rx="1" opacity="0.5" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <rect x="6" y="2" width="12" height="16" rx="1" />
      <rect x="4" y="4" width="12" height="16" rx="1" opacity="0.7" />
      <rect x="2" y="6" width="12" height="16" rx="1" opacity="0.4" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={styles.icon}
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}

export default LayoutModeSelector;
