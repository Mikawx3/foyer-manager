# @foyer/web

React 18 frontend for Foyer Manager (Vite + TypeScript + Tailwind CSS v4).

## Stack

- **TanStack Query** — API data fetching
- **React Hook Form + Zod** — validated forms
- **React Router** — client routing
- **Axios** — HTTP client (`baseURL: /api`, proxied to the API in dev)
- **Recharts** — dashboard charts

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

## Routes

| Path | Page |
|------|------|
| `/` | Redirect to `/households` |
| `/households` | List + create households |
| `/households/:id` | Redirect to dashboard |
| `/households/:id/dashboard` | Dashboard (KPIs + charts) |
| `/households/:id/tenants` | Members |
| `/households/:id/expenses` | Expenses + splits |
| `/households/:id/balances` | Balance table |

Run from monorepo root: `npm run dev` (starts web + API).
