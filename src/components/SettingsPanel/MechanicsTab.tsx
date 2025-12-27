/**
 * MechanicsTab component for selecting and managing game mechanics.
 */

import { useState, useEffect, useCallback } from "react";
import { mechanicRegistry } from "@/mechanics";
import { useSettingsStore } from "@/stores/settingsStore";
import type { MechanicManifest } from "@/mechanics";
import styles from "./SettingsPanel.module.css";

/**
 * Mechanics settings tab.
 */
export function MechanicsTab() {
  const [mechanics, setMechanics] = useState<MechanicManifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeMechanicId = useSettingsStore((s) => s.activeMechanicId);
  const setActiveMechanicId = useSettingsStore((s) => s.setActiveMechanicId);

  // Load all mechanics on mount
  useEffect(() => {
    const loadMechanics = async () => {
      try {
        setIsLoading(true);
        const loaded = await mechanicRegistry.loadAll();
        setMechanics(loaded.map((m) => m.manifest));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mechanics");
      } finally {
        setIsLoading(false);
      }
    };

    void loadMechanics();
  }, []);

  const handleSelect = useCallback(
    async (mechanicId: string | null) => {
      if (mechanicId === null) {
        // Deactivate current mechanic
        mechanicRegistry.deactivate();
        setActiveMechanicId(null);
      } else {
        try {
          await mechanicRegistry.activate(mechanicId);
          setActiveMechanicId(mechanicId);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to activate mechanic");
        }
      }
    },
    [setActiveMechanicId]
  );

  if (isLoading) {
    return (
      <div className={styles.row}>
        <span className={styles.label}>Loading mechanics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.row}>
        <span className={styles.formError}>{error}</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.helpText}>
        Select a game mechanic to add interactive gameplay to your collection.
      </div>

      {/* None option */}
      <div className={styles.row}>
        <label className={styles.radioLabel}>
          <input
            type="radio"
            name="mechanic"
            checked={activeMechanicId === null}
            onChange={() => { void handleSelect(null); }}
            className={styles.radio}
          />
          <div className={styles.radioContent}>
            <span className={styles.radioTitle}>None</span>
            <span className={styles.radioDescription}>
              Browse your collection without any game mechanics
            </span>
          </div>
        </label>
      </div>

      <div className={styles.divider} />

      {/* Mechanic options */}
      {mechanics.map((manifest) => {
        const Icon = manifest.icon;
        const isActive = activeMechanicId === manifest.id;

        return (
          <div key={manifest.id} className={styles.row}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="mechanic"
                checked={isActive}
                onChange={() => { void handleSelect(manifest.id); }}
                className={styles.radio}
              />
              <div className={styles.radioContent}>
                <div className={styles.radioHeader}>
                  <span className={styles.mechanicIcon}>
                    <Icon />
                  </span>
                  <span className={styles.radioTitle}>{manifest.name}</span>
                  <span className={styles.mechanicVersion}>v{manifest.version}</span>
                </div>
                <span className={styles.radioDescription}>
                  {manifest.description}
                </span>
                {manifest.minCards && (
                  <span className={styles.mechanicRequirement}>
                    Requires at least {manifest.minCards} cards
                  </span>
                )}
              </div>
            </label>
          </div>
        );
      })}

      {mechanics.length === 0 && (
        <div className={styles.helpText}>
          No mechanics available. Check back later!
        </div>
      )}
    </>
  );
}

export default MechanicsTab;
