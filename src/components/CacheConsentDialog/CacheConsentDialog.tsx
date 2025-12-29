/**
 * Cache consent dialog component.
 *
 * Prompts user for permission to cache external collection data locally.
 * Shows when loading an external collection for the first time.
 *
 * @see F-080: Per-collection cache consent dialog
 */

import { motion, AnimatePresence } from "framer-motion";
import { useSettingsStore } from "@/stores/settingsStore";
import styles from "./CacheConsentDialog.module.css";

/**
 * Props for CacheConsentDialog.
 */
interface CacheConsentDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Source ID for the collection being loaded */
  sourceId: string;
  /** Display name of the collection */
  collectionName: string;
  /** Called when user grants consent */
  onAllow: () => void;
  /** Called when user denies consent */
  onDeny: () => void;
}

/**
 * Cache consent dialog for external collections.
 */
export function CacheConsentDialog({
  isOpen,
  sourceId,
  collectionName,
  onAllow,
  onDeny,
}: CacheConsentDialogProps) {
  const grantCacheConsent = useSettingsStore((s) => s.grantCacheConsent);
  const denyCacheConsent = useSettingsStore((s) => s.denyCacheConsent);
  const setCacheConsentPreference = useSettingsStore((s) => s.setCacheConsentPreference);
  const visualTheme = useSettingsStore((s) => s.visualTheme);

  const handleAlwaysAllow = () => {
    setCacheConsentPreference("always");
    grantCacheConsent(sourceId);
    onAllow();
  };

  const handleAllowOnce = () => {
    grantCacheConsent(sourceId);
    onAllow();
  };

  const handleDeny = () => {
    denyCacheConsent(sourceId);
    onDeny();
  };

  const handleNeverCache = () => {
    setCacheConsentPreference("never");
    denyCacheConsent(sourceId);
    onDeny();
  };

  const containerClass = [
    styles.overlay,
    styles[visualTheme as keyof typeof styles]
  ].filter(Boolean).join(" ");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={containerClass}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={styles.dialog}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className={styles.title}>Cache Collection Data?</h2>

            <p className={styles.description}>
              <strong>{collectionName}</strong> is an external collection.
              Would you like to cache its images and data for faster loading
              and offline access?
            </p>

            <div className={styles.info}>
              <span className={styles.infoIcon}>i</span>
              <span>
                Cached data is stored only in this browser on this device.
                It will not sync to other browsers or devices.
              </span>
            </div>

            <div className={styles.actions}>
              {/* Primary action */}
              <button
                className={styles.primaryButton}
                onClick={handleAllowOnce}
              >
                Allow for this collection
              </button>

              {/* Secondary action - outline style */}
              <button
                className={styles.outlineButton}
                onClick={handleDeny}
              >
                Not now
              </button>

              {/* Global options below divider */}
              <div className={styles.divider} />

              <div className={styles.globalOptions}>
                <button
                  className={styles.textLink}
                  onClick={handleAlwaysAllow}
                >
                  Always allow caching
                </button>
                <span className={styles.optionSeparator}>|</span>
                <button
                  className={styles.textLink}
                  onClick={handleNeverCache}
                >
                  Never cache
                  <span className={styles.hint}> (can change in Settings)</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CacheConsentDialog;
