/**
 * Mechanic context provider.
 *
 * Provides React context for accessing the active mechanic
 * and its state throughout the component tree.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { mechanicRegistry } from "./registry";
import type { Mechanic, MechanicState, CardActions } from "./types";

/**
 * Context value type.
 */
interface MechanicContextValue {
  /** Currently active mechanic (null if none) */
  mechanic: Mechanic | null;
  /** Current mechanic state */
  state: MechanicState | null;
  /** Activate a mechanic by ID */
  activateMechanic: (id: string) => Promise<void>;
  /** Deactivate the current mechanic */
  deactivateMechanic: () => void;
  /** Reset the current mechanic */
  resetMechanic: () => void;
  /** Whether a mechanic is being loaded */
  isLoading: boolean;
  /** Error message if activation failed */
  error: string | null;
  /** List of available mechanic IDs */
  availableIds: string[];
  /** Open the mechanic selection panel */
  openMechanicPanel: () => void;
}

interface MechanicProviderProps {
  children: ReactNode;
  /** Callback to open the mechanic selection panel */
  onOpenMechanicPanel?: () => void;
}

const MechanicContext = createContext<MechanicContextValue | null>(null);

/**
 * Mechanic context provider component.
 */
export function MechanicProvider({ children, onOpenMechanicPanel }: MechanicProviderProps) {
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [state, setState] = useState<MechanicState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableIds, setAvailableIds] = useState<string[]>([]);

  const activeMechanicId = useSettingsStore((s) => s.activeMechanicId);
  const setActiveMechanicId = useSettingsStore((s) => s.setActiveMechanicId);

  // Update available IDs when registry changes
  useEffect(() => {
    const updateIds = () => {
      setAvailableIds(mechanicRegistry.getIds());
    };

    updateIds();
    return mechanicRegistry.subscribe(updateIds);
  }, []);

  // Subscribe to mechanic state changes
  useEffect(() => {
    if (!mechanic) {
      setState(null);
      return;
    }

    // Get initial state
    setState(mechanic.getState());

    // Subscribe to state updates
    return mechanic.subscribe((newState) => {
      setState(newState);
    });
  }, [mechanic]);

  // Sync with settings store - only handle deactivation
  // Activation is handled explicitly by activateMechanic()
  // We don't auto-activate from persisted state to prevent stale game state
  useEffect(() => {
    if (!activeMechanicId && mechanic) {
      // Deactivate mechanic
      mechanicRegistry.deactivate();
      setMechanic(null);
    }
  }, [activeMechanicId, mechanic]);

  // Clear any stale activeMechanicId from localStorage on mount
  useEffect(() => {
    if (activeMechanicId && !mechanic) {
      // Clear stale persisted mechanic ID - games should start fresh
      setActiveMechanicId(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const activateMechanic = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const activated = await mechanicRegistry.activate(id);
        setMechanic(activated);
        setActiveMechanicId(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to activate mechanic");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [setActiveMechanicId]
  );

  const deactivateMechanic = useCallback(() => {
    mechanicRegistry.deactivate();
    setMechanic(null);
    setActiveMechanicId(null);
    setError(null);
  }, [setActiveMechanicId]);

  const resetMechanic = useCallback(() => {
    mechanicRegistry.reset();
  }, []);

  const openMechanicPanel = useCallback(() => {
    onOpenMechanicPanel?.();
  }, [onOpenMechanicPanel]);

  const value = useMemo<MechanicContextValue>(
    () => ({
      mechanic,
      state,
      activateMechanic,
      deactivateMechanic,
      resetMechanic,
      isLoading,
      error,
      availableIds,
      openMechanicPanel,
    }),
    [
      mechanic,
      state,
      activateMechanic,
      deactivateMechanic,
      resetMechanic,
      isLoading,
      error,
      availableIds,
      openMechanicPanel,
    ]
  );

  return (
    <MechanicContext.Provider value={value}>
      {children}
    </MechanicContext.Provider>
  );
}

/**
 * Hook to access the mechanic context.
 */
export function useMechanicContext(): MechanicContextValue {
  const context = useContext(MechanicContext);
  if (!context) {
    throw new Error("useMechanicContext must be used within a MechanicProvider");
  }
  return context;
}

/**
 * Hook to get the active mechanic.
 */
export function useActiveMechanic(): Mechanic | null {
  const { mechanic } = useMechanicContext();
  return mechanic;
}

/**
 * Hook to get the current mechanic state.
 */
export function useMechanicState(): MechanicState | null {
  const { state } = useMechanicContext();
  return state;
}

/**
 * Hook to get card actions from the active mechanic.
 */
export function useMechanicCardActions(): CardActions | null {
  const { mechanic } = useMechanicContext();
  return mechanic?.getCardActions() ?? null;
}

/**
 * Hook to get the list of available mechanic IDs.
 */
export function useMechanicList(): string[] {
  const { availableIds } = useMechanicContext();
  return availableIds;
}
