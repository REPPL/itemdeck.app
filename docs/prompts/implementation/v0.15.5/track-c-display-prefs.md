# Track C: Mechanic Display Preferences (F-102)

## Features

- F-102: Mechanic Display Preferences

## Implementation Prompt

```
Implement Mechanic Display Preferences for itemdeck.

## Context

The useDisplayConfig hook already exists from v0.14.5. This feature extends the mechanic system to:
1. Declare display preferences in MechanicManifest
2. Automatically apply preferences when mechanic activates
3. Restore original settings when mechanic deactivates
4. Handle page refresh/unload gracefully

## Phase 1: Add TypeScript Interface

Modify src/mechanics/types.ts:

```typescript
/**
 * Display preferences that mechanics can declare.
 * Applied when mechanic activates, restored on deactivation.
 */
export interface MechanicDisplayPreferences {
  /** Preferred card size preset */
  cardSizePreset?: "small" | "medium" | "large";

  /** Preferred card aspect ratio */
  cardAspectRatio?: "3:4" | "5:7" | "1:1";

  /** Hide the main card grid when active (for full-screen games) */
  hideCardGrid?: boolean;

  /** UI mode determining overlay behaviour */
  uiMode?: "overlay" | "fullscreen" | "inline" | "panel";

  /** Maximum visible cards (for performance) */
  maxVisibleCards?: number;

  /** Force landscape orientation hint */
  suggestLandscape?: boolean;
}

// Add to existing MechanicManifest interface:
export interface MechanicManifest {
  // ... existing fields ...

  /** Display preferences applied when mechanic activates */
  displayPreferences?: MechanicDisplayPreferences;
}
```

## Phase 2: Add Settings Store Actions

Modify src/stores/settingsStore.ts:

1. Add backup state to SettingsState interface:
```typescript
// Transient state (not persisted)
_mechanicOverridesBackup: Partial<{
  cardSizePreset: CardSizePreset;
  cardAspectRatio: CardAspectRatio;
  layout: LayoutType;
  maxVisibleCards: number;
}> | null;
mechanicOverridesActive: boolean;
```

2. Add action functions:
```typescript
/**
 * Apply display preferences from active mechanic.
 * Stores current values for restoration.
 */
applyMechanicOverrides: (prefs: MechanicDisplayPreferences) => void;

/**
 * Restore original settings after mechanic deactivation.
 */
restoreMechanicOverrides: () => void;
```

3. Implementation:
```typescript
applyMechanicOverrides: (prefs) => {
  const current = get();

  // Store current values for restoration
  set({
    _mechanicOverridesBackup: {
      cardSizePreset: current.cardSizePreset,
      cardAspectRatio: current.cardAspectRatio,
      layout: current.layout,
      maxVisibleCards: current.maxVisibleCards,
    },
    mechanicOverridesActive: true,
  });

  // Apply preferences
  if (prefs.cardSizePreset) {
    set({ cardSizePreset: prefs.cardSizePreset });
  }
  if (prefs.cardAspectRatio) {
    set({ cardAspectRatio: prefs.cardAspectRatio });
  }
  if (prefs.hideCardGrid) {
    // May need to handle via layout or separate state
  }
  if (prefs.maxVisibleCards) {
    set({ maxVisibleCards: prefs.maxVisibleCards });
  }
},

