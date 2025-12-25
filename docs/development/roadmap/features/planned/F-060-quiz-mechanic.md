# F-060: Quiz Mechanic

## Problem Statement

Users want to test their knowledge of the collection:

1. **Question generation** - Create questions from card data
2. **Multiple formats** - Image-to-name, name-to-image, fill-the-blank
3. **Score tracking** - Track correct answers and streaks
4. **Difficulty levels** - Easy, medium, hard question types

## Design Approach

Create a Quiz mechanic that generates questions from collection data.

### Question Types

```
Type 1: Image to Name
┌─────────────────────────────────────────────────────────────┐
│  What game is this?                                         │
│                                                             │
│        ┌───────────────┐                                    │
│        │   [Image]     │                                    │
│        │               │                                    │
│        │               │                                    │
│        └───────────────┘                                    │
│                                                             │
│  A) Super Metroid    B) Castlevania                         │
│  C) Mega Man         D) Contra                              │
└─────────────────────────────────────────────────────────────┘

Type 2: Name to Image
┌─────────────────────────────────────────────────────────────┐
│  Which image shows "Super Metroid"?                         │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │  [A]    │  │  [B]    │  │  [C]    │  │  [D]    │         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
└─────────────────────────────────────────────────────────────┘

Type 3: Fill the Blank
┌─────────────────────────────────────────────────────────────┐
│  Super Metroid was released in ____                         │
│                                                             │
│  A) 1991    B) 1994    C) 1996    D) 1998                   │
└─────────────────────────────────────────────────────────────┘
```

### Grid Overlay

```
┌─────────────────────────────────────────────────────────────┐
│  Quiz Mode    Score: 8/10    Streak: 3 🔥                   │
│                                                             │
│  [Question Area]                                            │
│                                                             │
│  [A] [B] [C] [D]                                            │
│                                                             │
│  Question 8 of 10                    [Skip] [End Quiz]      │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### Phase 1: Mechanic Core

- [ ] Create `src/mechanics/quiz/index.ts`
- [ ] Define `QuizMechanicManifest`
- [ ] Create `QuizMechanic` class
- [ ] Register factory with mechanic registry

### Phase 2: Question Generator

- [ ] Create `src/mechanics/quiz/questionGenerator.ts`
- [ ] Implement image-to-name question generator
- [ ] Implement name-to-image question generator
- [ ] Implement fill-the-blank question generator
- [ ] Generate wrong answers from other cards in collection
- [ ] Randomise answer positions

### Phase 3: State Management

- [ ] Create `src/mechanics/quiz/store.ts`
- [ ] Track: `questions`, `currentIndex`, `answers`, `score`, `streak`
- [ ] Implement `startQuiz(config)` action
- [ ] Implement `submitAnswer(answer)` action
- [ ] Implement `nextQuestion()` action
- [ ] Implement `endQuiz()` action

### Phase 4: Quiz Overlay

- [ ] Create `QuizOverlay.tsx` (replaces grid)
- [ ] Display current question
- [ ] Show answer options
- [ ] Show immediate feedback (correct/incorrect)
- [ ] Animate transitions between questions

### Phase 5: Answer Feedback

- [ ] Highlight correct answer in green
- [ ] Highlight wrong selection in red
- [ ] Show explanation (optional)
- [ ] Update score and streak display
- [ ] Play sound effects (optional, respecting preferences)

### Phase 6: Quiz Configuration

- [ ] Select number of questions (5, 10, 20)
- [ ] Select question types (checkboxes)
- [ ] Select difficulty level
- [ ] Select which fields to quiz on

### Phase 7: Results Screen

- [ ] Show final score
- [ ] Show questions missed
- [ ] Show time taken (optional timer mode)
- [ ] Compare to best score
- [ ] Share results (copy to clipboard)

## Success Criteria

- [ ] Questions generated from collection data
- [ ] Multiple question types work
- [ ] Wrong answers are plausible (from same collection)
- [ ] Score tracking accurate
- [ ] Streak counter works
- [ ] Results displayed at end

## Dependencies

- **F-053**: Mechanic Plugin Registry
- **F-054**: Mechanic Context Provider
- **F-055**: Mechanic Overlay System

## Complexity

**Medium** - Question generation with UI overlay.

## Testing Strategy

- Unit tests for question generator
- Test answer validation
- Component tests for quiz overlay
- E2E test for complete quiz flow

---

## Related Documentation

- [F-055: Mechanic Overlay System](./F-055-mechanic-overlay-system.md)
- [R-005: Gaming Mechanics State Patterns](../../research/R-005-gaming-mechanics-state.md)
- [ADR-017: Mechanic State Management](../../decisions/adrs/ADR-017-mechanic-state-management.md)

---

**Status**: Planned
