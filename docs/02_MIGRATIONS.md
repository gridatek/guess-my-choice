# Database Migrations Guide

This guide covers everything you need to know about managing database migrations in this Supabase template.

## What Are Migrations?

Migrations are version-controlled SQL files that define your database schema changes over time. They allow you to:

- Track database changes in git
- Apply changes consistently across environments
- Roll back changes if needed
- Collaborate on schema changes with your team

## Migration Files

Migrations are stored in `supabase/migrations/` and use sequential numbering:

```
supabase/migrations/
├── 00000_create_users_table.sql
├── 00001_create_posts_table.sql
├── 00002_add_user_followers.sql
└── ...
```

### Naming Convention

Format: `[5-digit-number]_[descriptive_name].sql`

Examples:
- ✅ `00003_add_user_profiles.sql`
- ✅ `00004_create_comments_table.sql`
- ❌ `3_add_profiles.sql` (missing leading zeros)
- ❌ `add_profiles.sql` (missing number)

## Creating Migrations

### Method 1: Manual Creation

Create a new file in `supabase/migrations/`:

```sql
-- supabase/migrations/00003_create_comments_table.sql

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read comments"
  ON public.comments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Updated timestamp trigger
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Method 2: Generate from Database Changes

If you make changes directly in the database (via Studio or SQL shell):

```bash
# Compare local database with migrations
npm run diff

# Save changes to a new migration file
npm run diff > supabase/migrations/00003_my_changes.sql
```

## Applying Migrations

### Local Development

```bash
# Apply all pending migrations
npm run migrate

# Or reset database and reapply all migrations
npm run reset
```

### Production

```bash
# Link to your production project (first time only)
npm run link

# Apply migrations to production
npm run migrate:prod
```

## Migration Best Practices

### 1. Always Enable RLS

```sql
-- ✅ Good
CREATE TABLE public.users (...);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ❌ Bad - Security risk!
CREATE TABLE public.users (...);
```

### 2. Use Descriptive Names

```sql
-- ✅ Good
00003_add_user_avatar_column.sql

-- ❌ Bad
00003_update.sql
```

### 3. Make Migrations Idempotent

Use `IF NOT EXISTS` and `IF EXISTS`:

```sql
-- ✅ Safe to run multiple times
CREATE TABLE IF NOT EXISTS public.users (...);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ❌ Will fail if run twice
CREATE TABLE public.users (...);
CREATE INDEX idx_users_email ON public.users(email);
```

### 4. Test Locally First

```bash
# Always test migrations locally before production
npm run reset
npm run status

# Verify everything works
# Then apply to production
npm run migrate:prod
```

### 5. Use Transactions for Complex Changes

```sql
BEGIN;

-- Multiple related changes
ALTER TABLE public.users ADD COLUMN role TEXT;
UPDATE public.users SET role = 'user' WHERE role IS NULL;
ALTER TABLE public.users ALTER COLUMN role SET NOT NULL;

COMMIT;
```

### 6. Add Comments

```sql
-- Migration: Add user roles system
-- Purpose: Support admin/moderator/user roles
-- Date: 2024-01-15

CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');

ALTER TABLE public.users
  ADD COLUMN role user_role DEFAULT 'user' NOT NULL;
```

## Common Migration Patterns

### Adding a Column

```sql
ALTER TABLE public.users
  ADD COLUMN avatar_url TEXT;
```

### Removing a Column

```sql
ALTER TABLE public.users
  DROP COLUMN avatar_url;
```

### Creating an Index

```sql
CREATE INDEX IF NOT EXISTS idx_posts_created_at
  ON public.posts(created_at DESC);
```

### Creating a Function

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Creating a Trigger

```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Checking Migration Status

```bash
# View database differences
npm run diff

# Check which migrations are applied
npm run shell
\dt  -- List all tables
```

## Rolling Back Migrations

There is no automatic rollback. To undo a migration:

1. Create a new migration that reverses the changes
2. Or reset and remove the migration file (local only)

```bash
# Local only - removes all data!
npm run stop
# Delete the problematic migration file
npm run reset
```

## Migration Workflow Example

```bash
# 1. Create migration file
echo "CREATE TABLE public.products (...);" > supabase/migrations/00005_create_products.sql

# 2. Apply locally
npm run reset

# 3. Test your app
npm run status

# 4. Commit to git
git add supabase/migrations/00005_create_products.sql
git commit -m "Add products table"

# 5. Deploy to production
npm run migrate:prod
```

## Troubleshooting

### Migration Fails

```bash
# Check logs
npm run logs

# Check what went wrong
npm run shell
SELECT * FROM supabase_migrations.schema_migrations;
```

### Schema Drift

If your database schema doesn't match migrations:

```bash
# See differences
npm run diff

# Reset to migrations (local only - destroys data!)
npm run reset
```

### Production Migration Failed

1. Check production logs
2. Fix the migration file
3. Create a new migration to correct the issue
4. Never edit applied migrations

## Resources

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
