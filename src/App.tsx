import { useState } from "react";
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
import styles from "./App.module.css";

/**
 * Inner app component that uses theme hook.
 */
function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialise theme (applies data-theme to document)
  useTheme();

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
