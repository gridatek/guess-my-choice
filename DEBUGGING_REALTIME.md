# Debugging Realtime Subscription Issue

## Problem Summary

**Test:** `Player 1 sees both players ready after Player 2 joins`
(apps/frontend/e2e/game-complete-flow.spec.ts:241)

**Issue:** When Player 2 joins a game session, Player 1's lobby view doesn't update in real-time.
The `player2-status` still shows "Waiting to join..." instead of "Ready", indicating the session
signal is not being updated via the realtime subscription.

**Expected Behavior:**

1. Player 1 creates a game session and waits in lobby
2. Player 2 joins using the session code
3. Player 1's view should automatically update to show Player 2 as "Ready"
4. Both players should see "Both Players Ready!" message

**Current Behavior:**

- Player 2 successfully joins (backend updates player2_id and status='active')
- Player 1's view doesn't update (realtime subscription not triggering)

---

## Step 1: Verify Database Updates Are Happening

### Check if joinSession actually updates the database

1. Start Supabase:

   ```bash
   pnpm run dev
   ```

2. In a separate terminal, open Supabase Studio:

   ```bash
   supabase status
   ```

   Look for the Studio URL (usually http://localhost:54323)

3. Run the failing test in debug mode:

   ```bash
   cd apps/frontend
   npx playwright test e2e/game-complete-flow.spec.ts --grep "Player 1 sees both players ready" --debug
   ```

4. While test is paused at the failure point, check the database:
   - Open Studio → Table Editor → game_sessions
   - Find the session with the code from the test
   - Verify that `player2_id` is populated
   - Verify that `status` is 'active'

**✅ If player2_id is populated:** Database update works, issue is with realtime. **❌ If player2_id
is NULL:** The join operation itself is failing.

---

## Step 2: Check Supabase Realtime Configuration

### Verify Realtime is enabled for the table

1. Open `supabase/migrations/00011_create_game_sessions_table.sql`

2. Check if realtime is enabled. Add this if missing:

   ```sql
   -- Enable realtime for game_sessions table
   ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
   ```

3. If you added it, apply the migration:
   ```bash
   supabase db reset
   ```

---

## Step 3: Test Realtime Subscription Manually

### Create a minimal test to verify realtime works

1. Create a test file: `apps/frontend/src/app/test-realtime.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseKey = 'YOUR_ANON_KEY'; // Get from: supabase status

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealtime() {
  console.log('🔌 Setting up realtime subscription...');

  // Subscribe to game_sessions changes
  const channel = supabase
    .channel('test-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
      },
      (payload) => {
        console.log('✅ Realtime event received:', payload);
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
    });

  console.log('⏳ Waiting for updates... (make a change in Studio)');
  console.log('   Go to Studio → game_sessions → Edit a row');

  // Keep script running
  await new Promise(() => {});
}

testRealtime();
```

2. Get your anon key:

   ```bash
   supabase status | grep "anon key"
   ```

3. Run the test:

   ```bash
   npx tsx apps/frontend/src/app/test-realtime.ts
   ```

4. While script is running, go to Supabase Studio and update a game session row.

**✅ If you see "Realtime event received":** Realtime works! **❌ If nothing happens:** Realtime is
not configured correctly.

---

## Step 4: Debug the Subscription in the Component

### Add console logs to track subscription behavior

1. Open `apps/frontend/src/app/game/session-lobby/session-lobby.ts`

2. Add debug logging to the subscription:

```typescript
subscribeToSessionUpdates() {
  console.log('🔌 Setting up realtime subscription for session:', this.sessionId);

  this.subscription = this.gameService.subscribeToSession(
    this.sessionId!,
    async (updatedSession) => {
      console.log('✅ Realtime update received:', {
        sessionId: updatedSession.id,
        player2_id: updatedSession.player2_id,
        status: updatedSession.status,
      });

      this.session.set(updatedSession);

      // Load player 2's name if they joined
      if (updatedSession.player2_id && !this.player2Name().includes('@')) {
        console.log('👤 Loading player 2 name...');
        await this.loadPlayer2Name(updatedSession.player2_id);
      }

      // ... rest of the code
    }
  );

  // Check subscription status
  setTimeout(() => {
    console.log('📊 Subscription object:', this.subscription);
  }, 1000);
}
```

3. Run the test again and watch browser console:

   ```bash
   npx playwright test e2e/game-complete-flow.spec.ts --grep "Player 1 sees both players ready" --headed
   ```

4. Open browser DevTools (test runs in headed mode) and watch console logs.

**Look for:**

- "Setting up realtime subscription" (confirms subscription created)
- "Realtime update received" (confirms events are arriving)
- Subscription status/errors

---

## Step 5: Check for Timing Issues

### The subscription might not be ready when Player 2 joins

1. Check if subscription is subscribed before the update happens:

```typescript
subscribeToSessionUpdates() {
  this.subscription = this.gameService.subscribeToSession(
    this.sessionId!,
    async (updatedSession) => {
      // ... handler
    }
  );

  // Add subscription ready handler
  this.subscription.on('subscribe', () => {
    console.log('✅ Subscription is READY and listening');
  });
}
```

2. If timing is the issue, you might need to wait for subscription to be ready before allowing
   Player 2 to join.

---

## Step 6: Check Game Service Subscription Implementation

### Verify the subscription setup in game.service.ts

1. Open `apps/frontend/src/app/services/game.service.ts`

2. Find `subscribeToSession` method (around line 318)

3. Check the subscription configuration:

```typescript
subscribeToSession(sessionId: string, callback: (session: GameSession) => void) {
  const supabase = this.authService.getSupabaseClient();

  console.log('🔌 Creating channel for session:', sessionId);

  const channel = supabase
    .channel(`session:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: '*',  // Listen to all events
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        console.log('📨 Raw payload received:', payload);
        callback(payload.new as GameSession);
      }
    )
    .subscribe((status) => {
      console.log('📡 Channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to session updates');
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('❌ Channel error occurred');
      }
    });

  return channel;
}
```

4. Rerun test and check for these console logs.

---

## Step 7: Check RLS Policies

### Realtime respects Row Level Security policies

1. Open `supabase/migrations/00011_create_game_sessions_table.sql`

2. Check the SELECT policy. Users must be able to READ the session for realtime to work:

```sql
-- Check if this policy exists and is not too restrictive
CREATE POLICY "Users can view their own game sessions"
ON game_sessions FOR SELECT
USING (
  auth.uid() = player1_id OR
  auth.uid() = player2_id
);
```

3. If policy is missing or too restrictive, update it:

   ```sql
   -- Allow users to see sessions they're part of
   DROP POLICY IF EXISTS "Users can view their own game sessions" ON game_sessions;

   CREATE POLICY "Users can view their own game sessions"
   ON game_sessions FOR SELECT
   USING (
     auth.uid() = player1_id OR
     auth.uid() = player2_id
   );
   ```

4. Apply migration:
   ```bash
   supabase db reset
   ```

---

## Step 8: Alternative Solution - Polling

### If realtime can't be fixed quickly, implement polling as fallback

1. In `session-lobby.ts`, add polling logic:

```typescript
private pollingInterval: any = null;

