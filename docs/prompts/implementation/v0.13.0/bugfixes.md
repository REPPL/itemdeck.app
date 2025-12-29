# v0.13.0 Bug Fixes & UX Improvements

**Version:** 0.13.0
**Status:** Ready for implementation

## Overview

Four issues to address:
1. **Offline loading** - App stuck when scanning GitHub without internet
2. **Reset feedback** - Cmd-R reset has no visible confirmation
3. **Guess the Value flip bug** - Cards won't flip due to race condition
4. **Game configuration** - Users need to configure mechanics before playing

---

## Issue 1: Offline Loading UX

### Problem
When offline, the loading screen shows "Scanning repository..." indefinitely, then "Load failed" with only a "Retry" button. No indication of offline state or cached options.

### Root Cause
- `useOnlineStatus` hook exists but isn't used in LoadingScreen
- No early offline detection before fetch attempts
- Cached collections exist (`cardCache.ts`) but aren't offered as fallback

### Solution

**Files to modify:**
- `src/components/LoadingScreen/LoadingScreen.tsx`
- `src/lib/cardCache.ts` (add helper to list cached collections)

**Implementation:**
1. Import `useOnlineStatus` hook in LoadingScreen
2. Add early offline detection before GitHub scan starts
3. If offline AND have cached data for this source → show "Offline mode" badge, load from cache
4. If offline AND no cache → show clear "You appear to be offline" message with:
   - List of cached collections (if any) user can browse
   - Retry button
5. Show offline indicator banner when viewing cached content

---

## Issue 2: Reset (Cmd-R) Feedback

### Problem
After confirming Reset, there's no obvious visual feedback that anything happened. Cards animate to new positions but this is subtle.

### Root Cause
- No toast/notification system for transient messages
- Card shuffle animation (400ms) is the only feedback, easily missed
- No explicit "reset complete" signal

### Solution

**Files to modify:**
- `src/App.tsx` (add toast state and trigger)
- `src/components/Toast/Toast.tsx` (new component)
- `src/components/Toast/Toast.module.css` (new styles)
- `src/components/CardGrid/CardGrid.module.css` (enhance shuffle animation)

**Implementation:**
1. Create simple Toast component with:
   - Auto-dismiss after 2 seconds
   - Slide-in from bottom animation
   - "View reset" message
2. Add shuffle animation enhancement:
   - Brief scale-down effect on all cards (50ms)
   - Then animate to new positions
   - Creates more noticeable "shuffle" visual
3. Trigger toast in `handleReloadConfirm()` after reset actions

---

## Issue 3: Guess the Value Card Flip Bug

### Problem
Cards cannot be flipped in the Guess the Value mechanic. Clicks are silently ignored.

### Root Cause
**Race condition between initialization and activation:**
1. User selects mechanic → `onActivate()` sets `isActive: true`
2. CardGrid's useEffect runs → `initGame()` sets `isActive: false`
3. `flipCurrentCard()` guard checks `if (!state.isActive)` → returns early
4. Click handler's `isCurrent` check fails → click ignored

The comment in store.ts says `isActive: false, // Will be activated separately` but CardGrid calls `initGame()` unconditionally whenever the mechanic loads.

### Solution

**Files to modify:**
- `src/mechanics/snap-ranking/store.ts`

**Implementation:**
Preserve the current `isActive` state in `initGame()`:
```typescript
set({
  isActive: get().isActive,  // Preserve current active state
  // ... keep other state ...
});
```

---

## Issue 4: Game Configuration Before Play

### Problem
Users can't configure game settings (card count, difficulty) before starting a mechanic.

### Current State
- Memory game has `pairCount` setting in its store
- Snap Ranking has `showTimer` setting
- Settings are accessible but not prominently shown before game starts

### Solution

**Files to modify:**
- `src/components/MechanicPanel/MechanicPanel.tsx`
- `src/mechanics/snap-ranking/Settings.tsx`
- `src/mechanics/snap-ranking/store.ts`
- `src/mechanics/snap-ranking/types.ts`

**Implementation:**

1. **Add settings to Snap Ranking types:**
   ```typescript
   interface SnapRankingSettings {
     showTimer: boolean;
     cardCount: number;      // NEW: How many cards to play (default: all)
     timeLimit: number;      // NEW: Seconds per card, 0 = unlimited
     scoringMode: "strict" | "lenient";  // NEW: strict = exact only, lenient = partial credit
   }
   ```

2. **Update Settings panel:**
   - Card count slider (min 5, max all cards, default all)
   - Time limit dropdown (Unlimited, 5s, 10s, 30s per card)
   - Scoring mode toggle (Strict/Lenient)

3. **Enhance MechanicPanel flow:**
   - When mechanic selected but not started → show settings inline
   - "Start Game" button below settings
   - Settings collapsed once game is active

4. **Integrate settings into game:**
   - `initGame()` accepts settings from store
   - Filter cards to requested count
   - Time limit affects scoring (timeout = 0 points)
   - Scoring mode affects `calculateScore()` thresholds

---

## Implementation Order

1. **Issue 3 (Flip bug)** - Critical, blocks gameplay (5 min fix)
2. **Issue 1 (Offline)** - Important UX improvement
3. **Issue 2 (Reset feedback)** - Nice-to-have polish
4. **Issue 4 (Game config)** - Feature enhancement

---

## Testing Checklist

### Issue 3 - Flip Bug
- [ ] Select "Guess the Value" mechanic
- [ ] Click on the current card to flip it
- [ ] Card should reveal and show guess buttons
- [ ] Complete a full game cycle

### Issue 1 - Offline
- [ ] Disconnect network, try to load collection
- [ ] See "You appear to be offline" message
- [ ] If previously cached, see option to load cached version
- [ ] Reconnect, retry works

### Issue 2 - Reset
- [ ] Press Cmd-R, confirm reset
- [ ] See toast "View reset" appear briefly
- [ ] See cards visually shuffle (enhanced animation)

### Issue 4 - Game Config
- [ ] Select mechanic, see settings before start
- [ ] Adjust card count, start game with fewer cards
- [ ] Time limit affects gameplay if enabled
