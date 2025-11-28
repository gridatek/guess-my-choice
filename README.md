# Angular + Supabase Full-Stack Application

## Project Structure

```
project/
├── .github/
│   └── workflows/        # CI/CD workflows
├── supabase/
│   ├── functions/        # Edge Functions (Deno)
│   │   ├── admin-create-user/
│   │   ├── admin-list-users/
│   │   ├── admin-update-user/
│   │   ├── admin-delete-user/
│   │   ├── import_map.json
│   │   └── test-functions.ts
│   ├── migrations/       # Database migrations (00000-00006)
│   ├── seed.sql          # Seed data with proper auth schema
│   └── config.toml       # Supabase configuration
├── package.json          # npm scripts
├── CLAUDE.md             # AI assistant guidance
├── .gitignore
└── README.md
```

## Quick Start Guide

### Prerequisites

- [Docker Desktop](https://docs.docker.com/desktop/) installed and running (required for local
  development)
- Node.js 18+ and npm
- **Note**: GitHub Actions automatically sets up Docker on all platforms (Ubuntu, Windows, macOS)

### Start in 3 Commands

```bash
git clone <repository-url>
cd angular-supabase
npm install  # Install dependencies (uses npm workspaces)
npm run dev  # Start Supabase backend

# Start frontend (in another terminal)
npm run frontend:dev
# Or: cd frontend && npm start

# That's it! Backend and frontend are running
```

### Seed Test Data

```bash
# Reset database and load seed data (test users & posts)
npm run seed
```

**Test Users:**

- `alice@example.com` / `password123` (Admin user)
- `bob@example.com` / `password123` (Regular user)
- `carol@example.com` / `password123` (Regular user)

**Features:**

- ✅ Passwords hashed with PostgreSQL `crypt()` + bcrypt
- ✅ All GoTrue auth columns properly configured
- ✅ Email auto-confirmed, ready to login immediately
- ✅ Admin permissions set for alice (can use Edge Functions)
- ✅ Git hooks for automatic code formatting and commit message linting

## Development Commands

All commands work on Windows, Mac, and Linux:

```bash
# Start Supabase locally
npm run dev

# Stop Supabase
npm run stop

# Reset database (drops all data and re-runs migrations)
npm run reset

# Apply migrations locally
npm run migrate

# Apply migrations to production
npm run migrate:prod

# View database diff
npm run diff

# Check service status
npm run status

# View logs
npm run logs

# Open database shell
npm run shell

# Generate TypeScript types
npm run types

# Link to production project
npm run link

# Seed test data (users & posts)
npm run seed
```

## Service Endpoints

Once running (`npm run dev`), services are available at:

- **API Gateway**: http://localhost:54321 (all services route through here)
- **Edge Functions**: http://localhost:54321/functions/v1/
- **Database**: Check `npm run status` for connection string (port 54322)
- **Studio UI**: http://localhost:54323
- **Email UI (Inbucket)**: http://localhost:54324

## Edge Functions

This template includes **admin API functions** built with Deno:

- **admin-create-user** - Create new users (requires admin)
- **admin-list-users** - List all users (requires admin)
- **admin-update-user** - Update user profiles (requires admin)
- **admin-delete-user** - Delete users (requires admin)

**Testing Edge Functions:**

```bash
# The test suite is automatically run in CI
# To run manually (requires Supabase running):
deno run --allow-net --allow-env supabase/functions/test-functions.ts
```

All functions:

- Require Bearer token authentication
- Verify admin role via `profiles.is_admin`
- Return JSON with CORS headers
- Auto-served by `supabase start`

## CI/CD Workflows

### Main CI (`ci.yml`)

**Runs on:** `ubuntu-latest` (Docker pre-installed)

**Comprehensive testing pipeline:**

1. ✅ Sets up Node.js 20, Supabase CLI, and Deno
2. ✅ Starts all Supabase services
3. ✅ Applies database migrations
4. ✅ Seeds test data with proper auth schema
5. ✅ **Waits for services** - 15s + health checks
6. ✅ Verifies auth service is ready (10 retries, 3s intervals)
7. ✅ Confirms seeded users exist in database
8. ✅ Tests Edge Functions endpoint accessibility
9. ✅ **Runs Edge Functions test suite** with Deno
10. ✅ Validates admin authentication and permissions
11. ✅ Shows comprehensive logs on failure

**Key improvements:**

- Robust environment variable parsing (case-insensitive, fallbacks)
- Service health checks prevent race conditions
- Auth service readiness verification after `db reset`
- Edge Functions auto-served and tested
- Detailed error diagnostics with auth/edge-runtime logs

**Test Coverage:**

- ✅ Database schema (migrations)
- ✅ Authentication (login with seeded users)
- ✅ Edge Functions (all admin endpoints)
- ✅ Security (unauthorized/non-admin access prevention)
- ✅ Data integrity (profiles, posts, follows)

### Deployment (`deploy.yml`)

- Manual trigger only
- Deploys migrations to production
- Requires `SUPABASE_ACCESS_TOKEN` and `PROJECT_ID`

## Architecture

This setup uses Supabase CLI which automatically manages:

- **PostgreSQL** - Database with extensions
- **PostgREST** - Auto-generated REST API
- **GoTrue** - Authentication service
- **Realtime** - Real-time subscriptions
- **Storage** - File storage service
- **Kong** - API gateway

## Best Practices

### Migrations

- Use 5-digit sequential numbering (00000, 00001, 00002, etc.)
- Test locally with `npm run reset` before production
- Always enable Row Level Security (RLS) on tables
- Use `npm run diff` to check changes before applying

### Development

- Run `npm run status` to check all services
- Use `npm run logs` to debug issues
- Generate TypeScript types with `npm run types`
- Link to production with `npm run link`

## What You Get

✅ **Cross-platform**: Works on Windows, Mac, and Linux ✅ **Docker-based**: Local development with
all Supabase services ✅ **Version-controlled migrations**: 7 migrations tracking schema evolution
✅ **Proper auth schema**: All GoTrue columns configured correctly ✅ **Edge Functions**: Admin API
with Deno + comprehensive tests ✅ **Seed data**: Test users with bcrypt passwords, ready to login
✅ **Robust CI/CD**: Health checks, service verification, error diagnostics ✅ **Production ready**:
Deploy migrations with one command ✅ **Admin system**: Role-based access control with `is_admin`
flag ✅ **Battle-tested**: All CI issues resolved, fully passing tests

## Troubleshooting

### Authentication Issues

If login fails with "Invalid credentials":

- Run `npm run seed` to recreate users with proper password hashing
- Verify `pgcrypto` extension is enabled
- Check auth.users columns are non-NULL (see CLAUDE.md)

### CI/CD Issues

If GitHub Actions fails:

- Check auth service logs in workflow output
- Verify Edge Functions are in `supabase/functions/`
- Ensure Deno is set up (auto-handled by workflow)
- Review comprehensive error logs in failed step

### Edge Functions Issues

If functions don't respond:

- Ensure Deno is installed: `deno --version`
- Check import_map.json exists
- Functions auto-serve with `supabase start`
- Test: `curl http://localhost:54321/functions/v1/admin-create-user`

For more details, see **[CLAUDE.md](./CLAUDE.md)** (AI assistant guidance with full troubleshooting)
