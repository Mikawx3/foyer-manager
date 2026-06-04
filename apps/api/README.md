# @foyer/api

Node.js API for Foyer Manager (Hono + Prisma + PostgreSQL).

## Setup

1. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

2. Install dependencies from the monorepo root (`npm install`). This runs `prisma generate` via `postinstall`.

3. Apply database migrations (requires PostgreSQL running). The DB user needs `CREATEDB` for Prisma’s shadow database in dev (`ALTER USER foyer_user CREATEDB;` as superuser if migrate fails with P3014):

   ```bash
   npm run db:migrate -w @foyer/api
   ```

## Prisma in the build pipeline

**Prisma** is the ORM: it reads [`prisma/schema.prisma`](prisma/schema.prisma) and talks to PostgreSQL.

| Step | Command | Role |
|------|---------|------|
| **Generate** | `prisma generate` (also in `postinstall` and `build`) | Builds `@prisma/client` — TypeScript types and query methods. Does **not** connect to or change the database. Required before `tsc` when code imports Prisma. |
| **Migrate (dev)** | `prisma migrate dev` / `npm run db:migrate` | Creates and applies SQL migration files under `prisma/migrations/`. Use when the schema changes. Not part of `npm run build`. |
| **Migrate (prod)** | `prisma migrate deploy` / `npm run db:migrate:deploy` | Applies pending migrations in production/CI. |
| **Build API** | `npm run build` → `prisma generate && tsc` | Regenerates the client, then compiles TypeScript to `dist/`. |

Shared domain types live in `@foyer/types` (JSON/API shapes). Prisma models mirror them for persistence (`Decimal`, `DateTime` in the database; `string` / `number` in shared types).

The Prisma client singleton is in [`src/lib/prisma.ts`](src/lib/prisma.ts). Use it from repositories only, not from routes or controllers.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API with hot reload (`tsx watch`) |
| `npm run build` | `prisma generate` then compile TypeScript to `dist/` |
| `npm run start` | Run compiled `dist/main.js` |
| `npm run db:generate` | Regenerate Prisma client only |
| `npm run db:migrate` | Dev migrations (`migrate dev`) |
| `npm run db:migrate:deploy` | Apply migrations (deploy) |

## Endpoints

- `GET /health` — service health check

## Architecture

Future routes should follow: Route → Controller → Service → Repository (Prisma). Do not call Prisma directly from routes or controllers.
