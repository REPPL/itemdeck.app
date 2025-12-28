/**
 * Collection picker component.
 *
 * Displays available collections from MyPlausibleMe repositories,
 * allowing users to select which collection to view.
 *
 * @see F-087: Collection Discovery & Startup Picker
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMyPlausibleMeDiscovery, type CollectionEntry } from "@/hooks/useMyPlausibleMeDiscovery";
import { useSourceStore } from "@/stores/sourceStore";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./CollectionPicker.module.css";

/**
 * Props for CollectionPicker.
 */
interface CollectionPickerProps {
  /** Called when a collection is selected and added */
  onSelect: (sourceId: string) => void;
  /** Called when user dismisses the picker without selecting */
  onDismiss?: () => void;
}

/**
 * Default username for discovery.
 */
const DEFAULT_USERNAME = "REPPL";

/**
 * Collection picker for startup flow.
 */
export function CollectionPicker({ onSelect, onDismiss }: CollectionPickerProps) {
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [inputValue, setInputValue] = useState(DEFAULT_USERNAME);

  const { collections, isLoading, error, refresh } = useMyPlausibleMeDiscovery(username);
  const addMyPlausibleMeSource = useSourceStore((s) => s.addMyPlausibleMeSource);
  const setActiveSource = useSourceStore((s) => s.setActiveSource);
  const visualTheme = useSettingsStore((s) => s.visualTheme);

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
                  <span className={styles.collectionName}>{collection.name}</span>
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

        {/* Skip option */}
        {onDismiss && (
          <button
            className={styles.skipButton}
            onClick={onDismiss}
          >
            Skip for now
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default CollectionPicker;
