/**
 * ThemeSettingsTabs - Sub-tabbed interface for theme settings.
 *
 * Replaces theme cards with navigable sub-tabs:
 * - Retro: Pixel fonts, sharp corners, CRT shadows, neon accents
 * - Modern: Rounded corners, soft shadows, smooth animations
 * - Minimal: Subtle styling, reduced shadows, clean typography
 *
 * Each sub-tab shows theme preview and theme-specific controls:
 * - Border Radius: none/small/medium/large
 * - Shadow Intensity: none/subtle/medium/strong
 * - Animation Style: none/subtle/smooth/bouncy
 * - Accent Colour: colour picker
 */

import { useState, useCallback } from "react";
import {
  useSettingsStore,
  type VisualTheme,
  type BorderRadiusPreset,
  type ShadowIntensity,
  type AnimationStyle,
} from "@/stores/settingsStore";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";

type ThemeSubTab = VisualTheme;

const subTabs: { id: ThemeSubTab; label: string; description: string }[] = [
  { id: "retro", label: "Retro", description: "Pixel fonts, sharp corners, CRT shadows, neon accents" },
  { id: "modern", label: "Modern", description: "Rounded corners, soft shadows, smooth animations" },
  { id: "minimal", label: "Minimal", description: "Subtle styling, reduced shadows, clean typography" },
];

const borderRadiusOptions: { value: BorderRadiusPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const shadowIntensityOptions: { value: ShadowIntensity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
];

const animationStyleOptions: { value: AnimationStyle; label: string }[] = [
  { value: "none", label: "None" },
  { value: "subtle", label: "Subtle" },
  { value: "smooth", label: "Smooth" },
  { value: "bouncy", label: "Bouncy" },
];

/**
 * Sub-tabbed theme settings interface.
 */
export function ThemeSettingsTabs() {
  const {
    visualTheme,
    setVisualTheme,
    themeCustomisations,
    setThemeCustomisation,
  } = useSettingsStore();
  const [activeSubTab, setActiveSubTab] = useState<ThemeSubTab>(visualTheme);

  // When switching tabs, also apply the theme
  const handleTabChange = (theme: ThemeSubTab) => {
    setActiveSubTab(theme);
    setVisualTheme(theme);
  };

  const currentCustomisation = themeCustomisations[activeSubTab];

  const handleBorderRadiusChange = useCallback((value: BorderRadiusPreset) => {
    setThemeCustomisation(activeSubTab, { borderRadius: value });
  }, [activeSubTab, setThemeCustomisation]);

  const handleShadowIntensityChange = useCallback((value: ShadowIntensity) => {
    setThemeCustomisation(activeSubTab, { shadowIntensity: value });
  }, [activeSubTab, setThemeCustomisation]);

  const handleAnimationStyleChange = useCallback((value: AnimationStyle) => {
    setThemeCustomisation(activeSubTab, { animationStyle: value });
  }, [activeSubTab, setThemeCustomisation]);

  const handleAccentColourChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeCustomisation(activeSubTab, { accentColour: event.target.value });
  }, [activeSubTab, setThemeCustomisation]);

  const handleHoverColourChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeCustomisation(activeSubTab, { hoverColour: event.target.value });
  }, [activeSubTab, setThemeCustomisation]);

  const handleCardBackgroundChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeCustomisation(activeSubTab, { cardBackgroundColour: event.target.value });
  }, [activeSubTab, setThemeCustomisation]);

  const handleTransparencyChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setThemeCustomisation(activeSubTab, { detailTransparency: Number(event.target.value) });
  }, [activeSubTab, setThemeCustomisation]);

  const renderSubTabContent = () => {
    return (
      <>
        {/* Border Radius */}
        <div className={styles.row}>
          <span className={styles.label}>Border Radius</span>
          <div className={styles.segmentedControl} role="radiogroup" aria-label="Border radius">
            {borderRadiusOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={[
                  styles.segmentButton,
                  currentCustomisation.borderRadius === value ? styles.segmentButtonActive : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { handleBorderRadiusChange(value); }}
                role="radio"
                aria-checked={currentCustomisation.borderRadius === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Shadow Intensity */}
        <div className={styles.row}>
          <span className={styles.label}>Shadow Intensity</span>
          <div className={styles.segmentedControl} role="radiogroup" aria-label="Shadow intensity">
            {shadowIntensityOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={[
                  styles.segmentButton,
                  currentCustomisation.shadowIntensity === value ? styles.segmentButtonActive : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { handleShadowIntensityChange(value); }}
                role="radio"
                aria-checked={currentCustomisation.shadowIntensity === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Animation Style */}
        <div className={styles.row}>
          <span className={styles.label}>Animation Style</span>
          <div className={styles.segmentedControl} role="radiogroup" aria-label="Animation style">
            {animationStyleOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={[
                  styles.segmentButton,
                  currentCustomisation.animationStyle === value ? styles.segmentButtonActive : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { handleAnimationStyleChange(value); }}
                role="radio"
                aria-checked={currentCustomisation.animationStyle === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Colour */}
        <div className={styles.row}>
          <span className={styles.label}>Accent Colour</span>
          <div className={styles.colourPickerWrapper}>
            <input
              type="color"
              className={styles.colourPicker}
              value={currentCustomisation.accentColour}
              onChange={handleAccentColourChange}
              aria-label="Accent colour"
            />
            <span className={styles.colourValue}>{currentCustomisation.accentColour}</span>
          </div>
        </div>

        {/* Hover Colour */}
        <div className={styles.row}>
          <span className={styles.label}>Hover Colour</span>
          <div className={styles.colourPickerWrapper}>
            <input
              type="color"
              className={styles.colourPicker}
              value={currentCustomisation.hoverColour}
              onChange={handleHoverColourChange}
              aria-label="Hover colour"
            />
            <span className={styles.colourValue}>{currentCustomisation.hoverColour}</span>
          </div>
        </div>

        {/* Card Background Colour */}
        <div className={styles.row}>
          <span className={styles.label}>Card Background</span>
          <div className={styles.colourPickerWrapper}>
            <input
              type="color"
              className={styles.colourPicker}
              value={currentCustomisation.cardBackgroundColour}
              onChange={handleCardBackgroundChange}
              aria-label="Card background colour"
            />
            <span className={styles.colourValue}>{currentCustomisation.cardBackgroundColour}</span>
          </div>
        </div>

        {/* Detail Transparency */}
        <div className={styles.row}>
          <span className={styles.label}>Detail Transparency</span>
          <div className={styles.sliderWrapper}>
            <input
              type="range"
              className={styles.slider}
              min="50"
              max="100"
              value={currentCustomisation.detailTransparency}
              onChange={handleTransparencyChange}
              aria-label="Detail view transparency"
            />
            <span className={styles.sliderValue}>{currentCustomisation.detailTransparency}%</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={tabStyles.container}>
      {/* Sub-tab navigation - compact button group */}
      <div className={tabStyles.subTabs} role="tablist" aria-label="Theme options">
        {subTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeSubTab === id}
            aria-controls={`theme-subtab-${id}`}
            className={[
              tabStyles.subTab,
              activeSubTab === id ? tabStyles.subTabActive : "",
            ].filter(Boolean).join(" ")}
            onClick={() => { handleTabChange(id); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div
        className={tabStyles.subTabContent}
        role="tabpanel"
        id={`theme-subtab-${activeSubTab}`}
        aria-labelledby={`theme-subtab-btn-${activeSubTab}`}
      >
        {renderSubTabContent()}
      </div>
    </div>
  );
}
