-- Create questions table for game prompts
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    question_text TEXT NOT NULL,
    description TEXT,
    session_type TEXT NOT NULL CHECK (session_type IN ('friends', 'couple', 'adult')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    tags TEXT[],
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_session_type ON public.questions(session_type);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.questions(user_id);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions table
-- Anyone can read published questions
CREATE POLICY "Anyone can read published questions"
    ON public.questions
    FOR SELECT
    USING (status = 'published');

-- Users can read their own questions regardless of status
CREATE POLICY "Users can read own questions"
    ON public.questions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only admins can create questions
CREATE POLICY "Admins can create questions"
    ON public.questions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Admins can update any question, users can update their own
CREATE POLICY "Admins can update any question, users can update own"
    ON public.questions
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Admins can delete any question, users can delete their own
CREATE POLICY "Admins can delete any question, users can delete own"
    ON public.questions
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.questions IS 'Questions/prompts that frame the game rounds (e.g., "What would I prefer to do this weekend?")';
