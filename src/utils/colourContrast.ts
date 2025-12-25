/**
 * Colour contrast utilities using WCAG 2.1 relative luminance.
 *
 * Used to determine if text should be light or dark based on
 * background colour for optimal readability.
 */

/**
 * Calculate relative luminance of a colour (WCAG 2.1 formula).
 *
 * @param hex - Hex colour string (e.g., "#ff6b6b" or "ff6b6b")
 * @returns Luminance value between 0 (black) and 1 (white)
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getLuminance(hex: string): number {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Handle shorthand hex (e.g., "fff" -> "ffffff")
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((c) => c + c)
          .join("")
      : cleanHex;

  // Parse RGB values
  const r = parseInt(fullHex.slice(0, 2), 16) / 255;
  const g = parseInt(fullHex.slice(2, 4), 16) / 255;
  const b = parseInt(fullHex.slice(4, 6), 16) / 255;

  // Apply gamma correction (sRGB to linear)
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const rL = toLinear(r);
  const gL = toLinear(g);
  const bL = toLinear(b);

  // Calculate luminance using ITU-R BT.709 coefficients
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

/**
 * Determine if a colour is "light" (needs dark text for contrast).
 *
 * @param hex - Hex colour string
 * @param threshold - Luminance threshold (default 0.5)
 * @returns true if background is light and needs dark text
 *
 * @example
 * ```ts
 * isLightColour("#ffffff"); // true (white)
 * isLightColour("#000000"); // false (black)
 * isLightColour("#ffff00"); // true (yellow)
 * isLightColour("#1a1a2e"); // false (dark blue)
 * ```
 */
export function isLightColour(hex: string, threshold = 0.5): boolean {
  return getLuminance(hex) > threshold;
}

/**
 * Get optimal text colour for a background.
 *
 * @param backgroundHex - Background colour hex
 * @returns "#000000" for light backgrounds, "#ffffff" for dark
 *
 * @example
 * ```ts
 * getContrastTextColour("#ffff00"); // "#000000" (black text on yellow)
 * getContrastTextColour("#1a1a2e"); // "#ffffff" (white text on dark)
 * ```
 */
export function getContrastTextColour(backgroundHex: string): string {
  return isLightColour(backgroundHex) ? "#000000" : "#ffffff";
}

/**
 * Calculate contrast ratio between two colours (WCAG 2.1).
 *
 * @param foreground - Foreground colour hex
 * @param background - Background colour hex
 * @returns Contrast ratio (1 to 21)
 *
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(foreground: string, background: string): number {
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a colour combination meets WCAG AA standard.
 *
 * @param foreground - Foreground colour hex
 * @param background - Background colour hex
 * @param largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns true if contrast ratio meets AA standard
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}
