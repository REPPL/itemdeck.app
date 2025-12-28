/**
 * CSS-only bar chart component.
 *
 * Displays horizontal bars representing distribution data.
 * Pure CSS implementation with no charting library dependencies.
 */

import styles from "./BarChart.module.css";

/**
 * Data point for the bar chart.
 */
export interface BarChartItem {
  /** Label for this bar */
  label: string;
  /** Value/count for this bar */
  value: number;
}

interface BarChartProps {
  /** Chart title */
  title: string;
  /** Data items to display */
  items: BarChartItem[];
  /** Maximum number of bars to show (default: 5) */
  maxBars?: number;
  /** Whether to show "Other" for remaining items */
  showOther?: boolean;
}

/**
 * Horizontal bar chart using pure CSS.
 */
export function BarChart({
  title,
  items,
  maxBars = 5,
  showOther = true,
}: BarChartProps) {
  if (items.length === 0) {
    return null;
  }

  // Sort by value descending
  const sorted = [...items].sort((a, b) => b.value - a.value);

  // Take top N and optionally aggregate the rest
  let displayItems: BarChartItem[];
  if (sorted.length <= maxBars) {
    displayItems = sorted;
  } else {
    const top = sorted.slice(0, maxBars);
    if (showOther) {
      const otherValue = sorted.slice(maxBars).reduce((sum, item) => sum + item.value, 0);
      displayItems = [...top, { label: "Other", value: otherValue }];
    } else {
      displayItems = top;
    }
  }

  // Calculate max value for percentage calculations
  const maxValue = Math.max(...displayItems.map((item) => item.value));
  const totalValue = displayItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>{title}</h4>
      <div className={styles.chart} role="img" aria-label={`${title} distribution chart`}>
        {displayItems.map((item) => {
          const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
          const sharePercentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;

          return (
            <div key={item.label} className={styles.row}>
              <span className={styles.label} title={item.label}>
                {item.label}
              </span>
              <div className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{ width: `${percentage.toFixed(1)}%` }}
                  role="presentation"
                  aria-hidden="true"
                />
              </div>
              <span className={styles.value} title={`${String(item.value)} (${sharePercentage.toFixed(0)}%)`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
