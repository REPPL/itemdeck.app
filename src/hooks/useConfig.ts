/**
 * Hook to access application configuration.
 */

import { useContext } from "react";
import { ConfigContext } from "@/context/ConfigContext";

/**
 * Access the application configuration context.
 *
 * @throws Error if used outside of ConfigProvider
 */
export function useConfig() {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }

  return context;
}
