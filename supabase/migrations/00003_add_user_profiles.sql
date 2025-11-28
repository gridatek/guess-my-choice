-- Add social links to profiles
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Create followers relationship
CREATE TABLE IF NOT EXISTS public.follows (
                                              follower_id UUID REFERENCES auth.users ON DELETE CASCADE,
                                              following_id UUID REFERENCES auth.users ON DELETE CASCADE,
                                              created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id != following_id)
    );

-- Create indexes
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies for follows
CREATE POLICY "Users can view all follows"
    ON public.follows FOR SELECT
                                     USING (true);

CREATE POLICY "Users can follow others"
    ON public.follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- Create view for follower counts
CREATE OR REPLACE VIEW public.profile_stats AS
SELECT
    p.id,
    p.username,
    COUNT(DISTINCT f1.follower_id) as followers_count,
    COUNT(DISTINCT f2.following_id) as following_count,
    COUNT(DISTINCT posts.id) as posts_count
FROM public.profiles p
         LEFT JOIN public.follows f1 ON f1.following_id = p.id
         LEFT JOIN public.follows f2 ON f2.follower_id = p.id
         LEFT JOIN public.posts ON posts.user_id = p.id AND posts.published = true
GROUP BY p.id, p.username;