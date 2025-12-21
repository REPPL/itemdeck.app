import { useState } from "react";
import { CardGrid } from "@/components/CardGrid/CardGrid";
import { MenuButton } from "@/components/MenuButton/MenuButton";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QueryErrorBoundary } from "@/components/QueryErrorBoundary";
import { ConfigProvider } from "@/context/ConfigContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { MotionProvider } from "@/context/MotionContext";
import styles from "./App.module.css";

/**
 * Root application component.
 */
function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  return (
    <ConfigProvider>
      <SettingsProvider>
        <MotionProvider>
          <div className={styles.app}>
            <Sidebar isOpen={menuOpen} onClose={handleMenuClose} />
            <MenuButton isOpen={menuOpen} onClick={handleMenuToggle} />
            <main className={styles.main}>
              <QueryErrorBoundary>
                <CardGrid />
              </QueryErrorBoundary>
            </main>
            <OfflineIndicator />
          </div>
        </MotionProvider>
      </SettingsProvider>
    </ConfigProvider>
  );
}

export default App;
