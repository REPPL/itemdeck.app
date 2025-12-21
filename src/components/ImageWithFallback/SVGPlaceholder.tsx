import { useMemo } from "react";

interface SVGPlaceholderProps {
  /** Title to extract initials from */
  title: string;
  /** CSS class for styling */
  className?: string;
}

/**
 * Generates a colour based on the title string.
 * Produces consistent colours for the same title.
 */
function generateColour(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL colour with fixed saturation and lightness for readability
  const hue = Math.abs(hash % 360);
  return `hsl(${String(hue)}, 45%, 35%)`;
}

/**
 * Extracts initials from a title string.
 * Takes first letter of first two words, or first two letters if single word.
 */
function getInitials(title: string): string {
  const words = title.trim().split(/\s+/);

  if (words.length >= 2) {
    const firstWord = words[0];
    const secondWord = words[1];
    const firstChar = firstWord?.charAt(0);
    const secondChar = secondWord?.charAt(0);
    if (firstChar && secondChar) {
      return (firstChar + secondChar).toUpperCase();
    }
  }

  const firstWord = words[0] ?? "";
  if (firstWord.length >= 2) {
    return firstWord.substring(0, 2).toUpperCase();
  }

  return firstWord.toUpperCase() || "?";
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

// Export utilities for testing
export { getInitials, generateColour };
