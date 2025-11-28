# Testing Edge Functions

Guide for testing admin Edge Functions locally and in CI.

## Local Testing

### Method 1: Using the Test Script (Recommended)

```bash
# 1. Make sure Supabase is running
npm run dev

# 2. Setup admin user (first time only)
npm run shell
```

In the shell:
```sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
UPDATE public.profiles SET is_admin = true WHERE email = 'alice@example.com';
\q
```

```bash
# 3. Start Edge Functions
supabase functions serve

# 4. Run tests (in another terminal)
cd supabase/functions
deno run --allow-net --allow-env test-functions.ts
```

**Expected output:**
```
🧪 Testing Edge Functions

📍 Supabase URL: http://localhost:54321
🔑 API Key: eyJhbGciOiJIUzI1N...

Testing security...
✅ Unauthorized Access Prevention

Logging in as admin...
✅ Logged in as admin

Testing non-admin access...
✅ Non-Admin Access Prevention

Testing admin functions...
✅ Create User
✅ List Users (found 4)
✅ Delete User

==================================================
📊 Test Summary

Total: 6 | Passed: 6 | Failed: 0

✅ All tests passed!
```

### Method 2: Manual Testing with cURL

```bash
# 1. Get your API key
npm run status

# Copy the "Publishable key"

# 2. Login as admin
curl -X POST 'http://localhost:54321/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'

# Copy the access_token

# 3. Test create user
curl -X POST 'http://localhost:54321/functions/v1/admin-create-user' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'

# 4. Test list users
curl 'http://localhost:54321/functions/v1/admin-list-users' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 5. Test delete user
curl -X POST 'http://localhost:54321/functions/v1/admin-delete-user' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_UUID_FROM_STEP_3"}'
```

### Method 3: Using Supabase JS Client

Create `test-client.ts`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  'http://localhost:54321',
  'YOUR_ANON_KEY'
)

// Login
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'alice@example.com',
  password: 'password123'
})

console.log('✅ Logged in')

// Create user
const { data, error } = await supabase.functions.invoke('admin-create-user', {
  body: {
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    full_name: 'Test User'
  },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})

console.log('Create result:', data)

// List users
const { data: listData } = await supabase.functions.invoke('admin-list-users', {
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})

console.log('Users:', listData.users)
```

Run it:
```bash
deno run --allow-net test-client.ts
```

## CI Testing (GitHub Actions)

The CI workflow automatically tests Edge Functions on every push/PR.

### What the CI Does

1. **Sets up environment**
   - Node.js, Docker, Supabase CLI, Deno

2. **Starts Supabase**
   - Runs migrations
   - Seeds test data

3. **Setup admin user**
   - Adds `is_admin` column
   - Makes `alice@example.com` an admin

4. **Starts Edge Functions**
   - Runs `supabase functions serve` in background

5. **Runs tests**
   - Executes `test-functions.ts`
   - Tests all security and functionality

### CI Workflow

See `.github/workflows/ci.yml`:

```yaml
- name: Set up Deno
  uses: denoland/setup-deno@v1

- name: Setup admin user for tests
  run: |
    supabase db execute --sql "
      ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
      UPDATE public.profiles
      SET is_admin = true
      WHERE email = 'alice@example.com';
    "

- name: Start Edge Functions
  run: |
    supabase functions serve &
    sleep 10

- name: Test Edge Functions
  run: |
    export SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
    export SUPABASE_ANON_KEY=$(supabase status | grep "Publishable key" | awk '{print $3}')
    deno run --allow-net --allow-env supabase/functions/test-functions.ts
```

### View CI Results

1. Go to your GitHub repo
2. Click "Actions" tab
3. Select the latest workflow run
4. Check "Test Edge Functions" step

## Test Coverage

The test suite covers:

✅ **Security**
- Unauthorized access prevention
- Non-admin access prevention
- Token validation

✅ **Functionality**
- Create user
- List users
- Delete user

✅ **Error Handling**
- Invalid requests
- Missing parameters
- Invalid tokens

## Adding More Tests

Edit `test-functions.ts` to add more tests:

```typescript
async function testUpdateUser(token: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-update-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        email: 'updated@example.com'
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Update user failed')
    }

    logTest('Update User', true)
    return true
  } catch (error) {
    logTest('Update User', false, error.message)
    return false
  }
}

// Add to main():
await testUpdateUser(adminToken, userId)
```

## Troubleshooting

### "Failed to login as admin"

Make sure alice is an admin:
```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'alice@example.com';
```

### "Connection refused"

Make sure:
1. Supabase is running: `npm run dev`
2. Functions are running: `supabase functions serve`

### "Function not found"

The function might not be deployed locally. Check:
```bash
ls supabase/functions/
```

Should show:
- admin-create-user/
- admin-list-users/
- admin-delete-user/

### Tests timeout

Increase the sleep time in CI:
```yaml
- name: Start Edge Functions
  run: |
    supabase functions serve &
    sleep 15  # Increase from 10 to 15
```

## Performance Testing

For load testing, use [autocannon](https://github.com/mcollina/autocannon):

```bash
# Install
npm install -g autocannon

# Load test create user
autocannon -c 10 -d 5 \
  -m POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -b '{"email":"test@example.com","password":"password123"}' \
  http://localhost:54321/functions/v1/admin-create-user
```

## Manual Production Testing

After deploying to production:

```bash
# Set production URL
PROD_URL=https://your-project.supabase.co

# Login
curl -X POST "$PROD_URL/auth/v1/token?grant_type=password" \
  -H "apikey: YOUR_PROD_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password"}'

# Test function
curl -X POST "$PROD_URL/functions/v1/admin-create-user" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Monitoring

View function logs:

**Local:**
```bash
supabase functions serve --debug
```

**Production:**
```bash
supabase functions logs admin-create-user --tail
```

Or in Supabase Dashboard:
1. Go to Edge Functions
2. Select function
3. View "Logs" tab

## Summary

**Quick test locally:**
```bash
npm run dev
supabase functions serve
deno run --allow-net --allow-env supabase/functions/test-functions.ts
```

**CI automatically tests** on every push/PR.

**Production testing** via Supabase Dashboard or CLI logs.
