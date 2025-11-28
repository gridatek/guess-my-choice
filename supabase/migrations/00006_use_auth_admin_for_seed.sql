-- This migration is intentionally empty
-- The seed data will be handled by seed.sql using proper auth functions

-- Note: Direct insertion into auth.users is problematic because:
-- 1. Password hashing must match GoTrue's expectations exactly
-- 2. Multiple auth-related columns must have correct non-NULL values
-- 3. The trigger system must be properly coordinated

-- Instead, we'll use Supabase's auth.admin API via the seed file
