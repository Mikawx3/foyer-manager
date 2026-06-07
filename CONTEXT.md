# Foyer Manager — Project Context

> Last updated: 2026-06-07. This document describes the current state of the application so an AI assistant or developer can continue development without reading the full source tree.

---

## 1. Project Overview

### App name, purpose, target users

| Field | Value |
|-------|-------|
| **Name** | Foyer Manager |
| **Purpose** | Track shared household expenses: record spending, split costs between members, compute balances, record settlements, and manage recurring bills |
| **Target users** | People living together (roommates, couples, families) who need transparent expense sharing; also individuals tracking personal spending in solo mode |

### Deployment modes (`DEPLOYMENT_MODE`)

The application supports two runtime modes controlled by the API environment variable `DEPLOYMENT_MODE`:

| Mode | Value | Auth | Typical use |
|------|-------|------|-------------|
| **Local** | `local` (default when unset or invalid) | None — open API access | Personal/local use, LAN access, rapid development |
| **Cloud** | `cloud` | JWT Bearer on all `/api/*` routes except register/login/config/health | Multi-user hosted deployment with authentication |

The frontend discovers the mode at runtime via `GET /api/config` and adapts routing, auth headers, and UI accordingly. The web app itself is mode-agnostic.

**Development databases are isolated:**

| Mode | Env file | Database |
|------|----------|----------|
| Local | `apps/api/.env.local` | `foyer_local` |
| Cloud | `apps/api/.env.development` | `foyer_dev` |

Start commands: `npm run dev:local` (default `npm run dev`) or `npm run dev:cloud`.

### Current status

| Area | Status |
|------|--------|
| **Production-ready (MVP)** | Expense CRUD, default/custom splits, balances, settlements, recurring expenses, household wizard, dashboard, i18n (EN/FR), member management, soft delete, solo/shared households, dual deployment mode |
| **Functional but limited** | Cloud auth (register/login only; one user per household; no invites, password reset, or email verification) |
| **Not implemented** | Production deployment pipeline, E2E tests, HTTP integration tests (Supertest), lint job in CI, multi-user household sharing |
| **CI** | Typecheck + unit tests + build on `main` — all passing |

---

## 2. Tech Stack

### Frontend (`apps/web`)

