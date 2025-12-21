/**
 * Badge component for displaying status indicators on cards.
 */

import type { ReactNode } from "react";
import styles from "./Badge.module.css";

/**
 * Badge variant for visual styling.
 */
export type BadgeVariant = "solid" | "outline" | "subtle" | "dot";

/**
 * Badge colour for semantic meaning.
 */
export type BadgeColour = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

/**
 * Badge position on the card.
 */
export type BadgePosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Badge component props.
 */
interface BadgeProps {
  /** Badge label text */
  label?: string;

  /** Optional icon to display */
  icon?: ReactNode;

  /** Visual variant */
  variant?: BadgeVariant;

  /** Semantic colour */
  colour?: BadgeColour;

  /** Additional CSS class */
  className?: string;

  /** Size of the badge */
  size?: "small" | "medium";
}

/**
 * Badge component for status indicators.
 *
 * @example
 * ```tsx
 * <Badge label="New" colour="primary" />
 * <Badge icon={<StarIcon />} label="Featured" variant="outline" />
 * <Badge variant="dot" colour="success" />
 * ```
 */
export function Badge({
  label,
  icon,
  variant = "solid",
  colour = "neutral",
  className,
  size = "medium",
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[colour],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Dot variant has no content
  if (variant === "dot") {
    return (
      <span
        className={classNames}
        role="status"
        aria-label={label ?? "Status indicator"}
      />
    );
  }

  return (
    <span className={classNames}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {label && <span className={styles.label}>{label}</span>}
    </span>
  );
}
