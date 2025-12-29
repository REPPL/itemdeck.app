/**
 * Collection picker component.
 *
 * Displays available collections from MyPlausibleMe repositories,
 * allowing users to select which collection to view.
 *
 * @see F-087: Collection Discovery & Startup Picker
 * @see F-109: Launch Screen with Logo
 * @see F-112: MyPlausibleMe Example Loading
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMyPlausibleMeDiscovery, type CollectionEntry } from "@/hooks/useMyPlausibleMeDiscovery";
import { useSourceStore } from "@/stores/sourceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  isDevelopmentMode,
  getAvailableExamples,
  buildExampleCollectionUrl,
  type ExampleCollection,
} from "@/config/devSources";
import appLogo from "@/assets/img/logo.png";
import styles from "./CollectionPicker.module.css";

/**
 * Props for CollectionPicker.
 */
interface CollectionPickerProps {
  /** Called when a collection is selected and added */
  onSelect: (sourceId: string) => void;
  /** Initial username to prefill (from URL) */
  initialUsername?: string;
}

/**
 * Default username for discovery.
 */
const DEFAULT_USERNAME = "REPPL";

/**
 * Collection picker for startup flow.
 */
export function CollectionPicker({ onSelect, initialUsername }: CollectionPickerProps) {
  const startUsername = initialUsername ?? DEFAULT_USERNAME;
  const [username, setUsername] = useState(startUsername);
  const [inputValue, setInputValue] = useState(startUsername);
  const [showExamples, setShowExamples] = useState(false);

  const { collections, isLoading, error, refresh } = useMyPlausibleMeDiscovery(username);
  const addMyPlausibleMeSource = useSourceStore((s) => s.addMyPlausibleMeSource);
  const addSourceFromUrl = useSourceStore((s) => s.addSourceFromUrl);
  const setActiveSource = useSourceStore((s) => s.setActiveSource);
  const visualTheme = useSettingsStore((s) => s.visualTheme);

  // Get dev examples (F-112)
  const devExamples = useMemo(() => getAvailableExamples(), []);
  const isDevMode = isDevelopmentMode();

  const handleUsernameSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && inputValue.trim() !== username) {
      setUsername(inputValue.trim());
    }
  }, [inputValue, username]);

  const handleCollectionSelect = useCallback((collection: CollectionEntry) => {
    // Add the source and set it as active
    const sourceId = addMyPlausibleMeSource(
      username,
      collection.folder,
      collection.name
    );
    setActiveSource(sourceId);
    onSelect(sourceId);
  }, [username, addMyPlausibleMeSource, setActiveSource, onSelect]);

  // Handle example collection selection (F-112)
  const handleExampleSelect = useCallback((example: ExampleCollection) => {
    const url = buildExampleCollectionUrl(example.folder);
    const sourceId = addSourceFromUrl(url, "gh", "REPPL", `examples/${example.folder}`);
    setActiveSource(sourceId);
    onSelect(sourceId);
  }, [addSourceFromUrl, setActiveSource, onSelect]);

  const containerClass = [
    styles.container,
    styles[visualTheme as keyof typeof styles]
  ].filter(Boolean).join(" ");

  return (
    <div className={containerClass}>
      <motion.div
        className={styles.picker}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* App logo */}
        <img
          src={appLogo}
          alt="itemdeck logo"
          className={styles.logo}
          draggable="false"
        />
        <h1 className={styles.title}>itemdeck</h1>
        <p className={styles.subtitle}>Select a collection to view</p>

        {/* Username input */}
        <form className={styles.usernameForm} onSubmit={handleUsernameSubmit}>
          <label className={styles.usernameLabel}>
            GitHub Username
            <div className={styles.usernameInputGroup}>
              <input
                type="text"
                className={styles.usernameInput}
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); }}
                placeholder="Enter GitHub username"
              />
              <button
                type="submit"
                className={styles.usernameButton}
                disabled={!inputValue.trim() || inputValue.trim() === username}
              >
                Scan
              </button>
            </div>
          </label>
        </form>

        {/* Loading state */}
        {isLoading && (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            <span>Scanning repository...</span>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className={styles.error}>
            <p>{error}</p>
            <button
              className={styles.retryButton}
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        )}

        {/* Collections list */}
        {!isLoading && !error && collections.length > 0 && (
          <div className={styles.collectionsContainer}>
            <AnimatePresence>
              {collections.map((collection, index) => (
                <motion.button
                  key={collection.folder}
                  className={styles.collectionCard}
                  onClick={() => { handleCollectionSelect(collection); }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className={styles.collectionHeader}>
                    <span className={styles.collectionName}>{collection.name}</span>
                    {collection.isCached && (
                      <span className={styles.cachedBadge} title="Available offline">
                        Cached
                      </span>
                    )}
                  </span>
                  {collection.description && (
                    <span className={styles.collectionDescription}>
                      {collection.description}
                    </span>
                  )}
                  {collection.itemCount !== undefined && (
                    <span className={styles.collectionItemCount}>
                      {collection.itemCount} items
                    </span>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty state - no collections found (F-107) */}
        {!isLoading && !error && collections.length === 0 && (
          <motion.div
            className={styles.emptyState}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.emptyStateIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className={styles.emptyStateTitle}>No collections found</h2>
            <p className={styles.emptyStateMessage}>
              We couldn&apos;t find any collections for <strong>@{username}</strong>.
              Try a different username or check that the repository has valid collections.
            </p>
            <div className={styles.emptyStateActions}>
              <button
                type="button"
                className={styles.emptyStateButton}
                onClick={() => {
                  setInputValue("");
                  // Focus the username input after a short delay
                  setTimeout(() => {
                    const usernameInputClass = styles.usernameInput ?? "";
                    const input = document.querySelector<HTMLInputElement>(`.${usernameInputClass}`);
                    input?.focus();
                    input?.select();
                  }, 100);
                }}
              >
                Try another username
              </button>
            </div>
          </motion.div>
        )}

        {/* Dev examples toggle (F-112) - only in development mode */}
        {isDevMode && devExamples.length > 0 && (
          <div className={styles.devExamplesSection}>
            <button
              type="button"
              className={styles.devExamplesToggle}
              onClick={() => { setShowExamples(!showExamples); }}
            >
              <span className={styles.devBadge}>DEV</span>
              <span>{showExamples ? "Hide" : "Load"} Example Collections</span>
              <svg
                className={[styles.devExamplesChevron, showExamples ? styles.chevronOpen : ""].filter(Boolean).join(" ")}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <AnimatePresence>
              {showExamples && (
                <motion.div
                  className={styles.devExamplesList}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {devExamples.map((example, index) => (
                    <motion.button
                      key={example.folder}
                      className={styles.devExampleCard}
                      onClick={() => { handleExampleSelect(example); }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={styles.devExampleName}>{example.name}</span>
                      <span className={styles.devExampleDescription}>{example.description}</span>
                      {example.itemCount !== undefined && (
                        <span className={styles.devExampleCount}>~{example.itemCount} items</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

      </motion.div>
    </div>
  );
}

export default CollectionPicker;
