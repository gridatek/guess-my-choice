-- Drop the old policies
DROP POLICY IF EXISTS "Players can view their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Players can update their own game sessions" ON public.game_sessions;

-- Allow players to view sessions they're part of OR waiting sessions (so they can join)
CREATE POLICY "Players can view their own game sessions"
    ON public.game_sessions FOR SELECT
    USING (
        auth.uid() = player1_id OR
        auth.uid() = player2_id OR
        (player2_id IS NULL AND status = 'waiting')
    );

-- Allow players to update sessions they're part of OR join waiting sessions
CREATE POLICY "Players can update their own game sessions"
    ON public.game_sessions FOR UPDATE
    USING (
        auth.uid() = player1_id OR
        auth.uid() = player2_id OR
        (player2_id IS NULL AND status = 'waiting')
    );
