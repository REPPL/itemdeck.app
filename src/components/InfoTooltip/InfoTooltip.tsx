/**
 * InfoTooltip component.
 *
 * Displays an info icon that shows a tooltip on hover.
 * Uses CSS-only hover behaviour, no JavaScript required.
 */

import styles from "./InfoTooltip.module.css";

interface InfoTooltipProps {
  /** Text to display in the tooltip */
  text: string;
  /** Additional CSS class name */
  className?: string;
}

/**
 * A small info icon that reveals a tooltip on hover.
 */
export function InfoTooltip({ text, className }: InfoTooltipProps) {
  const wrapperClass = className
    ? `${styles.tooltipWrapper} ${className}`
    : styles.tooltipWrapper;

  return (
    <span className={wrapperClass}>
      <span
        className={styles.icon}
        aria-label="More information"
        tabIndex={0}
        role="button"
      >
        i
      </span>
      <span className={styles.tooltip} role="tooltip">
        {text}
      </span>
    </span>
  );
}

export default InfoTooltip;
