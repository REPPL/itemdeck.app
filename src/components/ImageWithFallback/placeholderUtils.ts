/**
 * Utility functions for SVG placeholder generation.
 */

/**
 * Generates a colour based on the title string.
 * Produces consistent colours for the same title.
 */
export function generateColour(text: string): string {
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
export function getInitials(title: string): string {
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
