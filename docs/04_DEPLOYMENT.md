# Production Deployment Guide

This guide covers deploying your Supabase application to production.

## Prerequisites

- A Supabase account ([Sign up](https://app.supabase.com))
- A production Supabase project
- Your database migrations tested locally

## Quick Deployment

### 1. Create Production Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Choose organization, name, database password, region
4. Wait for project to be created (~2 minutes)

### 2. Link Local to Production

```bash
npm run link
```

Follow the prompts:

1. Enter your Supabase access token (create one at
   [Account Settings](https://app.supabase.com/account/tokens))
2. Select your production project

This creates a `.env.local` file (already gitignored).

### 3. Deploy Migrations

```bash
npm run migrate:prod
```

This applies all migrations from `supabase/migrations/` to production.

### 4. Verify Deployment

Check the Supabase Dashboard:

- **Database → Tables**: Verify tables exist
- **Database → Policies**: Check RLS policies
- **API Docs**: Test endpoints

## Environment Configuration

### Local Development

```toml
# supabase/config.toml
project_id = "angular-supabase"

[db]
port = 54322

[api]
port = 54321
```

### Production

Configure in Supabase Dashboard:

1. **Settings → API**
   - Copy your `URL` and `anon` key
   - These are your production credentials

2. **Settings → Database**
   - Connection string
   - Connection pooling settings

## Frontend Deployment

### Option 1: Vercel

```bash
cd frontend
npm run build

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment Variables** (in Vercel dashboard):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Option 2: Netlify

```bash
cd frontend
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist/frontend
```

**Environment Variables** (in Netlify dashboard):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Option 3: Static Hosting

Build and upload `frontend/dist/` to any static host:

- AWS S3 + CloudFront
- GitHub Pages
- Firebase Hosting
- Cloudflare Pages

## Database Management

### Applying New Migrations

```bash
# Create migration locally
echo "ALTER TABLE users ADD COLUMN role TEXT;" > supabase/migrations/00006_add_roles.sql

# Test locally
npm run reset

# Deploy to production
npm run migrate:prod
```

### Backing Up Production Database

Via Supabase Dashboard:

1. **Database → Backups**
2. Enable daily backups (automatic on Pro plan)
3. Download manual backup if needed

Via CLI:

```bash
# Dump database
supabase db dump -f backup.sql

# Restore database (be careful!)
supabase db reset --db-url "your-connection-string" -f backup.sql
```

## Security Checklist

### Before Going Live

- [ ] Enable RLS on all tables
- [ ] Review and test all RLS policies
- [ ] Remove seed data from production
- [ ] Set strong database password
- [ ] Configure auth providers (email, OAuth)
- [ ] Enable email confirmations
- [ ] Set proper CORS settings
- [ ] Review API rate limits
- [ ] Enable SSL for database connections
- [ ] Set up monitoring and alerts

### Remove Seed Data

```sql
-- In production, run this once:
DELETE FROM public.user_followers;
DELETE FROM public.posts;
DELETE FROM public.users;
```

Or create a migration:

```sql
-- supabase/migrations/00007_remove_seed_data.sql
-- Only run in production!

DELETE FROM public.user_followers;
DELETE FROM public.posts;
DELETE FROM public.users WHERE email LIKE '%@example.com';
```

## Authentication Setup

### Email Authentication

In Supabase Dashboard → **Authentication → Providers**:

1. Enable Email provider
2. Configure email templates
3. Set up SMTP (or use Supabase's built-in email)

### OAuth Providers

Example: GitHub OAuth

1. **Create GitHub OAuth App**:
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Set callback URL: `https://your-project.supabase.co/auth/v1/callback`

2. **Configure in Supabase**:

   ```toml
   # Update supabase/config.toml for local
   [auth.external.github]
   enabled = true
   client_id = "your-client-id"
   secret = "your-secret"
   ```

3. **Production**: Set in Dashboard → Authentication → Providers → GitHub

## Monitoring and Logging

### Supabase Dashboard

Monitor in **Project Settings → Usage**:

- API requests
- Database size
- Bandwidth
- Active users

### View Logs

```bash
# Production logs (requires linking)
supabase functions logs
supabase db logs
```

### Set Up Alerts

In Supabase Dashboard:

1. **Settings → Billing → Usage**
2. Set up email alerts for:
   - Database size limits
   - Bandwidth limits
   - API request limits

## Performance Optimization

### Database Indexes

```sql
-- Add indexes for common queries
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_users_email ON public.users(email);
```

### Connection Pooling

Enable in Dashboard → **Settings → Database → Connection Pooling**

Use pooler URL for serverless environments:

```
postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Caching

Implement caching for frequently accessed data:

- Browser cache (Cache-Control headers)
- CDN caching for static assets
- Application-level caching (Redis, Upstash)

## Scaling

### Upgrading Your Plan

As your app grows, consider upgrading:

| Plan           | Use Case                      |
| -------------- | ----------------------------- |
| **Free**       | Development, small projects   |
| **Pro**        | Production apps, $25/month    |
| **Team**       | Collaborative teams           |
| **Enterprise** | Custom SLA, dedicated support |

### Database Scaling

- **Vertical**: Upgrade instance size in Dashboard
- **Read Replicas**: Available on Pro plan and above
- **Connection Pooling**: Use pgBouncer (built-in)

## Disaster Recovery

### Backup Strategy

1. **Automated Daily Backups** (Pro plan)
2. **Manual Backups** before major changes
3. **Migration History** in git

### Restore Process

```bash
# Download backup from Dashboard
# Restore to new project
supabase db reset --db-url "connection-string" -f backup.sql
```

## CI/CD Deployment

### GitHub Actions

Already configured in `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: supabase/setup-cli@v1
      - run: npm run migrate:prod
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: ${{ secrets.SUPABASE_PROJECT_ID }}
```

**Setup**:

1. Add secrets to GitHub repo
2. Push to main or create a tag
3. Workflow runs automatically

## Domain Configuration

### Custom Domain

In Supabase Dashboard → **Settings → API**:

1. Click **Custom domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Add DNS records as shown
4. Wait for verification

### SSL Certificates

Automatically managed by Supabase.

## Environment Variables

### Frontend

Create `.env.production` in your frontend:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Edge Functions)

If you add Edge Functions:

```bash
supabase secrets set MY_SECRET=value
```

## Testing Production

### Health Check

```bash
# Test API
curl https://your-project.supabase.co/rest/v1/ \
  -H "apikey: your-anon-key"

# Test specific table
curl https://your-project.supabase.co/rest/v1/users \
  -H "apikey: your-anon-key"
```

### Smoke Tests

After deployment:

1. Test user registration
2. Test login/logout
3. Test data queries
4. Test file uploads (if using Storage)
5. Test real-time subscriptions (if using)

## Rollback Strategy

### If Migration Fails

1. **Don't panic** - migrations are transactional
2. Check error in dashboard logs
3. Fix migration locally
4. Create new migration to correct issue
5. Deploy corrected migration

### Emergency Rollback

```bash
# Option 1: Restore from backup
# Download backup from Dashboard → Database → Backups

# Option 2: Create reverse migration
# supabase/migrations/00008_rollback_changes.sql
DROP TABLE IF EXISTS new_table;
ALTER TABLE users DROP COLUMN new_column;
```

## Post-Deployment Checklist

- [ ] Migrations applied successfully
- [ ] All tables exist and have correct schema
- [ ] RLS policies are working
- [ ] Authentication is configured
- [ ] Frontend is connected and working
- [ ] Test user registration/login
- [ ] Check API rate limits
- [ ] Monitor error logs
- [ ] Set up status page/monitoring
- [ ] Document production URLs

## Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Database Optimization](https://supabase.com/docs/guides/database/overview)
- [Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)

## Getting Help

- [Supabase Discord](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Support Email](mailto:support@supabase.io) (Pro plan and above)
