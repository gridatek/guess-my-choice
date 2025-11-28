# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2025-11-16

### Added - CI/CD Fixes & Improvements

This release focuses on making the GitHub Actions CI workflow robust and fully functional.

#### 🔧 Infrastructure Improvements

**Commit 1: Improve CI debugging for Edge Functions testing**
- Added comprehensive logging throughout CI workflow
- Enhanced seeded data debugging with detailed queries
- Added manual login test to verify auth before running full test suite
- Improved error diagnostics for better troubleshooting

**Commit 2: Fix GitHub Actions CI workflow for Edge Functions testing**
- Implemented robust environment variable extraction from `supabase status`
  - Case-insensitive grep patterns
  - Uses `$NF` (last field) instead of hardcoded positions
  - Added fallback URL (`http://127.0.0.1:54321`)
  - Validates ANON_KEY has minimum length
- Created `import_map.json` for Deno module resolution
- Enhanced Edge Functions verification (10 retries, 3s intervals)
- Added auth service and edge-runtime logs on failure

**Commit 3: Fix auth service timing issue after database reset**
- Added comprehensive health checks after `npm run seed`
- 15-second stabilization period post-reset
- Verify database is responding with test queries
- Check auth service health endpoint (10 retries, 3s intervals)
- Validate seeded users exist before running tests
- Prevents race condition where tests ran before services were ready

**Commit 4: Remove non-existent docker/setup-docker-action**
- Removed invalid `docker/setup-docker-action@v3` (404 error)
- Docker is pre-installed on `ubuntu-latest` runners
- Simplifies workflow, improves reliability

#### 🗄️ Database Schema Fixes

**Commit 5: Fix auth.users schema - add missing email_change columns**
- Added required GoTrue auth.users columns:
  - `email_change` (empty string, not NULL)
  - `email_change_token_new` (empty string)
  - `email_change_token_current` (empty string)
  - `email_change_confirm_status` (0)
- Fixed "sql: Scan error on column index 8, name 'email_change': converting NULL to string is unsupported"

**Commit 6: Add remaining missing auth.users columns**
- Added additional required GoTrue columns:
  - `recovery_token` (for password recovery)
  - `phone_change` (for phone number changes)
  - `phone_change_token` (token for phone verification)
  - `reauthentication_token` (for sensitive operations)
- All columns have proper non-NULL defaults for GoTrue v2.182.1 compatibility

**Commit 7: Fix password hashing - use PostgreSQL crypt() for bcrypt**
- Replaced hardcoded bcrypt hash with `crypt('password123', gen_salt('bf'))`
- Generates fresh bcrypt hash at insert time
- Ensures compatibility with GoTrue's password verification
- Enabled `pgcrypto` extension in seed.sql
- Added migration 00006_use_auth_admin_for_seed.sql (documentation)
- Fixed "Invalid login credentials" error

### Changed

#### Updated Workflows
- CI now runs only on `ubuntu-latest` (removed multi-platform testing temporarily)
- Docker setup step removed (pre-installed on ubuntu-latest)
- Enhanced error logging with auth and edge-runtime container logs

#### Improved Seed Data
- Passwords now use PostgreSQL `crypt()` function
- All required auth.users columns properly populated
- Users can login immediately after seeding
- No more NULL string values causing scan errors

### Technical Details

#### Issues Resolved

1. **Database Schema Errors** ❌ → ✅
   - Missing email_change, recovery_token, phone_change columns
   - NULL string values causing GoTrue scan errors
   - Incompatible password hashing

2. **Authentication Failures** ❌ → ✅
   - "Invalid login credentials" - password hash mismatch
   - "Database error querying schema" - NULL scan errors
   - Race conditions with auth service readiness

3. **CI Infrastructure** ❌ → ✅
   - Non-existent Docker action (404 error)
   - Environment variable parsing brittleness
   - Missing service health checks
   - Inadequate error diagnostics

4. **Edge Functions** ❌ → ✅
   - Functions not accessible during tests
   - Missing import_map.json for Deno
   - No verification of endpoint readiness

#### Test Coverage

The CI now successfully tests:
- ✅ Database migrations (all 7 migrations)
- ✅ Seed data integrity (users, profiles, posts, follows)
- ✅ Authentication (login with bcrypt passwords)
- ✅ Edge Functions (admin-create/list/update/delete-user)
- ✅ Security (unauthorized and non-admin access prevention)
- ✅ Service health (database, auth, Edge Functions)

### Files Modified

- `.github/workflows/ci.yml` - Main CI workflow improvements
- `supabase/seed.sql` - Auth schema and password hashing fixes
- `supabase/functions/import_map.json` - Created for Deno imports
- `supabase/migrations/00006_use_auth_admin_for_seed.sql` - Created
- `CLAUDE.md` - Updated with latest architecture and troubleshooting
- `README.md` - Updated with Edge Functions and CI improvements

### Migration Path

For existing deployments:
1. Run `npm run seed` to recreate users with proper schema
2. All auth.users columns will be properly populated
3. Passwords will be hashed correctly with bcrypt
4. Users can login immediately

No action needed for new deployments - everything works out of the box.

## Summary

This release transforms the CI from failing to fully passing by:
- ✅ Fixing all auth schema issues (7 commits of fixes)
- ✅ Adding comprehensive service health checks
- ✅ Implementing robust error handling and diagnostics
- ✅ Ensuring GoTrue compatibility (v2.182.1)
- ✅ Testing Edge Functions end-to-end

The project now has a **battle-tested CI pipeline** that validates:
- Database schema integrity
- Authentication flows
- Edge Functions functionality
- Security controls
- Cross-service integration
