import { useState, useEffect, useCallback, useRef } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CardGrid } from "@/components/CardGrid/CardGrid";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { SettingsPanel } from "@/components/SettingsPanel";
import { HelpModal } from "@/components/HelpModal";
import { MechanicPanel } from "@/components/MechanicPanel";
import { NavigationHub } from "@/components/NavigationHub";
import { ViewPopover } from "@/components/ViewPopover";
import { LoadingScreen } from "@/components/LoadingScreen";
import { CollectionPicker } from "@/components/CollectionPicker";
import { StatisticsBar } from "@/components/Statistics";
import { EditModeIndicator } from "@/components/EditModeIndicator";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { MotionProvider } from "@/context/MotionContext";
import { CollectionDataProvider } from "@/context/CollectionDataContext";
import { MechanicProvider } from "@/mechanics";
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
  const [mechanicPanelOpen, setMechanicPanelOpen] = useState(false);
  const [viewPopoverOpen, setViewPopoverOpen] = useState(false);
  const [devtoolsEnabled, setDevtoolsEnabled] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Collection picker state (F-087)
  // Always show picker on startup until dismissed or a collection is selected
  const [pickerDismissed, setPickerDismissed] = useState(false);

  // Show picker on every startup until user selects or dismisses
  const showCollectionPicker = !pickerDismissed;

  const handleCollectionSelect = useCallback((_sourceId: string) => {
    // Source is already added and set as active by the picker
    // Just dismiss the picker
    setPickerDismissed(true);
  }, []);

  const handlePickerDismiss = useCallback(() => {
    // User chose to skip - use default built-in source
    setPickerDismissed(true);
  }, []);

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

  // Search bar state
  const showSearchBar = useSettingsStore((state) => state.showSearchBar);
  const searchBarMinimised = useSettingsStore((state) => state.searchBarMinimised);
  const setSearchBarMinimised = useSettingsStore((state) => state.setSearchBarMinimised);

  // Active mechanic state
  const activeMechanicId = useSettingsStore((state) => state.activeMechanicId);

  // Track pre-mechanic state for restoration
  const preMechanicStateRef = useRef<{
    settingsOpen: boolean;
    searchBarMinimised: boolean;
  } | null>(null);

  // When a mechanic activates, save current state and close panels
  useEffect(() => {
    if (activeMechanicId) {
      // Save current state before mechanic
      preMechanicStateRef.current = {
        settingsOpen,
        searchBarMinimised,
      };
      // Close panels during game
      setSettingsOpen(false);
      setSearchBarMinimised(true);
    } else if (preMechanicStateRef.current) {
      // Restore state when mechanic deactivates
      const { settingsOpen: wasSettingsOpen, searchBarMinimised: wasMinimised } = preMechanicStateRef.current;
      setSettingsOpen(wasSettingsOpen);
      setSearchBarMinimised(wasMinimised);
      preMechanicStateRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMechanicId]); // Only react to mechanic changes

  const handleStatisticsBarDismiss = useCallback(() => {
    setShowStatisticsBar(false);
  }, [setShowStatisticsBar]);

  const handleSearchButtonClick = useCallback(() => {
    setSearchBarMinimised(false);
  }, [setSearchBarMinimised]);

  const handleViewClick = useCallback(() => {
    setViewPopoverOpen((prev) => !prev);
  }, []);

  return (
    <div className={styles.app}>
      {/* Skip to main content link (accessibility) */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to content
      </a>

      {/* Collection picker (shows on startup if no custom sources) */}
      {showCollectionPicker && (
        <CollectionPicker
          onSelect={handleCollectionSelect}
          onDismiss={handlePickerDismiss}
        />
      )}

      {/* Loading screen (shows during initial load, after picker) */}
      {!showCollectionPicker && !loadingComplete && (
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

      {/* Navigation Hub (bottom-right) */}
      {/* Replaces individual floating buttons with collapsible navigation */}
      {/* Hidden during collection picker and loading to avoid z-index issues */}
      {!showCollectionPicker && loadingComplete && (
        <NavigationHub
          onHelpClick={() => { setHelpOpen(true); }}
          onSearchClick={handleSearchButtonClick}
          onGamesClick={() => { setMechanicPanelOpen(true); }}
          onSettingsClick={handleSettingsOpen}
          onViewClick={handleViewClick}
          disabled={!searchBarMinimised}
          showHelpButton={showHelpButton}
          showSettingsButton={showSettingsButton}
          showSearchBar={showSearchBar}
        />
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

      {/* Mechanic panel */}
      <MechanicPanel
        isOpen={mechanicPanelOpen}
        onClose={() => { setMechanicPanelOpen(false); }}
      />

      {/* View popover */}
      <ViewPopover
        isOpen={viewPopoverOpen}
        onClose={() => { setViewPopoverOpen(false); }}
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
            <MechanicProvider>
              <AppContent />
            </MechanicProvider>
          </CollectionDataProvider>
        </MotionProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default App;
