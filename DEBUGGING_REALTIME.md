# Debugging Realtime Subscription Issue - User Testing Guide

## Problem Summary

When Player 2 joins a game session, Player 1's lobby screen doesn't update automatically. Player 1
still sees "Waiting to join..." instead of "Ready" for Player 2.

**What Should Happen:**

1. Player 1 creates a game and waits in lobby
2. Player 2 joins using the session code
3. Player 1's screen automatically updates showing Player 2 as "Ready"
4. Both players see "Both Players Ready!" message

**What Actually Happens:**

- Player 2 joins successfully
- Player 1's screen doesn't update (needs manual refresh)

---

## Prerequisites

### Setup for Testing

1. **Start the development environment:**

   ```bash
   pnpm run dev
   ```

   Wait for message: "Started supabase local development setup."

2. **Start the frontend app:**

   ```bash
   pnpm run frontend:dev
   ```

   Wait for: "Local: http://localhost:4200/"

3. **Check Supabase is running:**
   ```bash
   supabase status
   ```
   You should see all services running (green status).

---

## Test 1: Single Computer - Two Browser Windows

### Step-by-Step Instructions

#### Player 1 Setup (Browser Window 1)

1. **Open Chrome** (or your main browser)
2. **Go to:** `http://localhost:4200`
3. **Login:**
   - Email: `bob@example.com`
   - Password: `password123`
   - Click "Sign In"
4. **Click:** "🎮 Start Playing" button
5. **Click:** "Create New Game" button
6. **Note the session code** (e.g., "ABC123")
7. **Keep this window open and visible**

#### Player 2 Setup (Browser Window 2 - Incognito)

8. **Open Incognito/Private window** (Ctrl+Shift+N or Cmd+Shift+N)
9. **Go to:** `http://localhost:4200`
10. **Login as different user:**
    - Email: `carol@example.com`
    - Password: `password123`
    - Click "Sign In"
11. **Click:** "🎮 Start Playing" button
12. **Enter the session code** from step 6 in the "Join Code" field
13. **Click:** "Join Game" button

#### Check the Results

14. **Look at Player 1's window (the first browser window)**

**✅ PASS - If you see:**

- Player 2's status shows "Ready"
- Player 2's name shows "carol"
- Message shows "Both Players Ready!"
- The "Start Game" button is enabled

**❌ FAIL - If you see:**

- Player 2's status still shows "Waiting to join..."
- No change on Player 1's screen
- Still shows "Waiting for Player 2..."

15. **If FAIL:** Manually refresh Player 1's page (F5)
    - If the updates appear after refresh → Database works, Realtime doesn't work
    - If updates don't appear → Database update might be failing

---

## Test 2: Two Computers (or Computer + Phone)

This tests realtime across different devices and networks.

### Setup

1. **Find your local IP address:**

   ```bash
   # On Linux/Mac:
   ifconfig | grep "inet "
   # Look for something like: 192.168.1.XXX

   # On Windows:
   ipconfig
   # Look for: IPv4 Address
   ```

2. **Make sure both devices are on the same WiFi network**

3. **Update Supabase config to allow external connections:**

   Open `supabase/config.toml` and add your IP:

   ```toml
   [api]
   # Add your local IP
   enabled = true
   port = 54321
   schemas = ["public", "graphql_public"]
   extra_search_path = ["public"]
   max_rows = 1000
   ```

4. **Restart Supabase:**
   ```bash
   supabase stop
   supabase start
   ```

### Computer 1 (Player 1)

1. **Open browser on Computer 1**
2. **Go to:** `http://localhost:4200`
3. **Login:**
   - Email: `bob@example.com`
   - Password: `password123`
4. **Click:** "🎮 Start Playing"
5. **Click:** "Create New Game"
6. **Write down the session code** (share it with Computer 2)
7. **Keep this screen open and visible**

### Computer 2 or Phone (Player 2)

8. **Open browser on second device**
9. **Go to:** `http://YOUR_LOCAL_IP:4200` (e.g., `http://192.168.1.5:4200`)
10. **Login:**
    - Email: `carol@example.com`
    - Password: `password123`
11. **Click:** "🎮 Start Playing"
12. **Enter the session code** from Computer 1
13. **Click:** "Join Game"

### Watch Computer 1's Screen

