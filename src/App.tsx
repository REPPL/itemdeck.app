import { useState, useEffect, useCallback } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CardGrid } from "@/components/CardGrid/CardGrid";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AdminButton } from "@/components/AdminButton";
import { HelpButton } from "@/components/HelpButton";
import { HelpModal } from "@/components/HelpModal";
import { LoadingScreen } from "@/components/LoadingScreen";
import { StatisticsBar } from "@/components/Statistics";
import { EditModeIndicator } from "@/components/EditModeIndicator";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { MotionProvider } from "@/context/MotionContext";
import { CollectionDataProvider } from "@/context/CollectionDataContext";
import { useTheme } from "@/hooks/useTheme";
import { useVisualTheme } from "@/hooks/useVisualTheme";
import { useAdminModeShortcut, useGlobalKeyboard } from "@/hooks/useGlobalKeyboard";
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [devtoolsEnabled, setDevtoolsEnabled] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  const handleLoadingComplete = useCallback(() => {
    setLoadingComplete(true);
  }, []);

  // Settings from store
  const visualTheme = useSettingsStore((state) => state.visualTheme);
  const themeCustomisations = useSettingsStore((state) => state.themeCustomisations);
  const overlayStyle = themeCustomisations[visualTheme].overlayStyle;
  const titleDisplayMode = useSettingsStore((state) => state.titleDisplayMode);
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const highContrast = useSettingsStore((state) => state.highContrast);
  const shuffleOnLoad = useSettingsStore((state) => state.shuffleOnLoad);
  const setShuffleOnLoad = useSettingsStore((state) => state.setShuffleOnLoad);

  // Initialise theme (applies data-theme to document for light/dark mode)
  useTheme();

  // Apply visual theme (retro/modern/minimal)
  useVisualTheme();

  // Ctrl+A toggles settings panel
  const handleSettingsToggle = useCallback(() => {
    setSettingsOpen((prev) => !prev);
  }, []);

  const handleHelpToggle = useCallback(() => {
    setHelpOpen((prev) => !prev);
  }, []);

  const handleShuffle = useCallback(() => {
    // Toggle shuffle off and on to trigger a re-shuffle
    if (shuffleOnLoad) {
      setShuffleOnLoad(false);
      // Re-enable after a tick to trigger re-render
      setTimeout(() => {
        setShuffleOnLoad(true);
      }, 10);
    } else {
      setShuffleOnLoad(true);
    }
  }, [shuffleOnLoad, setShuffleOnLoad]);

  // Edit mode settings (must be before useGlobalKeyboard)
  const editModeEnabled = useSettingsStore((state) => state.editModeEnabled);
  const setEditModeEnabled = useSettingsStore((state) => state.setEditModeEnabled);

  const handleEditModeToggle = useCallback(() => {
    setEditModeEnabled(!editModeEnabled);
  }, [editModeEnabled, setEditModeEnabled]);

  useAdminModeShortcut(handleSettingsToggle);

  // Additional keyboard shortcuts: ?, S, R, E
  useGlobalKeyboard({
    shortcuts: [
      {
        key: "Slash", // ? key (Shift + /)
        shift: true,
        handler: handleHelpToggle,
        preventDefault: true,
      },
      {
        key: "KeyS",
        handler: handleSettingsToggle,
        preventDefault: true,
      },
      {
        key: "KeyR",
        handler: handleShuffle,
        preventDefault: true,
      },
      {
        key: "KeyE",
        handler: handleEditModeToggle,
        preventDefault: true,
      },
    ],
  });

  // Apply settings as data attributes to document
  useEffect(() => {
    document.documentElement.dataset.overlayStyle = overlayStyle;
    // Use setAttribute for hyphenated data attributes
    document.documentElement.setAttribute("data-title-display", titleDisplayMode);
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

  // Statistics bar settings
  const showStatisticsBar = useSettingsStore((state) => state.showStatisticsBar);
  const setShowStatisticsBar = useSettingsStore((state) => state.setShowStatisticsBar);

  // Button visibility settings
  const showHelpButton = useSettingsStore((state) => state.showHelpButton);
  const showSettingsButton = useSettingsStore((state) => state.showSettingsButton);

  const handleStatisticsBarDismiss = useCallback(() => {
    setShowStatisticsBar(false);
  }, [setShowStatisticsBar]);

  return (
    <div className={styles.app}>
      {/* Skip to main content link (accessibility) */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      {/* Loading screen (shows during initial load) */}
      {!loadingComplete && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}

      {/* Sidebar (Explorer) */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Main content */}
      <main id="main-content" className={styles.main}>
        {showStatisticsBar && (
          <StatisticsBar onDismiss={handleStatisticsBarDismiss} />
        )}
        <QueryErrorBoundary>
          <CardGrid />
        </QueryErrorBoundary>
      </main>

      {/* Edit mode indicator (top-right, shows when edit mode active) */}
      <EditModeIndicator onClick={handleSettingsOpen} />

      {/* Floating buttons (bottom-right, stacked from bottom) */}
      {(showHelpButton || showSettingsButton) && (
        <div className={styles.floatingButtons}>
          {/* Settings button appears at bottom (first in column-reverse) */}
          {showSettingsButton && (
            <AdminButton onClick={handleSettingsOpen} />
          )}
          {/* Help button appears above settings (or at bottom if settings hidden) */}
          {showHelpButton && (
            <HelpButton onClick={() => { setHelpOpen(true); }} />
          )}
        </div>
      )}

      {/* Settings panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={handleSettingsClose}
        devtoolsEnabled={devtoolsEnabled}
        onDevtoolsToggle={handleDevtoolsToggle}
      />

      {/* Help modal */}
      <HelpModal
        isOpen={helpOpen}
        onClose={() => { setHelpOpen(false); }}
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
          <CollectionDataProvider>
            <AppContent />
          </CollectionDataProvider>
        </MotionProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default App;
