import { useState, useEffect, useCallback } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CardGrid } from "@/components/CardGrid/CardGrid";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AdminButton } from "@/components/AdminButton";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { MotionProvider } from "@/context/MotionContext";
import { useTheme } from "@/hooks/useTheme";
import { useVisualTheme } from "@/hooks/useVisualTheme";
import { useAdminModeShortcut } from "@/hooks/useGlobalKeyboard";
import { useSettingsStore } from "@/stores/settingsStore";
import "@/styles/themes";
import styles from "./App.module.css";

/**
 * Inner app component that uses theme hook.
 */
function AppContent() {
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [devtoolsEnabled, setDevtoolsEnabled] = useState(false);

  // Settings from store
  const overlayStyle = useSettingsStore((state) => state.overlayStyle);
  const titleDisplayMode = useSettingsStore((state) => state.titleDisplayMode);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const highContrast = useSettingsStore((state) => state.highContrast);

  // Initialise theme (applies data-theme to document for light/dark mode)
  useTheme();

  // Apply visual theme (retro/modern/minimal)
  useVisualTheme();

  // Ctrl+A toggles settings panel
  const handleSettingsToggle = useCallback(() => {
    setSettingsOpen((prev) => !prev);
  }, []);

  useAdminModeShortcut(handleSettingsToggle);

  // Apply settings as data attributes to document
  useEffect(() => {
    document.documentElement.dataset.overlayStyle = overlayStyle;
    document.documentElement.dataset.titleDisplay = titleDisplayMode;
    document.documentElement.dataset.reduceMotion = reduceMotion;
    document.documentElement.dataset.highContrast = String(highContrast);
  }, [overlayStyle, titleDisplayMode, reduceMotion, highContrast]);

  // Handlers
  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleSettingsOpen = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleSettingsClose = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleDevtoolsToggle = useCallback(() => {
    setDevtoolsEnabled((prev) => !prev);
  }, []);

  return (
    <div className={styles.app}>
      {/* Sidebar (Explorer) */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main content */}
      <main className={styles.main}>
        <QueryErrorBoundary>
          <CardGrid />
        </QueryErrorBoundary>
      </main>

      {/* Floating admin button (bottom-right) - always visible */}
      <AdminButton onClick={handleSettingsOpen} />

      {/* Settings panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={handleSettingsClose}
        devtoolsEnabled={devtoolsEnabled}
        onDevtoolsToggle={handleDevtoolsToggle}
      />

      <OfflineIndicator />

      {/* TanStack Query DevTools (dev mode only, controlled by setting) */}
      {import.meta.env.DEV && devtoolsEnabled && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </div>
  );
}

/**
 * Root application component.
 */
function App() {
  return (
    <ConfigProvider>
      <SettingsProvider>
        <MotionProvider>
          <AppContent />
        </MotionProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default App;
