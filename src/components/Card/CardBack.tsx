import { useState } from "react";
import { isLightColour } from "@/utils/colourContrast";
import type { CardBackDisplay } from "@/stores/settingsStore";
import styles from "./Card.module.css";

/**
 * App logo icon (card deck).
 * Inline SVG to support currentColor inheritance for theme-aware colouring.
 */
function AppLogoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <g opacity="0.9">
        {/* Back card (offset) */}
        <rect x="18" y="12" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.4"/>
        {/* Middle card (offset) */}
        <rect x="24" y="18" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.6"/>
        {/* Front card */}
        <rect x="30" y="24" width="50" height="70" rx="6" fill="none" stroke="currentColor" strokeWidth="3"/>
        {/* Diamond symbol on front card */}
        <path d="M55 44 L65 59 L55 74 L45 59 Z" fill="currentColor" opacity="0.8"/>
      </g>
    </svg>
  );
}

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
  /** Whether the card is currently flipping (hides drag handle during animation) */
  isFlipping?: boolean;
  /** Background colour for contrast calculation */
  backgroundColour?: string;
  /** Whether to use app logo as default (when user selects app-logo background) */
  useAppLogo?: boolean;
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
  isFlipping = false,
  backgroundColour,
  useAppLogo = false,
}: CardBackProps) {
  const [hasError, setHasError] = useState(false);

  // Show logo if:
  // 1. Display mode includes logo ("logo" or "both"), OR
  // 2. A logoUrl is explicitly provided (platform-logo or card-logo background), OR
  // 3. useAppLogo is true (app-logo background selected)
  const showLogo = display === "logo" || display === "both" || logoUrl !== undefined || useAppLogo;

  // Determine if background is light (needs dark text/icons)
  const hasLightBackground = backgroundColour ? isLightColour(backgroundColour) : false;

  // Handle image load error - fall back to app logo
  const handleError = () => {
    setHasError(true);
  };

  // Determine what logo to show:
  // - If external logoUrl provided and hasn't errored, use <img>
  // - Otherwise use inline AppLogoIcon (supports currentColor)
  const shouldUseExternalLogo = logoUrl && !hasError;

  // Don't render anything if display is "none"
  if (display === "none") {
    return <div className={[styles.cardFace, styles.cardBack].join(" ")} />;
  }

  // Build class names - add hasDragHandle when drag handle is shown
  const backClasses = [
    styles.cardFace,
    styles.cardBack,
    showDragHandle ? styles.hasDragHandle : "",
  ].filter(Boolean).join(" ");

  // Drag handle is always visible when showDragHandle is true
  // but becomes inactive (no event handlers) during flip animation
  const shouldShowDragHandle = showDragHandle;
  const isDragHandleActive = showDragHandle && !isFlipping;

  return (
    <div
      className={backClasses}
      data-light-bg={hasLightBackground ? "true" : undefined}
    >
      {showLogo && (
        <div className={styles.logoContainer}>
          {shouldUseExternalLogo ? (
            <img
              className={styles.logo}
              src={logoUrl}
              alt=""
              aria-hidden="true"
              draggable="false"
              onError={handleError}
            />
          ) : (
            <AppLogoIcon className={styles.logo} />
          )}
        </div>
      )}
      {/* Drag handle indicator at bottom - always visible but inactive during flip */}
      {shouldShowDragHandle && (
        <div
          className={[
            styles.dragHandle,
            !isDragHandleActive ? styles.dragHandleInactive : "",
          ].filter(Boolean).join(" ")}
          {...(isDragHandleActive ? dragHandleProps : {})}
          aria-label="Drag to reorder"
        >
          <DragGripIcon />
        </div>
      )}
    </div>
  );
}
