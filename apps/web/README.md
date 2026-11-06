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
| `npm run build` | Production build, then prerenders the public pages (see below) |
| `npm run preview` | Preview production build (serves the SPA shell only, not the prerendered pages) |

## Public pages and SEO

`npm run build` runs `scripts/prerender.mjs` after the client build. It renders every public page
(`/`, `/use/*`, `/compare`, `/help`, legal pages) to static HTML in French at the bare path and in
English under `/en/...`, with `canonical`, `hreflang`, Open Graph tags and JSON-LD. It also writes
`sitemap.xml`, `robots.txt`, and moves the SPA shell to `dist/app.html` (served for app routes,
`noindex`). The public site origin comes from `VITE_PUBLIC_SITE_ORIGIN`, or the Vercel production
domain; without it, canonical and hreflang are skipped. The URL decides the language on public
pages; the language switcher moves between `/...` and `/en/...`.

## Routes

| Path | Page |
|------|------|
| `/`, `/en` | Landing (prerendered); signed-in users go to `/households` |
| `/use/:useCase`, `/compare`, `/help`, `/privacy`, `/legal`, `/terms`, `/accessibility` | Public pages (prerendered, also under `/en`) |
| `/households` | List + create households |
| `/households/:id` | Redirect to dashboard |
| `/households/:id/dashboard` | Dashboard (KPIs + charts) |
| `/households/:id/settings` | Settings (general) |
| `/households/:id/settings/members` | Manage members |
| `/households/:id/tenants` | Redirects to `/settings/members` |
| `/households/:id/expenses` | Expenses + splits |
| `/households/:id/balances` | Balance table |

Run from monorepo root: `npm run dev` (starts web + API).
