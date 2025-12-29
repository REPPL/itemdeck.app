/**
 * MechanicPanel - Dedicated panel for game mechanics selection and control.
 * Separate from Settings to emphasise that mechanics change the app's behaviour.
 * ADR-020: Uses mechanic.Settings component instead of direct store imports.
 *
 * v0.13.0: Two-step activation - select mechanic, configure settings, then start.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { mechanicRegistry, useMechanicContext, type Mechanic } from "@/mechanics";
import { useSettingsStore } from "@/stores/settingsStore";
import { useCollectionData } from "@/context/CollectionDataContext";
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
  // Two-step activation: selected mechanic ID (for configuration), separate from active
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic<any> | null>(null);
  // Pending settings before game starts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingSettings, setPendingSettings] = useState<Record<string, any> | null>(null);

  const activeMechanicId = useSettingsStore((s) => s.activeMechanicId);
  const { mechanic: activeMechanicInstance, state: mechanicState, activateMechanic, deactivateMechanic } = useMechanicContext();
  const { cards } = useCollectionData();
  const cardCount = cards.length;

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

  // Handle mechanic selection (first step - show configuration)
  const handlePreSelect = useCallback(
    async (mechanicId: string | null) => {
      if (mechanicId === null) {
        // Deselect / cancel selection
        setSelectedMechanicId(null);
        setSelectedMechanic(null);
        setPendingSettings(null);
        return;
      }

      // If already active, just deselect (no-op)
      if (mechanicId === activeMechanicId) {
        setSelectedMechanicId(null);
        setSelectedMechanic(null);
        setPendingSettings(null);
        return;
      }

      // Load the mechanic to get its settings
      try {
        const mechanic = await mechanicRegistry.load(mechanicId);
        setSelectedMechanicId(mechanicId);
        setSelectedMechanic(mechanic);
        // Initialise pending settings with defaults
        setPendingSettings(mechanic.defaultSettings ?? {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load mechanic");
      }
    },
    [activeMechanicId]
  );

  // Handle starting the game (second step - activate with settings)
  const handleStartGame = useCallback(async () => {
    if (!selectedMechanicId || !selectedMechanic) return;

    try {
      // Apply pending settings before activation
      if (selectedMechanic.setSettings && pendingSettings) {
        selectedMechanic.setSettings(pendingSettings);
      }
      await activateMechanic(selectedMechanicId);
      // Reset selection state
      setSelectedMechanicId(null);
      setSelectedMechanic(null);
      setPendingSettings(null);
      // Close panel after starting
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate mechanic");
    }
  }, [selectedMechanicId, selectedMechanic, pendingSettings, activateMechanic, onClose]);

  // Handle stopping an active game
  const handleStop = useCallback(() => {
    deactivateMechanic();
    setSelectedMechanicId(null);
    setSelectedMechanic(null);
    setPendingSettings(null);
  }, [deactivateMechanic]);

  // Handle pending settings change
  const handlePendingSettingsChange = useCallback((newSettings: Partial<unknown>) => {
    setPendingSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // ADR-020: Get settings from active mechanic via interface
  // Depend on mechanicState to re-render when settings change
  const mechanicSettings = activeMechanicInstance?.getSettings
    ? activeMechanicInstance.getSettings()
    : null;
  // Force dependency on mechanicState for reactivity
  void mechanicState;

  // ADR-020: Handle settings change via mechanic interface
  const handleSettingsChange = useCallback((newSettings: Partial<unknown>) => {
    if (activeMechanicInstance?.setSettings) {
      activeMechanicInstance.setSettings(newSettings);
    }
  }, [activeMechanicInstance]);

  if (!isOpen) return null;

  const activeMechanic = mechanics.find((m) => m.id === activeMechanicId);
  const selectedManifest = mechanics.find((m) => m.id === selectedMechanicId);
  const MechanicSettings = activeMechanicInstance?.Settings;
  const SelectedMechanicSettings = selectedMechanic?.Settings;

  return createPortal(
    <div className={styles.overlay}>
      <div ref={panelRef} className={styles.panel}>
        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <GameControllerIcon />
          </div>
          <h2 className={styles.title}>Games</h2>
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
              {/* Active mechanic display */}
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
                      onClick={handleStop}
                    >
                      Stop
                    </button>
                  </div>

                  {/* ADR-020: Mechanic-provided settings UI */}
                  {MechanicSettings && mechanicSettings !== null && (
                    <div className={styles.gameSettings}>
                      <MechanicSettings
                        settings={mechanicSettings as Record<string, unknown>}
                        onChange={handleSettingsChange}
                        disabled={false}
                        cardCount={cardCount}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Help text - only show when configuring */}
              {selectedManifest && !activeMechanic && (
                <div className={styles.helpText}>
                  Configure your game settings, then click Start Game.
                </div>
              )}

              {/* None option - only show when a mechanic is active */}
              {activeMechanic && (
                <button
                  type="button"
                  className={[styles.mechanicOption, !activeMechanicId ? styles.mechanicOptionActive : ""].filter(Boolean).join(" ")}
                  onClick={handleStop}
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

              {/* Mechanic options - hide active mechanic (already shown in ACTIVE section above) */}
              {mechanics
                .filter((manifest) => manifest.id !== activeMechanicId)
                .map((manifest) => {
                  const Icon = manifest.icon;
                  const minCards = manifest.minCards ?? 1;
                  const isAvailable = cardCount >= minCards;

                  return (
                    <button
                      key={manifest.id}
                      type="button"
                      className={[
                        styles.mechanicOption,
                        !isAvailable ? styles.mechanicOptionDisabled : ""
                      ].filter(Boolean).join(" ")}
                      onClick={() => { if (isAvailable) void handlePreSelect(manifest.id); }}
                      disabled={!isAvailable}
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
                          {isAvailable
                            ? manifest.description
                            : `Requires at least ${String(minCards)} cards to play`}
                        </span>
                      </div>
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

        {/* Configuration overlay - appears on top of the selection panel */}
        {selectedManifest && selectedMechanic && !activeMechanic && (
          <div
            className={styles.configOverlay}
            onClick={(e) => { e.stopPropagation(); }}
          >
            <div className={styles.configPanel}>
              <div className={styles.configHeader}>
                <span className={styles.configIcon}>
                  <selectedManifest.icon />
                </span>
                <div className={styles.configTitleArea}>
                  <h3 className={styles.configTitle}>{selectedManifest.name}</h3>
                  <p className={styles.configSubtitle}>Configure game settings</p>
                </div>
              </div>

              {/* Settings */}
              {SelectedMechanicSettings && pendingSettings && (
                <div className={styles.configSettings}>
                  <SelectedMechanicSettings
                    settings={pendingSettings as Record<string, unknown>}
                    onChange={handlePendingSettingsChange}
                    disabled={false}
                    cardCount={cardCount}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className={styles.configActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={(e) => { e.stopPropagation(); void handlePreSelect(null); }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.startButton}
                  onClick={() => { void handleStartGame(); }}
                >
                  Start Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default MechanicPanel;
