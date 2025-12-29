# Understanding the Mechanics System

Learn how interactive game mechanics work in itemdeck.

## What Are Mechanics?

Mechanics are interactive modes that transform your card collection into games or tools. When a mechanic is active, it overlays special behaviour on top of the standard card viewing experience.

**Examples of mechanics:**
- Memory Game: Match pairs of cards
- Knowledge Quiz: Answer questions about your collection
- Top Trumps: Compare card stats against a CPU opponent
- Guess the Value: Predict hidden card attributes
- Collection Tracker: Track owned and wanted items

## How Mechanics Work

### Activation and Deactivation

Each mechanic follows a lifecycle:

1. **Registration**: Mechanic is loaded and available
2. **Activation**: User starts the mechanic
3. **Active state**: Mechanic controls card behaviour
4. **Deactivation**: User exits or completes the mechanic

Only one mechanic can be active at a time. Activating a new mechanic deactivates the current one.

### State Management

Mechanics maintain their own state:

```
┌─────────────────────────────────────┐
│ Mechanic State                      │
├─────────────────────────────────────┤
│ - isActive: boolean                 │
│ - settings: { difficulty, ... }     │
│ - gameState: { score, ... }         │
│ - display preferences               │
└─────────────────────────────────────┘
```

**Key points:**
- State is separate from application settings
- State persists while mechanic is active
- State resets on deactivation (for games)
- Settings may persist (for tools like Collection Tracker)

### Card Interactions

When a mechanic is active, it can:

| Behaviour | Description |
|-----------|-------------|
| Override clicks | Handle card clicks differently |
| Filter cards | Show only specific cards |
| Add overlays | Display extra UI on cards |
| Change flip behaviour | Control which cards can flip |
| Highlight cards | Mark cards visually |

### Display Preferences

Mechanics can request display changes:

- Hide navigation elements
- Show game-specific UI
- Display score/timer overlays
- Change card layout

The application respects these preferences while the mechanic is active.

## Available Mechanics

### Memory Game

**Type**: Competitive game
**Goal**: Match all pairs with fewest moves
**Min cards**: 4

**Features:**
- Configurable pair count
- Difficulty levels
- Move counter and timer
- Match tracking

**How it works:**
1. Cards are duplicated and shuffled
2. All cards start face-down
3. Player flips two cards at a time
4. Matches stay face-up
5. Non-matches flip back

### Knowledge Quiz

**Type**: Quiz game
**Goal**: Answer questions about your collection
**Min cards**: 4

**Features:**
- Multiple question types
- Configurable question count
- Timer modes
- Score tracking

**Question types:**
- Image to name: "Which item is shown?"
- Name to image: "Which image shows X?"
- Fill the blank: "Complete this fact about X"
- Relationship: "What is X's category?"

### Top Trumps (Competing)

**Type**: Battle game
**Goal**: Win all cards by choosing stats
**Min cards**: 4

**Features:**
- Player vs CPU
- Stat comparison battles
- Difficulty-based AI
- Round limits

**How it works:**
1. Cards dealt to player and CPU
2. Player chooses a stat to compare
3. Higher value wins the round
4. Winner takes both cards
5. Game ends when one player has all cards

### Guess the Value

**Type**: Guessing game
**Goal**: Predict hidden field values
**Min cards**: 2

**Features:**
- Works with numeric fields
- Score based on accuracy
- Card-by-card progression

**How it works:**
1. Card displays with one field hidden
2. Player guesses the hidden value
3. Actual value revealed
4. Score based on accuracy
5. Move to next card

### Collection Tracker

**Type**: Persistent tool
**Goal**: Track owned/wanted items
**Min cards**: 1

**Features:**
- Owned/Wishlist status per card
- Persistent across sessions
- Per-collection tracking
- Export capability

**How it works:**
1. Cards display with status icons
2. Click to toggle owned/wanted
3. Filter by status
4. Export collection data

## Mechanic Settings

Each mechanic has configurable settings:

| Setting Type | Examples |
|--------------|----------|
| Difficulty | Easy, Medium, Hard |
| Counts | Pair count, question count |
| Timers | Show/hide, limits |
| Display | Animations, transitions |

Access settings:
1. Settings > Mechanics tab
2. Select a mechanic
3. Adjust settings before playing

## Technical Architecture

### Mechanic Registry

Mechanics register with a central registry:

```
┌──────────────────────┐
│   Mechanic Registry  │
├──────────────────────┤
│ - memory             │
│ - quiz               │
│ - competing          │
│ - snap-ranking       │
│ - collection         │
└──────────────────────┘
```

The registry manages:
- Available mechanics
- Loading (lazy)
- Activation state
- Settings persistence

### Mechanic Interface

Each mechanic implements:

```typescript
interface Mechanic {
  manifest: {
    id: string;
    name: string;
    description: string;
    minCards: number;
  };
  lifecycle: {
    onActivate(): void;
    onDeactivate(): void;
    onReset?(): void;
  };
  getCardActions(): CardActions;
  CardOverlay?: Component;
  GridOverlay?: Component;
  Settings?: Component;
}
```

### Overlays

Mechanics use two types of overlays:

| Type | Purpose | Example |
|------|---------|---------|
| Card Overlay | Per-card UI | Match indicators, status icons |
| Grid Overlay | Full-screen UI | Score display, quiz interface |

Overlays render on top of the standard card grid.

---

## Related Documentation

- [Playing Memory Game](../tutorials/playing-memory-game.md) - Memory game tutorial
- [Keyboard Shortcuts](../guides/keyboard-shortcuts.md) - Game controls
- [Settings Reference](../reference/settings.md) - Mechanic settings
