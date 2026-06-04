# @foyer/api

Node.js API for Foyer Manager (Hono + Prisma + PostgreSQL).

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies from the monorepo root (`npm install`). This runs `prisma generate` via `postinstall`.

3. Ensure PostgreSQL is available when you add models and run migrations. The dev server does not require a live database until Prisma is used in code.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled `dist/main.js` |
| `npm run db:generate` | Regenerate Prisma client |

## Endpoints

- `GET /health` — service health check

## Architecture

Future routes should follow: Route → Controller → Service → Repository (Prisma). Do not call Prisma directly from routes or controllers.