14. **Within 1-2 seconds, Computer 1 should automatically update**

**✅ PASS - If Computer 1 shows:**

- Player 2 (carol) is Ready
- Both Players Ready! message
- Start Game button is enabled

**❌ FAIL - If Computer 1:**

- Still shows "Waiting for Player 2..."
- Doesn't update automatically

---

## Test 3: Check Database Updates

This verifies the database is being updated correctly.

1. **Open Supabase Studio:**

   ```bash
   supabase status
   ```

   Look for "Studio URL" (usually `http://localhost:54323`)

2. **Open Studio in browser**

3. **Go to:** Table Editor → game_sessions

4. **Find the session** you just created (look for the session code)

5. **Check these columns:**
   - `player1_id`: Should have a UUID
   - `player2_id`: Should have a UUID (after Player 2 joined)
   - `status`: Should be 'active' (after Player 2 joined)

**✅ If player2_id is filled:** Database works! Issue is realtime subscription. **❌ If player2_id
is NULL:** The join operation is failing.

---

## Test 4: Check Realtime Configuration

### Enable Realtime for game_sessions Table

1. **Check if realtime is enabled:**

   ```bash
   cat supabase/migrations/00011_create_game_sessions_table.sql | grep -i "realtime"
   ```

2. **If you don't see a realtime publication line, add it:**

   Open `supabase/migrations/00011_create_game_sessions_table.sql`

   Add this at the end of the file:

   ```sql
   -- Enable realtime for game_sessions table
   ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
   ```

3. **Apply the migration:**

   ```bash
   supabase db reset
   ```

   Wait for it to complete.

4. **Repeat Test 1 or Test 2** to see if it works now.

---

## Test 5: Manual Realtime Subscription Test

This creates a simple listener to test if realtime works at all.

1. **Open browser console** (F12 → Console tab)

2. **While on the game lobby page, paste this code:**

```javascript
// Get Supabase client from window (Angular app exposes it)
const testRealtime = async () => {
  console.log('🔌 Testing realtime subscription...');

  // You'll need to get these from: supabase status
  const supabaseUrl = 'http://localhost:54321';
  const supabaseKey = 'YOUR_ANON_KEY_HERE'; // Get from: supabase status | grep "anon key"

  const { createClient } = window.supabase || {};
  if (!createClient) {
    console.error('❌ Supabase client not available');
    return;
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const channel = client
    .channel('test-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
      },
      (payload) => {
        console.log('✅ REALTIME EVENT RECEIVED:', payload);
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
    });

  console.log('⏳ Listening for changes to game_sessions table...');
  console.log('   Now go update a row in Supabase Studio');
};

testRealtime();
```

3. **Get your anon key:**

   ```bash
   supabase status | grep "anon key"
   ```

   Copy the key and replace `YOUR_ANON_KEY_HERE` in the code above.

4. **Go to Supabase Studio** → game_sessions table

5. **Edit any row** (change status, add a note, anything)

6. **Check browser console:**

**✅ PASS - If you see:** "REALTIME EVENT RECEIVED" with the changed data **❌ FAIL - If nothing
happens:** Realtime is not working

---

## Test 6: Add Debug Logging

Add console logs to see what's happening in the code.

1. **Open:** `apps/frontend/src/app/game/session-lobby/session-lobby.ts`

2. **Find the `subscribeToSessionUpdates()` method** (around line 287)

3. **Add console logs:**

```typescript
subscribeToSessionUpdates() {
  console.log('🔌 [LOBBY] Setting up realtime subscription for session:', this.sessionId);

  this.subscription = this.gameService.subscribeToSession(
    this.sessionId!,
    async (updatedSession) => {
      console.log('✅ [LOBBY] Realtime update received!', {
        sessionId: updatedSession.id,
        player1_id: updatedSession.player1_id,
        player2_id: updatedSession.player2_id,
        status: updatedSession.status,
        timestamp: new Date().toISOString()
      });

      this.session.set(updatedSession);

      // Load player 2's name if they joined
      if (updatedSession.player2_id && !this.player2Name().includes('@')) {
        console.log('👤 [LOBBY] Loading player 2 name for:', updatedSession.player2_id);
        await this.loadPlayer2Name(updatedSession.player2_id);
      }

      // ... rest of code
    }
  );

  console.log('✅ [LOBBY] Subscription created');
}
```

