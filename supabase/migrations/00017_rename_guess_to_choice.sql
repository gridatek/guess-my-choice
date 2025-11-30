-- Rename player2_guess to player2_choice to reflect simultaneous gameplay
ALTER TABLE public.game_rounds
RENAME COLUMN player2_guess TO player2_choice;

-- Update the check constraint
ALTER TABLE public.game_rounds
DROP CONSTRAINT IF EXISTS game_rounds_player2_guess_check;

ALTER TABLE public.game_rounds
ADD CONSTRAINT game_rounds_player2_choice_check
CHECK (player2_choice = ANY(selected_options) OR player2_choice IS NULL);

-- Update the trigger to fire when player2_choice is set (instead of player2_guess)
DROP TRIGGER IF EXISTS check_round_guess_trigger ON public.game_rounds;

CREATE TRIGGER check_round_completion_trigger
    BEFORE UPDATE ON public.game_rounds
    FOR EACH ROW
    WHEN (NEW.player2_choice IS NOT NULL AND OLD.player2_choice IS NULL)
    EXECUTE FUNCTION check_round_guess();

-- Update comments to reflect simultaneous gameplay
COMMENT ON COLUMN public.game_rounds.player2_choice IS 'The option UUID that player2 chose (simultaneous with player1)';
COMMENT ON COLUMN public.game_rounds.is_correct IS 'Whether both players chose the same option (match = correct)';
