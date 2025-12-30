/**
 * ThemeSettingsTabs - Theme settings with sub-tabbed interface.
 *
 * Structure:
 * - Select Theme: Minimal|Modern|Retro toggle
 * - Sub-tabs: Card Style | Colours | Detail View
 *
 * Card Style:
 * - Border Radius: none/small/medium/large
 * - Shadow: none/subtle/medium/strong
 * - Animation: none/subtle/smooth/bouncy
 *
 * Colours:
 * - Card Background
 * - Accent Colour
 * - Hover Colour
 *
 * Detail View:
 * - Transparency: None|25|50|75
 * - Footer Style: Dark|Light
 * - More Button Label: text input
 * - Auto-expand More: toggle
 * - Zoom First Image: toggle
 */

import { useState, useCallback } from "react";
import {
  useSettingsStore,
  type VisualTheme,
  type BorderRadiusPreset,
  type BorderWidthPreset,
  type ShadowIntensity,
  type AnimationStyle,
  type DetailTransparencyPreset,
  type OverlayStyle,
  type ThemeCustomisation,
} from "@/stores/settingsStore";
import { ThemeBrowser } from "@/components/ThemeBrowser";
import styles from "./SettingsPanel.module.css";
import tabStyles from "./CardSettingsTabs.module.css";
import themeStyles from "./ThemeSettingsTabs.module.css";

type ThemeSubTab = "style" | "colours" | "detail" | "animations" | "browse";

const themeOptions: { value: VisualTheme; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "modern", label: "Modern" },
  { value: "retro", label: "Retro" },
];

const subTabs: { id: ThemeSubTab; label: string }[] = [
  { id: "style", label: "Card Style" },
  { id: "colours", label: "Colours" },
  { id: "detail", label: "Detail View" },
  { id: "animations", label: "Animations" },
  { id: "browse", label: "Browse" },
];

