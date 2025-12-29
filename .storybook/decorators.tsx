/**
 * Storybook decorators for wrapping stories with context providers.
 *
 * Provides the necessary React context wrappers for components that
 * depend on application-level state (settings, motion, config, etc.).
 */

import type { Decorator } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "../src/context/ConfigContext";
import { SettingsProvider } from "../src/context/SettingsContext";
import { MotionProvider } from "../src/context/MotionContext";

// Create a QueryClient instance for Storybook
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Decorator that wraps stories with all required context providers.
 *
 * Use this decorator for components that depend on:
 * - React Query (data fetching)
 * - ConfigContext (app configuration)
 * - SettingsContext (user settings)
 * - MotionContext (reduced motion preferences)
 */
export const withProviders: Decorator = (Story) => (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider>
      <SettingsProvider>
        <MotionProvider>
          <Story />
        </MotionProvider>
      </SettingsProvider>
    </ConfigProvider>
  </QueryClientProvider>
);

/**
 * Decorator that wraps stories with only motion context.
 *
 * Use this for simple components that only need animation support.
 */
export const withMotion: Decorator = (Story) => (
  <MotionProvider>
    <Story />
  </MotionProvider>
);

/**
 * Decorator that provides a fixed-size container for card components.
 *
 * Useful for demonstrating card layouts at consistent sizes.
 */
export const withCardContainer: Decorator = (Story) => (
  <div style={{ padding: "2rem", maxWidth: "400px" }}>
    <Story />
  </div>
);

/**
 * Decorator that provides a grid container for multiple cards.
 *
 * Useful for grid layout demonstrations.
 */
export const withGridContainer: Decorator = (Story) => (
  <div
    style={{
      padding: "2rem",
      display: "grid",
      gap: "1rem",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    }}
  >
    <Story />
  </div>
);
