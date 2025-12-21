/**
 * Device badge component for displaying platform/device information.
 *
 * Shows a subtle text badge in the bottom-right corner of a card
 * indicating the device or platform category.
 */

import styles from "./DeviceBadge.module.css";

interface DeviceBadgeProps {
  /** Device/platform name to display */
  device: string;

  /** Size variant */
  size?: "small" | "medium" | "large";
}

/**
 * Device badge component.
 *
 * Features:
 * - Subtle semi-transparent background
 * - Rounded corners
 * - Text-based display
 *
 * @example
 * ```tsx
 * <DeviceBadge device="Switch" />
 * <DeviceBadge device="VCS2600" size="small" />
 * ```
 */
export function DeviceBadge({ device, size = "small" }: DeviceBadgeProps) {
  const className = [styles.badge, styles[size]].filter(Boolean).join(" ");

  return (
    <div className={className} aria-label={`Device: ${device}`}>
      {device}
    </div>
  );
}

export default DeviceBadge;
