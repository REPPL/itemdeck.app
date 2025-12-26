/**
 * Hook for applying visual themes and customisations.
 *
 * Syncs the visual theme and customisation settings from the
 * settings store to CSS variables on the document.
 */

import { useEffect } from "react";
import {
  useSettingsStore,
  type BorderRadiusPreset,
  type BorderWidthPreset,
  type ShadowIntensity,
  type AnimationStyle,
  type DetailTransparencyPreset,
} from "@/stores/settingsStore";
import { applyVisualTheme } from "@/styles/themes";
import { isLightColour } from "@/utils/colourContrast";

/**
 * Border radius CSS values by preset.
 */
const BORDER_RADIUS_VALUES: Record<BorderRadiusPreset, string> = {
  none: "0px",
  small: "4px",
  medium: "8px",
  large: "16px",
};

/**
 * Border width CSS values by preset.
 */
const BORDER_WIDTH_VALUES: Record<BorderWidthPreset, string> = {
  none: "0px",
  small: "1px",
  medium: "2px",
  large: "4px",
};

/**
 * Shadow CSS values by intensity.
 */
const SHADOW_VALUES: Record<ShadowIntensity, { card: string; cardHover: string }> = {
  none: {
    card: "none",
    cardHover: "none",
  },
  subtle: {
    card: "0 1px 2px rgba(0, 0, 0, 0.05)",
    cardHover: "0 2px 4px rgba(0, 0, 0, 0.08)",
  },
  medium: {
    card: "0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)",
    cardHover: "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
  },
  strong: {
    card: "0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)",
    cardHover: "0 16px 32px rgba(0, 0, 0, 0.2), 0 8px 16px rgba(0, 0, 0, 0.1)",
  },
};

/**
 * Animation timing CSS values by style.
 */
