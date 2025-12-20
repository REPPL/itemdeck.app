import { useContext } from "react";
import { SettingsContext } from "@/context/SettingsContext";

/**
 * Hook to access settings context.
 * Must be used within a SettingsProvider.
 */
export function useSettingsContext() {
  return useContext(SettingsContext);
}
