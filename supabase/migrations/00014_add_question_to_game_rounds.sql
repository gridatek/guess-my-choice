-- Add question_id to game_rounds table
ALTER TABLE public.game_rounds
ADD COLUMN question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_rounds_question_id ON public.game_rounds(question_id);

-- Add comment
COMMENT ON COLUMN public.game_rounds.question_id IS 'Optional question/prompt that frames this round (e.g., "What would I prefer to do this weekend?")';
