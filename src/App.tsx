import { useState, useEffect } from "react";
import { CardGrid } from "@/components/CardGrid/CardGrid";
import { MenuButton } from "@/components/MenuButton/MenuButton";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RefreshButton } from "@/components/RefreshButton";
import { SettingsButton } from "@/components/SettingsButton";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { MotionProvider } from "@/context/MotionContext";
import { useTheme } from "@/hooks/useTheme";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./App.module.css";

/**
 * Inner app component that uses theme hook.
 */
function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayStyle = useSettingsStore((state) => state.overlayStyle);
  const titleDisplayMode = useSettingsStore((state) => state.titleDisplayMode);

  // Initialise theme (applies data-theme to document)
  useTheme();

  // Apply overlay style and title display mode to document
  useEffect(() => {
    document.documentElement.dataset.overlayStyle = overlayStyle;
    document.documentElement.dataset.titleDisplay = titleDisplayMode;
  }, [overlayStyle, titleDisplayMode]);

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  return (
    <div className={styles.app}>
      <Sidebar isOpen={menuOpen} onClose={handleMenuClose} />
      <MenuButton isOpen={menuOpen} onClick={handleMenuToggle} />
      <header className={styles.header}>
        <RefreshButton size="small" />
        <ThemeToggle />
        <SettingsButton />
      </header>
      <main className={styles.main}>
        <QueryErrorBoundary>
          <CardGrid />
        </QueryErrorBoundary>
      </main>
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
