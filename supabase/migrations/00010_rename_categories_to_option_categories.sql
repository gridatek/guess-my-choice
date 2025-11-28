-- Migration: Rename categories to option_categories for game functionality
-- This adapts categories to organize game options

-- Rename the main table
ALTER TABLE public.categories RENAME TO option_categories;

-- Rename the junction table
ALTER TABLE public.post_categories RENAME TO option_category_assignments;

-- Update foreign key column names in junction table
ALTER TABLE public.option_category_assignments RENAME COLUMN post_id TO option_id;
ALTER TABLE public.option_category_assignments RENAME COLUMN category_id TO option_category_id;

-- Update indexes
DROP INDEX IF EXISTS idx_categories_slug;
DROP INDEX IF EXISTS idx_post_categories_post_id;
DROP INDEX IF EXISTS idx_post_categories_category_id;

CREATE INDEX idx_option_categories_slug ON public.option_categories(slug);
CREATE INDEX idx_option_category_assignments_option_id ON public.option_category_assignments(option_id);
CREATE INDEX idx_option_category_assignments_category_id ON public.option_category_assignments(option_category_id);

-- RLS is already enabled from categories table

-- Drop old policies
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.option_categories;
DROP POLICY IF EXISTS "Authenticated users can create categories" ON public.option_categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.option_categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.option_categories;

DROP POLICY IF EXISTS "Post categories are viewable by everyone" ON public.option_category_assignments;
DROP POLICY IF EXISTS "Users can assign categories to their own posts" ON public.option_category_assignments;
DROP POLICY IF EXISTS "Users can update categories on their own posts" ON public.option_category_assignments;

-- Create new policies for option_categories
CREATE POLICY "Option categories are viewable by everyone"
    ON public.option_categories FOR SELECT
    USING (true);

CREATE POLICY "Admins can create option categories"
    ON public.option_categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update option categories"
    ON public.option_categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can delete option categories"
    ON public.option_categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

-- Create policies for option_category_assignments
CREATE POLICY "Option category assignments are viewable by everyone"
    ON public.option_category_assignments FOR SELECT
    USING (true);

CREATE POLICY "Admins can assign categories to options"
    ON public.option_category_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can remove category assignments"
    ON public.option_category_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.is_admin = true
        )
    );

-- Update trigger (rename from categories to option_categories)
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.option_categories;
CREATE TRIGGER update_option_categories_updated_at
    BEFORE UPDATE ON public.option_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.option_categories IS 'Categories to organize game options (e.g., Outdoor, Food, Romantic, Funny)';
COMMENT ON TABLE public.option_category_assignments IS 'Junction table linking options to their categories';