| Concern | Technology |
|---------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Router | React Router DOM v7 (`createBrowserRouter`) |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` (no separate `tailwind.config.js`) |
| i18n | i18next + react-i18next + i18next-browser-languagedetector |
| Server state | TanStack Query v5 (no Redux/Zustand) |
| Forms | React Hook Form + `@hookform/resolvers` + Zod 4 |
| HTTP | Axios (`baseURL: /api`, proxied to `:3000`) |
| Charts | Recharts 3 |
| Icons | lucide-react |
| Toasts | Sonner |
| Shared types | `@foyer/types` |

### Backend (`apps/api`)

| Concern | Technology |
|---------|------------|
| Runtime | Node.js 22+ |
| Framework | Hono 4 + `@hono/node-server` |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Validation | Zod 4 on all endpoints |
| Auth (cloud) | JWT (HS256 via `jose`) + bcryptjs password hashing |

### Auth strategy per deployment mode

| Aspect | Local | Cloud |
|--------|-------|-------|
| `authMiddleware` | No-op — all requests pass | Requires `Authorization: Bearer <token>` |
| `assertHouseholdAccess` | No-op | JWT `householdId` must match requested household |
| `GET /api/households` | Returns all households | Returns only the user's household |
| `POST /api/households` | Creates freely | `409 Conflict` — household created at registration |
| API client headers | No `Authorization` | JWT attached; 401 → redirect `/login` |
| `GET /api/auth/me` | Returns 401 (no auth context) | Returns user profile |
| Frontend login/register | Redirected away (`CloudAuthRoute`) | Available |

### Testing

| Workspace | Framework | Test files | Tests | Pass rate |
|-----------|-----------|------------|-------|-----------|
| `@foyer/api` | Vitest 3.2.6 | 20 | 83 | 100% |
| `@foyer/web` | Vitest 3.2.6 + jsdom | 12 | 49 | 100% |
| `@foyer/types` | Vitest 3.2.6 | 1 | 2 | 100% |
| **Total** | | **33** | **134** | **100%** |

- API tests are **unit tests** with mocked repositories/services — no Supertest HTTP integration tests despite project rules mentioning Supertest.
- CI uses a dummy `DATABASE_URL`; tests do not connect to PostgreSQL.
- No E2E or Playwright tests in CI (a `scripts/capture-screenshots.mjs` exists for manual doc screenshots).

### CI/CD

**File:** `.github/workflows/ci.yml`

**Triggers:** `push` and `pull_request` on `main`

| Job | Steps | Depends on |
|-----|-------|------------|
| `typecheck` | `npm ci` → build `@foyer/types` → `tsc --noEmit` (web + api) | — |
| `test` | `npm ci` → build `@foyer/types` → `npm run test --workspaces` | — |
| `build` | `npm ci` → `npm run build` | `typecheck`, `test` |

**Not in CI:** lint, Prisma migrate, Postgres service, E2E, deploy, coverage.

---

## 3. Project Structure

### Directory tree (2–3 levels)

```
foyer-manager/
├── .cursor/rules/          # Cursor AI rules (project, api, web, i18n)
├── .github/workflows/      # CI pipeline
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/     # 11 migrations
│   │   ├── scripts/              # seed-dashboard-data.mjs
│   │   └── src/
│   │       ├── controllers/      # HTTP handlers
│   │       ├── routes/           # Hono route definitions
│   │       ├── services/         # Business logic (required layer)
│   │       ├── repositories/     # Prisma data access
│   │       ├── validators/       # Zod schemas
│   │       ├── middleware/       # auth, error-handler
│   │       ├── lib/              # split-calculator, jwt, mappers, etc.
│   │       ├── errors/           # AppError classes
│   │       ├── app.ts            # Hono app factory
│   │       └── main.ts           # Server entry (port 3000)
│   └── web/
│       ├── messages/             # en.json, fr.json (i18n)
│       └── src/
│           ├── pages/            # Route-level components
│           ├── components/       # auth, balances, dashboard, expenses, forms, layout, settings, tenants, ui, wizard
│           ├── contexts/         # DeploymentModeContext
│           ├── hooks/            # useFormat, useSwipeToClose
│           ├── lib/              # api, schemas, stats, export, toast, etc.
│           ├── router.tsx
│           ├── App.tsx
│           ├── main.tsx
│           └── i18n.ts
├── packages/
│   └── types/                # Shared TypeScript interfaces (@foyer/types)
├── scripts/                  # capture-screenshots.mjs
├── package.json              # Workspace root
├── README.md
├── NETWORK.md                # LAN access guide
└── CONTEXT.md                # This file
```

### Key files and roles

| File | Role |
|------|------|
| `apps/api/src/app.ts` | Registers routes, auth middleware on protected `/api/*` |
| `apps/api/src/main.ts` | Starts HTTP server on `0.0.0.0:PORT` |
| `apps/api/src/lib/deployment.ts` | Reads `DEPLOYMENT_MODE`, defaults to `local` |
| `apps/api/src/lib/split-calculator.ts` | Percentage validation, amount allocation, balance computation |
| `apps/api/src/lib/redistribute-splits.ts` | Rescale default splits for participant subsets |
| `apps/api/src/lib/apply-settlements.ts` | Adjust balances after settlements |
| `apps/api/prisma/schema.prisma` | Database schema (source of truth for persistence) |
| `packages/types/src/index.ts` | API/JSON DTO shapes shared by web and api |
| `apps/web/src/router.tsx` | Full frontend route tree |
| `apps/web/src/lib/api.ts` | Axios client + all API call functions |
| `apps/web/src/lib/schemas.ts` | Zod form schemas (i18n-aware) |
| `apps/web/src/contexts/DeploymentModeContext.tsx` | Fetches and exposes deployment mode |
| `apps/web/src/index.css` | Tailwind v4 `@theme` design tokens |
| `apps/web/src/lib/ui-classes.ts` | Reusable CSS class patterns |

### Architecture constraints

- **Backend:** `Route → Controller → Service → Repository`. Business logic only in `services/`. Prisma only in `repositories/`.
- **Frontend:** Functional components only. No `useEffect` for business logic — use TanStack Query.
- **Types:** Import from `@foyer/types`; never redefine locally.
- **Validation:** Zod required on all API endpoints.
- **Strict TypeScript:** No `any`, no `as unknown`.

---

## 4. Database Schema

**ORM:** Prisma 6 | **Provider:** PostgreSQL | **Schema:** `apps/api/prisma/schema.prisma`

### Models

#### Household

| Field | Type | Constraints / default |
|-------|------|----------------------|
| `id` | String | PK, `@default(cuid())` |
| `name` | String | |
| `type` | String | Default `"shared"` — values: `"solo"` \| `"shared"` |
| `settlementPeriod` | String | Default `"none"` — values: `"none"` \| `"monthly"` \| `"quarterly"` \| `"yearly"` |
| `createdAt` | DateTime | `@default(now())` |

**Relations:** `user?`, `tenants[]`, `categories[]`, `expenses[]`, `defaultSplits[]`, `settlements[]`, `recurringExpenses[]`

#### User

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `email` | String | Unique |
| `password` | String | bcrypt hash |
| `householdId` | String | Unique — 1:1 with Household |
| `createdAt` | DateTime | |

**Relations:** `household` (Cascade delete)

#### Tenant (household member)

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `name` | String | |
| `email` | String | Unique (auto-generated if omitted) |
| `color` | String? | Hex preset |
| `active` | Boolean | Default `true` — soft delete via `false` |
| `archivedAt` | DateTime? | Set on archive |
| `householdId` | String | FK |
| `createdAt` | DateTime | |

**Relations:** `household`, `expensesPaid`, `expenseSplits`, `defaultSplits`, `settlementsFrom/To`, `recurringExpensesPaid`, `recurringExpenseSplits`

**Index:** `householdId`

#### Category

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `name` | String | |
| `householdId` | String | FK |

**Relations:** `household`, `expenses[]`, `defaultSplits[]`

#### Expense

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `amount` | Decimal(12,2) | |
| `description` | String | |
| `categoryId` | String | FK → Category (Restrict) |
| `paidByTenantId` | String | FK → Tenant (Restrict) |
| `householdId` | String | FK (Cascade) |
| `recurringExpenseId` | String? | FK → RecurringExpense (SetNull) |
| `splitMode` | String | Default `"default"` — `"default"` \| `"custom"` |
| `date` | DateTime | |
| `createdAt` | DateTime | |

**Unique partial index:** `(recurringExpenseId, date)` WHERE `recurringExpenseId IS NOT NULL` — prevents duplicate auto-generated expenses.

**Relations:** `category`, `paidByTenant`, `household`, `recurringExpense?`, `splits[]`

#### ExpenseSplit

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `expenseId` | String | FK (Cascade) |
| `tenantId` | String | FK (Cascade) |
| `amount` | Decimal(12,2) | |
| `percentage` | Float? | |

Only persisted when `splitMode = "custom"`. Default-mode splits are computed dynamically.

#### DefaultSplit

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `householdId` | String | FK (Cascade) |
| `categoryId` | String? | `null` = global rule; FK → Category (Cascade) |
| `tenantId` | String | FK (Cascade) |
| `percentage` | Float | |
| `createdAt` / `updatedAt` | DateTime | |

**Unique:** `(householdId, categoryId, tenantId)`

#### Settlement

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `householdId` | String | FK (Cascade) |
| `fromTenantId` | String | FK → Tenant (Restrict) |
| `toTenantId` | String | FK → Tenant (Restrict) |
| `amount` | Decimal(12,2) | |
| `note` | String? | |
| `date` | DateTime | Default `now()` |
| `createdAt` | DateTime | Used for 24h undo window |

#### RecurringExpense

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `householdId` | String | FK (Cascade) |
| `title` | String | |
| `amount` | Decimal(12,2) | |
| `category` | String? | Category ID (cuid) — **required to auto-generate expenses** |
| `paidById` | String | FK → Tenant (Restrict) |
| `frequency` | String | `"weekly"` \| `"monthly"` \| `"quarterly"` \| `"yearly"` |
| `startDate` | DateTime | |
| `nextDueDate` | DateTime | |
| `active` | Boolean | Default `true` |
| `createdAt` | DateTime | |

**Relations:** `household`, `paidBy`, `splits[]`, `generatedExpenses[]`

#### RecurringExpenseSplit

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | String | PK, cuid |
| `recurringExpenseId` | String | FK (Cascade) |
| `tenantId` | String | FK (Cascade) |
| `percentage` | Float | |

### Default categories (created with every household)

`Rent`, `Groceries`, `Utilities`, `Internet`, `Streaming`, `Water`, `Insurance`, `Transport`, `Health`, `Other`

### Migrations (chronological order)

| # | Migration folder | Summary |
|---|------------------|---------|
| 1 | `20260604174823_init` | Household, Tenant, Category, Expense, ExpenseSplit |
| 2 | `20260604194447_add_default_splits` | `Expense.splitMode`, `DefaultSplit` table |
| 3 | `20260604212713_add_settlements` | `Household.settlementPeriod`, `Settlement` table |
| 4 | `20260605120000_add_household_type_and_tenant_color` | `Household.type`, `Tenant.color` |
| 5 | `20260605153137_add_recurring_expenses` | `RecurringExpense`, `RecurringExpenseSplit` |
| 6 | `20260605154617_add_recurring_expense_id_to_expense` | `Expense.recurringExpenseId` FK |
| 7 | `20260605180000_add_user_auth` | `User` table (email unique, householdId unique) |
| 8 | `20260605180100_add_tenant_soft_delete` | `Tenant.active`, `Tenant.archivedAt` |
| 9 | `20260605190000_add_user_owner_tenant` | User→tenant owner link (later removed) |
| 10 | `20260605200000_unique_recurring_expense_date` | Dedup + unique index on `(recurringExpenseId, date)` |
| 11 | `20260605210000_remove_user_owner_tenant` | Removed user owner tenant link |

---

## 5. API Routes

**Base URL:** `http://localhost:3000` (dev) | **Error shape:** `{ error: string, details?: unknown }`

### Legend

- **Auth Local:** No JWT required (middleware is no-op)
- **Auth Cloud:** JWT Bearer required
- **Protected routes** use `authMiddleware` on `/api/households`, `/api/tenants`, `/api/categories`, `/api/expenses`

---

### Public routes

| Method | Path | Auth | Description | Request | Response |
|--------|------|------|-------------|---------|----------|
| GET | `/health` | None | Health check | — | `{ status: "ok", service: "foyer-api" }` |
| GET | `/api/config` | None | Deployment mode | — | `{ deploymentMode: "local" \| "cloud" }` |
| POST | `/api/auth/register` | None | Register user + create household | `{ email, password (min 8), householdName }` | `201` `{ token, householdId }` |
| POST | `/api/auth/login` | None | Login | `{ email, password }` | `200` `{ token, householdId }` |

### Auth routes

| Method | Path | Auth Cloud | Description | Request | Response |
|--------|------|------------|-------------|---------|----------|
| GET | `/api/auth/me` | JWT | Current user profile | — | `200` `AuthUser`: `{ userId, email, householdId, household }` |

---

### Households — `/api/households`

| Method | Path | Auth Cloud | Description | Request | Response |
|--------|------|------------|-------------|---------|----------|
| GET | `/` | JWT | List households | — | `Household[]` |
| POST | `/` | JWT | Create household | `{ name, type: "solo"\|"shared", settlementPeriod }` | `201` `Household` |
| GET | `/:id` | JWT + access | Get household | param `id` | `Household` |
| PATCH | `/:id` | JWT + access | Update household | `{ settlementPeriod?, type? }` (≥1 field) | `Household` |
| DELETE | `/:id` | JWT + access | Delete household (cascade) | — | `Household` |
| GET | `/:id/deletion-preview` | JWT + access | Pre-delete stats | — | `HouseholdDeletionPreview` |
| GET | `/:id/balances` | JWT + access | Member balances | query `{ period?: "all"\|"current" }` | `TenantBalance[]` |

#### Nested tenants — `/api/households/:id/tenants`

| Method | Path | Request | Response |
|--------|------|---------|----------|
| POST | `/` | `{ name, email?, color? }` | `201` `Tenant` |
| GET | `/` | query `{ includeArchived?: "true"\|"false" }` | `Tenant[]` |
| PATCH | `/:tenantId` | `{ name?, color?, active? }` | `UpdateTenantResult` |
| GET | `/:tenantId/removal-preview` | — | `TenantRemovalPreview` |
| DELETE | `/:tenantId` | — | `RemoveTenantResult` |

#### Default splits — `/api/households/:id/default-splits`

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/` | — | `DefaultSplitRules` `{ global, byCategory }` |
| PUT | `/` | `{ categoryId: cuid\|null, splits: [{ tenantId, percentage }] }` (sum=100) | `DefaultSplit[]` |
| GET | `/resolve` | query `categoryId` | `ResolvedDefaultSplit[]` |
| DELETE | `/` | query `categoryId` | `204` |

#### Recurring expenses — `/api/households/:id/recurring-expenses`

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/` | — | `RecurringExpense[]` |
| POST | `/` | `{ title, amount, category?, paidById, frequency, startDate, splits }` | `201` `RecurringExpense` |
| PATCH | `/:recurringId` | partial update fields + optional `splits` | `RecurringExpense` |
| DELETE | `/:recurringId` | — | `RecurringExpense` (deleted) |
| POST | `/:recurringId/generate` | — | `201` `Expense` (manual generation) |

#### Settlements — `/api/households/:id/settlements`

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/` | — | `Settlement[]` |
| POST | `/` | `{ fromTenantId, toTenantId, amount (>0), note?, date? }` | `201` `Settlement` |
| DELETE | `/:settlementId` | — | `Settlement` (undo within 24h) |

---

### Tenants — `/api/tenants`

| Method | Path | Auth Cloud | Request | Response |
|--------|------|------------|---------|----------|
| GET | `/` | JWT | query `{ householdId, includeArchived? }` | `Tenant[]` |
| POST | `/` | JWT | `{ name, email?, color?, householdId }` | `201` `Tenant` |
| GET | `/:id` | JWT | — | `Tenant` |
| DELETE | `/:id` | JWT | — | `Tenant` (hard delete via removal rules) |

---

### Categories — `/api/categories`

| Method | Path | Auth Cloud | Request | Response |
|--------|------|------------|---------|----------|
| GET | `/` | JWT | query `{ householdId }` | `Category[]` |
| POST | `/` | JWT | `{ name, householdId }` | `201` `Category` |
| DELETE | `/:id` | JWT | — | `Category` (fails if expenses linked) |

---

### Expenses — `/api/expenses`

| Method | Path | Auth Cloud | Request | Response |
|--------|------|------------|---------|----------|
| GET | `/` | JWT | query `{ householdId, page?, limit?, month? (YYYY-MM), categoryId? }` | `PaginatedExpenses` + `recurringGeneratedCount?` |
| POST | `/` | JWT | `CreateExpensePayload` | `201` `Expense` |
| GET | `/:id` | JWT | — | `Expense` |
| PATCH | `/:id` | JWT | `UpdateExpensePayload` | `Expense` |
| DELETE | `/:id` | JWT | — | `Expense` |
| GET | `/:id/splits` | JWT | — | `ExpenseSplit[]` |
| POST | `/:id/splits` | JWT | `{ splits: [{ tenantId, percentage }] }` (sum=100) | `201` `ExpenseSplit[]` |
| POST | `/:id/splits/reset` | JWT | — | `ExpenseSplit[]` (revert to default mode) |

**Create/Update expense body:**

```typescript
{
  amount: number,          // 0 < x ≤ 999_999_999.99
  description: string,     // 1-500 chars
  categoryId: string,      // cuid
  paidByTenantId: string,  // cuid
  date: string,            // YYYY-MM-DD
  splitMode?: "default" | "custom",
  splits?: { tenantId: string, percentage: number }[],
  participantIds?: string[],  // subset of members; unique, min 1
  householdId: string      // create only
}
```

**List response:**

```typescript
{
  data: Expense[],
  total: number,
  page: number,
  totalPages: number,
  recurringGeneratedCount?: number  // auto-generated on this list call
}
```

---

## 6. Frontend Pages and Components

### Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `LoginPage` | Cloud-only login form |
| `/register` | `RegisterPage` | Cloud-only registration + initial household |
| `/` | `AuthGate` → redirect | Index redirects to `/households` |
| `/households` | `HouseholdsPage` | Household list (cloud) or auto-redirect (local) |
| `/households/new` | `HouseholdWizardPage` (`mode="create"`) | 6-step household creation wizard |
| `/households/:id/onboarding` | `HouseholdWizardPage` (`mode="setup"`) | Post-registration setup wizard |
| `/households/:id` | `HouseholdDetailPage` → `HouseholdLayout` | Household shell (sidebar + mobile tab bar) |
| `/households/:id/dashboard` | `DashboardPage` | KPIs, charts, recent expenses, settlement suggestions |
| `/households/:id/expenses` | `ExpensesPage` | Expenses, categories, recurring, CSV export |
| `/households/:id/balances` | `BalancesPage` | Member balances, settlements, history |
| `/households/:id/settings` | `SettingsLayout` → `SettingsPage` | General settings, default splits, language |
| `/households/:id/settings/members` | `SettingsLayout` → `TenantsPage` | Member CRUD, archive, restore |
| `/households/:id/tenants` | `Navigate` | Legacy redirect → `settings/members` |
| `*` | `NotFoundPage` | 404 |

### Route guards and layouts

| Component | Role |
|-----------|------|
| `AuthGate` | Cloud: token check, `/auth/me`, household scoping, onboarding redirect. Local: URL-based routing |
| `CloudAuthRoute` | Wraps login/register — redirects to `/households` in local mode |
| `AppLayout` | Global header + `<Outlet />` |
| `HouseholdLayout` | Sidebar nav + `MobileBottomTabBar` |
| `SettingsLayout` | Sub-nav: General / Manage members |

### Shared/reusable components (props)

#### UI (`components/ui/`)

| Component | Props |
|-----------|-------|
| `EmptyState` | `title`, `description`, `action?` |
| `ErrorMessage` | `message`, `onRetry?` |
| `ErrorBoundary` | `children` |
| `Modal` | `title`, `open`, `onClose`, `children`, `fullHeightMobile?` |
| `ConfirmModal` | `isOpen`, `title`, `message`, `confirmLabel?`, `cancelLabel?`, `variant?: "danger"\|"warning"`, `onConfirm`, `onCancel`, `isLoading?` |
| `Skeleton` | `className?` |
| `ListSkeleton` | `rows?` (default 3) |
| `CategoryBadge` | `name` |
| `SplitModeBadge` | `splitMode: SplitMode` |
| `LanguageSwitcher` | `compact?` |
| `DocumentLang` | _(syncs `document.documentElement.lang`)_ |

#### Layout

| Component | Props |
|-----------|-------|
| `AppLayout` | — |
| `AppHeader` | `trailing?` |
| `HouseholdLayout` | — (reads `:id` from params) |
| `MobileBottomTabBar` | `householdId` |
| `UserMenu` | — (cloud only via `CloudOnly`) |

#### Forms

| Component | Props |
|-----------|-------|
| `FormField` | `label`, `error?`, `children` |
| `ExpenseForm` | `householdId`, `categories`, `tenants`, `isSolo?`, `onSubmit`, `isPending`, `variant?`, `initialExpense?`, `initialParticipantIds?`, `initialSplits?`, `title?`, `submitLabel?` |
| `SplitForm` | `tenants`, `initialSplits?`, `onSubmit`, `isPending` |
| `CategoryForm` | `householdId`, `onSubmit`, `isPending` |
| `TenantForm` | `householdId`, `onSubmit`, `isPending` |
| `RecurringExpenseForm` | `householdId`, `categories`, `tenants`, `onSubmit`, `isPending`, `initialRecurring?`, `submitLabel?` |
| `SmartPercentageInputs` | `items`, `values`, `onChange` |

#### Feature components

| Component | Props |
|-----------|-------|
| `SettlementModal` | `isOpen`, `draft`, `tenants`, amount/note/date handlers, `onConfirm`, `onCancel`, `isLoading?` |
| `ExpenseEditModal` | `expense`, `householdId`, `categories`, `tenants`, `isSolo?`, `expenseFilters`, `open`, `onClose` |
| `ExpenseParticipantSplits` | participant selection, auto/custom toggle, preview |
| `DeleteHouseholdModal` | `isOpen`, `householdId`, `householdName`, `onClose` |
| `DeleteMemberModal` | `isOpen`, `householdId`, `memberName`, `preview`, `onConfirm`, `onCancel`, `isLoading?` |
| `EditMemberModal` | `isOpen`, `householdId`, `tenant`, `onClose`, `onSaved` |
| `KpiCard` | `title`, `value`, `subtitle?`, `valueClassName?`, `to?` |
| `ChartCard` | `title`, `children`, `emptyMessage?`, `isEmpty?` |

#### Wizard steps

`WizardProgressBar`, `WizardCard`, `WizardStepType`, `WizardStepNameMembers`, `WizardStepDefaultSplit`, `WizardStepRecurring`, `WizardStepBalancePeriod`, `WizardStepSummary`, `MemberColorPicker`

#### Hooks

| Hook | Returns |
|------|---------|
| `useFormat()` | `{ locale, formatCurrency, formatDate, formatSignedCurrency }` |
| `useDeploymentMode()` | `{ deploymentMode, isLocalMode, isCloudMode, isLoading }` |
| `useSwipeToClose()` | `{ dragOffset, panelStyle, swipeHandlers }` |

---

## 7. Features Implemented

### Exhaustive feature list

| Feature | Description |
|---------|-------------|
| Dual deployment mode | Local (no auth) vs cloud (JWT) with runtime detection |
| User registration | Email/password signup creates user + household (cloud) |
| User login | JWT token stored in localStorage (cloud) |
| Household CRUD | Create, read, update, delete with cascade |
| Household deletion preview | Shows member/expense/balance stats before delete |
| Solo household | Auto-creates "Me" member on creation |
| Shared household | Starts with 0 members; wizard adds them |
| Solo ↔ shared auto-switch | Type updates when member count crosses threshold |
| Household wizard (create) | 6-step flow: type, name/members, splits, recurring, period, summary |
| Household wizard (onboarding) | Post-registration setup for cloud users |
| Member CRUD | Add, edit name/color, remove |
| Member soft delete (archive) | `active=false`, `archivedAt` set; excluded from active lists |
| Member hard delete | Only if balance ≈ 0 and no expense history |
| Member removal preview | Balance, history flag, solo-switch warning |
| Archived member restore | Reactivate via `active=true` |
| Default categories | 10 categories seeded per household |
| Category CRUD | Add/delete (delete blocked if expenses exist) |
| Expense CRUD | Full create/read/update/delete with pagination |
| Expense filters | By month (YYYY-MM) and category |
| Default split mode | Dynamic splits from household rules (no DB rows) |
| Custom split mode | Persisted `ExpenseSplit` rows |
| Participant subsets | Exclude members from a specific expense |
| Split redistribution | Rescale default % across selected participants |
| Split assign/reset API | Switch between custom and default per expense |
| Default split rules | Global + per-category overrides |
| Balance computation | paid − owed per member, settlements applied |
| Settlement period filtering | `all` vs `current` (monthly/quarterly/yearly UTC) |
| Settlement CRUD | Record payments between members |
| Settlement undo | Delete within 24 hours of creation |
| Settlement suggestions | Greedy debtor-creditor matching (frontend) |
| Recurring expenses | CRUD with weekly/monthly/quarterly/yearly frequency |
| Recurring auto-generation | On expense list fetch when `nextDueDate ≤ now` |
| Recurring manual generate | Single expense from template |
| Recurring pause/resume | `active` toggle |
| Dashboard KPIs | Month total, expense count, largest expense, pending settlements |
| Dashboard charts | Category bars, 6-month trend, signed balance bars |
| CSV export | Filtered month expenses |
| i18n EN/FR | Full UI translation with locale-aware formatting |
| Mobile UX | Bottom tab bar, FAB, bottom-sheet modals, swipe-to-close |
| LAN access | API and Vite bind `0.0.0.0` (see `NETWORK.md`) |
| Error handling | Global error boundary, toast notifications, retry UI |
| Loading states | Skeletons for lists and charts |

### Known bugs and limitations

| Issue | Detail |
|-------|--------|
| `/api/auth/me` in local mode | Returns 401 — no auth context populated |
| Cloud: one user per household | No invite/join flow; register creates isolated household |
| Recurring generation requires category | Expenses cannot be auto-generated without `category` set |
| Archived members in balances | Included by default (`includeArchived: true`) in balance API |
| No password reset / email verification | Auth is minimal |
| `LocalOnly` component | Defined but unused in codebase |
| `HouseholdForm` component | Exists but replaced by wizard — unused |
| Supertest not used | Project rules mention Supertest; only Vitest unit tests exist |
| No production deploy config | CI builds artifacts but does not deploy |
| Currency hardcoded EUR | Backend member removal messages use EUR formatting |
| JWT secret required in local mode | Not enforced at runtime but needed if testing auth endpoints |

---

## 8. Features Planned but Not Yet Implemented

> No formal roadmap file exists in the repository. The following are inferred gaps based on current limitations and typical next steps.

| Priority | Feature | Rationale |
|----------|---------|-----------|
| **High** | Multi-user household invites | Cloud mode locks one user per household |
| **High** | Production deployment pipeline | No hosting/CDN/database deploy automation |
| **High** | HTTP integration tests (Supertest) | API routes tested via mocks only |
| **Medium** | Password reset / email verification | Auth is register/login only |
| **Medium** | E2E tests (Playwright) | Screenshot script exists but no CI E2E |
| **Medium** | Lint job in CI | No ESLint/Prettier pipeline |
| **Medium** | Exclude archived members from balances by default | Current behavior may confuse users |
| **Low** | Multi-currency support | EUR assumed throughout |
| **Low** | Expense attachments/receipts | Not in schema |
| **Low** | Push notifications for recurring due dates | Generation is pull-based (on list) |
| **Low** | `LocalOnly` UI patterns | Component scaffolded but unused |

---

## 9. Design System

### CSS framework

**Tailwind CSS v4** with custom tokens in `apps/web/src/index.css` (`@theme` block). Utility class patterns centralized in `apps/web/src/lib/ui-classes.ts`.

### Color tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#f9f8f5` | Page background |
| `--color-surface` | `#ffffff` | Cards, modals |
| `--color-border` | `oklch(0.2 0.01 80 / 0.1)` | Borders |
| `--color-primary` | `#01696f` | Primary actions, positive amounts |
| `--color-primary-hover` | `#01555a` | Hover state |
| `--color-positive` | `#01696f` | Credits, positive balances |
| `--color-negative` | `#a12c7b` | Errors, debits |
| `--color-rent` | `#f43f5e` | Category chart |
| `--color-groceries` | `#3b82f6` | Category chart |
| `--color-utilities` | `#f59e0b` | Category chart |
| `--color-internet` | `#8b5cf6` | Category chart |
| `--color-other` | `#6b7280` | Category chart |

**Member color presets** (6 hex values): `#01696f`, `#a12c7b`, `#d97706`, `#2563eb`, `#7c3aed`, `#059669`

**Text palette:** stone-800 (body), stone-600 (secondary), stone-500 (muted)

### Typography

| Token | Value |
|-------|-------|
| `--font-sans` | Plus Jakarta Sans (+ system fallbacks) |
| `--font-mono` | ui-monospace stack |
| Page title | `text-lg md:text-2xl font-semibold` |
| Body | `text-base md:text-sm` |
| Amounts | `font-mono tabular-nums font-semibold` |

### Component patterns

| Pattern | Classes / behavior |
|---------|-------------------|
| **Cards** | `rounded-xl border border-border bg-surface p-4 shadow-sm hover:shadow-md` |
| **Primary button** | `bg-primary text-white min-h-11 rounded-lg` — 44px touch target |
| **Secondary button** | Text-only primary color |
| **FAB** | Fixed bottom-right, `h-14 w-14 rounded-full bg-primary` (mobile expenses) |
| **Modals** | Backdrop blur; mobile = bottom sheet (`rounded-t-2xl`, swipe-to-close); desktop = centered |
| **Confirm modal** | Focus trap, Escape to close, danger/warning variants |
| **Empty states** | Dashed border container |
| **Errors** | `text-negative`, `bg-negative/5 border-negative/20` |
| **Mobile tab bar** | 56px height + safe-area inset |
| **Desktop sidebar** | Sticky `w-72`, active nav = `bg-primary text-white` |
| **Sticky form panel** | `xl:sticky xl:top-24 xl:w-80` on expenses page |

---

## 10. i18n

| Aspect | Detail |
|--------|--------|
| Library | i18next + react-i18next + i18next-browser-languagedetector |
| Config | `apps/web/src/i18n.ts` |
| Languages | English (`en`, fallback), French (`fr`) |
| Detection | `localStorage` key `fm_locale`, then browser `navigator` |
| Default namespace | `common` |
| Translation files | `apps/web/messages/en.json`, `apps/web/messages/fr.json` |
| Structure | One JSON file per language; top-level keys = namespaces |
| Loading | Static imports; namespaces derived from `Object.keys(en)` |

### Namespaces (15)

`common`, `nav`, `auth`, `dashboard`, `expenses`, `balances`, `members`, `settings`, `wizard`, `recurring`, `validation`, `errors`, `export`, `toast`, `households`

### Usage patterns

- Components: `useTranslation("namespace")` — often multiple namespaces per page
- Outside React: `i18n.t("errors:...")` in `api.ts`, `toast.ts`, `ErrorBoundary`
- Zod validation: factory schemas with `TFunction<"validation">`
- Formatting: `useFormat()` → `fr-FR` / `en-US` via `lib/locale.ts`
- `DocumentLang` syncs `<html lang>` dynamically

### Cursor rule location

`.cursor/rules/i18n.mdc` — mandates no hardcoded user-visible strings; both `en.json` and `fr.json` must be updated together.

---

## 11. Environment Variables

### API — `apps/api/.env.local` (local mode)

| Variable | Description | Example |
|----------|-------------|---------|
| `DEPLOYMENT_MODE` | Runtime mode | `local` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://foyer_user:foyer_pass@localhost:5432/foyer_local` |
| `PORT` | HTTP port | `3000` |
| `JWT_SECRET` | HS256 signing secret | `change-me-in-development` |
| `JWT_EXPIRES_IN` | Token expiry | `7d` (default if omitted) |

### API — `apps/api/.env.development` (cloud mode)

Same variables; `DEPLOYMENT_MODE=cloud`, database `foyer_dev`.

### API — legacy `apps/api/.env`

Still supported for ad-hoc use; the two env files above are recommended.

### CI

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/foyer_manager` (dummy; tests are mocked) |

### Web

No environment variables. API proxy configured in `vite.config.ts` (`/api` → `http://localhost:3000`).

### Env file templates

| File | Purpose |
|------|---------|
| `apps/api/.env.example` | Points to `.env.local.example` and `.env.development.example` |
| `apps/api/.env.local.example` | Local mode template |
| `apps/api/.env.development.example` | Cloud mode template |

---

## 12. Scripts

### Root `package.json`

| Script | Description |
|--------|-------------|
| `predev` / `predev:local` / `predev:cloud` | Build `@foyer/types` before dev |
| `dev` | Alias for `dev:local` |
| `dev:local` | Concurrently: web (Vite) + API (`dev:local` with `.env.local`) |
| `dev:cloud` | Concurrently: web + API (`dev:cloud` with `.env.development`) |
| `build` | Build `@foyer/types` then all workspaces |
| `test` | Run tests in all workspaces |

### `@foyer/api` (`apps/api/package.json`)

| Script | Description |
|--------|-------------|
| `dev` | `tsx watch src/main.ts` (default dotenv) |
| `dev:local` | Dev with `.env.local` |
| `dev:cloud` | Dev with `.env.development` |
| `build` | `prisma generate && tsc` → `dist/` |
| `start` | `node dist/main.js` (production) |
| `postinstall` | `prisma generate` |
| `db:generate` | Regenerate Prisma client |
| `db:migrate` | `prisma migrate dev` (default env) |
| `db:migrate:local` | Migrate `foyer_local` |
| `db:migrate:dev` | Migrate `foyer_dev` |
| `db:migrate:deploy` | `prisma migrate deploy` (prod/CI) |
| `db:reset:local` | Destructive reset of `foyer_local` |
| `db:reset:dev` | Destructive reset of `foyer_dev` |
| `test` | `vitest run` |

### `@foyer/web` (`apps/web/package.json`)

| Script | Description |
|--------|-------------|
| `dev` | Vite dev server on `0.0.0.0:5173` |
| `build` | `tsc -b && vite build` |
| `preview` | Preview production build |
| `test` | `vitest run` |

### `@foyer/types` (`packages/types/package.json`)

| Script | Description |
|--------|-------------|
| `build` | `tsc` → `dist/` |
| `test` | `vitest run` |

---

## 13. Business Logic

### Expense splits — auto (default) vs custom

**Default mode (`splitMode: "default"`):**
- No `ExpenseSplit` rows stored in DB
- Splits computed dynamically from `DefaultSplit` rules:
  1. Category-specific rules if they exist for the expense's category
  2. Otherwise global rules (`categoryId: null`)
- Amounts calculated via `calculateSplitAmounts()` — last member absorbs rounding remainder

**Custom mode (`splitMode: "custom"`):**
- `ExpenseSplit` rows persisted with `amount` and `percentage`
- Activated when:
  - User explicitly sets `splitMode: "custom"` with `splits` array (sum must = 100)
  - User excludes members via `participantIds` (subset of household) — rules are rescaled and stored as custom
  - User calls `POST /expenses/:id/splits` to assign custom percentages
  - Recurring expense generates an expense in custom mode

**Participant subsets:**
- If all active members participate → stays/gets default mode (no DB splits)
- If subset selected → `redistributeSplitsToItems()` rescales default percentages:
  - Proportional rescale if base rules exist for selected members
  - Equal split if base total is 0
  - Stored as custom mode

### Balance calculation

```
For each member:
  paid  = sum(expense.amount where paidByTenantId = member)
  owed  = sum(split.amount for member across all expenses)
  balance = paid - owed
```

Then settlements are applied (`applySettlements`):
- `fromTenant` (debtor): `balance += settlement.amount`, `settledAmount += amount`
- `toTenant` (creditor): `balance -= settlement.amount`

**Period filtering:** When `period=current` and `settlementPeriod ≠ none`:
- Only expenses and settlements with `date >= getPeriodStart(period)` (UTC) are included
- Period starts: monthly = 1st of month, quarterly = 1st of quarter, yearly = Jan 1

**Archived members:** Included in balance calculations by default (`includeArchived: true`).

### Recurring expense generation

**Trigger:** Called automatically in `expense.controller.list` via `generateDueRecurringExpenses(householdId)`.

**Algorithm:**
1. Find active recurring expenses where `nextDueDate ≤ now`
2. For each due item:
   - If expense already exists for `(recurringExpenseId, nextDueDate)` → skip creation, advance `nextDueDate`
   - Else create expense with: title, amount, category, paidBy, date=`nextDueDate`, `splitMode: custom`, splits from template
   - Advance `nextDueDate` via `getNextDueDate()` (weekly +7d, monthly +1mo, quarterly +3mo, yearly +1yr)
3. Return count as `recurringGeneratedCount` in list response

**Requirements:** `category` must be set on the recurring expense or generation throws `ValidationError`.

**Schedule change:** Updating `startDate` or `frequency` deletes all previously generated expenses for that recurring rule.

**Manual generation:** `POST .../recurring-expenses/:id/generate` creates one expense and advances due date.

### Settlements

- **Create:** Validates both tenants belong to household; `fromTenantId ≠ toTenantId`; amount > 0
- **Delete (undo):** Allowed only within 24 hours of `createdAt` (`UNDO_WINDOW_MS`)
- **Suggestions (frontend):** `computeSuggestedSettlements()` — greedy match largest debtors to largest creditors

### Soft delete strategy for members

| Action | Condition | Result |
|--------|-----------|--------|
| **Archive** (PATCH `active: false`) | Balance ≈ 0 (epsilon 0.005) | `active=false`, `archivedAt=now()` |
| **Hard delete** (DELETE) | Balance ≈ 0 AND no expense history | Row removed from DB |
| **Blocked** | Non-zero balance | `403 ForbiddenError` — settle first |
| **Blocked hard delete** | Has expense history | `403` — archive instead |

After removal/archive leaving 1 active member → `Household.type` set to `"solo"`.

### Solo vs shared household behavior

| Event | Behavior |
|-------|----------|
| Create `type: "solo"` | Auto-creates member "Me" with default color `#01696f` |
| Create `type: "shared"` | No members; 10 default categories created |
| 2nd active member on solo household | `type` → `"shared"` (`maybeSwitchToShared`) |
| Restore archived member on solo | May switch back to `"shared"` |
| Remove/archive → 1 active left | `type` → `"solo"` |
| UI solo mode | Dashboard/balances show adapted views (category breakdown instead of member balances) |

`Household.type` is informational + drives auto-switching; API does not enforce member count limits.

### Dual deployment mode behavior differences

| Concern | Local | Cloud |
|---------|-------|-------|
| API authentication | Open | JWT required on protected routes |
| Household access control | Any household ID accessible | Scoped to JWT `householdId` |
| Household listing | All households in DB | Single household array |
| Household creation | Unlimited | Blocked after registration household |
| Frontend auth storage | Cleared on config load | JWT in localStorage |
| Login/register pages | Redirect to `/households` | Available |
| User menu / logout | Hidden (`CloudOnly`) | Visible |
| Households page | Auto-redirect: 0 → wizard, 1 → dashboard | Shows list / empty state |
| Multi-household | Supported (local testing) | One per user |

---

## Appendix: Shared Types (`@foyer/types`)

All API JSON shapes are defined in `packages/types/src/index.ts`. Key exports:

- `Household`, `HouseholdType`, `SettlementPeriod`, `HouseholdDeletionPreview`
- `AuthResponse`, `RegisterPayload`, `LoginPayload`, `AuthUser`
- `DeploymentMode`, `AppConfig`
- `Tenant`, `CreateTenantPayload`, `UpdateTenantPayload`
- `Category`, `SplitMode`, `DefaultSplit`, `DefaultSplitRules`, `ResolvedDefaultSplit`, `SplitPreview`
- `Expense`, `CreateExpensePayload`, `UpdateExpensePayload`, `PaginatedExpenses`, `ExpenseSplit`
- `RecurringFrequency`, `RecurringExpense`, `RecurringExpenseSplit`, `CreateRecurringExpensePayload`, `UpdateRecurringExpensePayload`
- `Settlement`, `CreateSettlementPayload`
- `TenantBalance`

Build before dev: `npm run build -w @foyer/types` (automated via `predev` hooks).

---

## Appendix: Git Conventions

**Conventional Commits:** `feat|fix|chore|docs|refactor|test(scope): description`

**Scopes:** `web`, `api`, `types`, `infra`

**Language:** All code, comments, commits, and PR text in English.
