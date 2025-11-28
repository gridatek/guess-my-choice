# Supabase Edge Functions - Admin API

Admin user management using Supabase Edge Functions (serverless, deployed with Supabase).

## Available Functions

- **admin-create-user** - Create new users (admin only)
- **admin-list-users** - List all users (admin only)
- **admin-delete-user** - Delete a user (admin only)

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Admin user setup**
   ```bash
   npm run shell
   ```

   Then run:
   ```sql
   ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
   UPDATE public.profiles SET is_admin = true WHERE email = 'alice@example.com';
   ```

## Local Development

### 1. Start Supabase
```bash
npm run dev
```

### 2. Serve Functions Locally
```bash
supabase functions serve
```

This will start all functions at:
- `http://localhost:54321/functions/v1/admin-create-user`
- `http://localhost:54321/functions/v1/admin-list-users`
- `http://localhost:54321/functions/v1/admin-delete-user`

### 3. Test Functions

**Get your publishable key:**
```bash
npm run status
```

**Login to get token:**
```bash
curl -X POST 'http://localhost:54321/auth/v1/token?grant_type=password' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Copy the `access_token` from the response.

**Create a user:**
```bash
curl -X POST 'http://localhost:54321/functions/v1/admin-create-user' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "full_name": "New User",
    "username": "newuser"
  }'
```

**List users:**
```bash
curl 'http://localhost:54321/functions/v1/admin-list-users' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Delete a user:**
```bash
curl -X POST 'http://localhost:54321/functions/v1/admin-delete-user' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_UUID_HERE"}'
```

## Production Deployment

### 1. Link to Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in the Supabase Dashboard URL:
`https://app.supabase.com/project/YOUR_PROJECT_REF`

### 2. Deploy All Functions

```bash
supabase functions deploy admin-create-user
supabase functions deploy admin-list-users
supabase functions deploy admin-delete-user
```

Or deploy all at once:
```bash
supabase functions deploy
```

### 3. Get Production URLs

Your functions will be available at:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-create-user
https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-list-users
https://YOUR_PROJECT_REF.supabase.co/functions/v1/admin-delete-user
```

## Usage in Your App

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Login as admin
const { data: { session } } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password123'
})

// Create a user
const { data, error } = await supabase.functions.invoke('admin-create-user', {
  body: {
    email: 'newuser@example.com',
    password: 'password123',
    full_name: 'New User',
    username: 'newuser',
    is_admin: false
  },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})

console.log(data)
```

### List Users

```typescript
const { data, error } = await supabase.functions.invoke('admin-list-users', {
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})

console.log(data.users)
```

### Delete User

```typescript
const { data, error } = await supabase.functions.invoke('admin-delete-user', {
  body: { user_id: 'uuid-here' },
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})
```

## Function Parameters

### admin-create-user

**Request Body:**
```json
{
  "email": "user@example.com",        // Required
  "password": "password123",          // Required
  "full_name": "John Doe",           // Optional
  "username": "johndoe",             // Optional
  "is_admin": false,                 // Optional (default: false)
  "metadata": {                      // Optional
    "department": "Engineering"
  }
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-11-07T..."
  }
}
```

### admin-list-users

**No body required**

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2025-11-07T...",
      "last_sign_in_at": "2025-11-07T..."
    }
  ]
}
```

### admin-delete-user

**Request Body:**
```json
{
  "user_id": "uuid"  // Required
}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Testing Script

Create `test-functions.js`:

```javascript
const SUPABASE_URL = 'http://localhost:54321'
const ANON_KEY = 'your_anon_key'

async function test() {
  // 1. Login
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'alice@example.com',
      password: 'password123'
    })
  })
  const { access_token } = await loginRes.json()
  console.log('✅ Logged in')

  // 2. Create user
  const createRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-create-user`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      full_name: 'Test User'
    })
  })
  const createData = await createRes.json()
  console.log('✅ Created user:', createData)

  // 3. List users
  const listRes = await fetch(`${SUPABASE_URL}/functions/v1/admin-list-users`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  })
  const listData = await listRes.json()
  console.log('✅ Listed users:', listData.users.length)
}

test()
```

## Environment Variables

Edge Functions automatically have access to:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
- `SUPABASE_ANON_KEY` - Anonymous key

No additional configuration needed!

## Security

✅ **Admin verification** - Each function checks if user has `is_admin = true`
✅ **JWT validation** - Token verified on every request
✅ **Service role** - Uses service_role key for admin operations (bypasses RLS)
✅ **CORS enabled** - Functions can be called from your web app

## Advantages of Edge Functions

✅ **Deployed with Supabase** - No separate hosting needed
✅ **Globally distributed** - Low latency worldwide
✅ **Auto-scaling** - Handles traffic spikes
✅ **Built-in secrets** - Environment variables managed by Supabase
✅ **Free tier** - 500K function invocations/month
✅ **TypeScript support** - Full type safety

## Troubleshooting

### "Missing authorization header"
Include the JWT token:
```javascript
headers: { 'Authorization': `Bearer ${access_token}` }
```

### "Forbidden: Admin access required"
Make sure the user has `is_admin = true`:
```sql
UPDATE public.profiles SET is_admin = true WHERE email = 'your@email.com';
```

### "Function not found"
Make sure you deployed the function:
```bash
supabase functions deploy admin-create-user
```

### Local function not starting
Make sure Supabase is running:
```bash
npm run dev
```

## Viewing Logs

### Local
```bash
supabase functions serve --debug
```

### Production
```bash
supabase functions logs admin-create-user
```

Or view in the Supabase Dashboard:
1. Go to your project
2. Click "Edge Functions"
3. Select the function
4. View logs

## Next Steps

- Add more functions (update user, bulk import, etc.)
- Add rate limiting
- Add email notifications
- Create admin dashboard UI
- Add audit logging

## Cost

Supabase Edge Functions pricing:
- **Free tier**: 500K invocations/month
- **Pro tier**: 2M invocations/month included
- **Additional**: $2 per 1M invocations

Perfect for most applications!
