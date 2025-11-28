-- Create game_sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player1_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    player2_id UUID REFERENCES auth.users ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('friends', 'couple', 'adult')),
    connection_points INTEGER DEFAULT 0 CHECK (connection_points >= 0),
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished', 'cancelled')),
    current_round INTEGER DEFAULT 0 CHECK (current_round >= 0),
    max_rounds INTEGER DEFAULT 10 CHECK (max_rounds >= 1 AND max_rounds <= 50),
    session_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_game_sessions_player1_id ON public.game_sessions(player1_id);
CREATE INDEX idx_game_sessions_player2_id ON public.game_sessions(player2_id);
CREATE INDEX idx_game_sessions_status ON public.game_sessions(status);
CREATE INDEX idx_game_sessions_session_code ON public.game_sessions(session_code);
CREATE INDEX idx_game_sessions_created_at ON public.game_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: Players can only see their own game sessions
CREATE POLICY "Players can view their own game sessions"
    ON public.game_sessions FOR SELECT
    USING (
        auth.uid() = player1_id OR
        auth.uid() = player2_id
    );

-- Player 1 can create game sessions
CREATE POLICY "Authenticated users can create game sessions"
    ON public.game_sessions FOR INSERT
    WITH CHECK (auth.uid() = player1_id);

-- Both players can update the game session (for joining, updating status)
CREATE POLICY "Players can update their own game sessions"
    ON public.game_sessions FOR UPDATE
    USING (
        auth.uid() = player1_id OR
        auth.uid() = player2_id
    );

-- Only player 1 can delete (cancel) the game session
CREATE POLICY "Player 1 can delete their game sessions"
    ON public.game_sessions FOR DELETE
    USING (auth.uid() = player1_id);

-- Admins can view all game sessions
CREATE POLICY "Admins can view all game sessions"
    ON public.game_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

-- Update trigger
CREATE TRIGGER update_game_sessions_updated_at
    BEFORE UPDATE ON public.game_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique session codes
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars like 0, O, I, 1
    code TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE public.game_sessions IS 'Active game sessions between two players';
COMMENT ON COLUMN public.game_sessions.session_code IS 'Unique 6-character code for joining game';
COMMENT ON COLUMN public.game_sessions.connection_points IS 'Total points earned - increases when player2 guesses correctly';
COMMENT ON COLUMN public.game_sessions.current_round IS 'Current round number (0 = not started, 1 = first round)';
