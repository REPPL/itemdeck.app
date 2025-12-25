/**
 * Source management store using Zustand with persistence.
 *
 * Manages user-configured data sources including URLs, active source,
 * and default source selection.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Storage key for sources.
 */
const STORAGE_KEY = "itemdeck-sources";

/**
 * Current store version for migrations.
 */
const STORE_VERSION = 1;

/**
 * Source configuration.
 */
export interface Source {
  /** Unique identifier */
  id: string;
  /** Source URL (base path to collections) */
  url: string;
  /** User-defined name (optional) */
  name?: string;
  /** When source was added */
  addedAt: Date;
  /** Last health check timestamp */
  lastHealthCheck?: Date;
  /** Whether this is a built-in source */
  isBuiltIn?: boolean;
}

/**
 * Source store state.
 */
interface SourceState {
  /** Configured sources */
  sources: Source[];
  /** Currently active source ID */
  activeSourceId: string | null;
  /** Default source ID (used on fresh load) */
  defaultSourceId: string | null;

  // Actions
  /** Add a new source */
  addSource: (url: string, name?: string) => string;
  /** Remove a source by ID */
  removeSource: (id: string) => void;
  /** Update a source */
  updateSource: (id: string, updates: Partial<Pick<Source, "name" | "url">>) => void;
  /** Set active source */
  setActiveSource: (id: string | null) => void;
  /** Set default source */
  setDefaultSource: (id: string | null) => void;
  /** Get active source URL */
  getActiveSourceUrl: () => string | null;
  /** Get source by ID */
  getSource: (id: string) => Source | undefined;
}

/**
 * Generate unique source ID.
 */
function generateId(): string {
  return `src_${String(Date.now())}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Built-in local source.
 */
const LOCAL_SOURCE: Source = {
  id: "local",
  url: "/data",
  name: "Local Collection",
  addedAt: new Date(0),
  isBuiltIn: true,
};

/**
 * Source management store.
 */
export const useSourceStore = create<SourceState>()(
  persist(
    (set, get) => ({
      sources: [LOCAL_SOURCE],
      activeSourceId: "local",
      defaultSourceId: "local",

      addSource: (url: string, name?: string) => {
        const id = generateId();
        const newSource: Source = {
          id,
          url: url.endsWith("/") ? url.slice(0, -1) : url,
          name,
          addedAt: new Date(),
        };

        set((state) => ({
          sources: [...state.sources, newSource],
        }));

        return id;
      },

      removeSource: (id: string) => {
        const source = get().sources.find((s) => s.id === id);

        // Prevent removing built-in sources
        if (source?.isBuiltIn) {
          return;
        }

        set((state) => {
          const newSources = state.sources.filter((s) => s.id !== id);

          // If removing active source, switch to default or first available
          let newActiveId = state.activeSourceId;
          if (state.activeSourceId === id) {
            newActiveId = state.defaultSourceId ?? newSources[0]?.id ?? null;
          }

          // If removing default source, set to first available
          let newDefaultId = state.defaultSourceId;
          if (state.defaultSourceId === id) {
            newDefaultId = newSources[0]?.id ?? null;
          }

          return {
            sources: newSources,
            activeSourceId: newActiveId,
            defaultSourceId: newDefaultId,
          };
        });
      },

      updateSource: (id: string, updates: Partial<Pick<Source, "name" | "url">>) => {
        set((state) => ({
          sources: state.sources.map((s) =>
            s.id === id
              ? {
                  ...s,
                  ...updates,
                  url: updates.url
                    ? updates.url.endsWith("/")
                      ? updates.url.slice(0, -1)
                      : updates.url
                    : s.url,
                }
              : s
          ),
        }));
      },

      setActiveSource: (id: string | null) => {
        set({ activeSourceId: id });
      },

      setDefaultSource: (id: string | null) => {
        set({ defaultSourceId: id });
      },

      getActiveSourceUrl: () => {
        const state = get();
        const activeSource = state.sources.find(
          (s) => s.id === state.activeSourceId
        );
        return activeSource?.url ?? null;
      },

      getSource: (id: string) => {
        return get().sources.find((s) => s.id === id);
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sources: state.sources,
        activeSourceId: state.activeSourceId,
        defaultSourceId: state.defaultSourceId,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<SourceState>;

        // Ensure local source always exists
        let sources = persistedState.sources ?? current.sources;
        if (!sources.find((s) => s.id === "local")) {
          sources = [LOCAL_SOURCE, ...sources];
        }

        // Ensure date objects are properly hydrated
        sources = sources.map((s) => ({
          ...s,
          addedAt: new Date(s.addedAt),
          lastHealthCheck: s.lastHealthCheck
            ? new Date(s.lastHealthCheck)
            : undefined,
        }));

        return {
          ...current,
          sources,
          activeSourceId: persistedState.activeSourceId ?? current.activeSourceId,
          defaultSourceId: persistedState.defaultSourceId ?? current.defaultSourceId,
        };
      },
    }
  )
);

/**
 * Hook to get the current active source URL.
 */
export function useActiveSourceUrl(): string {
  return useSourceStore((state) => {
    const activeSource = state.sources.find(
      (s) => s.id === state.activeSourceId
    );
    return activeSource?.url ?? "/data";
  });
}

/**
 * Hook to get all configured sources.
 */
export function useSources(): Source[] {
  return useSourceStore((state) => state.sources);
}

/**
 * Hook to check if a URL is already configured.
 */
export function useIsSourceConfigured(url: string): boolean {
  return useSourceStore((state) =>
    state.sources.some((s) => s.url === url || s.url === url.replace(/\/$/, ""))
  );
}