const ANIMATION_VALUES: Record<AnimationStyle, { duration: string; easing: string }> = {
  none: {
    duration: "0ms",
    easing: "linear",
  },
  subtle: {
    duration: "150ms",
    easing: "ease-out",
  },
  smooth: {
    duration: "250ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  bouncy: {
    duration: "400ms",
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
};

/** Map transparency preset to alpha value */
const TRANSPARENCY_VALUES: Record<DetailTransparencyPreset, number> = {
  "none": 0,
  "25": 0.25,
  "50": 0.50,
  "75": 0.75,
};

/**
 * Apply theme customisation settings as CSS variables.
 */
function applyThemeCustomisation(
  borderRadius: BorderRadiusPreset,
  borderWidth: BorderWidthPreset,
  shadowIntensity: ShadowIntensity,
  animationStyle: AnimationStyle,
  accentColour: string,
  hoverColour: string,
  cardBackgroundColour: string,
  detailTransparency: DetailTransparencyPreset,
  flipAnimation: boolean,
  detailAnimation: boolean,
  overlayAnimation: boolean,
  borderColour: string
): void {
  const root = document.documentElement;

  // Apply border radius
  const radiusValue = BORDER_RADIUS_VALUES[borderRadius];
  root.style.setProperty("--card-border-radius", radiusValue);
  root.style.setProperty("--radius-md", radiusValue);

  // Apply border width
  const widthValue = BORDER_WIDTH_VALUES[borderWidth];
  root.style.setProperty("--card-border-width", widthValue);

  // Apply shadow intensity
  const shadowValue = SHADOW_VALUES[shadowIntensity];
  root.style.setProperty("--shadow-card", shadowValue.card);
  root.style.setProperty("--shadow-card-hover", shadowValue.cardHover);

  // Apply animation style (controls hover lift effect)
  const animValue = ANIMATION_VALUES[animationStyle];
  root.style.setProperty("--transition-normal", animValue.duration);
  root.style.setProperty("--easing-default", animValue.easing);

  // Set hover effects based on animation style
  // "none" = no hover effects at all
  // "subtle" and "smooth" = shadow change only
  // "bouncy" = shadow change + scale/translate
  if (animationStyle === "none") {
    // No hover effects
    root.style.setProperty("--card-hover-scale", "1");
    root.style.setProperty("--card-hover-translate", "0");
    root.style.setProperty("--card-hover-shadow", "var(--elevation-1)");
    root.style.setProperty("--card-hover-glow", "var(--shadow-card)");
  } else if (animationStyle === "bouncy") {
    // Full hover effects with movement
    root.style.setProperty("--card-hover-scale", "1.02");
    root.style.setProperty("--card-hover-translate", "-2px");
    root.style.setProperty("--card-hover-shadow", "var(--elevation-2)");
    root.style.setProperty("--card-hover-glow", "0 0 20px rgba(100, 150, 255, 0.4), 0 0 40px rgba(100, 150, 255, 0.2), var(--shadow-card-hover)");
  } else {
    // Subtle/smooth - shadow change only, no movement
    root.style.setProperty("--card-hover-scale", "1");
    root.style.setProperty("--card-hover-translate", "0");
    root.style.setProperty("--card-hover-shadow", "var(--elevation-2)");
    root.style.setProperty("--card-hover-glow", "0 0 20px rgba(100, 150, 255, 0.4), 0 0 40px rgba(100, 150, 255, 0.2), var(--shadow-card-hover)");
  }

  // Apply accent colour
  root.style.setProperty("--colour-accent", accentColour);
  root.style.setProperty("--colour-primary", accentColour);

  // Apply hover colour
  root.style.setProperty("--colour-primary-hover", hoverColour);
  root.style.setProperty("--colour-accent-hover", hoverColour);

  // Apply card background colour
  root.style.setProperty("--card-back-background", cardBackgroundColour);

  // Apply detail view transparency
  const alpha = TRANSPARENCY_VALUES[detailTransparency];
  root.style.setProperty("--detail-overlay-alpha", String(alpha));
  root.style.setProperty("--detail-overlay-background", `rgba(0, 0, 0, ${String(alpha)})`);

  // Apply granular animation toggles
  root.style.setProperty("--flip-animation-enabled", flipAnimation ? "1" : "0");
  root.style.setProperty("--detail-animation-enabled", detailAnimation ? "1" : "0");
  root.style.setProperty("--overlay-animation-enabled", overlayAnimation ? "1" : "0");

  // Apply border colour
  root.style.setProperty("--card-border-colour", borderColour);

  // Calculate auto-contrast text colours based on card background
  // Strip alpha channel if present (8-char hex -> 6-char)
  const cleanBgHex = cardBackgroundColour.replace(/^#/, "");
  const bgHex6 = cleanBgHex.length === 8 ? cleanBgHex.slice(0, 6) : cleanBgHex;
  const bgIsLight = isLightColour(`#${bgHex6}`);

  // Apply text colour for card back - auto-contrast based on background
  // Ignores user's text colour setting to ensure readability
  root.style.setProperty("--card-back-text", bgIsLight ? "#1a1a1a" : "#ffffff");
  root.style.setProperty("--card-back-text-background", bgIsLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.15)");

  // Set contrast-aware colours for expanded view
  root.style.setProperty("--text-contrast-primary", bgIsLight ? "#1a1a1a" : "#ffffff");
  root.style.setProperty("--text-contrast-secondary", bgIsLight ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.7)");
  root.style.setProperty("--border-contrast", bgIsLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)");
}

/**
 * Apply the visual theme from settings to the document.
 *
 * This hook should be used at the app root level to ensure
 * the visual theme is always synced with settings.
 *
 * @example
 * ```tsx
 * function App() {
 *   useVisualTheme();
 *   return <MyApp />;
 * }
 * ```
 */
export function useVisualTheme(): void {
  const visualTheme = useSettingsStore((state) => state.visualTheme);
  const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);

  useEffect(() => {
    // Apply base theme first
    applyVisualTheme(visualTheme);

    // Apply customisations on top
    const customisation = themeCustomisations[visualTheme];
    applyThemeCustomisation(
      customisation.borderRadius,
      customisation.borderWidth,
      customisation.shadowIntensity,
      customisation.animationStyle,
      customisation.accentColour,
      customisation.hoverColour,
      customisation.cardBackgroundColour,
      customisation.detailTransparency,
      customisation.flipAnimation,
      customisation.detailAnimation,
      customisation.overlayAnimation,
      customisation.borderColour
    );
  }, [visualTheme, themeCustomisations]);
}

export default useVisualTheme;
