/**
 * MechanicPanel - Dedicated panel for game mechanics selection and control.
 * Separate from Settings to emphasise that mechanics change the app's behaviour.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { mechanicRegistry, useMechanicContext } from "@/mechanics";
import {
  useMemoryStore,
  DIFFICULTY_SETTINGS,
  PAIR_COUNT_OPTIONS,
  type MemoryDifficulty,
  type PairCount,
} from "@/mechanics/memory/store";
import { useSettingsStore } from "@/stores/settingsStore";
import type { MechanicManifest } from "@/mechanics";
import styles from "./MechanicPanel.module.css";

interface MechanicPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Game controller icon for the mechanic button.
 */
function GameControllerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="18" cy="10" r="1" />
      <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
    </svg>
  );
}

/**
 * Close icon.
 */
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * MechanicPanel component.
 */
export function MechanicPanel({ isOpen, onClose }: MechanicPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [mechanics, setMechanics] = useState<MechanicManifest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeMechanicId = useSettingsStore((s) => s.activeMechanicId);
  const { activateMechanic, deactivateMechanic } = useMechanicContext();

  // Memory game settings
  const memoryDifficulty = useMemoryStore((s) => s.difficulty);
  const memoryPairCount = useMemoryStore((s) => s.pairCount);
  const setMemoryDifficulty = useMemoryStore((s) => s.setDifficulty);
  const setMemoryPairCount = useMemoryStore((s) => s.setPairCount);
  const resetMemoryGame = useMemoryStore((s) => s.resetGame);

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

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [isOpen, onClose]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate close on button click
    const timeoutId = setTimeout(() => {
      window.addEventListener("click", handleClickOutside);
    }, 0) as unknown as number;

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    async (mechanicId: string | null) => {
      if (mechanicId === null) {
        deactivateMechanic();
      } else {
        try {
          await activateMechanic(mechanicId);
          // Close panel immediately when a mechanic is selected
          onClose();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to activate mechanic");
        }
      }
    },
    [activateMechanic, deactivateMechanic, onClose]
  );

  // Handle difficulty change - reset game with new settings
  const handleDifficultyChange = useCallback((difficulty: MemoryDifficulty) => {
    setMemoryDifficulty(difficulty);
    resetMemoryGame();
  }, [setMemoryDifficulty, resetMemoryGame]);

  // Handle pair count change - reset game with new settings
  const handlePairCountChange = useCallback((count: PairCount) => {
    setMemoryPairCount(count);
    resetMemoryGame();
  }, [setMemoryPairCount, resetMemoryGame]);

  if (!isOpen) return null;

  const activeMechanic = mechanics.find((m) => m.id === activeMechanicId);

  return createPortal(
    <div className={styles.overlay}>
      <div ref={panelRef} className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <GameControllerIcon />
          </div>
          <h2 className={styles.title}>Game Mechanics</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close mechanics panel"
          >
            <CloseIcon />
          </button>
        </header>

        <div className={styles.content}>
          {isLoading && (
            <div className={styles.status}>Loading mechanics...</div>
          )}

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {!isLoading && !error && (
            <>
              {activeMechanic && (
                <div className={styles.activeSection}>
                  <div className={styles.activeBadge}>ACTIVE</div>
                  <div className={styles.activeMechanic}>
                    <span className={styles.activeIcon}>
                      <activeMechanic.icon />
                    </span>
                    <div className={styles.activeInfo}>
                      <span className={styles.activeName}>{activeMechanic.name}</span>
                      <span className={styles.activeDescription}>{activeMechanic.description}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.stopButton}
                      onClick={() => { void handleSelect(null); }}
                    >
                      Stop
                    </button>
                  </div>

                  {/* Memory game settings */}
                  {activeMechanicId === "memory" && (
                    <div className={styles.gameSettings}>
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>Difficulty</span>
                        <div className={styles.segmentedControl}>
                          {(Object.entries(DIFFICULTY_SETTINGS) as [MemoryDifficulty, { label: string; flipDelay: number }][]).map(([key, { label }]) => (
                            <button
                              key={key}
                              type="button"
                              className={[
                                styles.segmentButton,
                                memoryDifficulty === key ? styles.segmentButtonActive : "",
                              ].filter(Boolean).join(" ")}
                              onClick={() => { handleDifficultyChange(key); }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>Pairs</span>
                        <div className={styles.segmentedControl}>
                          {PAIR_COUNT_OPTIONS.map((count) => (
                            <button
                              key={count}
                              type="button"
                              className={[
                                styles.segmentButton,
                                memoryPairCount === count ? styles.segmentButtonActive : "",
                              ].filter(Boolean).join(" ")}
                              onClick={() => { handlePairCountChange(count); }}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.helpText}>
                {activeMechanic
                  ? "Select a different mechanic or stop the current one."
                  : "Select a game mechanic to add interactive gameplay to your collection."}
              </div>

              {/* None option - only show when a mechanic is active */}
              {activeMechanic && (
                <button
                  type="button"
                  className={[styles.mechanicOption, !activeMechanicId ? styles.mechanicOptionActive : ""].filter(Boolean).join(" ")}
                  onClick={() => { void handleSelect(null); }}
                >
                  <div className={styles.mechanicIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  </div>
                  <div className={styles.mechanicInfo}>
                    <span className={styles.mechanicName}>None</span>
                    <span className={styles.mechanicDescription}>
                      Browse your collection without any game mechanics
                    </span>
                  </div>
                </button>
              )}

              {/* Mechanic options */}
              {mechanics.map((manifest) => {
                const Icon = manifest.icon;
                const isActive = activeMechanicId === manifest.id;

                return (
                  <button
                    key={manifest.id}
                    type="button"
                    className={[styles.mechanicOption, isActive ? styles.mechanicOptionActive : ""].filter(Boolean).join(" ")}
                    onClick={() => { void handleSelect(manifest.id); }}
                    disabled={isActive}
                  >
                    <div className={styles.mechanicIcon}>
                      <Icon />
                    </div>
                    <div className={styles.mechanicInfo}>
                      <div className={styles.mechanicHeader}>
                        <span className={styles.mechanicName}>{manifest.name}</span>
                        <span className={styles.mechanicVersion}>v{manifest.version}</span>
                      </div>
                      <span className={styles.mechanicDescription}>
                        {manifest.description}
                      </span>
                      {manifest.minCards && (
                        <span className={styles.mechanicRequirement}>
                          Requires at least {manifest.minCards} cards
                        </span>
                      )}
                    </div>
                    {isActive && <span className={styles.activeMark}>✓</span>}
                  </button>
                );
              })}

              {mechanics.length === 0 && (
                <div className={styles.status}>
                  No mechanics available. Check back later!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MechanicPanel;
