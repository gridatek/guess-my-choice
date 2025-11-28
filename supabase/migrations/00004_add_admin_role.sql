-- Add admin role column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
ON public.profiles(is_admin)
WHERE is_admin = true;

-- Comment on the column
COMMENT ON COLUMN public.profiles.is_admin IS
'Indicates whether the user has administrative privileges for admin API functions.';