ngOnInit() {
  // ... existing code
  await this.loadSession();
  this.subscribeToSessionUpdates();

  // Add polling as backup (every 2 seconds)
  this.startPolling();
}

ngOnDestroy() {
  if (this.subscription) {
    this.subscription.unsubscribe();
  }
  if (this.pollingInterval) {
    clearInterval(this.pollingInterval);
  }
}

startPolling() {
  this.pollingInterval = setInterval(async () => {
    // Only poll if waiting for player 2
    if (this.session()?.status === 'waiting') {
      await this.loadSession();
    }
  }, 2000);
}
```

This is a workaround, but will make the test pass while you investigate the realtime issue.

---

## Common Issues & Solutions

### Issue 1: Realtime not enabled on table

**Solution:** Add `ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;`

### Issue 2: RLS policies too restrictive

**Solution:** Ensure SELECT policy allows both player1 and player2 to read the session

### Issue 3: Subscription not ready before update

**Solution:** Add delays or wait for subscription status to be 'SUBSCRIBED'

### Issue 4: WebSocket connection issues in test environment

**Solution:** Check if Playwright can establish WebSocket connections, may need special config

### Issue 5: Multiple channels with same name

**Solution:** Ensure unique channel names, unsubscribe properly in ngOnDestroy

---

## Testing Your Fix

Once you've made changes, test with:

```bash
# Run just the failing test
cd apps/frontend
npx playwright test e2e/game-complete-flow.spec.ts --grep "Player 1 sees both players ready"

# Run in headed mode to see browser
npx playwright test e2e/game-complete-flow.spec.ts --grep "Player 1 sees both players ready" --headed

# Run with debug mode
npx playwright test e2e/game-complete-flow.spec.ts --grep "Player 1 sees both players ready" --debug
```

---

## Additional Resources

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Debugging Realtime](https://supabase.com/docs/guides/realtime/troubleshooting)
- Check Supabase logs: `docker logs supabase_realtime_guess-my-choice`

---

## Report Back

After debugging, please note:

1. Which step revealed the issue?
2. What was the root cause?
3. What fix worked?

This will help us document the solution and prevent similar issues in the future.