const borderRadiusOptions: { value: BorderRadiusPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const borderWidthOptions: { value: BorderWidthPreset; label: string }[] = [
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

const transparencyOptions: { value: DetailTransparencyPreset; label: string }[] = [
  { value: "none", label: "None" },
  { value: "25", label: "25%" },
  { value: "50", label: "50%" },
  { value: "75", label: "75%" },
];

const overlayStyleOptions: { value: OverlayStyle; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

/**
 * Convert hex colour to 6-character format for HTML color input.
 * Strips alpha channel if present (8-char hex -> 6-char hex).
 */
function toHex6(hex: string | undefined): string {
  if (!hex) return "#000000";
  const clean = hex.replace(/^#/, "");
  // If 8 characters (with alpha), take first 6
  if (clean.length === 8) {
    return `#${clean.slice(0, 6)}`;
  }
  return hex;
}

/**
 * Theme settings with sub-tabs.
 */
export function ThemeSettingsTabs() {
  // Use draft pattern for settings (F-090)
  // Subscribe to _draft to trigger re-renders when draft changes
  useSettingsStore((s) => s._draft);
  const getEffective = useSettingsStore((s) => s.getEffective);
  const updateDraft = useSettingsStore((s) => s.updateDraft);

  const [activeSubTab, setActiveSubTab] = useState<ThemeSubTab>("style");

  // Get effective values from draft
  // Note: _draft subscription above ensures re-render when these values change
  const visualTheme = getEffective("visualTheme");
  const themeCustomisations = getEffective("themeCustomisations");
  const currentCustomisation = themeCustomisations[visualTheme];

  // Helper to update theme customisation via draft
  const updateThemeCustomisation = useCallback((updates: Partial<ThemeCustomisation>) => {
    updateDraft({
      themeCustomisations: {
        ...themeCustomisations,
        [visualTheme]: {
          ...themeCustomisations[visualTheme],
          ...updates,
        },
      },
    });
  }, [updateDraft, themeCustomisations, visualTheme]);

  // Handler for visual theme change
  const handleVisualThemeChange = useCallback((theme: VisualTheme) => {
    updateDraft({ visualTheme: theme });
  }, [updateDraft]);

  const handleBorderRadiusChange = useCallback((value: BorderRadiusPreset) => {
    updateThemeCustomisation({ borderRadius: value });
  }, [updateThemeCustomisation]);

  const handleBorderWidthChange = useCallback((value: BorderWidthPreset) => {
    updateThemeCustomisation({ borderWidth: value });
  }, [updateThemeCustomisation]);

  const handleShadowIntensityChange = useCallback((value: ShadowIntensity) => {
    updateThemeCustomisation({ shadowIntensity: value });
  }, [updateThemeCustomisation]);

  const handleAnimationStyleChange = useCallback((value: AnimationStyle) => {
    updateThemeCustomisation({ animationStyle: value });
  }, [updateThemeCustomisation]);

  const handleAccentColourChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ accentColour: event.target.value });
  }, [updateThemeCustomisation]);

  const handleHoverColourChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ hoverColour: event.target.value });
  }, [updateThemeCustomisation]);

  const handleCardBackgroundChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ cardBackgroundColour: event.target.value });
  }, [updateThemeCustomisation]);

  const handleBorderColourChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ borderColour: event.target.value });
  }, [updateThemeCustomisation]);

  const handleTextColourChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ textColour: event.target.value });
  }, [updateThemeCustomisation]);

  const handleTransparencyChange = useCallback((value: DetailTransparencyPreset) => {
    updateThemeCustomisation({ detailTransparency: value });
  }, [updateThemeCustomisation]);

  const handleOverlayStyleChange = useCallback((value: OverlayStyle) => {
    updateThemeCustomisation({ overlayStyle: value });
  }, [updateThemeCustomisation]);

  const handleMoreButtonLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ moreButtonLabel: event.target.value });
  }, [updateThemeCustomisation]);

  const handleAutoExpandChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ autoExpandMore: event.target.checked });
  }, [updateThemeCustomisation]);

  const handleZoomImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ zoomImage: event.target.checked });
  }, [updateThemeCustomisation]);

  const handleFlipAnimationChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ flipAnimation: event.target.checked });
  }, [updateThemeCustomisation]);

  const handleDetailAnimationChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ detailAnimation: event.target.checked });
  }, [updateThemeCustomisation]);

  const handleOverlayAnimationChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    updateThemeCustomisation({ overlayAnimation: event.target.checked });
  }, [updateThemeCustomisation]);

  const renderSubTabContent = () => {
    switch (activeSubTab) {
      case "style":
        return (
          <>
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
            <div className={styles.row}>
              <span className={styles.label}>Border Width</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Border width">
                {borderWidthOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      currentCustomisation.borderWidth === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { handleBorderWidthChange(value); }}
                    role="radio"
                    aria-checked={currentCustomisation.borderWidth === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Shadow</span>
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
          </>
        );

      case "colours":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Card Background</span>
              <div className={styles.colourPickerWrapper}>
                <span className={styles.colourValue}>{currentCustomisation.cardBackgroundColour}</span>
                <input
                  type="color"
                  className={styles.colourPicker}
                  value={currentCustomisation.cardBackgroundColour}
                  onChange={handleCardBackgroundChange}
                  aria-label="Card background colour"
                />
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Border Colour</span>
              <div className={styles.colourPickerWrapper}>
                <span className={styles.colourValue}>{toHex6(currentCustomisation.borderColour)}</span>
                <input
                  type="color"
                  className={styles.colourPicker}
                  value={toHex6(currentCustomisation.borderColour)}
                  onChange={handleBorderColourChange}
                  aria-label="Border colour"
                />
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Text Colour</span>
              <div className={styles.colourPickerWrapper}>
                <span className={styles.colourValue}>{toHex6(currentCustomisation.textColour)}</span>
                <input
                  type="color"
                  className={styles.colourPicker}
                  value={toHex6(currentCustomisation.textColour)}
                  onChange={handleTextColourChange}
                  aria-label="Text colour"
                />
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Accent Colour</span>
              <div className={styles.colourPickerWrapper}>
                <span className={styles.colourValue}>{currentCustomisation.accentColour}</span>
                <input
                  type="color"
                  className={styles.colourPicker}
                  value={currentCustomisation.accentColour}
                  onChange={handleAccentColourChange}
                  aria-label="Accent colour"
                />
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Hover Colour</span>
              <div className={styles.colourPickerWrapper}>
                <span className={styles.colourValue}>{currentCustomisation.hoverColour}</span>
                <input
                  type="color"
                  className={styles.colourPicker}
                  value={currentCustomisation.hoverColour}
                  onChange={handleHoverColourChange}
                  aria-label="Hover colour"
                />
              </div>
            </div>
          </>
        );

      case "detail":
        return (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Footer Style</span>
              <div className={styles.segmentedControl} role="radiogroup" aria-label="Footer style">
                {overlayStyleOptions.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={[
                      styles.segmentButton,
                      currentCustomisation.overlayStyle === value ? styles.segmentButtonActive : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => { handleOverlayStyleChange(value); }}
                    role="radio"
                    aria-checked={currentCustomisation.overlayStyle === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>More Button Label</span>
              <input
                type="text"
                className={styles.textInput}
                value={currentCustomisation.moreButtonLabel}
                onChange={handleMoreButtonLabelChange}
                placeholder="Details"
                aria-label="More button label"
              />
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Auto-expand More</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={currentCustomisation.autoExpandMore}
                  onChange={handleAutoExpandChange}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Zoom First Image</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={currentCustomisation.zoomImage}
                  onChange={handleZoomImageChange}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
          </>
        );

      case "animations":
        return (
          <>
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
            <div className={styles.row}>
              <span className={styles.label}>Card Flip</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={currentCustomisation.flipAnimation}
                  onChange={handleFlipAnimationChange}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Detail View</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={currentCustomisation.detailAnimation}
                  onChange={handleDetailAnimationChange}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Overlay</span>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={currentCustomisation.overlayAnimation}
                  onChange={handleOverlayAnimationChange}
                />
                <span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.helpText}>
              Toggle individual animation effects on or off. Set animation style to
              &quot;None&quot; to disable all animations globally.
            </div>
          </>
        );

      case "browse":
        return <ThemeBrowser />;
    }
  };

  return (
    <div className={tabStyles.container}>
      {/* Theme selector header */}
      <div className={themeStyles.themeHeader}>
        <div className={themeStyles.themePicker} role="radiogroup" aria-label="Visual theme">
          {themeOptions.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={[
                themeStyles.themeButton,
                visualTheme === value ? themeStyles.themeButtonActive : "",
              ].filter(Boolean).join(" ")}
              onClick={() => { handleVisualThemeChange(value); }}
              role="radio"
              aria-checked={visualTheme === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Global overlay transparency setting */}
      <div className={themeStyles.globalSetting}>
        <div className={styles.row}>
          <span className={styles.label}>Overlay Transparency</span>
          <div className={styles.segmentedControl} role="radiogroup" aria-label="Overlay transparency">
            {transparencyOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={[
                  styles.segmentButton,
                  currentCustomisation.detailTransparency === value ? styles.segmentButtonActive : "",
                ].filter(Boolean).join(" ")}
                onClick={() => { handleTransparencyChange(value); }}
                role="radio"
                aria-checked={currentCustomisation.detailTransparency === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className={themeStyles.settingHint}>
          Applies to Detail View, Search, Games, and Help overlays
        </p>
      </div>

      {/* Sub-tab navigation */}
      <div className={themeStyles.subTabsWrapper}>
        <div className={tabStyles.subTabs} role="tablist" aria-label="Theme settings sections">
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
              onClick={() => { setActiveSubTab(id); }}
            >
              {label}
            </button>
          ))}
        </div>
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
