/**
 * Entity edits store.
 *
 * Manages local edits to entity data using an overlay pattern.
 * Edits are stored separately from source data and merged at render time.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * A single entity's edits.
 */
export interface EntityEdit {
  /** Fields that have been modified */
  fields: Record<string, unknown>;
  /** Timestamp of last edit */
  editedAt: number;
}

/**
 * Exported edits format for import/export.
 */
export interface ExportedEdits {
  /** Export format version */
  version: 1;
  /** ISO timestamp of export */
  exportedAt: string;
  /** ID of the source collection */
  collectionId: string;
  /** Number of entities with edits */
  editCount: number;
  /** The actual edits */
  edits: Record<string, EntityEdit>;
}

/**
 * Edits store state interface.
 */
interface EditsState {
  /** Map of entity ID to edits */
  edits: Record<string, EntityEdit>;

  // Actions
  /** Set a single field value for an entity */
  setField: (entityId: string, field: string, value: unknown) => void;
  /** Set multiple field values for an entity */
  setFields: (entityId: string, fields: Record<string, unknown>) => void;
  /** Revert a single field for an entity */
  revertField: (entityId: string, field: string) => void;
  /** Revert all edits for an entity */
  revertEntity: (entityId: string) => void;
  /** Revert all edits for all entities */
  revertAll: () => void;

  // Selectors
  /** Get edits for a specific entity */
  getEdit: (entityId: string) => EntityEdit | undefined;
  /** Check if an entity has any edits */
  hasEdits: (entityId: string) => boolean;
  /** Get all entity IDs that have edits */
  getEditedEntityIds: () => string[];
  /** Get total count of edited entities */
  getTotalEditCount: () => number;

  // Export/Import
  /** Export all edits for backup */
  exportEdits: (collectionId: string) => ExportedEdits;
  /** Import edits from backup */
  importEdits: (data: ExportedEdits, mode: "merge" | "replace") => void;
}

/**
 * Entity edits store with persistence.
 *
 * Uses overlay pattern: edits are stored separately and merged at render time.
 */
export const useEditsStore = create<EditsState>()(
  persist(
    (set, get) => ({
      edits: {},

      setField: (entityId, field, value) => {
        set((state) => {
          const existingEdit = state.edits[entityId];
          return {
            edits: {
              ...state.edits,
              [entityId]: {
                fields: {
                  ...(existingEdit?.fields ?? {}),
                  [field]: value,
                },
                editedAt: Date.now(),
              },
            },
          };
        });
      },

      setFields: (entityId, fields) => {
        set((state) => {
          const existingEdit = state.edits[entityId];
          return {
            edits: {
              ...state.edits,
              [entityId]: {
                fields: {
                  ...(existingEdit?.fields ?? {}),
                  ...fields,
                },
                editedAt: Date.now(),
              },
            },
          };
        });
      },

      revertField: (entityId, field) => {
        set((state) => {
          const existingEdit = state.edits[entityId];
          if (!existingEdit) return state;

          const { [field]: _, ...remainingFields } = existingEdit.fields;

          // If no fields remain, remove the entity entry entirely
          if (Object.keys(remainingFields).length === 0) {
            const { [entityId]: __, ...remainingEdits } = state.edits;
            return { edits: remainingEdits };
          }

          return {
            edits: {
              ...state.edits,
              [entityId]: {
                fields: remainingFields,
                editedAt: existingEdit.editedAt,
              },
            },
          };
        });
      },

      revertEntity: (entityId) => {
        set((state) => {
          const { [entityId]: _, ...remainingEdits } = state.edits;
          return { edits: remainingEdits };
        });
      },

      revertAll: () => {
        set({ edits: {} });
      },

      getEdit: (entityId) => {
        return get().edits[entityId];
      },

      hasEdits: (entityId) => {
        return entityId in get().edits;
      },

      getEditedEntityIds: () => {
        return Object.keys(get().edits);
      },

      getTotalEditCount: () => {
        return Object.keys(get().edits).length;
      },

      exportEdits: (collectionId) => {
        const edits = get().edits;
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          collectionId,
          editCount: Object.keys(edits).length,
          edits,
        };
      },

      importEdits: (data, mode) => {
        set((state) => {
          if (mode === "replace") {
            return { edits: data.edits };
          }

          // Merge mode: existing edits take priority for conflicts
          const merged: Record<string, EntityEdit> = { ...data.edits };

          for (const [entityId, existingEdit] of Object.entries(state.edits)) {
            const importedEdit = merged[entityId];
            if (importedEdit) {
              // Merge fields, keeping existing values for conflicts
              merged[entityId] = {
                fields: {
                  ...importedEdit.fields,
                  ...existingEdit.fields,
                },
                editedAt: Math.max(existingEdit.editedAt, importedEdit.editedAt),
              };
            } else {
              merged[entityId] = existingEdit;
            }
          }

          return { edits: merged };
        });
      },
    }),
    {
      name: "itemdeck-edits",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useEditsStore;