4. **Save the file** (the dev server will auto-reload)

5. **Repeat Test 1** with browser console open (F12)

6. **Watch for these logs in Player 1's console:**
   - "🔌 [LOBBY] Setting up realtime subscription"
   - "✅ [LOBBY] Subscription created"
   - "✅ [LOBBY] Realtime update received!" (when Player 2 joins)

**If you see the update:** Realtime is working! Issue might be with the UI not updating. **If you
don't see the update:** Realtime subscription is not receiving events.

---

## Test 7: Check Row Level Security (RLS) Policies

RLS policies might be blocking the realtime updates.

1. **Open:** `supabase/migrations/00011_create_game_sessions_table.sql`

2. **Find the SELECT policy** (should look like this):

```sql
CREATE POLICY "Users can view their own game sessions"
ON game_sessions FOR SELECT
USING (
  auth.uid() = player1_id OR
  auth.uid() = player2_id
);
```

3. **If this policy is missing or different, add/update it:**

```sql
-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can view their own game sessions" ON game_sessions;

-- Create new policy allowing both players to see the session
CREATE POLICY "Users can view their own game sessions"
ON game_sessions FOR SELECT
USING (
  auth.uid() = player1_id OR
  auth.uid() = player2_id
);
```

4. **Apply the changes:**

   ```bash
   supabase db reset
   ```

5. **Repeat Test 1**

---

## Quick Fix: Add Polling (Temporary Workaround)

If realtime can't be fixed immediately, add polling so the UI updates periodically.

1. **Open:** `apps/frontend/src/app/game/session-lobby/session-lobby.ts`

2. **Add a polling interval:**

```typescript
export class SessionLobby implements OnInit, OnDestroy {
  // ... existing properties
  private pollingInterval: any = null;

  async ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id');
    if (!this.sessionId) {
      this.goBack();
      return;
    }

    await this.loadSession();
    this.subscribeToSessionUpdates();

    // Add polling as backup
    this.startPolling();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    // Clean up polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  startPolling() {
    console.log('⏰ [LOBBY] Starting polling every 2 seconds');
    this.pollingInterval = setInterval(async () => {
      // Only poll if waiting for player 2
      if (this.session()?.status === 'waiting') {
        console.log('🔄 [LOBBY] Polling for updates...');
        await this.loadSession();
      } else {
        // Stop polling once both players are ready
        if (this.pollingInterval) {
          console.log('⏹️ [LOBBY] Stopping polling (both players ready)');
          clearInterval(this.pollingInterval);
          this.pollingInterval = null;
        }
      }
    }, 2000); // Check every 2 seconds
  }
}
```

3. **Save the file**

4. **Repeat Test 1** - Player 1's screen should update within 2 seconds

This is a workaround, but it will make the feature work while you debug realtime.

---

## Checklist: What to Check

- [ ] Both services running (`pnpm run dev` and `pnpm run frontend:dev`)
- [ ] Can login as both users successfully
- [ ] Can create a game session
- [ ] Can join a game session
- [ ] Database shows player2_id after joining (check in Studio)
- [ ] Database shows status='active' after joining
- [ ] Player 1's screen updates automatically (or after 2s with polling)
- [ ] Both players see "Both Players Ready!" message
- [ ] Console shows realtime subscription events (if you added logs)

---

## Common Issues

### Issue 1: "Subscription status: CLOSED"

**Cause:** Realtime not enabled on table **Fix:** Add
`ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;` to migration

### Issue 2: No updates even after manual refresh

**Cause:** Join operation failing **Fix:** Check browser console for errors when clicking "Join
Game"

### Issue 3: Updates work after refresh but not automatically

**Cause:** Realtime subscription not triggering **Fix:** Check RLS policies, add polling as
workaround

### Issue 4: "Cannot read property 'subscribe' of undefined"

**Cause:** Supabase client not initialized **Fix:** Check auth service is providing valid Supabase
client

### Issue 5: Works on localhost but not across devices

**Cause:** Supabase API not accessible from other devices **Fix:** Update `supabase/config.toml` to
allow external connections

---

## Report Your Findings

After testing, document what you found:

