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
  type ShadowIntensity,
  type AnimationStyle,
  type DetailTransparencyPreset,
} from "@/stores/settingsStore";
import { applyVisualTheme } from "@/styles/themes";

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
  shadowIntensity: ShadowIntensity,
  animationStyle: AnimationStyle,
  accentColour: string,
  hoverColour: string,
  cardBackgroundColour: string,
  detailTransparency: DetailTransparencyPreset
): void {
  const root = document.documentElement;

  // Apply border radius
  const radiusValue = BORDER_RADIUS_VALUES[borderRadius];
  root.style.setProperty("--card-border-radius", radiusValue);
  root.style.setProperty("--radius-md", radiusValue);

  // Apply shadow intensity
  const shadowValue = SHADOW_VALUES[shadowIntensity];
  root.style.setProperty("--shadow-card", shadowValue.card);
  root.style.setProperty("--shadow-card-hover", shadowValue.cardHover);

  // Apply animation style (controls hover lift effect)
  const animValue = ANIMATION_VALUES[animationStyle];
  root.style.setProperty("--transition-normal", animValue.duration);
  root.style.setProperty("--easing-default", animValue.easing);
  // Set hover scale based on animation style
  const hoverScale = animationStyle === "none" ? "1" : animationStyle === "subtle" ? "1.01" : "1.02";
  root.style.setProperty("--card-hover-scale", hoverScale);

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
      customisation.shadowIntensity,
      customisation.animationStyle,
      customisation.accentColour,
      customisation.hoverColour,
      customisation.cardBackgroundColour,
      customisation.detailTransparency
    );
  }, [visualTheme, themeCustomisations]);
}

export default useVisualTheme;
