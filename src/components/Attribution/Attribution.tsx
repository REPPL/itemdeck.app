/**
 * Attribution component for image credits.
 *
 * Displays structured attribution information with links to source and licence.
 * Supports both compact and full display modes.
 */

import type { Attribution as AttributionType } from "@/types/image";
import styles from "./Attribution.module.css";

/**
 * External link icon for attribution links.
 */
function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

interface AttributionProps {
  /** Attribution data */
  attribution: AttributionType;
  /** Compact mode shows minimal info */
  compact?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Attribution component for displaying image credits.
 *
 * @example
 * ```tsx
 * <Attribution
 *   attribution={{
 *     source: "Wikimedia Commons",
 *     sourceUrl: "https://commons.wikimedia.org/wiki/File:Example.jpg",
 *     licence: "CC BY-SA 4.0",
 *     licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/"
 *   }}
 * />
 * ```
 */
export function Attribution({
  attribution,
  compact = false,
  className,
}: AttributionProps) {
  const { source, sourceUrl, author, licence, licenceUrl, url } = attribution;

  // Use sourceUrl or fall back to deprecated url field
  const effectiveSourceUrl = sourceUrl ?? url;

  // Don't render if no attribution data
  if (!source && !author && !licence) {
    return null;
  }

  if (compact) {
    return (
      <span className={`${styles.compact} ${className ?? ""}`}>
        {source && (
          <>
            {effectiveSourceUrl ? (
              <a
                href={effectiveSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {source}
              </a>
            ) : (
              source
            )}
          </>
        )}
        {licence && (
          <>
            {" • "}
            {licenceUrl ? (
              <a
                href={licenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {licence}
              </a>
            ) : (
              licence
            )}
          </>
        )}
      </span>
    );
  }

  return (
    <div className={`${styles.full} ${className ?? ""}`}>
      {source && (
        <span className={styles.source}>
          Image from{" "}
          {effectiveSourceUrl ? (
            <a
              href={effectiveSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {source}
              <ExternalLinkIcon />
            </a>
          ) : (
            source
          )}
        </span>
      )}

      {author && (
        <span className={styles.author}>
          by {author}
        </span>
      )}

      {licence && (
        <span className={styles.licence}>
          {licenceUrl ? (
            <a
              href={licenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {licence}
              <ExternalLinkIcon />
            </a>
          ) : (
            licence
          )}
        </span>
      )}
    </div>
  );
}
