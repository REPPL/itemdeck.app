/**
 * Simple toast notification component.
 *
 * Shows a brief message that auto-dismisses.
 * Used for quick feedback after actions like reset.
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Toast.module.css";

interface ToastProps {
  /** Message to display */
  message: string;

  /** Whether toast is visible */
  visible: boolean;

  /** Callback when toast should hide */
  onHide: () => void;

  /** Auto-dismiss duration in ms (default: 2000) */
  duration?: number;

  /** Toast type for styling */
  type?: "info" | "success" | "warning";
}

/**
 * Toast notification that slides in from bottom.
 */
export function Toast({
  message,
  visible,
  onHide,
  duration = 2000,
  type = "info",
}: ToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    if (!visible) return undefined;

    const timer = setTimeout(() => {
      onHide();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [visible, duration, onHide]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`${styles.toast} ${styles[type]}`}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="status"
          aria-live="polite"
          onClick={onHide}
        >
          <span className={styles.message}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
