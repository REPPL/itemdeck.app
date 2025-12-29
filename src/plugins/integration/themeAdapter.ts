/**
 * Theme plugin adapter.
 *
 * Applies theme contributions as CSS custom properties and manages theme switching.
 *
 * @module plugins/integration/themeAdapter
 */

import type { ThemeContribution } from "@/plugins/schemas/contributions/theme";
import { usePluginStore } from "@/stores/pluginStore";

// ============================================================================
// Types
// ============================================================================

/**
 * Theme adapter configuration.
 */
export interface ThemeAdapterConfig {
  /** Target element for CSS variables (defaults to document root) */
  target?: HTMLElement;
  /** Custom property prefix */
  prefix?: string;
}

/**
 * Applied theme info.
 */
export interface AppliedTheme {
  /** Plugin ID that provided this theme */
  pluginId: string;
  /** Theme contribution ID */
  themeId: string;
  /** Full theme contribution */
  contribution: ThemeContribution;
}

// ============================================================================
// CSS Variable Mapping
// ============================================================================

/**
 * Map theme contributions to CSS custom properties.
 */
function themeToCSSVariables(
  theme: ThemeContribution,
  prefix = ""
): Record<string, string> {
  const vars: Record<string, string> = {};
  const p = prefix ? `${prefix}-` : "";

  // Colours
  if (theme.colours) {
    const c = theme.colours;
    if (c.primary) vars[`--${p}colour-primary`] = c.primary;
    if (c.primaryHover) vars[`--${p}colour-primary-hover`] = c.primaryHover;
    if (c.secondary) vars[`--${p}colour-secondary`] = c.secondary;
    if (c.background) vars[`--${p}colour-background`] = c.background;
    if (c.backgroundSecondary) vars[`--${p}colour-background-secondary`] = c.backgroundSecondary;
    if (c.surface) vars[`--${p}colour-surface`] = c.surface;
    if (c.surfaceHover) vars[`--${p}colour-surface-hover`] = c.surfaceHover;
    if (c.text) vars[`--${p}colour-text`] = c.text;
    if (c.textSecondary) vars[`--${p}colour-text-secondary`] = c.textSecondary;
    if (c.textMuted) vars[`--${p}colour-text-muted`] = c.textMuted;
    if (c.border) vars[`--${p}colour-border`] = c.border;
    if (c.borderHover) vars[`--${p}colour-border-hover`] = c.borderHover;
    if (c.accent) vars[`--${p}colour-accent`] = c.accent;
    if (c.error) vars[`--${p}colour-error`] = c.error;
    if (c.success) vars[`--${p}colour-success`] = c.success;
    if (c.warning) vars[`--${p}colour-warning`] = c.warning;
    if (c.info) vars[`--${p}colour-info`] = c.info;
    if (c.cardBackground) vars[`--${p}colour-card-background`] = c.cardBackground;
    if (c.cardBorder) vars[`--${p}colour-card-border`] = c.cardBorder;
    if (c.cardText) vars[`--${p}colour-card-text`] = c.cardText;
  }

  // Typography
  if (theme.typography) {
    const t = theme.typography;
    if (t.body?.family) vars[`--${p}font-family-body`] = t.body.family;
    if (t.heading?.family) vars[`--${p}font-family-heading`] = t.heading.family;
    if (t.mono?.family) vars[`--${p}font-family-mono`] = t.mono.family;
  }

  // Border radii
  if (theme.borderRadii) {
    const b = theme.borderRadii;
    if (b.sm) vars[`--${p}radius-sm`] = b.sm;
    if (b.md) vars[`--${p}radius-md`] = b.md;
    if (b.lg) vars[`--${p}radius-lg`] = b.lg;
    if (b.xl) vars[`--${p}radius-xl`] = b.xl;
    if (b.full) vars[`--${p}radius-full`] = b.full;
    if (b.card) vars[`--${p}card-border-radius`] = b.card;
  }

  // Shadows
  if (theme.shadows) {
    const s = theme.shadows;
    if (s.sm) vars[`--${p}shadow-sm`] = s.sm;
    if (s.md) vars[`--${p}shadow-md`] = s.md;
    if (s.lg) vars[`--${p}shadow-lg`] = s.lg;
    if (s.xl) vars[`--${p}shadow-xl`] = s.xl;
    if (s.card) vars[`--${p}shadow-card`] = s.card;
    if (s.cardHover) vars[`--${p}shadow-card-hover`] = s.cardHover;
  }

  // Animation
  if (theme.animations) {
    const a = theme.animations;
    if (a.fast) vars[`--${p}transition-fast`] = a.fast;
    if (a.normal) vars[`--${p}transition-normal`] = a.normal;
    if (a.slow) vars[`--${p}transition-slow`] = a.slow;
    if (a.easing) vars[`--${p}easing-default`] = a.easing;
    if (a.easingBounce) vars[`--${p}easing-bounce`] = a.easingBounce;
  }

  return vars;
}

