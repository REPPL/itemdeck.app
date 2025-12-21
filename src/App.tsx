import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardGrid } from "@/components/CardGrid/CardGrid";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshButton } from "@/components/RefreshButton";
import { SettingsButton } from "@/components/SettingsButton";
import { SettingsPanel } from "@/components/SettingsPanel";
import { AdminButton } from "@/components/AdminButton";
import { SearchButton } from "@/components/SearchButton";
import { SearchBar } from "@/components/SearchBar";
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
  const [adminModeVisible, setAdminModeVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [devtoolsEnabled, setDevtoolsEnabled] = useState(false);

  // Settings from store
  const overlayStyle = useSettingsStore((state) => state.overlayStyle);
  const titleDisplayMode = useSettingsStore((state) => state.titleDisplayMode);

  // Initialise theme (applies data-theme to document for light/dark mode)
  useTheme();

  // Apply visual theme (retro/modern/minimal)
  useVisualTheme();

  // Ctrl+A toggles admin mode visibility
  const handleAdminToggle = useCallback(() => {
    setAdminModeVisible((prev) => !prev);
  }, []);

  useAdminModeShortcut(handleAdminToggle);

  // Apply overlay style and title display mode to document
  useEffect(() => {
    document.documentElement.dataset.overlayStyle = overlayStyle;
    document.documentElement.dataset.titleDisplay = titleDisplayMode;
  }, [overlayStyle, titleDisplayMode]);

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

  const handleSearchExpand = useCallback(() => {
    setSearchExpanded(true);
  }, []);

  const handleSearchCollapse = useCallback(() => {
    setSearchExpanded(false);
  }, []);

  const handleExplorerOpen = useCallback(() => {
    setSidebarOpen(true);
    setSearchExpanded(false);
  }, []);

  const handleDevtoolsToggle = useCallback(() => {
    setDevtoolsEnabled((prev) => !prev);
  }, []);

  return (
    <div className={styles.app}>
      {/* Sidebar (Explorer) */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />

      {/* Search button (replaces red MenuButton) */}
      <SearchButton onClick={handleSearchExpand} isExpanded={searchExpanded} />

      {/* Expandable search bar */}
      <SearchBar
        isExpanded={searchExpanded}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={handleSearchCollapse}
        onExplorerClick={handleExplorerOpen}
      />

      {/* Header - slides down when admin mode visible */}
      <AnimatePresence>
        {adminModeVisible && (
          <motion.header
            className={styles.header}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <RefreshButton size="small" />
            <ThemeToggle />
            <SettingsButton onClick={handleSettingsOpen} />
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={styles.main}>
        <QueryErrorBoundary>
          <CardGrid />
        </QueryErrorBoundary>
      </main>

      {/* Floating admin button (bottom-right) */}
      <AdminButton
        isVisible={adminModeVisible}
        onClick={handleSettingsOpen}
      />

      {/* Settings panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={handleSettingsClose}
        devtoolsEnabled={devtoolsEnabled}
        onDevtoolsToggle={handleDevtoolsToggle}
      />

      <OfflineIndicator />
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
