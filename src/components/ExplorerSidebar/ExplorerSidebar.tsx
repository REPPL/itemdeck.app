/**
 * Explorer sidebar component for filtering cards.
 *
 * Provides filter controls for categories, rank, year, and device.
 */

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFilterStore } from "@/stores/filterStore";
import styles from "./ExplorerSidebar.module.css";

/**
 * Close icon SVG.
 */
function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

interface ExplorerSidebarProps {
  /** Whether the sidebar is open */
  isOpen: boolean;

  /** Callback when closing */
  onClose: (applyFilters: boolean) => void;

  /** Available categories for filtering */
  categories: string[];

  /** Available devices for filtering */
  devices: string[];
}

/**
 * Explorer sidebar with filter controls.
 *
 * Features:
 * - Category checkboxes
 * - Rank range slider
 * - Year range inputs
 * - Device/platform filter
 * - "Apply Filters" / "Just Browsing" footer buttons
 * - On open: Temporarily flips all cards to front
 * - On close with "Just Browsing": Reset to previous state
 * - On close with "Apply Filters": Keep filters active
 *
 * @example
 * ```tsx
 * <ExplorerSidebar
 *   isOpen={explorerOpen}
 *   onClose={(apply) => closeExplorer(apply)}
 *   categories={availableCategories}
 *   devices={availableDevices}
 * />
 * ```
 */
export function ExplorerSidebar({
  isOpen,
  onClose,
  categories,
  devices,
}: ExplorerSidebarProps) {
  const {
    tempFilters,
    setTempCategories,
    setTempRankRange,
    setTempDevices,
    resetFilters,
  } = useFilterStore();

  // Handle category toggle
  const handleCategoryToggle = useCallback(
    (category: string) => {
      const current = tempFilters.categories;
      if (current.includes(category)) {
        setTempCategories(current.filter((c) => c !== category));
      } else {
        setTempCategories([...current, category]);
      }
    },
    [tempFilters.categories, setTempCategories]
  );

  // Handle device toggle
  const handleDeviceToggle = useCallback(
    (device: string) => {
      const current = tempFilters.devices;
      if (current.includes(device)) {
        setTempDevices(current.filter((d) => d !== device));
      } else {
        setTempDevices([...current, device]);
      }
    },
    [tempFilters.devices, setTempDevices]
  );

  // Handle rank range change
  const handleRankMinChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ? parseInt(event.target.value, 10) : null;
      setTempRankRange([value, tempFilters.rankRange[1]]);
    },
    [tempFilters.rankRange, setTempRankRange]
  );

  const handleRankMaxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value ? parseInt(event.target.value, 10) : null;
      setTempRankRange([tempFilters.rankRange[0], value]);
    },
    [tempFilters.rankRange, setTempRankRange]
  );

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    onClose(true);
  }, [onClose]);

  // Handle just browsing
  const handleJustBrowsing = useCallback(() => {
    onClose(false);
  }, [onClose]);

  // Handle reset
  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleJustBrowsing}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <motion.aside
            className={styles.sidebar}
            role="dialog"
            aria-modal="true"
            aria-labelledby="explorer-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Header */}
            <header className={styles.header}>
              <h2 id="explorer-title" className={styles.title}>
                Filter Cards
              </h2>
              <button
                type="button"
                className={styles.closeButton}
                onClick={handleJustBrowsing}
                aria-label="Close explorer"
              >
                <CloseIcon />
              </button>
            </header>

            {/* Filter content */}
            <div className={styles.content}>
              {/* Categories */}
              {categories.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Categories</h3>
                  <div className={styles.checkboxList}>
                    {categories.map((category) => (
                      <label key={category} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={tempFilters.categories.includes(category)}
                          onChange={() => {
                            handleCategoryToggle(category);
                          }}
                        />
                        <span className={styles.checkboxLabel}>{category}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* Devices */}
              {devices.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Devices</h3>
                  <div className={styles.checkboxList}>
                    {devices.map((device) => (
                      <label key={device} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={tempFilters.devices.includes(device)}
                          onChange={() => {
                            handleDeviceToggle(device);
                          }}
                        />
                        <span className={styles.checkboxLabel}>{device}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* Rank Range */}
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Rank Range</h3>
                <div className={styles.rangeInputs}>
                  <input
                    type="number"
                    className={styles.rangeInput}
                    placeholder="Min"
                    min={1}
                    value={tempFilters.rankRange[0] ?? ""}
                    onChange={handleRankMinChange}
                    aria-label="Minimum rank"
                  />
                  <span className={styles.rangeSeparator}>to</span>
                  <input
                    type="number"
                    className={styles.rangeInput}
                    placeholder="Max"
                    min={1}
                    value={tempFilters.rankRange[1] ?? ""}
                    onChange={handleRankMaxChange}
                    aria-label="Maximum rank"
                  />
                </div>
              </section>

              {/* Reset button */}
              <button
                type="button"
                className={styles.resetButton}
                onClick={handleReset}
              >
                Reset All Filters
              </button>
            </div>

            {/* Footer actions */}
            <footer className={styles.footer}>
              <button
                type="button"
                className={styles.browsingButton}
                onClick={handleJustBrowsing}
              >
                Just Browsing
              </button>
              <button
                type="button"
                className={styles.applyButton}
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default ExplorerSidebar;
