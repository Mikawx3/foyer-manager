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

### Households

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/households` | List all households |
| POST | `/api/households` | Create `{ "name": string }` |
| GET | `/api/households/:id` | Get by id |
| GET | `/api/households/:id/balances` | Tenant balances (`totalPaid`, `totalOwed`, `balance`) |
| DELETE | `/api/households/:id` | Delete by id |

### Tenants

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tenants?householdId=` | List tenants for a household |
| POST | `/api/tenants` | Create `{ "name", "email", "householdId" }` |
| GET | `/api/tenants/:id` | Get by id |
| DELETE | `/api/tenants/:id` | Delete by id |

### Categories

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/categories?householdId=` | List categories for a household |
| POST | `/api/categories` | Create `{ "name", "householdId" }` |
| DELETE | `/api/categories/:id` | Delete category (fails if expenses exist) |

### Expenses

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/expenses?householdId=&page=&limit=&month=&categoryId=` | Paginated list. `page` default 1, `limit` default 10 (max 100). Optional `month` (`YYYY-MM`), `categoryId`. Response: `{ data, total, page, totalPages }` |
| POST | `/api/expenses` | Create expense (requires valid `categoryId` in household) |
| GET | `/api/expenses/:id` | Get by id |
| DELETE | `/api/expenses/:id` | Delete by id |
| POST | `/api/expenses/:id/splits` | Replace splits `{ "splits": [{ "tenantId", "percentage" }] }` (sum = 100) |
| GET | `/api/expenses/:id/splits` | List splits for an expense |

`POST /api/expenses` body example:

```json
{
  "amount": 120,
  "description": "January rent",
  "categoryId": "...",
  "paidByTenantId": "...",
  "householdId": "...",
  "date": "2026-06-01"
}
```

Errors return `{ "error": string, "details"?: unknown }`.

## Architecture

Route → Controller → Service → Repository (Prisma). Do not call Prisma directly from routes or controllers.
