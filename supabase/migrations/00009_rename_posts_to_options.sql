-- Migration: Rename posts table to options for game functionality
-- This adapts the existing posts structure to store game options/choices

-- Drop dependent views first
DROP VIEW IF EXISTS public.profile_stats;

-- Rename the table
ALTER TABLE public.posts RENAME TO options;

-- Rename columns to match game domain
ALTER TABLE public.options RENAME COLUMN title TO option_text;
ALTER TABLE public.options RENAME COLUMN content TO description;

-- Drop columns we don't need for game options
ALTER TABLE public.options DROP COLUMN IF EXISTS slug;
ALTER TABLE public.options DROP COLUMN IF EXISTS published;
ALTER TABLE public.options DROP COLUMN IF EXISTS published_at;

-- Add new columns for game functionality
ALTER TABLE public.options ADD COLUMN IF NOT EXISTS session_type TEXT NOT NULL DEFAULT 'friends'
    CHECK (session_type IN ('friends', 'couple', 'adult'));

ALTER TABLE public.options ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1
    CHECK (difficulty_level >= 1 AND difficulty_level <= 5);

ALTER TABLE public.options ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived'));

-- Update indexes (drop old ones and create new ones)
DROP INDEX IF EXISTS idx_posts_user_id;
DROP INDEX IF EXISTS idx_posts_slug;
DROP INDEX IF EXISTS idx_posts_published;
DROP INDEX IF EXISTS idx_posts_created_at;
DROP INDEX IF EXISTS idx_posts_tags;

CREATE INDEX idx_options_user_id ON public.options(user_id);
CREATE INDEX idx_options_session_type ON public.options(session_type);
CREATE INDEX idx_options_difficulty_level ON public.options(difficulty_level);
CREATE INDEX idx_options_status ON public.options(status);
CREATE INDEX idx_options_created_at ON public.options(created_at DESC);
CREATE INDEX idx_options_tags ON public.options USING GIN(tags);

-- RLS is already enabled from posts table
-- Update RLS policies

-- Drop old policies
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.options;
DROP POLICY IF EXISTS "Users can view their own unpublished posts" ON public.options;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.options;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.options;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.options;

-- Create new policies for options
CREATE POLICY "Published options are viewable by everyone"
    ON public.options FOR SELECT
    USING (status = 'published');

CREATE POLICY "Admins can view all options"
    ON public.options FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can create options"
    ON public.options FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update options"
    ON public.options FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can delete options"
    ON public.options FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

-- Update trigger (rename from posts to options)
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.options;
CREATE TRIGGER update_options_updated_at
    BEFORE UPDATE ON public.options
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.options IS 'Game options pool - admin-created choices that players select from during game sessions';

-- Recreate profile_stats view with updated table and column names
CREATE OR REPLACE VIEW public.profile_stats AS
SELECT
    p.id,
    p.username,
    COUNT(DISTINCT f1.follower_id) as followers_count,
    COUNT(DISTINCT f2.following_id) as following_count,
    COUNT(DISTINCT opts.id) as posts_count
FROM public.profiles p
         LEFT JOIN public.follows f1 ON f1.following_id = p.id
         LEFT JOIN public.follows f2 ON f2.follower_id = p.id
         LEFT JOIN public.options opts ON opts.user_id = p.id AND opts.status = 'published'
GROUP BY p.id, p.username;