restoreMechanicOverrides: () => {
  const backup = get()._mechanicOverridesBackup;
  if (!backup) return;

  set({
    cardSizePreset: backup.cardSizePreset ?? get().cardSizePreset,
    cardAspectRatio: backup.cardAspectRatio ?? get().cardAspectRatio,
    layout: backup.layout ?? get().layout,
    maxVisibleCards: backup.maxVisibleCards ?? get().maxVisibleCards,
    _mechanicOverridesBackup: null,
    mechanicOverridesActive: false,
  });
},
```

4. Exclude backup from persistence:
```typescript
persist(
  // ... store definition ...
  {
    name: "itemdeck-settings",
    partialize: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _mechanicOverridesBackup, mechanicOverridesActive, ...rest } = state;
      return rest;
    },
  }
)
```

## Phase 3: Update MechanicContext

Modify src/mechanics/context.tsx:

1. Update activateMechanic:
```typescript
const activateMechanic = useCallback(
  async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const activated = await mechanicRegistry.activate(id);

      // Apply display preferences if present
      if (activated.manifest.displayPreferences) {
        useSettingsStore.getState().applyMechanicOverrides(
          activated.manifest.displayPreferences
        );
      }

      setMechanic(activated);
      setActiveMechanicId(id);
    } catch (err) {
      // ... existing error handling ...
    } finally {
      setIsLoading(false);
    }
  },
  [setActiveMechanicId]
);
```

2. Update deactivateMechanic:
```typescript
const deactivateMechanic = useCallback(() => {
  // Restore settings before deactivating
  useSettingsStore.getState().restoreMechanicOverrides();

  mechanicRegistry.deactivate();
  setMechanic(null);
  setActiveMechanicId(null);
  setError(null);
}, [setActiveMechanicId]);
```

3. Add beforeunload handler:
```typescript
useEffect(() => {
  const handleBeforeUnload = () => {
    if (mechanic) {
      useSettingsStore.getState().restoreMechanicOverrides();
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [mechanic]);
```

## Phase 4: Add Display Preferences to Mechanics

### Competing (Top Trumps)

Modify src/mechanics/competing/index.tsx:
```typescript
export const competingMechanic = {
  manifest: {
    id: "competing",
    name: "Top Trumps",
    // ... existing fields ...
    displayPreferences: {
      cardSizePreset: "small",
      hideCardGrid: true,
      uiMode: "fullscreen",
    },
  },
  // ... rest of definition ...
};
```

### Quiz

Modify src/mechanics/quiz/index.tsx:
```typescript
displayPreferences: {
  cardSizePreset: "medium",
  uiMode: "overlay",
},
```

### Memory

Modify src/mechanics/memory/index.tsx:
```typescript
displayPreferences: {
  cardSizePreset: "medium",
  hideCardGrid: true,
},
```

### Snap Ranking

Modify src/mechanics/snap-ranking/index.tsx:
```typescript
displayPreferences: {
  cardSizePreset: "small",
  uiMode: "inline",
},
```

## Phase 5: Testing

Test each mechanic:
1. Note current settings (card size, aspect ratio)
2. Activate mechanic
3. Verify settings changed per preferences
4. Deactivate mechanic
5. Verify original settings restored
6. Test page refresh during active mechanic
7. Verify settings are not stuck in "mechanic mode"

## Files to Modify

- src/mechanics/types.ts
- src/stores/settingsStore.ts
- src/mechanics/context.tsx
- src/mechanics/competing/index.tsx
- src/mechanics/quiz/index.tsx
- src/mechanics/memory/index.tsx
- src/mechanics/snap-ranking/index.tsx

## Success Criteria

- [ ] MechanicDisplayPreferences interface added to types.ts
- [ ] MechanicManifest extended with displayPreferences field
- [ ] _mechanicOverridesBackup state added to settingsStore
- [ ] applyMechanicOverrides() action implemented
- [ ] restoreMechanicOverrides() action implemented
- [ ] Backup state excluded from persistence
- [ ] MechanicContext.activateMechanic() applies preferences
- [ ] MechanicContext.deactivateMechanic() restores settings
- [ ] beforeunload handler restores settings
- [ ] Competing manifest has displayPreferences
- [ ] Quiz manifest has displayPreferences
- [ ] Memory manifest has displayPreferences
- [ ] Snap Ranking manifest has displayPreferences
- [ ] All mechanics tested and working
- [ ] Settings restore correctly on deactivation
- [ ] Settings not stuck after page refresh
```

---

## Related Documentation

- [F-102 Feature Spec](../../../development/roadmap/features/planned/F-102-mechanic-display-preferences.md)
- [Mechanic Types](../../../../src/mechanics/types.ts)
- [Settings Store](../../../../src/stores/settingsStore.ts)
- [Mechanic Context](../../../../src/mechanics/context.tsx)