1. **Which test failed?** (Test 1, 2, 3, etc.)
2. **What did you see?** (describe the behavior)
3. **Any console errors?** (copy/paste from browser console)
4. **Database check results?** (is player2_id populated?)
5. **Did polling workaround work?** (yes/no)

This information will help identify the root cause!

---

## Next Steps After You Find the Issue

- If **database updates work but realtime doesn't** → Focus on realtime configuration
- If **database updates don't work** → Check joinSession method and RLS policies
- If **polling works but realtime doesn't** → Use polling temporarily, debug realtime separately
- If **nothing works** → Check for JavaScript errors in console, verify Supabase is running

Good luck debugging! 🔍

---

## Test 8: Manual Game Flow Testing (Without Playwright)

This test helps verify the complete game flow works correctly by manually testing in the browser.

### Prerequisites

1. **Start the development environment:**

   ```bash
   pnpm run dev
   ```

   Wait for: "Started supabase local development setup."

2. **Start the frontend app:**
   ```bash
   pnpm run frontend:dev
   ```
   Wait for: "Local: http://localhost:4200/"

### Complete Game Flow Test

#### Player 1 Setup (Main Browser Window)

1. **Open Chrome** (regular window)
2. **Go to:** `http://localhost:4200`
3. **Login:**
   - Email: `bob@example.com`
   - Password: `password123`
4. **Click:** "🎮 Start Playing"
5. **Click:** "Create New Game" button
6. **You should see the lobby page with:**
   - Session code (6 characters)
   - "Player 1 (You)" shown as Ready
   - "Player 2" shown as "Waiting to join..."
   - Message: "Game will start automatically when both players join"
7. **Note the session code**
8. **Keep window open and visible**

#### Player 2 Setup (Incognito Window)

9. **Open Incognito window** (Ctrl+Shift+N or Cmd+Shift+N)
10. **Go to:** `http://localhost:4200`
11. **Login:**
    - Email: `carol@example.com`
    - Password: `password123`
12. **Click:** "🎮 Start Playing"
13. **Enter the session code** from step 7
14. **Click:** "Join Game"
15. **Player 2 should navigate directly to the play page** showing:
    - "Waiting for Game to Start..." message
    - Connection Points: 0

#### Check Player 1's Lobby (Main Window)

16. **Look at Player 1's window** - should now show:
    - ✅ Player 2 status: "Ready"
    - ✅ "Both Players Ready!" message
    - ✅ "Start Game" button is visible
    - ❌ Player 2 should NOT see the Start Game button (only Player 1)

#### Start the Game (Player 1)

17. **In Player 1's window, click:** "Start Game" button
18. **Both windows should navigate to the game play page**

#### Verify Game UI Elements (Both Windows)

**Player 1's window should show:**

- ✅ Round indicator: "Round 1 / 3" (or whatever max_rounds is)
- ✅ Player role: "Friends - Casual & Fun - You are Player 1"
- ✅ Connection Points: 0
- ✅ Turn message: "Choose your option (Player 2 will guess)"
- ✅ 4 option buttons visible
- ✅ Options are clickable

**Player 2's window should show:**

- ✅ Round indicator: "Round 1 / 3"
- ✅ Player role: "Friends - Casual & Fun - You are Player 2"
- ✅ Connection Points: 0
- ✅ Turn message: "Waiting for Player 1 to choose..."
- ✅ 4 option buttons visible but grayed out/disabled
- ✅ Loading animation or waiting indicator

#### Play Round 1

19. **Player 1: Click on any option**
    - Option should highlight with purple border
    - "✓ Selected" should appear on the option
    - "Confirm Choice" button should appear

20. **Player 1: Click "Confirm Choice" button**
    - Turn message should change to "Waiting for Player 2 to guess..."
    - Options should be disabled

21. **Player 2's window should update:**
    - Turn message changes to "What did Player 1 choose?"
    - 4 options become clickable
    - Options should have pink styling (different from Player 1)

22. **Player 2: Click on any option**
    - Option highlights with pink border
    - "✓ Your Guess" appears
    - "Confirm Guess" button appears

23. **Player 2: Click "Confirm Guess" button**
    - Result overlay should appear on both windows
    - Shows "🎉 Correct Guess!" or "😅 Not Quite!"
    - Shows what Player 1 chose
    - Shows points earned (if correct)
    - "Continue to Next Round" button visible

#### Check Result Overlay

**Both windows should show:**

