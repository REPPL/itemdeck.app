/**
 * StatusAnnouncer component for screen reader announcements.
 *
 * Provides ARIA live regions for announcing status changes
 * to assistive technologies.
 */

interface StatusAnnouncerProps {
  /** Message to announce */
  message: string;

  /** Politeness level for the announcement */
  politeness?: "polite" | "assertive";

  /** Whether to announce atomic changes */
  atomic?: boolean;
}

/**
 * Screen reader announcement component.
 *
 * Uses ARIA live regions to announce status updates.
 * Content is visually hidden but available to screen readers.
 *
 * @example
 * ```tsx
 * <StatusAnnouncer message="Loading 12 cards" politeness="polite" />
 * <StatusAnnouncer message="Error occurred" politeness="assertive" />
 * ```
 */
export function StatusAnnouncer({
  message,
  politeness = "polite",
  atomic = true,
}: StatusAnnouncerProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * Alert announcer for urgent messages.
 *
 * Uses role="alert" which is more assertive than aria-live.
 */
export function AlertAnnouncer({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div role="alert" className="sr-only">
      {message}
    </div>
  );
}
