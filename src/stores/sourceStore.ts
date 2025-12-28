/**
 * Source management store using Zustand with persistence.
 *
 * Manages user-configured data sources including URLs, active source,
 * and default source selection.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isMyPlausibleMeUrl } from "@/config/dataSource";

/**
 * Storage key for sources.
 */
const STORAGE_KEY = "itemdeck-sources";

/**
 * Current store version for migrations.
 */
const STORE_VERSION = 2;

/**
 * Source type indicating how the source was added.
 */
export type SourceType = "local" | "myplausibleme" | "legacy";

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
  /** Source type (local, myplausibleme, or legacy) */
  sourceType?: SourceType;
  /** MyPlausibleMe username (if sourceType is myplausibleme) */
  mpmUsername?: string;
  /** MyPlausibleMe folder (if sourceType is myplausibleme) */
  mpmFolder?: string;
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
  /** Add a new source (legacy - use addMyPlausibleMeSource for new sources) */
  addSource: (url: string, name?: string) => string;
  /** Add a MyPlausibleMe source */
  addMyPlausibleMeSource: (username: string, folder: string, name?: string) => string;
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
 * Built-in MyPlausibleMe sources.
 */
const RETRO_GAMES_SOURCE: Source = {
  id: "reppl-retro-games",
  url: "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-games",
  name: "Retro Games",
  addedAt: new Date(0),
  isBuiltIn: true,
  sourceType: "myplausibleme",
  mpmUsername: "REPPL",
  mpmFolder: "retro-games",
};

const RETRO_ADVERTS_SOURCE: Source = {
  id: "reppl-retro-adverts",
  url: "https://cdn.jsdelivr.net/gh/REPPL/MyPlausibleMe@main/data/collections/retro-adverts",
  name: "Retro Adverts",
  addedAt: new Date(0),
  isBuiltIn: true,
  sourceType: "myplausibleme",
  mpmUsername: "REPPL",
  mpmFolder: "retro-adverts",
};

/**
 * All built-in sources.
 */
const BUILT_IN_SOURCES: Source[] = [RETRO_GAMES_SOURCE, RETRO_ADVERTS_SOURCE];

/**
 * Source management store.
 */
export const useSourceStore = create<SourceState>()(
  persist(
    (set, get) => ({
      sources: BUILT_IN_SOURCES,
      activeSourceId: "reppl-retro-games",
      defaultSourceId: "reppl-retro-games",

      addSource: (url: string, name?: string) => {
        const id = generateId();
        const normalizedUrl = url.endsWith("/") ? url.slice(0, -1) : url;

        // Determine source type based on URL format
        const sourceType: SourceType = isMyPlausibleMeUrl(normalizedUrl)
          ? "myplausibleme"
          : "legacy";

        const newSource: Source = {
          id,
          url: normalizedUrl,
          name,
          addedAt: new Date(),
          sourceType,
        };

        set((state) => ({
          sources: [...state.sources, newSource],
        }));

        return id;
      },

      addMyPlausibleMeSource: (username: string, folder: string, name?: string) => {
        const id = generateId();
        const url = `https://cdn.jsdelivr.net/gh/${username}/MyPlausibleMe@main/data/collections/${folder}`;

        const newSource: Source = {
          id,
          url,
          name: name ?? `${username}/${folder}`,
          addedAt: new Date(),
          sourceType: "myplausibleme",
          mpmUsername: username,
          mpmFolder: folder,
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

        // Start with persisted sources
        let sources = persistedState.sources ?? current.sources;

        // Ensure all built-in sources exist
        for (const builtIn of BUILT_IN_SOURCES) {
          if (!sources.find((s) => s.id === builtIn.id)) {
            sources = [builtIn, ...sources];
          }
        }

        // Remove old local source if present (migrated to MyPlausibleMe)
        sources = sources.filter((s) => s.id !== "local");

        // Ensure date objects are properly hydrated
        sources = sources.map((s) => ({
          ...s,
          addedAt: new Date(s.addedAt),
          lastHealthCheck: s.lastHealthCheck
            ? new Date(s.lastHealthCheck)
            : undefined,
        }));

        // Validate active/default source IDs exist
        let activeSourceId = persistedState.activeSourceId ?? current.activeSourceId;
        let defaultSourceId = persistedState.defaultSourceId ?? current.defaultSourceId;

        // If active source doesn't exist, fall back to first built-in
        const firstBuiltIn = BUILT_IN_SOURCES[0];
        if (!sources.find((s) => s.id === activeSourceId) && firstBuiltIn) {
          activeSourceId = firstBuiltIn.id;
        }
        if (!sources.find((s) => s.id === defaultSourceId) && firstBuiltIn) {
          defaultSourceId = firstBuiltIn.id;
        }

        return {
          ...current,
          sources,
          activeSourceId,
          defaultSourceId,
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
    const fallbackUrl = BUILT_IN_SOURCES[0]?.url ?? "";
    return activeSource?.url ?? fallbackUrl;
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
