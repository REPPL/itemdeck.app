# F-054: Mechanic Context Provider

## Problem Statement

Components need access to the active mechanic and its state. We need:

1. **React integration** - Connect registry to React component tree
2. **State subscriptions** - Re-render on mechanic state changes
3. **Hooks API** - Clean hooks for accessing mechanic data
4. **Activation control** - Actions to switch mechanics

## Design Approach

Create a React Context that wraps the registry and provides hooks.

### Context Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MechanicProvider                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ MechanicContext.Provider                              │  │
│  │   value: {                                            │  │
│  │     mechanic: Mechanic | null,                        │  │
│  │     state: MechanicState | null,                      │  │
│  │     activateMechanic: (id) => Promise<void>,          │  │
│  │     deactivateMechanic: () => void,                   │  │
│  │     isLoading: boolean                                │  │
│  │   }                                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                │
│                            ▼                                │
│    ┌─────────────────────────────────────────────────┐      │
│    │ Components using useMechanic() hook             │      │
│    │   - CardGrid                                    │      │
│    │   - Card                                        │      │
│    │   - SettingsPanel                               │      │
│    └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Hooks API

```typescript
// Main hook - full access
function useMechanic(): {
  mechanic: Mechanic | null;
  state: MechanicState | null;
  activateMechanic: (id: string) => Promise<void>;
  deactivateMechanic: () => void;
  isLoading: boolean;
};

// Specific hooks
function useActiveMechanic(): Mechanic | null;
function useMechanicState(): MechanicState | null;
function useMechanicActions(): MechanicActions | null;
function useMechanicList(): MechanicManifest[];
```

## Implementation Tasks

### Phase 1: Context Creation

- [ ] Create `src/mechanics/context.tsx`
- [ ] Define `MechanicContextValue` interface
- [ ] Create `MechanicContext` with React.createContext
- [ ] Create `MechanicProvider` component

### Phase 2: Provider Implementation

- [ ] Subscribe to `activeMechanicId` from settingsStore
- [ ] Load and activate mechanic on ID change
- [ ] Subscribe to mechanic state changes
- [ ] Handle loading states during activation

### Phase 3: Hook Creation

- [ ] Create `useMechanic()` main hook
- [ ] Create `useActiveMechanic()` for mechanic instance
- [ ] Create `useMechanicState()` for current state
- [ ] Create `useMechanicActions()` for actions
- [ ] Create `useMechanicList()` for selector UI

### Phase 4: Error Handling

- [ ] Handle mechanic activation errors
- [ ] Provide error state in context
- [ ] Log errors for debugging
- [ ] Graceful fallback to no mechanic

## Success Criteria

- [ ] Components can access active mechanic via hooks
- [ ] State changes trigger re-renders
- [ ] Activating mechanic updates UI
- [ ] Loading state shown during activation
- [ ] Errors handled gracefully

## Dependencies

- **F-053**: Mechanic Plugin Registry

## Complexity

**Medium** - React Context with state subscription.

## Testing Strategy

- Unit tests for hooks
- Component tests with mock provider
- Test state subscription updates
- Test error handling

---

## Related Documentation

- [F-053: Mechanic Plugin Registry](./F-053-mechanic-plugin-registry.md)
- [ADR-016: Gaming Mechanics Plugin Architecture](../../decisions/adrs/ADR-016-gaming-mechanics-plugin-architecture.md)

---

**Status**: Complete
