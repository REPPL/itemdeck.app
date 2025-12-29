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
import { CollectionToast } from "@/components/CollectionToast";
import { EditModeIndicator } from "@/components/EditModeIndicator";
import { StatisticsBar } from "@/components/Statistics";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Toast } from "@/components/Toast";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { MotionProvider } from "@/context/MotionContext";
import { CollectionDataProvider } from "@/context/CollectionDataContext";
import { MechanicProvider } from "@/mechanics";
import { useTheme } from "@/hooks/useTheme";
import { useVisualTheme } from "@/hooks/useVisualTheme";
import { useAdminModeShortcut, useGlobalKeyboard } from "@/hooks/useGlobalKeyboard";
import { useUrlCollection, clearUrlPath } from "@/hooks/useUrlCollection";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSourceStore } from "@/stores/sourceStore";
import { ACTION_SHORTCUTS } from "@/config/keyboardShortcuts";
import "@/styles/themes";
import styles from "./App.module.css";

interface AppContentProps {
  mechanicPanelOpen: boolean;
  setMechanicPanelOpen: (open: boolean) => void;
}

/**
 * Inner app component that uses theme hook.
 */
function AppContentWithMechanicPanel({ mechanicPanelOpen, setMechanicPanelOpen }: AppContentProps) {
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [viewPopoverOpen, setViewPopoverOpen] = useState(false);
  const [devtoolsEnabled, setDevtoolsEnabled] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [showReloadDialog, setShowReloadDialog] = useState(false);
  const [resetToastVisible, setResetToastVisible] = useState(false);

  // URL-based collection loading
  const urlCollection = useUrlCollection();
  const addMyPlausibleMeSource = useSourceStore((s) => s.addMyPlausibleMeSource);
  const addSourceFromUrl = useSourceStore((s) => s.addSourceFromUrl);
  const setActiveSource = useSourceStore((s) => s.setActiveSource);
  const activeSourceId = useSourceStore((s) => s.activeSourceId);

  // Collection picker state (F-087)
  // Skip picker if URL specifies direct load
  const [pickerDismissed, setPickerDismissed] = useState(false);
  const [urlHandled, setUrlHandled] = useState(false);

  // Handle direct URL loading
  // Supports: /gh?u=REPPL&collection=commercials (provider format)
  //           /gh/REPPL/collection/retro-games/ (path format)
  //           ?collection=https://... (legacy format)
  useEffect(() => {
    if (urlHandled) return;

    // Provider URL format or legacy full URL format
    if (urlCollection.directLoad && urlCollection.collectionUrl) {
      const sourceId = addSourceFromUrl(
        urlCollection.collectionUrl,
        urlCollection.providerId,
        urlCollection.username,
        urlCollection.folder
      );
      setActiveSource(sourceId);
      setPickerDismissed(true);
      clearUrlPath();
      setUrlHandled(true);
    } else if (urlCollection.directLoad && urlCollection.username && urlCollection.folder) {
      // Path-based format without collectionUrl (legacy path format)
      const sourceId = addMyPlausibleMeSource(
        urlCollection.username,
        urlCollection.folder
      );
      setActiveSource(sourceId);
      setPickerDismissed(true);
      clearUrlPath();
      setUrlHandled(true);
    } else if (urlCollection.hasGitHubPath) {
      // Just username in URL: will be passed to picker
      setUrlHandled(true);
    }
  }, [urlCollection, urlHandled, addMyPlausibleMeSource, addSourceFromUrl, setActiveSource]);

  // Show picker on startup unless:
  // 1. Already dismissed in this session
  // 2. URL specifies direct load
  // 3. Already have an active source (persisted from previous session)
  const showCollectionPicker = !pickerDismissed && !urlCollection.directLoad && !activeSourceId;

  const handleCollectionSelect = useCallback((_sourceId: string) => {
    // Source is already added and set as active by the picker
    // Just dismiss the picker and clear URL
    setPickerDismissed(true);
    clearUrlPath();
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

  // Soft refresh handlers (Cmd-R)
  const clearAllFilters = useSettingsStore((state) => state.clearAllFilters);

  // Listen for early keyboard interception event from main.tsx
  useEffect(() => {
    const handleReloadRequest = () => {
      setShowReloadDialog(true);
    };

    window.addEventListener("app:reload-request", handleReloadRequest);
    return () => {
      window.removeEventListener("app:reload-request", handleReloadRequest);
    };
  }, []);

  const handleReloadConfirm = useCallback(() => {
    setShowReloadDialog(false);

    // Soft refresh: reset transient state without full page reload
    // 1. Clear search and filters
    clearAllFilters();

    // 2. Close all panels/overlays
    setSettingsOpen(false);
    setHelpOpen(false);
    setMechanicPanelOpen(false);
    setViewPopoverOpen(false);
    setSidebarOpen(false);

    // 3. Trigger re-shuffle by toggling shuffleOnLoad
    if (shuffleOnLoad) {
      setShuffleOnLoad(false);
      setTimeout(() => {
        setShuffleOnLoad(true);
      }, 10);
    }

    // 4. Show confirmation toast
    setResetToastVisible(true);
  }, [clearAllFilters, shuffleOnLoad, setShuffleOnLoad, setMechanicPanelOpen]);

  const handleReloadCancel = useCallback(() => {
    setShowReloadDialog(false);
  }, []);

  useAdminModeShortcut(handleSettingsToggle);

  // Additional keyboard shortcuts using centralised config
  // All action shortcuts now require Ctrl modifier for consistency
  // Note: Cmd-R/Ctrl-R is handled in main.tsx for early interception
  useGlobalKeyboard({
    shortcuts: [
      {
        key: ACTION_SHORTCUTS.help.key,
        shift: ACTION_SHORTCUTS.help.shift,
        handler: handleHelpToggle,
        preventDefault: true,
      },
      {
        key: ACTION_SHORTCUTS.settings.key,
        ctrl: ACTION_SHORTCUTS.settings.ctrl,
        handler: handleSettingsToggle,
        preventDefault: true,
      },
      {
        key: ACTION_SHORTCUTS.shuffle.key,
        ctrl: ACTION_SHORTCUTS.shuffle.ctrl,
        handler: handleShuffle,
        preventDefault: true,
      },
      {
        key: ACTION_SHORTCUTS.editMode.key,
        ctrl: ACTION_SHORTCUTS.editMode.ctrl,
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


  // Button visibility settings
  const showHelpButton = useSettingsStore((state) => state.showHelpButton);
  const showSettingsButton = useSettingsStore((state) => state.showSettingsButton);
  const showViewButton = useSettingsStore((state) => state.showViewButton);

  // Search bar state
  const showSearchBar = useSettingsStore((state) => state.showSearchBar);
  const searchBarMinimised = useSettingsStore((state) => state.searchBarMinimised);
  const setSearchBarMinimised = useSettingsStore((state) => state.setSearchBarMinimised);

  // Statistics bar state
  const showStatisticsBar = useSettingsStore((state) => state.showStatisticsBar);
  const setShowStatisticsBar = useSettingsStore((state) => state.setShowStatisticsBar);

  const handleStatisticsDismiss = useCallback(() => {
    setShowStatisticsBar(false);
  }, [setShowStatisticsBar]);

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

      {/* Collection picker (shows on startup) */}
      {showCollectionPicker && (
        <CollectionPicker
          onSelect={handleCollectionSelect}
          initialUsername={urlCollection.username ?? undefined}
        />
      )}

      {/* Loading screen (shows during initial load, after picker) */}
      {!showCollectionPicker && !loadingComplete && (
        <LoadingScreen onComplete={handleLoadingComplete} />
      )}

      {/* Sidebar (Explorer) */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Collection loaded toast (brief summary) */}
      <CollectionToast loadingComplete={loadingComplete} />

      {/* Main content */}
      <main id="main-content" className={styles.main}>
        {/* Statistics bar (shows above card grid when enabled and loaded) */}
        {loadingComplete && showStatisticsBar && (
          <StatisticsBar onDismiss={handleStatisticsDismiss} />
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
      {/* Also hidden when Search or View overlays are open */}
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
          showViewButton={showViewButton}
          hidden={!searchBarMinimised || viewPopoverOpen}
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

      {/* Soft refresh confirmation dialog (Cmd-R/Ctrl-R) */}
      <ConfirmDialog
        isOpen={showReloadDialog}
        title="Reset View?"
        message="This will clear your search, filters, and re-shuffle the cards. Your settings and edits are preserved."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleReloadConfirm}
        onCancel={handleReloadCancel}
      />

      {/* Reset confirmation toast */}
      <Toast
        message="View reset"
        visible={resetToastVisible}
        onHide={() => { setResetToastVisible(false); }}
        type="success"
      />
    </div>
  );
}

/**
 * Wrapper that provides MechanicProvider with panel open callback.
 * Manages mechanic panel state at this level so children can open it.
 */
function MechanicProviderWithPanel() {
  const [mechanicPanelOpen, setMechanicPanelOpen] = useState(false);

  const handleOpenMechanicPanel = useCallback(() => {
    setMechanicPanelOpen(true);
  }, []);

  return (
    <MechanicProvider onOpenMechanicPanel={handleOpenMechanicPanel}>
      <AppContentWithMechanicPanel
        mechanicPanelOpen={mechanicPanelOpen}
        setMechanicPanelOpen={setMechanicPanelOpen}
      />
    </MechanicProvider>
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
            <MechanicProviderWithPanel />
          </CollectionDataProvider>
        </MotionProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default App;
