# Frontend Integration Guide

This guide shows how to add Angular to your Supabase template as a monorepo setup.

## Angular Setup

### Quick Setup

```bash
# Install Angular CLI
npm install -g @angular/cli

# Create Angular app
ng new frontend --skip-git --defaults --inline-style --inline-template --skip-tests

# Install Supabase client
cd frontend
npm install @supabase/supabase-js
```

> **Note**: Uses `--skip-git` (monorepo), `--defaults` (no prompts), `--inline-style` and `--inline-template` (no separate files), and `--skip-tests` (simpler setup).

### Configure Supabase Connection

Update `frontend/src/app/app.ts`:

```typescript
import { Component, OnInit } from '@angular/core'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

@Component({
  selector: 'app-root',
  template: `
    <h1>Supabase + Angular</h1>
    @for (user of users; track user.id) {
      <div>{{ user.email }}</div>
    }
  `,
  styles: []
})
export class App implements OnInit {
  users: any[] = []

  async ngOnInit() {
    const { data } = await supabase.from('profiles').select('*')
    if (data) this.users = data
  }
}
```

> **Note**: Angular 20+ removed component suffixes (now `app.ts` instead of `app.component.ts`), uses standalone by default, and the new `@for` control flow. The API key shown is the default Supabase CLI key for local development only.

## Monorepo Structure

Your project should now look like this:

```
project/
├── frontend/                 # Angular app
│   ├── src/
│   │   └── app/
│   │       └── app.ts  # Root component with Supabase client
│   ├── angular.json
│   └── package.json
├── supabase/                # Supabase backend
│   ├── migrations/
│   └── config.toml
├── .github/                 # CI/CD workflows
├── docs/                    # Documentation
├── package.json            # Root scripts
└── README.md
```

## Update .gitignore

Add Angular-specific entries to your root `.gitignore`:

```gitignore
# Angular
frontend/node_modules/
frontend/dist/
frontend/.angular/
```

## Development Workflow

### Terminal 1: Start Supabase

```bash
npm run dev
```

### Terminal 2: Start Angular

```bash
cd frontend
npm start
```

### Access Points

- **Angular**: http://localhost:4200
- **Supabase API**: http://localhost:54321
- **Email UI**: http://localhost:54324

## Testing Connection

Test your setup by querying the users table:

```typescript
// Example: Fetch users from seed data
const { data, error } = await supabase
  .from('profiles')
  .select('*')

console.log(data) // Should show Alice, Bob, Carol
```

## Production Setup

For production, just update the hardcoded URL and key in `frontend/src/app/app.ts` to your production values:

```typescript
const supabase = createClient(
  'https://your-project.supabase.co',
  'your-production-anon-key'
)
```

Get production credentials from: **Supabase Dashboard → Settings → API**

## Git Workflow

The monorepo keeps frontend and backend together:

```bash
# Add frontend to your repo
git add frontend/
git commit -m "Add Angular frontend"

# Both frontend and backend are tracked together
git push
```

## CI/CD Integration

The template includes an Angular integration workflow at `.github/workflows/angular-integration.yml`.

It automatically:
- Starts Supabase backend
- Installs frontend dependencies
- Builds Angular application
- Runs Angular unit tests

## Common Features

### Authentication

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'alice@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Real-time Subscriptions

```typescript
// Subscribe to changes
supabase
  .channel('posts')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'posts' },
    (payload) => console.log('Change!', payload)
  )
  .subscribe()
```

### File Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file)

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl('public/avatar.png')
```

## TypeScript Types

Generate types from your database:

```bash
# In root directory
npm run types
```

Use in your Angular app:

```typescript
import { Database } from '../../../types/database.types'

type User = Database['public']['Tables']['users']['Row']

// Type-safe queries
const { data } = await supabase
  .from('users')
  .select('*')
```

## Production Build

```bash
cd frontend
npm run build
```

Deploy the `frontend/dist/` directory to:
- **Vercel** - Great for Angular
- **Netlify** - Easy deployment
- **Cloudflare Pages** - Fast global CDN
- **Firebase Hosting** - Google ecosystem

## Troubleshooting

### CORS Errors

Shouldn't happen with Supabase CLI (it handles CORS). If you get CORS errors:

1. Restart Supabase: `npm run stop && npm run dev`
2. Check you're using http://localhost:54321 (not 127.0.0.1)

### Connection Refused

1. Verify Supabase is running: `npm run status`
2. Check the API URL matches (54321)
3. Ensure Docker is running

### RLS Blocking Queries

If queries return empty:

1. Check RLS policies in your migrations
2. Test with service role key (development only)
3. Sign in first for authenticated queries

## Resources

- [Angular Documentation](https://angular.io/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Supabase Angular Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-angular)
- [Authentication](https://supabase.com/docs/guides/auth)
- [Database](https://supabase.com/docs/guides/database)
- [Storage](https://supabase.com/docs/guides/storage)
- [Realtime](https://supabase.com/docs/guides/realtime)

---

That's it! You now have Angular integrated into your Supabase template. Start building! 🚀
