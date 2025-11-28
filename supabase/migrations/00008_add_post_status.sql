-- Create post status enum
CREATE TYPE post_status AS ENUM ('draft', 'published');

-- Add status column to posts table
ALTER TABLE public.posts
ADD COLUMN status post_status DEFAULT 'draft';

-- Set status based on existing published column
UPDATE public.posts
SET status = CASE
    WHEN published = true THEN 'published'::post_status
    ELSE 'draft'::post_status
END;

-- Update RLS policies to use status instead of published
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own unpublished posts" ON public.posts;

CREATE POLICY "Published posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (status = 'published');

CREATE POLICY "Users can view their own draft posts"
    ON public.posts FOR SELECT
    USING (auth.uid() = user_id);

-- Create index on status
CREATE INDEX idx_posts_status ON public.posts(status);

-- Note: We keep the published column for backward compatibility
-- but status is now the source of truth
