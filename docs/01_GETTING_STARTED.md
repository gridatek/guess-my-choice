# Getting Started with Supabase Template

This guide will help you set up and start using this Supabase template.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** ([Download](https://docs.docker.com/desktop/))
  - Required for running Supabase locally
  - Make sure Docker is running before starting development
- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/gridatek/supabase.git
cd supabase
```

### 2. Start Supabase

```bash
npm run dev
```

This will:
- Download required Docker images (first time only)
- Start all Supabase services
- Apply database migrations
- Load seed data (optional test users)

### 3. Verify Installation

```bash
npm run status
```

You should see all services running with their endpoints.

## Service Endpoints

Once running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:54321 | Main entry point for all API requests |
| **Studio** | http://localhost:54323 | Database admin UI (optional) |
| **Email UI** | http://localhost:54324 | Test email inbox (Inbucket) |

### Database Connection

Get your database connection string:

```bash
npm run status
```

Look for the `DB URL` in the output.

## Test Data

The template includes seed data for development:

### Users
- `alice@example.com` / `password123`
- `bob@example.com` / `password123`
- `carol@example.com` / `password123`

### Reset and Reload Seed Data

```bash
npm run seed
```

## Your First Query

### Using the REST API

```bash
# Get all users
curl http://localhost:54321/rest/v1/users \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
```

### Using JavaScript Client

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
)

// Query users
const { data, error } = await supabase
  .from('users')
  .select('*')
```

> **Note**: The API key shown is the default Supabase CLI key for local development only.

## Common Commands

```bash
# Start Supabase
npm run dev

# Stop Supabase
npm run stop

# Check status
npm run status

# View logs
npm run logs

# Open database shell
npm run shell

# Reset database
npm run reset
```

## Next Steps

- **[02. Migrations](./02_MIGRATIONS.md)** - Learn about database migrations
- **[03. CI/CD](./03_CI_CD.md)** - Set up automated testing
- **[04. Deployment](./04_DEPLOYMENT.md)** - Deploy to production
- **[05. Frontend Integration](./05_FRONTEND_INTEGRATION.md)** - Add Angular frontend

## Troubleshooting

### Docker Not Running

```
Error: Cannot connect to the Docker daemon
```

**Solution**: Start Docker Desktop and ensure it's running.

### Port Already in Use

```
Error: port is already allocated
```

**Solution**: Stop other services using these ports or change ports in `supabase/config.toml`.

### Services Won't Start

```bash
# Check logs
npm run logs

# Reset everything
npm run stop
docker system prune -a
npm run dev
```

### Can't Connect to Database

1. Check if services are running: `npm run status`
2. Verify Docker is running
3. Check logs: `npm run logs`

## Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [GitHub Issues](https://github.com/gridatek/supabase/issues)
