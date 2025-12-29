import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

/**
 * Check if a plugin is PWA-related and should be excluded.
 */
function isPwaPlugin(plugin: unknown): boolean {
  if (!plugin || typeof plugin !== "object") return false;

  // Check for name property
  if ("name" in plugin) {
    const name = String((plugin as { name: unknown }).name).toLowerCase();
    if (name.includes("pwa") || name.includes("workbox")) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively filter out PWA plugins from nested plugin arrays.
 */
function filterPlugins(plugins: PluginOption[]): PluginOption[] {
  return plugins.reduce<PluginOption[]>((acc, plugin) => {
    if (Array.isArray(plugin)) {
      // Handle nested arrays of plugins
      const filtered = filterPlugins(plugin);
      if (filtered.length > 0) {
        acc.push(filtered as PluginOption);
      }
    } else if (!isPwaPlugin(plugin)) {
      acc.push(plugin);
    }
    return acc;
  }, []);
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    check: true,
  },
  viteFinal: async (config) => {
    // Remove vite-plugin-pwa from Storybook builds
    // The PWA plugin causes issues with large Storybook assets
    if (config.plugins) {
      config.plugins = filterPlugins(config.plugins as PluginOption[]);
    }

    return config;
  },
};

export default config;