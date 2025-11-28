# CI/CD with GitHub Actions

This template includes pre-configured GitHub Actions workflows for automated testing and deployment.

## Workflows Overview

### 1. Main CI (`ci.yml`)

Runs on every push and pull request to the `main` branch.

**What it does:**
- ✅ Tests on Ubuntu, Windows, and macOS
- ✅ Sets up Docker automatically on all platforms
- ✅ Starts Supabase services
- ✅ Runs database migrations
- ✅ Checks schema differences
- ✅ Validates API and database connectivity
- ✅ Provides logs on failure

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

### 2. Angular Integration (`angular-integration.yml`)

Runs when frontend or Supabase files change.

**What it does:**
- ✅ Starts Supabase backend
- ✅ Installs frontend dependencies
- ✅ Builds Angular application
- ✅ Runs Angular unit tests

**Triggers:**
- Changes to `frontend/**` or `supabase/**`
- Pull requests affecting frontend
- Manual trigger via `workflow_dispatch`

### 3. Deployment (`deploy.yml`)

Deploys migrations to production.

**What it does:**
- ✅ Applies migrations to production Supabase project
- ✅ Runs health checks
- ✅ Verifies deployment success

**Triggers:**
- Push to `main` branch (tag-based)
- Manual trigger

## Setup

### 1. GitHub Secrets

Add these secrets to your repository:

Go to: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SUPABASE_ACCESS_TOKEN` | Your Supabase access token | [Supabase Dashboard](https://app.supabase.com/account/tokens) |
| `SUPABASE_PROJECT_ID` | Your production project ID | Supabase project settings |

### 2. Link Production Project

```bash
# One-time setup
npm run link

# Follow prompts to select your production project
```

## Customizing Workflows

### Removing the Health Check

If you don't need the health check step:

1. Open `.github/workflows/ci.yml`
2. Find the "Test database connection and data" step
3. Delete lines 43-58

```yaml
# Remove this entire section:
# Optional: Test database and services health (remove if not needed)
- name: Test database connection and data
  shell: bash
  run: |
    # ... (delete all this)
```

### Adding Custom Tests

Add your test command after the health check:

```yaml
# In .github/workflows/ci.yml
- run: npm run diff
  shell: bash

# Add your tests here
- name: Run tests
  shell: bash
  run: npm test
  working-directory: ./your-app-directory

- run: npm run logs
  if: failure()
  shell: bash
```

### Changing Test Matrix

To test only on specific platforms:

```yaml
# Before
matrix:
  os: [ubuntu-latest, windows-latest, macos-latest]

# After (Linux only)
jobs:
  test:
    runs-on: ubuntu-latest
```

## Dogfooding Pattern

This template uses the same commands in CI/CD as in local development:

| Local Development | GitHub Actions |
|-------------------|----------------|
| `npm run dev` | `npm run dev` |
| `npm run migrate` | `npm run migrate` |
| `npm run status` | `npm run status` |
| `npm run stop` | `npm run stop` |

**Why this matters:**
- Easier to debug CI issues locally
- Consistent behavior across environments
- Simpler maintenance

## Health Check Details

The CI workflow includes an optional health check that:

1. **Gets API URL** from `supabase status`
2. **Tests API endpoint** with curl
3. **Queries database** to verify data access
4. **Fails the build** if any service is down

Example output:
```bash
Testing API endpoint...
Testing database tables...
✅ All services responding and database accessible
```

## Manual Workflow Triggers

Run workflows manually from GitHub:

1. Go to **Actions** tab
2. Select a workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

## Deployment Workflow

### Automatic Deployment

Push a tag to deploy:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Manual Deployment

```bash
# Apply migrations to production
npm run migrate:prod
```

## Monitoring Workflows

### View Workflow Status

Go to: **Actions** tab in your repository

### Check Logs

1. Click on a workflow run
2. Click on the job (e.g., "test (ubuntu-latest)")
3. Expand steps to view logs

### Failed Workflows

When a workflow fails:

1. Check the logs in GitHub Actions
2. Look for the "View logs" step output
3. Reproduce locally:
   ```bash
   npm run dev
   npm run migrate
   npm run status
   ```

## Environment-Specific Configuration

### Local Development

Uses `supabase/config.toml` settings:
- API port: 54321
- DB port: 54322
- Email UI: 54324

### GitHub Actions

Uses the same configuration automatically.

### Production

Configure in Supabase Dashboard:
- Custom domain
- Environment variables
- Auth providers

## Best Practices

### 1. Test Migrations Locally First

```bash
# Before pushing
npm run reset
npm run status
git push
```

### 2. Use Pull Requests

Always use PRs to trigger CI checks before merging to main.

### 3. Keep Workflows Fast

- Use `fail-fast: false` to see all platform failures
- Cache dependencies when possible
- Exclude unnecessary services in tests

### 4. Secure Secrets

- Never commit secrets to git
- Use GitHub Secrets for sensitive data
- Rotate access tokens regularly

## Troubleshooting

### Docker Setup Fails

The `docker/setup-docker-action@v3` should handle Docker on all platforms. If it fails:

1. Check the action logs
2. Verify Docker image availability
3. Try running on `ubuntu-latest` only

### Migration Fails in CI

```bash
# Check diff locally
npm run diff

# Test migration
npm run reset
npm run migrate
```

### Health Check Fails

Common causes:
1. Services not fully started (add wait time)
2. Wrong API URL
3. RLS policies blocking access

Fix:
```yaml
- run: npm run dev
  shell: bash

# Add wait time
- run: sleep 10
  shell: bash

- run: npm run status
  shell: bash
```

### Platform-Specific Failures

If tests fail on specific platforms:

1. Check platform-specific Docker compatibility
2. Review file path differences (Windows uses backslashes)
3. Shell differences (use `shell: bash` consistently)

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Supabase CLI in CI/CD](https://supabase.com/docs/guides/cli/cicd-workflow)
- [Docker Setup Action](https://github.com/docker/setup-docker-action)
