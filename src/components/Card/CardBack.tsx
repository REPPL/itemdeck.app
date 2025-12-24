import appLogo from "@/assets/placeholder-logo.svg";
import type { CardBackDisplay } from "@/stores/settingsStore";
import styles from "./Card.module.css";

/**
 * Drag handle grip icon (6 dots arranged in 2x3 pattern).
 */
function DragGripIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={styles.dragGripIcon}
    >
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="6" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="9" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
    </svg>
  );
}

interface CardBackProps {
  /** Logo URL to display on back */
  logoUrl?: string;
  /** What to display on back (logo, none) */
  display?: CardBackDisplay;
  /** Whether drag handle should be shown */
  showDragHandle?: boolean;
  /** Drag handle props (listeners and attributes from dnd-kit) */
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

/**
 * Card back face component.
 * Displays centred logo only. Text elements removed in v0.6.2.
 * Uses app logo as fallback when no platform logo is available.
 */
export function CardBack({
  logoUrl,
  display = "logo",
  showDragHandle = false,
  dragHandleProps,
}: CardBackProps) {
  // Use platform logo, fall back to app logo
  const logoSrc = logoUrl ?? appLogo;
  const showLogo = display === "logo" || display === "both";

  // Don't render anything if display is "none"
  if (display === "none") {
    return <div className={[styles.cardFace, styles.cardBack].join(" ")} />;
  }

  return (
    <div className={[styles.cardFace, styles.cardBack].join(" ")}>
      {showLogo && (
        <div className={styles.logoContainer}>
          <img
            className={styles.logo}
            src={logoSrc}
            alt=""
            aria-hidden="true"
          />
        </div>
      )}
      {/* Drag handle indicator at bottom */}
      {showDragHandle && (
        <div
          className={styles.dragHandle}
          {...dragHandleProps}
          aria-label="Drag to reorder"
        >
          <DragGripIcon />
        </div>
      )}
    </div>
  );
}
