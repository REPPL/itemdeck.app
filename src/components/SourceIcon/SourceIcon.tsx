/**
 * SourceIcon - Displays recognisable icons for common source URLs.
 *
 * Detects known sources (Wikipedia, MobyGames, IGN) from URL patterns
 * and displays the appropriate logo icon. Falls back to a generic
 * external link icon for unknown sources.
 */

import { useMemo } from "react";

/**
 * Wikipedia "W" icon.
 * Based on Wikipedia's favicon design.
 */
function WikipediaIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .09-.086.153-.256.188-.853.17-1.137.289-1.137.52 0 .28.376 1.097 1.03 2.437.648 1.333 1.652 3.423 2.992 6.27.326-.652.84-1.754 1.54-3.296.704-1.543.89-2.009 1.09-2.668.207-.66.093-1.277-.344-1.851-.259-.34-.697-.524-1.353-.556-.066-.003-.172-.007-.322-.007-.083 0-.137-.046-.137-.138v-.463l.047-.04h4.817l.049.04v.463c0 .092-.054.138-.161.138-.851.012-1.321.149-1.637.471-.278.284-.619.97-1.114 2.052-.496 1.081-1.254 2.684-2.21 4.746l3.396 7.016c.093.189.129.311.129.382 0 .097-.041.186-.124.263a.408.408 0 01-.298.117c-.119 0-.238-.052-.357-.156L7.3 13.119h4.79zm9.108-5.617l.052.045v.434c0 .119-.114.18-.343.18h-.188c-.75 0-1.263.146-1.54.439-.278.293-.618.985-1.02 2.077-.404 1.091-1.124 2.963-2.16 5.615-.218.562-.415 1.072-.59 1.529-.176.457-.293.765-.351.923-.058.16-.1.266-.125.317a.49.49 0 01-.177.193.44.44 0 01-.253.073c-.161 0-.291-.066-.39-.198-.098-.133-.197-.346-.298-.638-.426-1.167-1.318-3.432-2.677-6.797-.261-.644-.462-1.147-.604-1.507-.141-.36-.295-.733-.462-1.12-.166-.386-.33-.705-.49-.958a1.37 1.37 0 00-.501-.468c-.184-.11-.428-.171-.73-.183-.13-.006-.209-.039-.234-.098a.435.435 0 01-.04-.175v-.463l.047-.04h4.786l.049.04v.422c0 .098-.04.164-.119.198-.08.034-.222.065-.428.093-.36.05-.54.144-.54.283 0 .095.08.329.239.702.16.373.394.894.703 1.564l2.047 4.465c.64-1.673 1.284-3.363 1.932-5.067.28-.738.419-1.264.419-1.578 0-.221-.138-.378-.414-.472-.276-.094-.542-.149-.798-.166-.21-.013-.315-.075-.315-.186v-.441l.047-.045 4.796.006z" />
    </svg>
  );
}

/**
 * MobyGames icon.
 * Simplified "M" logo inspired by their brand.
 */
function MobyGamesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 5h3l3 8 3-8h3l3 8 3-8h3v14h-3V10l-3 9h-2l-3-9v9H3V5z" />
    </svg>
  );
}

/**
 * IGN icon.
 * Stylised "IGN" text logo.
 */
function IGNIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2 5h3v14H2V5zm6 0h3v6h4V5h3v14h-3v-6h-4v6H8V5zm12 0h2v14h-2V5z" />
    </svg>
  );
}

/**
 * Generic external link icon for unknown sources.
 */
function GenericLinkIcon() {
  return (
    <svg
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

/**
 * Source patterns and their corresponding icons.
 */
const SOURCE_PATTERNS: {
  name: string;
  pattern: RegExp;
  Icon: React.ComponentType;
  title: string;
}[] = [
  {
    name: "wikipedia",
    pattern: /wikipedia\.org/i,
    Icon: WikipediaIcon,
    title: "Wikipedia",
  },
  {
    name: "mobygames",
    pattern: /mobygames\.com/i,
    Icon: MobyGamesIcon,
    title: "MobyGames",
  },
  {
    name: "ign",
    pattern: /ign\.com/i,
    Icon: IGNIcon,
    title: "IGN",
  },
];

interface SourceIconProps {
  /** URL to detect source from */
  url: string;
  /** Optional source label override (e.g., from link.source) */
  source?: string;
  /** Optional class name */
  className?: string;
}

/**
 * Detects the source type from URL and returns appropriate icon.
 *
 * @example
 * ```tsx
 * <SourceIcon url="https://en.wikipedia.org/wiki/Example" />
 * // Renders Wikipedia icon
 *
 * <SourceIcon url="https://example.com/page" />
 * // Renders generic external link icon
 * ```
 */
export function SourceIcon({ url, source, className }: SourceIconProps) {
  const match = useMemo(() => {
    // First check the URL for known patterns
    for (const pattern of SOURCE_PATTERNS) {
      if (pattern.pattern.test(url)) {
        return pattern;
      }
    }

    // If source label is provided, check if it matches a known source name
    if (source) {
      const sourceLower = source.toLowerCase();
      for (const pattern of SOURCE_PATTERNS) {
        if (sourceLower.includes(pattern.name)) {
          return pattern;
        }
      }
    }

    return null;
  }, [url, source]);

  const Icon = match?.Icon ?? GenericLinkIcon;
  const title = match?.title ?? source ?? "External Link";

  return (
    <span className={className} title={title}>
      <Icon />
    </span>
  );
}

/**
 * Check if a URL matches a known source pattern.
 * Useful for conditional rendering.
 */
export function isKnownSource(url: string): boolean {
  return SOURCE_PATTERNS.some((pattern) => pattern.pattern.test(url));
}

/**
 * Get the source name from a URL.
 * Returns undefined if not a known source.
 */
export function getSourceName(url: string): string | undefined {
  const match = SOURCE_PATTERNS.find((pattern) => pattern.pattern.test(url));
  return match?.title;
}

export default SourceIcon;
