/**
 * Add Source sub-tab for Collections settings.
 *
 * Provides a form to add MyPlausibleMe collections from GitHub.
 */

import { AddMyPlausibleMeForm } from "../AddMyPlausibleMeForm";
import styles from "../SettingsPanel.module.css";

/**
 * Add Source tab component.
 */
export function AddSourceTab() {
  return (
    <>
      <AddMyPlausibleMeForm />

      <div className={styles.divider} />

      <div className={styles.helpText}>
        After adding a collection, you can manage it in Collections &gt; Sources.
      </div>
    </>
  );
}