// ============================================================================
// Theme Adapter Class
// ============================================================================

/**
 * Theme plugin adapter.
 *
 * Manages applying and removing theme CSS custom properties.
 */
class ThemePluginAdapter {
  private currentTheme: AppliedTheme | null = null;
  private injectedStyleElement: HTMLStyleElement | null = null;
  private readonly config: Required<ThemeAdapterConfig>;

  constructor(config: ThemeAdapterConfig = {}) {
    this.config = {
      target: config.target ?? document.documentElement,
      prefix: config.prefix ?? "",
    };
  }

  /**
   * Apply a theme from a plugin contribution.
   *
   * @param pluginId - Plugin ID providing the theme
   * @param contribution - Theme contribution to apply
   */
  async applyTheme(pluginId: string, contribution: ThemeContribution): Promise<void> {
    // Remove current theme first
    this.removeCurrentTheme();

    // Apply CSS custom properties
    const cssVars = themeToCSSVariables(contribution, this.config.prefix);
    const target = this.config.target;

    for (const [property, value] of Object.entries(cssVars)) {
      target.style.setProperty(property, value);
    }

    // Set data attributes for theme-specific CSS selectors
    target.setAttribute("data-visual-theme", contribution.id);
    target.setAttribute("data-theme-category", contribution.category);

    // Inject custom CSS if provided
    if (contribution.customCSS) {
      this.injectCustomCSS(contribution.customCSS);
    }

    // Track current theme
    this.currentTheme = {
      pluginId,
      themeId: contribution.id,
      contribution,
    };

    // Update plugin store
    const store = usePluginStore.getState();
    store.setActiveTheme(`${pluginId}:${contribution.id}`);
  }

  /**
   * Remove the currently applied theme.
   */
  removeCurrentTheme(): void {
    if (!this.currentTheme) return;

    const target = this.config.target;

    // Remove CSS custom properties
    const cssVars = themeToCSSVariables(
      this.currentTheme.contribution,
      this.config.prefix
    );

    for (const property of Object.keys(cssVars)) {
      target.style.removeProperty(property);
    }

    // Remove data attributes
    target.removeAttribute("data-visual-theme");
    target.removeAttribute("data-theme-category");

    // Remove injected CSS
    this.removeInjectedCSS();

    // Clear current theme
    this.currentTheme = null;

    // Update plugin store
    const store = usePluginStore.getState();
    store.setActiveTheme(null);
  }

  /**
   * Get the currently applied theme.
   *
   * @returns Applied theme info or null
   */
  getCurrentTheme(): AppliedTheme | null {
    return this.currentTheme;
  }

  /**
   * Get the current theme ID (pluginId:themeId format).
   *
   * @returns Theme ID or null
   */
  getCurrentThemeId(): string | null {
    if (!this.currentTheme) return null;
    return `${this.currentTheme.pluginId}:${this.currentTheme.themeId}`;
  }

  /**
   * Check if a theme is currently applied.
   */
  hasTheme(): boolean {
    return this.currentTheme !== null;
  }

  /**
   * Inject custom CSS from theme.
   */
  private injectCustomCSS(css: string): void {
    this.removeInjectedCSS();

    const style = document.createElement("style");
    style.id = "itemdeck-theme-custom";
    style.textContent = css;
    document.head.appendChild(style);
    this.injectedStyleElement = style;
  }

  /**
   * Remove injected custom CSS.
   */
  private removeInjectedCSS(): void {
    if (this.injectedStyleElement) {
      this.injectedStyleElement.remove();
      this.injectedStyleElement = null;
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global theme adapter instance.
 */
export const themeAdapter = new ThemePluginAdapter();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Apply a theme by plugin and theme ID.
 *
 * @param pluginId - Plugin ID
 * @param contribution - Theme contribution
 */
export async function applyTheme(
  pluginId: string,
  contribution: ThemeContribution
): Promise<void> {
  return themeAdapter.applyTheme(pluginId, contribution);
}

/**
 * Remove the current theme.
 */
export function removeCurrentTheme(): void {
  themeAdapter.removeCurrentTheme();
}

/**
 * Get the current theme ID.
 */
export function getCurrentThemeId(): string | null {
  return themeAdapter.getCurrentThemeId();
}

/**
 * Export CSS variables for a theme (useful for previews).
 *
 * @param theme - Theme contribution
 * @param prefix - CSS variable prefix
 * @returns CSS variables as a string
 */
export function exportThemeCSS(theme: ThemeContribution, prefix = ""): string {
  const vars = themeToCSSVariables(theme, prefix);
  const lines = Object.entries(vars).map(
    ([property, value]) => `  ${property}: ${value};`
  );

  return `:root {\n${lines.join("\n")}\n}`;
}
