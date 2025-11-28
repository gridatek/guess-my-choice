-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_categories junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.post_categories (
    post_id UUID REFERENCES public.posts ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, category_id)
);

-- Create indexes
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_post_categories_post_id ON public.post_categories(post_id);
CREATE INDEX idx_post_categories_category_id ON public.post_categories(category_id);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories (everyone can read, only authenticated users can manage)
CREATE POLICY "Categories are viewable by everyone"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories"
    ON public.categories FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Policies for post_categories (follows post permissions)
CREATE POLICY "Post categories are viewable by everyone"
    ON public.post_categories FOR SELECT
    USING (true);

CREATE POLICY "Users can assign categories to their own posts"
    ON public.post_categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = post_categories.post_id
            AND posts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update categories on their own posts"
    ON public.post_categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE posts.id = post_categories.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Update trigger for categories
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
