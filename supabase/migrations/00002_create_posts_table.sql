-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
                                            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    slug TEXT UNIQUE NOT NULL,
    published BOOLEAN DEFAULT false,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
    );

-- Create indexes
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_published ON public.posts(published);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_tags ON public.posts USING GIN(tags);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Published posts are viewable by everyone"
    ON public.posts FOR SELECT
                                   USING (published = true);

CREATE POLICY "Users can view their own unpublished posts"
    ON public.posts FOR SELECT
                                   USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts"
    ON public.posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE
                                          USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE
USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();