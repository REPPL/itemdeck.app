import { useMemo } from "react";
import { getInitials, generateColour } from "./placeholderUtils";

interface SVGPlaceholderProps {
  /** Title to extract initials from */
  title: string;
  /** CSS class for styling */
  className?: string;
}

/**
 * SVG placeholder component displaying initials.
 * Used as final fallback when image loading fails.
 */
export function SVGPlaceholder({ title, className }: SVGPlaceholderProps) {
  const initials = useMemo(() => getInitials(title), [title]);
  const bgColour = useMemo(() => generateColour(title), [title]);

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Placeholder for ${title}`}
    >
      <rect width="100" height="100" fill={bgColour} />
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize="32"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
      >
        {initials}
      </text>
    </svg>
  );
}
