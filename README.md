# Foyer Manager

Monorepo for shared household expense tracking (React + Hono + Prisma + PostgreSQL).

## Prerequisites

- Node.js 22+
- PostgreSQL running locally
- Database user with `CREATEDB` (for Prisma shadow DB during migrations)

## Environment setup

Development uses **two separate PostgreSQL databases** so local and cloud modes do not share data.

| Mode | Env file | Database | Start command |
|------|----------|----------|---------------|
| Local (no auth) | `apps/api/.env.local` | `foyer_local` | `npm run dev:local` |
| Cloud (JWT auth) | `apps/api/.env.development` | `foyer_dev` | `npm run dev:cloud` |

### First-time setup

```bash
# Create databases
createdb foyer_local
createdb foyer_dev

# Copy environment files (from repo root)
cp apps/api/.env.local.example apps/api/.env.local
cp apps/api/.env.development.example apps/api/.env.development

# Install dependencies
npm install

# Apply migrations to both databases
npm run db:migrate:local -w @foyer/api
npm run db:migrate:dev -w @foyer/api
```

`npm run dev` defaults to **local mode** (`dev:local`).

### Reset a database

Wipes one database without affecting the other:

```bash
npm run db:reset:local -w @foyer/api   # foyer_local only
npm run db:reset:dev -w @foyer/api     # foyer_dev only
```

### Legacy `.env`

A single `apps/api/.env` still works for ad-hoc use, but the two env files above are the recommended workflow.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` / `npm run dev:local` | Web + API in local deployment mode |
| `npm run dev:cloud` | Web + API in cloud deployment mode |
| `npm run build` | Build all workspaces |
| `npm run test` | Run all tests |

See [apps/api/README.md](apps/api/README.md) for API details and [NETWORK.md](NETWORK.md) for LAN access.