- ✅ Result overlay visible (data-testid="result-overlay")
- ✅ Emoji (🎉 or 😅)
- ✅ "Correct Guess!" or "Not Quite!" heading
- ✅ "Player 1 chose:" with the actual choice
- ✅ Connection points updated if guess was correct
- ✅ "Continue to Next Round" button (or "View Final Results" if last round)

#### Continue to Round 2

24. **Either player can click:** "Continue to Next Round"
25. **Both windows should:**
    - Update round indicator to "Round 2 / 3"
    - Start over with Player 1 choosing
    - Maintain the same connection points

#### Complete the Game

26. **Play through all rounds** (usually 3)
27. **After the final round:**
    - Instead of "Continue to Next Round"
    - Should show "View Final Results" button
    - Clicking navigates both players to results page

#### Verify Results Page

28. **Both windows should show:**
    - Final connection points
    - Game summary
    - "Play Again" button
    - "Back to Dashboard" button

---

### Common Issues to Check

#### Issue: Player 2 doesn't see waiting message

**Expected:** Player 2 should see "Waiting for Game to Start..." when they first join **Check:**
Look for element with data-testid="turn-message" (only appears when game starts)

#### Issue: Options don't become clickable

**Expected:** Options should be clickable when it's your turn **Check:** Look for disabled attribute
on buttons, verify game phase is correct

#### Issue: Confirm button doesn't appear

**Expected:** After selecting an option, confirm button should appear **Check:** Verify selection is
being registered (purple/pink highlight), check for data-testid="confirm-choice-button" or
"confirm-guess-button"

#### Issue: Result overlay doesn't show

**Expected:** After both players make their move, result should display **Check:** Look for
data-testid="result-overlay", check browser console for errors

#### Issue: Player 2 sees Start Game button

**Expected:** Only Player 1 should see the "Start Game" button in lobby **Check:** Verify Player 2
goes directly to play page, not lobby

---

### Browser Console Checks

**Open browser console (F12) on both windows and check for:**

1. **Subscription logs:**

   ```
   🔌 [LOBBY] Setting up realtime subscription
   ✅ [LOBBY] Subscription created
   ✅ [LOBBY] Realtime update received!
   ```

2. **No errors** related to:
   - Supabase client
   - Missing test IDs
   - Failed API calls
   - Realtime subscription failures

3. **Game phase transitions:**
   - loading → player1_choosing → player2_guessing → revealing

---

### Checklist: Manual Testing

Use this checklist while testing:

- [ ] Player 1 can create a game and see lobby
- [ ] Player 2 can join with session code
- [ ] Player 2 goes directly to play page (not lobby)
- [ ] Player 1 sees "Both Players Ready!" in lobby
- [ ] Only Player 1 sees "Start Game" button
- [ ] Player 2 sees "Waiting for Player 1 to start..." on play page
- [ ] Player 1 can click "Start Game" and both navigate to play page
- [ ] Both players see correct round number and connection points
- [ ] Both players see correct "You are Player X" text
- [ ] Player 1 sees "Choose your option" message
- [ ] Player 2 sees "Waiting for Player 1" message
- [ ] Player 1 can select an option (highlights purple)
- [ ] "Confirm Choice" button appears for Player 1
- [ ] Player 1 can click "Confirm Choice"
- [ ] Player 2's turn message updates to "What did Player 1 choose?"
- [ ] Player 2 can select an option (highlights pink)
- [ ] "Confirm Guess" button appears for Player 2
- [ ] Player 2 can click "Confirm Guess"
- [ ] Result overlay appears on both screens
- [ ] Connection points update correctly
- [ ] Can continue to next round
- [ ] After final round, shows "View Final Results"
- [ ] Results page displays correctly

---

### Debugging Tips

1. **If elements don't appear:**
   - Check browser console for errors
   - Verify element has the correct data-testid
   - Check if the game phase is correct

2. **If realtime updates fail:**
   - Check that both browser windows are logged in
   - Verify Supabase is running
   - Check console for subscription errors

3. **If game flow breaks:**
   - Note at which step it breaks
   - Check the last successful action
   - Look for JavaScript errors in console
   - Verify database records in Supabase Studio

4. **To reset and try again:**
   - Close both browser windows
   - Start fresh from step 1
   - Use different session codes each time
