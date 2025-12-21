/**
 * Visual themes index.
 *
 * Exports theme CSS imports and theme application utilities.
 */

// Import all theme CSS files
import "./retro.css";
import "./modern.css";
import "./minimal.css";

/**
 * Available visual themes.
 */
export const VISUAL_THEMES = ["retro", "modern", "minimal"] as const;

/**
 * Visual theme type.
 */
export type VisualTheme = (typeof VISUAL_THEMES)[number];

/**
 * Apply a visual theme to the document.
 *
 * @param theme - The theme to apply
 */
export function applyVisualTheme(theme: VisualTheme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Get the current visual theme from the document.
 *
 * @returns The current theme or undefined if none set
 */
export function getCurrentVisualTheme(): VisualTheme | undefined {
  const theme = document.documentElement.getAttribute("data-theme");
  if (theme && VISUAL_THEMES.includes(theme as VisualTheme)) {
    return theme as VisualTheme;
  }
  return undefined;
}
