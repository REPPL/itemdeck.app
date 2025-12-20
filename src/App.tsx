import { useState } from "react";
import { CardGrid } from "@/components/CardGrid/CardGrid";
import { MenuButton } from "@/components/MenuButton/MenuButton";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { SettingsProvider } from "@/context/SettingsContext";
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
    <SettingsProvider>
      <div className={styles.app}>
        <Sidebar isOpen={menuOpen} onClose={handleMenuClose} />
        <MenuButton isOpen={menuOpen} onClick={handleMenuToggle} />
        <main className={styles.main}>
          <CardGrid />
        </main>
      </div>
    </SettingsProvider>
  );
}

export default App;
