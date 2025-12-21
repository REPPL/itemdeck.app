/**
 * Offline status indicator component.
 *
 * Displays a banner when the user loses internet connectivity.
 */

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import styles from "./OfflineIndicator.module.css";

interface OfflineIndicatorProps {
  /** Custom message to display (default: "You are offline") */
  message?: string;
}

/**
 * Offline indicator banner.
 *
 * Shows when navigator.onLine is false.
 * Automatically appears/disappears based on connectivity.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <OfflineIndicator />
 *       <MainContent />
 *     </>
 *   );
 * }
 * ```
 */
export function OfflineIndicator({
  message = "You are offline. Showing cached data.",
}: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={styles.indicator}
    >
      <span className={styles.icon} aria-hidden="true">
        &#x26A0;
      </span>
      <span className={styles.message}>{message}</span>
    </div>
  );
}
