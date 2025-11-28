-- Create game_rounds table
CREATE TABLE IF NOT EXISTS public.game_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_session_id UUID REFERENCES public.game_sessions ON DELETE CASCADE NOT NULL,
    round_number INTEGER NOT NULL CHECK (round_number >= 1),
    selected_options UUID[] NOT NULL, -- Array of option IDs shown this round
    player1_choice UUID, -- Which option player1 chose
    player2_guess UUID, -- Which option player2 guessed
    is_correct BOOLEAN, -- Did player2 guess correctly?
    points_earned INTEGER DEFAULT 0 CHECK (points_earned >= 0),
    player1_feedback TEXT, -- Optional feedback from player1
    player2_feedback TEXT, -- Optional feedback from player2
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE (game_session_id, round_number),
    -- Ensure player choices are from selected_options
    CHECK (player1_choice = ANY(selected_options) OR player1_choice IS NULL),
    CHECK (player2_guess = ANY(selected_options) OR player2_guess IS NULL)
);

-- Create indexes
CREATE INDEX idx_game_rounds_session_id ON public.game_rounds(game_session_id);
CREATE INDEX idx_game_rounds_round_number ON public.game_rounds(game_session_id, round_number);
CREATE INDEX idx_game_rounds_created_at ON public.game_rounds(created_at DESC);

-- Enable RLS
ALTER TABLE public.game_rounds ENABLE ROW LEVEL SECURITY;

-- Policies: Players can only see rounds from their own game sessions
CREATE POLICY "Players can view their own game rounds"
    ON public.game_rounds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.game_sessions
            WHERE game_sessions.id = game_rounds.game_session_id
              AND (game_sessions.player1_id = auth.uid() OR game_sessions.player2_id = auth.uid())
        )
    );

-- Players can create rounds for their game sessions
CREATE POLICY "Players can create rounds for their games"
    ON public.game_rounds FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.game_sessions
            WHERE game_sessions.id = game_rounds.game_session_id
              AND (game_sessions.player1_id = auth.uid() OR game_sessions.player2_id = auth.uid())
        )
    );

-- Players can update rounds (for making choices and guesses)
CREATE POLICY "Players can update their game rounds"
    ON public.game_rounds FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.game_sessions
            WHERE game_sessions.id = game_rounds.game_session_id
              AND (game_sessions.player1_id = auth.uid() OR game_sessions.player2_id = auth.uid())
        )
    );

-- Admins can view all rounds
CREATE POLICY "Admins can view all game rounds"
    ON public.game_rounds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

-- Function to calculate if guess was correct and award points
CREATE OR REPLACE FUNCTION check_round_guess()
RETURNS TRIGGER AS $$
BEGIN
    -- If both player1_choice and player2_guess exist, check if correct
    IF NEW.player1_choice IS NOT NULL AND NEW.player2_guess IS NOT NULL THEN
        NEW.is_correct := (NEW.player1_choice = NEW.player2_guess);

        -- Award points if correct (can be customized)
        IF NEW.is_correct THEN
            NEW.points_earned := 10; -- Base points for correct guess
        ELSE
            NEW.points_earned := 0;
        END IF;

        -- Mark round as completed
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := NOW();
        END IF;

        -- Update game session connection points
        UPDATE public.game_sessions
        SET connection_points = connection_points + NEW.points_earned
        WHERE id = NEW.game_session_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate round results
CREATE TRIGGER check_round_guess_trigger
    BEFORE UPDATE ON public.game_rounds
    FOR EACH ROW
    WHEN (NEW.player2_guess IS NOT NULL AND OLD.player2_guess IS NULL)
    EXECUTE FUNCTION check_round_guess();

-- Add comments
COMMENT ON TABLE public.game_rounds IS 'Individual rounds within a game session - stores options shown and player choices';
COMMENT ON COLUMN public.game_rounds.selected_options IS 'Array of option UUIDs shown to players this round (typically 4-6 options)';
COMMENT ON COLUMN public.game_rounds.player1_choice IS 'The option UUID that player1 secretly chose';
COMMENT ON COLUMN public.game_rounds.player2_guess IS 'The option UUID that player2 guessed';
COMMENT ON COLUMN public.game_rounds.is_correct IS 'Whether player2 guessed correctly (auto-calculated)';
COMMENT ON COLUMN public.game_rounds.points_earned IS 'Points awarded for this round (auto-calculated)';
